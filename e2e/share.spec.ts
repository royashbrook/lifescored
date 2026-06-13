import { test, expect } from '@playwright/test';

test('the default share is the score number, not the profile data', async ({ page }) => {
	await page.goto('/');
	await page.waitForLoadState('networkidle');

	// Put a sensitive value in so we can prove it does NOT leak into the default share.
	await page.locator('label', { hasText: 'Assets' }).locator('input').fill('999999');

	const shareBtn = page.getByRole('button', { name: 'share my score' });
	await shareBtn.click();
	// desktop chromium has no navigator.share → clipboard path
	await expect(page.getByRole('button', { name: /copied ✓/ })).toBeVisible({ timeout: 5000 });

	const copied = await page.evaluate(() => navigator.clipboard.readText());
	expect(copied).toContain('My life score is');
	expect(copied).toContain('lifescored.com');
	expect(copied).not.toContain('#p='); // no encoded profile
	expect(copied).not.toContain('999999'); // no raw inputs
});

test('the explicit answer link round-trips the full profile', async ({ page }) => {
	await page.goto('/');
	await page.waitForLoadState('networkidle');
	await page.locator('label', { hasText: 'Assets' }).locator('input').fill('424242');
	await page.waitForTimeout(400); // let the data link recompute

	await page.getByRole('button', { name: /share my exact answers/ }).click();
	const dataBtn = page.getByRole('button', { name: 'share the full answer link' });
	await expect(dataBtn).toBeEnabled();
	await dataBtn.click();
	await expect(page.getByRole('button', { name: 'answer link copied ✓' })).toBeVisible({ timeout: 5000 });

	const url = await page.evaluate(() => navigator.clipboard.readText());
	expect(url).toContain('/#p=1.');

	// Open the link in a fresh tab to simulate a recipient clicking the share URL.
	// (A genuine new page load is needed for the layout's import-on-load $effect to fire.)
	const freshPage = await page.context().newPage();
	await freshPage.goto(url);
	await expect(freshPage.getByText('Loaded a shared profile')).toBeVisible({ timeout: 5000 });
	await expect(freshPage.locator('label', { hasText: 'Assets' }).locator('input')).toHaveValue('424242');
	// The recipient's address bar should be clean after import — the hash is stripped.
	expect(freshPage.url()).not.toContain('#p=');
});
