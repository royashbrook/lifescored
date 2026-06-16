import { describe, expect, it } from 'vitest';
import { clampInputs, COUNTRIES, DEFAULT_INPUTS, NUMERIC_CLAMPS, TIER_BASE } from './inputs';
import type { CountryCode } from './types';

describe('inputs', () => {
	it('defaults are already within clamps (round-trips unchanged)', () => {
		expect(clampInputs(DEFAULT_INPUTS)).toEqual(DEFAULT_INPUTS);
	});

	it('clamps out-of-range numerics to their bounds', () => {
		const wild = { ...DEFAULT_INPUTS, age: 900, debt: -5, creditScore: 9000 };
		const c = clampInputs(wild);
		expect(c.age).toBe(NUMERIC_CLAMPS.age[1]);
		expect(c.debt).toBe(0);
		expect(c.creditScore).toBe(850); // clamped to FICO ceiling
	});

	it('every country has a name, a valid income tier, and a henley band; base is set by tier', () => {
		for (const c of Object.values(COUNTRIES)) {
			expect(c.name.length).toBeGreaterThan(0);
			expect([0, 1, 2]).toContain(c.henleyBand);
			expect(['high', 'upper-middle', 'lower-middle', 'low']).toContain(c.tier);
			expect(TIER_BASE[c.tier]).toBeGreaterThan(0);
			expect(TIER_BASE[c.tier]).toBeLessThanOrEqual(1);
		}
	});

	it('invalid country falls back to us', () => {
		const bad = { ...DEFAULT_INPUTS, country: 'xx' as unknown as CountryCode };
		expect(clampInputs(bad).country).toBe('us');
	});

	it('repairs invalid enum, ordinal, and boolean values from untrusted profiles', () => {
		const hostile = {
			...DEFAULT_INPUTS,
			smoker: 'yes', sex: 'attack', bmiBand: 7, employment: null,
			familySupport: 99, neighborhood: -3, socialConnection: 1.7,
			education: 'phd', insured: 0
		} as unknown as typeof DEFAULT_INPUTS;
		const c = clampInputs(hostile);
		expect(c.smoker).toBe(DEFAULT_INPUTS.smoker);
		expect(c.sex).toBe(DEFAULT_INPUTS.sex);
		expect(c.bmiBand).toBe(DEFAULT_INPUTS.bmiBand);
		expect(c.employment).toBe(DEFAULT_INPUTS.employment);
		expect(c.familySupport).toBe(2);
		expect(c.neighborhood).toBe(0);
		expect(c.socialConnection).toBe(2); // ordinal rounds and clamps to 0–2
		expect(c.education).toBe(DEFAULT_INPUTS.education); // invalid enum falls back to default
		expect(c.insured).toBe(false);
	});
});
