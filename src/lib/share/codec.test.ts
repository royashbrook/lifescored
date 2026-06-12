import { describe, expect, it } from 'vitest';
import { DEFAULT_INPUTS } from '../rulebook';
import { decodeProfile, encodeProfile } from './codec';

describe('share codec', () => {
	it('round-trips a profile', async () => {
		const profile = {
			inputs: { ...DEFAULT_INPUTS, netWorth: 123456, country: 'br' as const },
			overrides: { country: { weight: 30 }, dti: { enabled: false } }
		};
		const encoded = await encodeProfile(profile);
		expect(encoded).toMatch(/^1\.[A-Za-z0-9_-]+$/); // versioned, url-safe
		const decoded = await decodeProfile(encoded);
		expect(decoded).toEqual(profile);
	});

	it('returns null for unknown versions, garbage, and empty input', async () => {
		const good = await encodeProfile({ inputs: DEFAULT_INPUTS, overrides: {} });
		expect(await decodeProfile('9.' + good.slice(2))).toBeNull();
		expect(await decodeProfile('1.!!!not-base64!!!')).toBeNull();
		expect(await decodeProfile('1.AAAA')).toBeNull(); // valid b64, invalid deflate
		expect(await decodeProfile('')).toBeNull();
	});

	it('produces URLs meaningfully shorter than raw JSON', async () => {
		const profile = { inputs: DEFAULT_INPUTS, overrides: {} };
		const encoded = await encodeProfile(profile);
		expect(encoded.length).toBeLessThan(JSON.stringify(profile).length);
	});
});
