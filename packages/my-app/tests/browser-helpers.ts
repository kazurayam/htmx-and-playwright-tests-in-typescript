// tests/browser-helpers.ts
import type { Browser, BrowserContext, Page } from '@playwright/test';
import { chromium } from '@playwright/test';

export const openChromium = async (options: object = {}, args: string[] = []):
    Promise<{ browser: Browser, context: BrowserContext }> => {
    const browser = await launchChromium(options, args);
    const context = await newContext(browser);
    return { browser, context };
}

/**
 * https://www.technetexperts.com/slow-playwright-new-page-fix/
 */
export const launchChromium = async (options: object = {}, args: string[] = []): Promise<Browser> => {
    let transientOptions = {
        headless: true,
        timeout: 10_000,
    };
    if (options) {
        transientOptions = { ...transientOptions, ...options }
    }
    let transientArgs = [
        // Recommended optimization arguments for enterprise network environments
        '--no-sandbox',
        '--disable-setuid-sandbox',
        // Crucial for bypassing network checks/proxy auto-detection delays
        '--no-proxy-server',
        '--proxy-bypass-list=*',
        // Prevents slow DNS fallbacks or resolving internal domain lookups
        '--disable-features=NetworkService',
        '--disable-dev-shm-usage',
    ];
    if (args) {
        transientArgs = [...transientArgs, ...args];
    }
    const browser = await chromium.launch({ "args": transientArgs, ...transientOptions });
    return browser;
};

export const newContext = async (browser: Browser): Promise<BrowserContext> => {
    if (browser) {
        const context = await browser.newContext({
            javaScriptEnabled: true,
            viewport: { width: 700, height: 800 }
        });
        // some custom settings
        context.removeAllListeners();
        context.setDefaultNavigationTimeout(20_000);
        return context;
    } else {
        throw new Error('browser is required')
    }
};

export const newPage = async (context: BrowserContext): Promise<Page> => {
    if (context) {
        return await context.newPage();
    } else {
        throw new Error('context is required')
    }
}

