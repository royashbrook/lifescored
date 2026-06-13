import { test, expect } from '@playwright/test';

test('/improve loads with the no-affiliate promise and a known resource', async ({ page }) => {
	await page.goto('/improve');
	await expect(page.getByText('No affiliate links, by design')).toBeVisible();
	await expect(page.getByRole('link', { name: /CareerOneStop/ })).toBeVisible();
});

test('nav has an Improve link that routes to /improve', async ({ page }) => {
	await page.goto('/');
	await page.waitForLoadState('networkidle');
	await page.getByRole('link', { name: 'Improve' }).click();
	await expect(page).toHaveURL(/\/improve/);
	await expect(page.getByRole('link', { name: /Khan Academy/ }).first()).toBeVisible();
});

test('"Start here" heading is present with the default profile', async ({ page }) => {
	await page.goto('/improve');
	await expect(page.getByRole('heading', { name: /Start here/i })).toBeVisible();
});
