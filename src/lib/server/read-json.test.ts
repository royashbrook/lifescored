import { expect, it } from 'vitest';
import { readJson, BodyTooLarge } from './read-json';

it('counts streamed UTF-8 bytes and cancels oversized input without trusting Content-Length', async () => {
	for (const length of [undefined, '1']) {
		let cancelled = false;
		const body = new ReadableStream({
			start(controller) {
				controller.enqueue(new TextEncoder().encode('"é'));
				controller.enqueue(new TextEncoder().encode('é"'));
			},
			cancel() { cancelled = true; }
		});
		const request = new Request('https://test', {
			method: 'POST', body, headers: length ? { 'content-length': length } : {},
			duplex: 'half'
		} as RequestInit);
		await expect(readJson(request, 5)).rejects.toBeInstanceOf(BodyTooLarge);
		expect(cancelled).toBe(true);
	}
	const exact = new Request('https://test', { method: 'POST', body: '"éé"' });
	expect(await readJson(exact, 6)).toBe('éé');
	await expect(readJson(new Request('https://test', { method: 'POST', body: '{' }), 64)).rejects.toBeInstanceOf(SyntaxError);
});
