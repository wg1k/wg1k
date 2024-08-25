const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
        ],
        executablePath: '/usr/bin/google-chrome',
    });

    const page = await browser.newPage();

    // Set a viewport matching the size of your widget
    await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 2 });

    await page.goto('file:///app/widget.html', { waitUntil: 'networkidle2', timeout: 60000 });

    await page.waitForSelector('codersrank-summary');
    await page.waitForTimeout(2000);

    // Ensure all images are loaded
    await page.evaluate(() => {
        return new Promise((resolve) => {
            const images = document.querySelectorAll('img');
            let loadedImages = 0;
            images.forEach(img => {
                if (img.complete && img.naturalHeight !== 0) {
                    loadedImages++;
                } else {
                    img.onload = () => {
                        loadedImages++;
                        if (loadedImages === images.length) resolve();
                    };
                    img.onerror = () => {
                        loadedImages++;
                        if (loadedImages === images.length) resolve();
                    };
                }
            });
            if (loadedImages === images.length) resolve();
        });
    });

    const widget = await page.$('codersrank-summary');

    await widget.screenshot({
        path: '/app/widget.png',
        omitBackground: true,
    });

    await browser.close();
})();
