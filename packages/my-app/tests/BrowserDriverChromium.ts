// tests/BrowserDriverChromium.ts

import type { Browser, BrowserContext, Page } from '@playwright/test';
import * as BH from './browser-helpers';
import { getLogger } from '@logtape/logtape';

const logger = getLogger(["my-app", "BrowserDriverChromium"]);

export class BrowserDriverChromium {
    private id: string;
    private browser: Browser;
    private context: BrowserContext;

    // you should call create() instead of the private constructor
    private constructor(id: string, browser: Browser, context: BrowserContext) {
        this.id = encodeURIComponent(id);
        this.browser = browser;
        this.context = context;
    }

    // static method for async initialization
    static async create(id: string, options: object = {}, args: string[] = []): Promise<BrowserDriverChromium> {
        const browser = await BH.launchChromium(options, args);
        const context = await BH.newContext(browser);
        context.tracing.start({ screenshots: true, snapshots: true })
        return new BrowserDriverChromium(id, browser, context);
    }

    getBrowser(): Browser {
        return this.browser;
    }

    getContext(): BrowserContext {
        return this.context;
    }

    async navigateToUrl(url: string): Promise<Page> {
        try {
            const page = await BH.newPage(this.context);
            await page.goto(url, { timeout: 15_000 });
            await page.waitForLoadState('load', { timeout: 5_000 });
            return page;
        } catch (error) {
            logger.error(`${error}`);
            // when an error occured, restart the browser and retry
            this.browser.close();
            this.browser = await BH.launchChromium();
            this.context = await BH.newContext(this.browser);
            await this.context.tracing.start({ screenshots: true, snapshots: true })
            //
            const page = await BH.newPage(this.context);
            await page.goto(url, { timeout: 15_000 });
            await page.waitForLoadState('load', { timeout: 5_000 });
            logger.info(`[beforeEach] recreated the browser`)
            return page;
        }
    }

    async close() {
        if (this.context) {
            await this.context.tracing.stop({ path: `./out/traces/${Date.now()}-${this.id}` });
            await this.context.close()
        }
        if (this.browser) {
            await this.browser.close()
        }
    }
}
