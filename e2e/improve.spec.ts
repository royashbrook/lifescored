import { test, expect } from '@playwright/test';

test('/improve loads with the no-affiliate promise and a known resource', async ({ page }) => {
	await page.goto('/improve');
	await expect(page.getByText('No affiliate links, by design')).toBeVisible();
	await expect(page.getByRole('link', { name: /CareerOneStop/ })).toBeVisible();
});

test('the support card offers GitHub Sponsors and the repo', async ({ page }) => {
	await page.goto('/improve');
	const sponsor = page.getByRole('link', { name: /sponsor on GitHub/ });
	await expect(sponsor).toBeVisible();
	await expect(sponsor).toHaveAttribute('href', 'https://github.com/sponsors/royashbrook');
	await expect(page.getByRole('link', { name: /star the repo/ })).toHaveAttribute(
		'href',
		/github\.com\/royashbrook\/lifescored/
	);
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
