// tests/browser-helpers.test.ts
import { describe, test, expect } from 'bun:test';
import * as BH from '../tests/browser-helpers';

describe('test the browser-helpers', () => {
    test('test launchChromium function', async () => {
        const browser = await BH.launchChromium();
        expect(browser.browserType().name()).toBe('chromium')
        browser.close()
    })
    test('open chromium with headless=false', async () => {
        const browser = await BH.launchChromium({ headless: false });
        expect(browser.browserType().name()).toBe('chromium');
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.goto("http://example.com", { timeout: 15_000 });
        await page.waitForLoadState('load', { timeout: 5_000 });
        await delay(3000);
        browser.close();
    }, { timeout: 15000 })
    test('test openChromium function', async () => {
        const { browser, context } = await BH.openChromium();
        expect(browser.browserType().name()).toBe('chromium');
        expect(context.browser()?.browserType().name()).toBe('chromium');
        browser.close();
    })
})

async function delay(timeoutMs: number) {
    await new Promise(resolve => setTimeout(resolve, timeoutMs));
}
