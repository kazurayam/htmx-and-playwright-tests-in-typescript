// tests/todo.e2e.ts
import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test';
import * as PW from '@playwright/test';
import { BrowserDriverChromium } from '@kazurayam/htmx-and-playwright-tests-in-typescript-my-app';

const url = 'http://localhost:3000/';

describe(`test ${url}`, async () => {
    // Here I assume that the server at http://localhost:3000 is already up and running.
    let driver: BrowserDriverChromium;
    let page: PW.Page;
    beforeAll(async () => {
        driver = await BrowserDriverChromium.create('todo', { headless: false });
    });
    beforeEach(async () => {
        page = await driver.navigateToUrl(url);
    }, 20_000);

    test("type '筋トレする' into the 'input' element, click the '追加' button, assert the task is listed", async () => {
        await delay(1000)
        // select the input field
        const input: PW.Locator = page.locator("css=input[name='task']");
        await input.waitFor({ state: 'visible', timeout: 5000 })
        await PW.expect(input).toBeEnabled();
        // type '筋トレする' into the input filed
        input.fill('筋トレする')
        await delay(1000)
        // Select the button
        const button: PW.Locator = page.locator("css=button[type='submit']");
        // make sure the button is clickable
        await button.waitFor({ state: 'visible', timeout: 5000 });
        await PW.expect(button).toBeEnabled();
        // Click the button!
        await button.click();
        await delay(1000)
        //
        const p: PW.Locator = page.getByText('筋トレする').first();
        await PW.expect(p).toBeVisible();
    }, 20_000);

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
