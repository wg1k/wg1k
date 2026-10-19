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

const renderWidget = async (browser) => {
    const page = await browser.newPage();
    page.on('console', (message) => console.log(message.text()));

    // Set a viewport matching the size of your widget
    await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 2 });

    await page.goto('file:///app/widget.html', { waitUntil: 'networkidle2', timeout: 60000 });

    await page.waitForSelector('codersrank-summary');
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await page.evaluate(() => window.iconsRepaired());
    await waitForImages(page);

    const brokenImages = await findBrokenImages(page);
    if (brokenImages.length > 0) {
        throw new Error(`Broken images:\n${brokenImages.join('\n')}`);
    }

    const widget = await page.$('codersrank-summary');

    await widget.screenshot({
        path: '/app/widget.png',
        omitBackground: true,
    });
};

const main = async () => {
    const browser = await launchBrowser();
    try {
        await renderWidget(browser);
    } finally {
        await browser.close();
    }
};

main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
