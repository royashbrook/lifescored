import { test, expect } from '@playwright/test';

test('visible profile controls have names, keyboard focus, and fit a narrow screen', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');
	await page.waitForLoadState('networkidle');
	await expect(page.getByLabel('Country', { exact: true })).toBeVisible();
	await page.getByLabel('Age', { exact: true }).fill('43');
	await expect(page.getByLabel('Age', { exact: true })).toHaveValue('43');
	await expect(page.getByRole('switch', { name: 'Partner / spouse' })).toHaveAttribute('aria-checked', 'false');
	await page.getByRole('button', { name: /add detail/ }).click();
	await expect(page.getByLabel('Exercise min/wk', { exact: true })).toBeVisible();
	const unnamed = await page.locator('input, select').evaluateAll(elements => elements.filter(el => !el.labels?.length && !el.getAttribute('aria-labelledby') && !el.getAttribute('aria-label')).length);
	expect(unnamed).toBe(0);
	await page.getByLabel('Age', { exact: true }).focus();
	await page.keyboard.press('Tab');
	expect(await page.evaluate(() => getComputedStyle(document.activeElement!).outlineStyle)).not.toBe('none');
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('a generated narrative becomes stale without silently generating again', async ({ page }) => {
	let calls = 0;
	await page.route('**/api/narrative', route => { calls++; return route.fulfill({ json: { text: 'A story for the original score.' } }); });
	await page.goto('/');
	await page.waitForLoadState('networkidle');
	await page.getByRole('button', { name: 'tell me the story' }).click();
	await expect(page.getByText('A story for the original score.')).toBeVisible();
	await page.getByLabel('Age', { exact: true }).fill('60');
	await expect(page.getByText('Your score changed.', { exact: false })).toBeVisible();
	expect(calls).toBe(1);
});

test('a late narrative response cannot describe the next profile', async ({ page }) => {
	let release!: () => void;
	const gate = new Promise<void>(resolve => { release = resolve; });
	await page.route('**/api/narrative', async route => { await gate; await route.fulfill({ json: { text: 'Obsolete story.' } }); });
	await page.goto('/');
	await page.waitForLoadState('networkidle');
	const requested = page.waitForRequest('**/api/narrative');
	await page.getByRole('button', { name: 'tell me the story' }).click();
	await requested;
	await page.getByLabel('Age', { exact: true }).fill('60');
	release();
	await expect(page.getByRole('button', { name: 'tell me the story' })).toBeEnabled();
	await expect(page.getByText('Obsolete story.')).toHaveCount(0);
});
