import { test, expect } from '@playwright/test';

test('/improve loads with the no-affiliate promise and a known resource', async ({ page }) => {
	await page.goto('/improve');
	await expect(page.getByText('No affiliate links, by design')).toBeVisible();
	await expect(page.getByRole('link', { name: /CareerOneStop/ })).toBeVisible();
});

test('the GitHub Sponsors support link points at github.com/sponsors', async ({ page }) => {
	await page.goto('/improve');
	const sponsor = page.getByRole('link', { name: /GitHub Sponsors/ });
	await expect(sponsor).toBeVisible();
	await expect(sponsor).toHaveAttribute('href', /github\.com\/sponsors/);
});

test('nav has an Improve link that routes to /improve', async ({ page }) => {
	await page.goto('/');
	await page.waitForLoadState('networkidle');
	await page.getByRole('link', { name: 'Improve' }).click();
	await expect(page).toHaveURL(/\/improve/);
	await expect(page.getByRole('link', { name: /Khan Academy/ })).toBeVisible();
});
