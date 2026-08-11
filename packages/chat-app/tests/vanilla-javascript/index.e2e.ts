// tests/vanilla-javascript/index.e2e.ts
import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test';
import * as PW from '@playwright/test';
import { BrowserDriverChromium } from '@kazurayam/htmx-and-playwright-tests-in-typescript-my-app';

const url = 'http://localhost:8000/';
const serverName = 'vanilla-javascript/index.ts';

describe(`test the chat page`, async () => {
    // Here I assume that the server at http://localhost:8000 is already up and running.
    let driver: BrowserDriverChromium;
    let page: PW.Page;
    beforeAll(async () => {
        driver = await BrowserDriverChromium.create('/', { headless: true });
    });
    beforeEach(async () => {
        page = await driver.navigateToUrl(url);
    }, 20_000);

    test("make sure the correct serverName is shown", async () => {
        // Select the serverName
        const li: PW.Locator = page.getByText(serverName, { exact: false });
        // make sure the button is clickable
        await li.waitFor({ state: 'visible', timeout: 5000 });
        await PW.expect(li).toBeVisible();
    });

    test("type a message, click Submit button, wait to see the message is echoed by server", async () => {
        // Select the input field
        const inputMessage: PW.Locator = page.locator('css=input#message');
        // Make sure the field is visible
        await inputMessage.waitFor({ state: 'visible', timeout: 5000 });
        // type a message
        const msg = 'Hello, world!';
        inputMessage.fill(msg);
        // Select the Submit button
        const button: PW.Locator = page.locator('css=input#btn');
        // Make sure the button is visible
        await button.waitFor({ state: 'visible', timeout: 5000 });
        // Submit it
        button.click();
        // At the end of the content of <ul id="websocket_events">, expect a <li>Hello, world!</li>
        await PW.expect(page.locator(`css=div#messages span:last-child`)).toContainText(`${msg}`);
    });

    afterEach(async () => {
        await page.close();
    });
    afterAll(async () => {
        driver.close();
    });
})

async function delay(timeoutMs: number) {
    await new Promise(resolve => setTimeout(resolve, timeoutMs));
}
