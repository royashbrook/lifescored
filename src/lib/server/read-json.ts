export class BodyTooLarge extends Error {}

// Count streamed bytes before parsing. Content-Length is optional and untrusted.
export async function readJson(request: Request, maxBytes: number): Promise<unknown> {
	const reader = request.body?.getReader();
	if (!reader) return JSON.parse('');
	const decoder = new TextDecoder();
	let bytes = 0;
	let text = '';
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			bytes += value.byteLength;
			if (bytes > maxBytes) {
				await reader.cancel();
				throw new BodyTooLarge();
			}
			text += decoder.decode(value, { stream: true });
		}
		return JSON.parse(text + decoder.decode());
	} finally {
		reader.releaseLock();
	}
}
