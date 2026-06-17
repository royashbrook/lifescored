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

test('the score card renders on-device and downloads as a PNG', async ({ page }) => {
	await page.goto('/');
	await page.waitForLoadState('networkidle');

	// The button is disabled until the card has been rendered client-side — proves renderScoreCard ran.
	const dl = page.getByRole('button', { name: /download score card/ });
	await expect(dl).toBeEnabled({ timeout: 5000 });

	const [download] = await Promise.all([page.waitForEvent('download'), dl.click()]);
	expect(download.suggestedFilename()).toBe('life-scored.png');
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
	await expect(freshPage.getByText('Showing answers from a shared link')).toBeVisible({ timeout: 5000 });
	await expect(freshPage.locator('label', { hasText: 'Assets' }).locator('input')).toHaveValue('424242');
	// The recipient's address bar should be clean after import — the hash is stripped.
	expect(freshPage.url()).not.toContain('#p=');
});

test('opening a shared link never clobbers your own saved answers until you edit', async ({ page, context }) => {
	await page.goto('/');
	await page.waitForLoadState('networkidle');
	const assets = (p = page) => p.locator('label', { hasText: 'Assets' }).locator('input');

	// Build a shareable link carrying DIFFERENT answers (222222)...
	await assets().fill('222222');
	await page.waitForTimeout(400);
	await page.getByRole('button', { name: /share my exact answers/ }).click();
	await page.getByRole('button', { name: 'share the full answer link' }).click();
	await expect(page.getByRole('button', { name: 'answer link copied ✓' })).toBeVisible({ timeout: 5000 });
	const link = await page.evaluate(() => navigator.clipboard.readText());

	// ...then settle on my own answers (111111) and let them persist to localStorage.
	await assets().fill('111111');
	await page.waitForTimeout(300);

	// Open the shared link in the same context (shared localStorage). It shows their answers...
	const peek = await context.newPage();
	await peek.goto(link);
	await expect(peek.getByText('Showing answers from a shared link')).toBeVisible({ timeout: 5000 });
	await expect(assets(peek)).toHaveValue('222222');
	await peek.close(); // closed without editing

	// ...and a fresh visit shows MY saved answers intact — the peek did not clobber them.
	const mine = await context.newPage();
	await mine.goto('/');
	await mine.waitForLoadState('networkidle');
	await expect(assets(mine)).toHaveValue('111111');
	await mine.close();

	// Editing while viewing a shared link DOES commit — the first change makes it yours.
	const edit = await context.newPage();
	await edit.goto(link);
	await expect(assets(edit)).toHaveValue('222222');
	await assets(edit).fill('333333');
	await edit.waitForTimeout(300);
	await edit.close();

	const after = await context.newPage();
	await after.goto('/');
	await after.waitForLoadState('networkidle');
	await expect(assets(after)).toHaveValue('333333');
});
