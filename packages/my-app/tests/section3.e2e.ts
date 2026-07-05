// tests/section3.e2e.ts
import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test';
import * as PW from '@playwright/test';
import { BrowserDriverChromium } from './BrowserDriverChromium';
import { getLogger } from '@logtape/logtape';

const logger = getLogger(["my-app", "section3.test"]);
const url = 'http://localhost:3001/section3';

describe(`test ${url}`, async () => {
    // Here I assume that the server at http://localhost:3001 is already up and running.
    let driver: BrowserDriverChromium;
    let page: PW.Page;
    beforeAll(async () => {
        driver = await BrowserDriverChromium.create('section3', { headless: false });
    });
    beforeEach(async () => {
        page = await driver.navigateToUrl(url);
    }, 20_000);

    test("click <button hx-get=/hello>, then the button should show GETリクエスト!", async () => {
        // Select the button
        const button: PW.Locator = page.locator('css=button[hx-get]');
        // make sure the button is clickable
        await button.waitFor({ state: 'visible', timeout: 5000 });
        await PW.expect(button).toBeEnabled();
        // Click the button!
        await button.click();
        const span: PW.Locator = page.getByText('GETリクエスト!');
        await PW.expect(span).toBeVisible();
    });

    test("click <button hx-post=/hello>, then the button should show POSTリクエスト!", async () => {
        // Select the button
        const button: PW.Locator = page.locator('css=button[hx-post]');
        await button.waitFor({ state: 'visible', timeout: 5000 });
        await PW.expect(button).toBeEnabled();
        // Click the button!
        await button.click();
        const span: PW.Locator = page.getByText('POSTリクエスト!');
        await PW.expect(span).toBeVisible();
    });

    test("click <button hx-put=/hello>, then the button should show PUTリクエスト!", async () => {
        // Select the button
        const button: PW.Locator = page.locator('css=button[hx-put]');
        await button.waitFor({ state: 'visible', timeout: 5000 });
        await PW.expect(button).toBeEnabled();
        // Click the button!
        await button.click();
        const span: PW.Locator = page.getByText('PUTリクエスト!');
        await PW.expect(span).toBeVisible();
    });

    test("click <button hx-patch=/hello>, then the button should show PATCHリクエスト!", async () => {
        // Select the button
        const button: PW.Locator = page.locator('css=button[hx-patch]');
        await button.waitFor({ state: 'visible', timeout: 5000 });
        await PW.expect(button).toBeEnabled();
        // Click the button!
        await button.click();
        const span: PW.Locator = page.getByText('PATCHリクエスト!');
        await PW.expect(span).toBeVisible();
    });

    test("click <button hx-delete=/hello>, then the button should show DELETEリクエスト!", async () => {
        // Select the button
        const button: PW.Locator = page.locator('css=button[hx-delete]');
        await button.waitFor({ state: 'visible', timeout: 5000 });
        await PW.expect(button).toBeEnabled();
        // Click the button!
        await button.click();
        const span: PW.Locator = page.getByText('DELETEリクエスト!');
        await PW.expect(span).toBeVisible();
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
