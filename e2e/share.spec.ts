import { test, expect } from '@playwright/test';

test('share copies a link that round-trips the profile', async ({ page }) => {
	await page.goto('/');
	const netWorth = page.locator('label', { hasText: 'Net worth' }).locator('input');
	await netWorth.fill('424242');
	await page.waitForTimeout(400); // let the share URL recompute

	const shareBtn = page.getByRole('button', { name: /share — inputs travel/ });
	await expect(shareBtn).toBeEnabled();
	await shareBtn.click();
	// desktop chromium has no navigator.share → clipboard path → "shared ✓"
	await expect(page.getByRole('button', { name: 'shared ✓' })).toBeVisible({ timeout: 5000 });

	const url = await page.evaluate(() => navigator.clipboard.readText());
	expect(url).toContain('/#p=1.');

	// Open the link in a fresh tab to simulate a recipient clicking the share URL.
	// (Using the same page for page.goto with a hash navigates client-side in SvelteKit
	// and the layout $effect for the hash only fires correctly on a genuine new page load.)
	const freshPage = await page.context().newPage();
	await freshPage.goto(url);
	await expect(freshPage.getByText('Loaded a shared profile')).toBeVisible({ timeout: 5000 });
	await expect(freshPage.locator('label', { hasText: 'Net worth' }).locator('input')).toHaveValue('424242');
});
