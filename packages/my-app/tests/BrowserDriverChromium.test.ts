// tests/BrowserDriverChromium.test.ts
import { describe, test, expect } from 'bun:test';
import { BrowserDriverChromium } from './BrowserDriverChromium';

describe('test the BrowserDriverChromium class', () => {
    test('test create', async () => {
        const driver = await BrowserDriverChromium.create('test create');
        expect(driver.getBrowser().browserType().name()).toBe('chromium');
        expect(driver.getContext().browser()?.browserType().name()).toBe('chromium');
    }, 15_000)
    test('test navigateToUrl', async () => {
        const driver = await BrowserDriverChromium.create('test navigateToUrl');
        const page = await driver.navigateToUrl('https://www.google.com/')
        expect(page).not.toBeNull();
        expect(page.url()).toBe('https://www.google.com/')
    }, 15_000)
})
