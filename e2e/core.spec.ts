import { test, expect } from '@playwright/test';

test('renders the wordmark, composite, and top-movers strip', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { name: 'life. scored.' })).toBeVisible();
	await expect(page.getByTestId('composite')).toHaveText(/\d/);
	await expect(page.getByText("WHAT'S MOVING YOUR SCORE MOST")).toBeVisible();
});

test('presets change the composite — global median scores below born ahead', async ({ page }) => {
	await page.goto('/');
	// networkidle ensures Svelte hydration is complete so button click handlers are wired up
	await page.waitForLoadState('networkidle');
	const compositeLocator = page.getByTestId('composite');

	// Click Global median first — it reliably differs from the default composite (154 vs 184)
	await page.getByRole('button', { name: 'Global median' }).click();
	await expect(compositeLocator).not.toHaveText('184');
	const low = Number((await compositeLocator.textContent())!.replace(/[^0-9-]/g, ''));

	// Click Born ahead — it produces a significantly higher composite
	await page.getByRole('button', { name: 'Born ahead' }).click();
	await expect(compositeLocator).not.toHaveText(String(low));
	const high = Number((await compositeLocator.textContent())!.replace(/[^0-9-]/g, ''));

	expect(low).toBeLessThan(high);
});

test('a definition popover opens with a rule link', async ({ page }) => {
	await page.goto('/');
	// networkidle ensures Svelte hydration is complete so button click handlers are wired up
	await page.waitForLoadState('networkidle');
	await page.getByRole('button', { name: 'What does this mean?' }).first().click();
	await expect(page.getByRole('link', { name: /read the rule/ })).toBeVisible();
});

test('page title carries the composite for meaningful sharing', async ({ page }) => {
	await page.goto('/');
	await page.waitForLoadState('networkidle');
	await expect(page).toHaveTitle(/life\. scored\. [\d,]+/);
});
