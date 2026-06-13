import { test, expect } from '@playwright/test';

test('the wizard loads with header, progress, and the first question', async ({ page }) => {
	await page.goto('/start');
	await expect(page.getByText('GUIDED SETUP')).toBeVisible();
	await expect(page.getByText('1 / 8')).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Where do you live?' })).toBeVisible();
});

test('answering and clicking next advances the progress', async ({ page }) => {
	await page.goto('/start');
	await page.waitForLoadState('networkidle');
	await page.getByRole('button', { name: 'United States' }).click();
	await page.getByRole('button', { name: 'next ›' }).click();
	await expect(page.getByText('2 / 8')).toBeVisible();
	await expect(page.getByRole('heading', { name: 'How old are you?' })).toBeVisible();
});

test('the running score shows a number', async ({ page }) => {
	await page.goto('/start');
	await expect(page.getByText(/score so far · [\d,]+/)).toBeVisible();
});

test('the escape hatch returns to the full form', async ({ page }) => {
	await page.goto('/start');
	await page.waitForLoadState('networkidle');
	await page.getByRole('button', { name: /prefer the full form/ }).click();
	await expect(page).toHaveURL('/');
});

test('answers persist to the score page via the shared store', async ({ page }) => {
	await page.goto('/start');
	await page.waitForLoadState('networkidle');

	// Walk to the education step (index 6) and pick a distinctive value.
	for (let n = 0; n < 6; n++) {
		await page.getByRole('button', { name: 'next ›' }).click();
	}
	await expect(page.getByRole('heading', { name: 'Highest level of school you finished?' })).toBeVisible();
	await page.getByRole('button', { name: 'Graduate' }).click();

	// Last step, then finish.
	await page.getByRole('button', { name: 'next ›' }).click();
	await page.getByRole('button', { name: 'see your full score ›' }).click();

	await expect(page).toHaveURL('/');
	// The Education field on the score page should reflect the wizard answer.
	const education = page.locator('select').filter({ hasText: 'Graduate' });
	await expect(education).toHaveValue('graduate');
});

test('the score page links to the guided setup', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('link', { name: /walk through it one question at a time/ })).toHaveAttribute('href', '/start');
});

test('the wizard shows an early privacy reassurance linking to the why page', async ({ page }) => {
	await page.goto('/start');
	await expect(page.getByText(/Nothing you enter is collected/)).toBeVisible();
	await expect(page.getByRole('link', { name: /more on the why page/ })).toHaveAttribute('href', '/about');
});
