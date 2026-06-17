import { test, expect } from '@playwright/test';

test('the app still mounts when localStorage access is blocked', async ({ page }) => {
	// Simulate Safari "Block All Cookies" / a sandboxed iframe, where merely *accessing* the
	// localStorage getter throws SecurityError (before any getItem/setItem call).
	await page.addInitScript(() => {
		Object.defineProperty(window, 'localStorage', {
			configurable: true,
			get() {
				throw new DOMException('The operation is insecure.', 'SecurityError');
			}
		});
	});
	await page.goto('/');
	await page.waitForLoadState('networkidle');
	// If the layout crashed on the localStorage access, nothing would render. It should mount fine
	// (falling back to in-memory state).
	await expect(page.getByTestId('composite')).toBeVisible();
});
