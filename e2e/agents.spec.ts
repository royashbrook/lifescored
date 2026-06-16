import { test, expect } from '@playwright/test';

test('footer links to the agents page, which shows the MCP endpoint', async ({ page }) => {
	await page.goto('/');
	await page.waitForLoadState('networkidle');
	const link = page.getByRole('link', { name: 'use with AI' });
	await expect(link).toHaveAttribute('href', '/agents');
	await link.click();
	await expect(page).toHaveURL(/\/agents/);
	await expect(page.getByRole('heading', { name: 'Use this with an AI' })).toBeVisible();
	await expect(page.getByText('https://lifescored.com/mcp').first()).toBeVisible();
	await expect(page.getByText('https://lifescored.com/rules.json').first()).toBeVisible();
});
