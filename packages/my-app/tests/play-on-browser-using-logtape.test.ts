// $PROJECT/tests/play-on-browser-using-logtape.test.ts
import { describe, test, expect } from 'bun:test';
import type { Browser, BrowserContext, Page } from '@playwright/test';
import { chromium } from '@playwright/test';
import { getLogger } from '@logtape/logtape';

const logger = getLogger(["my-app", "play-on-browser.test"]);

describe("Play on Playwright's Browser API", async () => {
    // Here I assume that the server at http://localhost:3001 is already up and running.
    let browser: Browser;
    let context: BrowserContext;
    let page: Page;
    test("open browser, navigate to a URL, verify the content, close the browser", async () => {
        // Launch Chromium browser in non-headless mode, navigate to a URL
        browser = await chromium.launch({ headless: false });
        expect(browser).toBeDefined();
        expect(browser.browserType().name()).toBe('chromium');
        logger.info(`browser.browserType().executablePath()=${browser.browserType().executablePath()}`);
        context = await browser.newContext({
            viewport: { width: 800, height: 300 }
        });
        page = await context.newPage();
        await page.goto('http://example.com');
        await page.waitForLoadState('load', { timeout: 10_000 });
        // Check if the page title is correct
        const text = await page.locator('h1').innerText();
        expect(text).toBe('Example Domain');
        // Wait for a few seconds to observe the browser before closing it
        await delay(1000);
        // close the browser
        await context.close();
        await browser.close();
    }, 20000)
})

async function delay(timeoutMs: number) {
    await new Promise(resolve => setTimeout(resolve, timeoutMs));
}
