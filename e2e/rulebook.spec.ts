import { test, expect } from '@playwright/test';

test('rulebook has the collapsible all-sources bibliography', async ({ page }) => {
	await page.goto('/rulebook');
	await expect(page.getByText(/All sources — the raw citation list/)).toBeVisible();
});

test('the why page redirects to the rulebook instead of relisting the weights', async ({ page }) => {
	await page.goto('/about');
	await expect(page.getByText('The weights, justified')).toHaveCount(0);
	await expect(page.getByRole('link', { name: 'rulebook' }).first()).toBeVisible();
});
