// tests/vanilla-javascript/broadcast-dual.e2e.ts
import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test';
import * as PW from '@playwright/test';
import { BrowserDriverChromium } from '@kazurayam/htmx-and-playwright-tests-in-typescript-my-app';

const url = 'http://localhost:8000/';
const serverName = 'vanilla-javascript/broadcast.ts';

describe(`test Chat page using 2 browsers`, async () => {
    // Here I assume that the server at http://localhost:8000 is already up and running.
    let driver1: BrowserDriverChromium;
    let driver2: BrowserDriverChromium;
    let page1: PW.Page;
    let page2: PW.Page;
    beforeAll(async () => {
        driver1 = await BrowserDriverChromium.create('/', { headless: true });
        driver2 = await BrowserDriverChromium.create('/', { headless: true });
    });
    beforeEach(async () => {
        page1 = await driver1.navigateToUrl(url);
        page2 = await driver2.navigateToUrl(url);
    }, 20_000);

    test("make sure the correct serverName is shown", async () => {
        // Select the serverName
        const span: PW.Locator = page1.getByText(serverName, { exact: false });
        // make sure the button is clickable
        await span.waitFor({ state: 'visible', timeout: 5000 });
        await PW.expect(span).toBeVisible();
    });

    test("In a browser, type a message, click Submit button. In another browser, wait to see the message is echoed", async () => {
        // Select the input field
        const inputMessage: PW.Locator = page1.locator('css=input#message');
        // Make sure the field is visible
        await inputMessage.waitFor({ state: 'visible', timeout: 5000 });
        // type a message
        const msg = 'Hello, world!';
        inputMessage.fill(msg);
        // Select the Submit button
        const button: PW.Locator = page1.locator('css=input#btn');
        // Make sure the button is visible
        await button.waitFor({ state: 'visible', timeout: 5000 });
        // Submit it
        button.click();
        // In the page1, at the end of the content of <div id="messages">, expect a <span>Hello, world!</span>
        await PW.expect(page1.locator(`css=div#messages span:last-child`)).toContainText(`${msg}`);
        // Also in the page2, at the end of the content of <div id="messages">, expect a <span>Hello, world!</span>
        await PW.expect(page2.locator(`css=div#messages span:last-child`)).toContainText(`${msg}`);
    });

    afterEach(async () => {
        await page1.close();
        await page2.close();
    });
    afterAll(async () => {
        driver1.close();
        driver2.close();
    });
})

async function delay(timeoutMs: number) {
    await new Promise(resolve => setTimeout(resolve, timeoutMs));
}
