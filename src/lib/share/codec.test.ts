import { describe, expect, it } from 'vitest';
import { DEFAULT_INPUTS } from '../rulebook';
import { decodeProfile, encodeProfile } from './codec';

describe('share codec', () => {
	it('round-trips a profile', async () => {
		const profile = {
			inputs: { ...DEFAULT_INPUTS, assets: 123456, country: 'br' as const },
			overrides: { country: { weight: 30 }, dti: { enabled: false } },
			packs: {}
		};
		const encoded = await encodeProfile(profile);
		expect(encoded).toMatch(/^1\.[A-Za-z0-9_-]+$/); // versioned, url-safe
		const decoded = await decodeProfile(encoded);
		expect(decoded).toEqual(profile);
	});

	it('returns null for unknown versions, garbage, and empty input', async () => {
		const good = await encodeProfile({ inputs: DEFAULT_INPUTS, overrides: {}, packs: {} });
		expect(await decodeProfile('9.' + good.slice(2))).toBeNull();
		expect(await decodeProfile('1.!!!not-base64!!!')).toBeNull();
		expect(await decodeProfile('1.AAAA')).toBeNull(); // valid b64, invalid deflate
		expect(await decodeProfile('')).toBeNull();
		expect(await decodeProfile('1.')).toBeNull(); // empty payload
		const nulls = await encodeProfile({ inputs: null, overrides: null } as never);
		expect(await decodeProfile(nulls)).toBeNull(); // null fields rejected
	});

	it('sanitizes hostile overrides and merges missing inputs over defaults', async () => {
		const hostile = await encodeProfile({
			inputs: { age: 44 },
			overrides: { country: { weight: 'abc' }, dti: { enabled: 'yes' }, bmi: { weight: 12, enabled: false }, junk: null }
		} as never);
		const p = (await decodeProfile(hostile))!;
		expect(p.inputs.age).toBe(44);
		expect(p.inputs.country).toBe(DEFAULT_INPUTS.country); // missing keys filled
		expect(p.overrides.country).toBeUndefined(); // NaN weight dropped
		expect(p.overrides.dti).toBeUndefined(); // non-boolean enabled dropped
		expect(p.overrides.bmi).toEqual({ weight: 12, enabled: false }); // valid survives
	});

	it('produces URLs meaningfully shorter than raw JSON', async () => {
		const profile = { inputs: DEFAULT_INPUTS, overrides: {}, packs: {} };
		const encoded = await encodeProfile(profile);
		expect(encoded.length).toBeLessThan(JSON.stringify(profile).length);
	});

	it('migrates v1 profiles: degree maps to education', async () => {
		const legacyTrue = await encodeProfile({ inputs: { degree: true }, overrides: {} } as never);
		expect((await decodeProfile(legacyTrue))!.inputs.education).toBe('bachelor');
		const legacyFalse = await encodeProfile({ inputs: { degree: false }, overrides: {} } as never);
		expect((await decodeProfile(legacyFalse))!.inputs.education).toBe('hs');
		// explicit education wins over legacy degree
		const both = await encodeProfile({ inputs: { degree: false, education: 'graduate' }, overrides: {} } as never);
		expect((await decodeProfile(both))!.inputs.education).toBe('graduate');
	});

	it('migrates pre-split profiles: netWorth becomes assets = netWorth + debt (net worth preserved)', async () => {
		// old profile: $80k net worth, $30k debt → gross assets $110k, derived net worth still $80k
		const legacy = await encodeProfile({ inputs: { netWorth: 80000, debt: 30000 }, overrides: {} } as never);
		const p = (await decodeProfile(legacy))!;
		expect(p.inputs.assets).toBe(110000);
		expect('netWorth' in p.inputs).toBe(false);
		expect(p.inputs.assets - p.inputs.debt).toBe(80000);
		// negative legacy net worth with no debt floors assets at 0 (assets can't be negative)
		const underwater = await encodeProfile({ inputs: { netWorth: -100000, debt: 0 }, overrides: {} } as never);
		expect((await decodeProfile(underwater))!.inputs.assets).toBe(0);
		// explicit assets wins over legacy netWorth
		const both = await encodeProfile({ inputs: { netWorth: 80000, debt: 0, assets: 5000 }, overrides: {} } as never);
		expect((await decodeProfile(both))!.inputs.assets).toBe(5000);
	});

	it('drops unknown input keys entirely', async () => {
		const noisy = await encodeProfile({ inputs: { age: 30, bogusField: 'x' }, overrides: {} } as never);
		const p = (await decodeProfile(noisy))!;
		expect('bogusField' in p.inputs).toBe(false);
		expect(p.inputs.age).toBe(30);
	});

	it('preserves falsy values that differ from defaults', async () => {
		const enc = await encodeProfile({
			inputs: { ...DEFAULT_INPUTS, insured: false, voterRegistered: false, exerciseMins: 0 },
			overrides: {},
			packs: {}
		});
		const p = (await decodeProfile(enc))!;
		expect(p.inputs.insured).toBe(false);
		expect(p.inputs.voterRegistered).toBe(false);
		expect(p.inputs.exerciseMins).toBe(0);
	});

	it('round-trips enabled packs', async () => {
		const enc = await encodeProfile({ inputs: DEFAULT_INPUTS, overrides: {}, packs: { foundations: true } });
		expect((await decodeProfile(enc))!.packs).toEqual({ foundations: true });
	});

	it('sanitizes hostile packs — unknown ids and non-booleans dropped', async () => {
		const enc = await encodeProfile({ inputs: DEFAULT_INPUTS, overrides: {}, packs: { foundations: 'yes', bogus: true, speculative: false } } as never);
		expect((await decodeProfile(enc))!.packs).toEqual({ speculative: false });
	});

	it('missing packs default to empty', async () => {
		const enc = await encodeProfile({ inputs: DEFAULT_INPUTS, overrides: {} } as never);
		expect((await decodeProfile(enc))!.packs).toEqual({});
	});
});
