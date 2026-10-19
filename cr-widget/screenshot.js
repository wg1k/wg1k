const puppeteer = require('puppeteer');

const launchBrowser = () => puppeteer.launch({
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
    ],
});

const waitForImages = (page) => page.evaluate(() => {
    const settled = (img) => img.complete
        ? Promise.resolve()
        : new Promise((resolve) => {
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', resolve, { once: true });
        });
    return Promise.all([...document.querySelectorAll('img')].map(settled));
});

const findBrokenImages = (page) => page.evaluate(() =>
    [...document.querySelectorAll('img')]
        .filter(img => img.naturalWidth === 0)
        .map(img => img.src)
);

const CARDS = [
    ['codersrank-summary', 'widget.png'],
    ['.card-languages', 'languages.png'],
    ['.card-stackoverflow', 'stackoverflow.png'],
];

// The languages card slides its legend in over about 3 seconds.
const SETTLE_MS = 4000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const LOWER_CARDS = ['.card-languages', '.card-stackoverflow'];

const heightOf = async (page, selector) => {
    const card = await page.$(selector);
    const { height } = await card.boundingBox();
    return Math.round(height);
};

const assertEqualHeights = async (page, selectors) => {
    const heights = await Promise.all(selectors.map((selector) => heightOf(page, selector)));
    if (new Set(heights).size > 1) {
        const detail = selectors.map((selector, i) => `${selector}=${heights[i]}`).join(', ');
        throw new Error(`Cards differ in height: ${detail}`);
    }
};

const screenshotCard = async (page, [selector, file]) => {
    const card = await page.$(selector);
    await card.screenshot({ path: `/app/${file}`, omitBackground: true });
};

const renderCards = async (browser) => {
    const page = await browser.newPage();
    page.on('console', (message) => console.log(message.text()));

    await page.setViewport({ width: 1200, height: 1200, deviceScaleFactor: 2 });

    await page.goto('file:///app/widget.html', { waitUntil: 'networkidle2', timeout: 60000 });

    await page.waitForSelector('codersrank-summary');
    await page.evaluate(() => window.iconsRepaired());
    await waitForImages(page);
    await sleep(SETTLE_MS);

    const brokenImages = await findBrokenImages(page);
    if (brokenImages.length > 0) {
        throw new Error(`Broken images:\n${brokenImages.join('\n')}`);
    }

    await assertEqualHeights(page, LOWER_CARDS);

    for (const card of CARDS) {
        await screenshotCard(page, card);
    }
};

const main = async () => {
    const browser = await launchBrowser();
    try {
        await renderCards(browser);
    } finally {
        await browser.close();
    }
};

main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
