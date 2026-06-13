import { test, expect } from '@playwright/test';

// Helper: locates the Field label element (a <label> wrapping the input) for a given field name.
// We target <label> elements (Field.svelte wraps in <label>) to avoid matching score-row chips
// or narrative text that also contain "Clean water" substrings.
const cleanWaterField = (page: import('@playwright/test').Page) =>
	page.locator('label', { hasText: /^Clean water/ });
const registeredToVoteField = (page: import('@playwright/test').Page) =>
	page.locator('label', { hasText: /^Registered to vote/ });

test('speculative and foundations rules are absent by default', async ({ page }) => {
	await page.goto('/');
	await page.waitForLoadState('networkidle');
	// expand detail so any speculative fields would be visible if present
	await page.getByRole('button', { name: /add detail/ }).click();
	await expect(registeredToVoteField(page)).toHaveCount(0);
	await expect(cleanWaterField(page)).toHaveCount(0);
});

test('enabling the Foundations layer raises the composite and shows its inputs', async ({ page }) => {
	await page.goto('/');
	await page.waitForLoadState('networkidle');
	const before = Number((await page.getByTestId('composite').textContent())!.replace(/[^0-9-]/g, ''));
	await page.getByRole('button', { name: /Foundations/ }).click();
	await expect(cleanWaterField(page)).toBeVisible();
	const after = Number((await page.getByTestId('composite').textContent())!.replace(/[^0-9-]/g, ''));
	expect(after).toBeGreaterThan(before);
	// toggle off → reverts
	await page.getByRole('button', { name: /Foundations/ }).click();
	await expect(cleanWaterField(page)).toHaveCount(0);
});

test('enabling the Speculative layer reveals the quarantined inputs', async ({ page }) => {
	await page.goto('/');
	await page.waitForLoadState('networkidle');
	await page.getByRole('button', { name: /Speculative/ }).click();
	await page.getByRole('button', { name: /add detail/ }).click();
	await expect(registeredToVoteField(page)).toBeVisible();
});
