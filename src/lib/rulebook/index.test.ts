import { describe, expect, it } from 'vitest';
import { DOMAINS, RULES, TIERS } from './index';

describe('rulebook aggregate', () => {
	it('contains all 31 rules with unique ids', () => {
		expect(RULES).toHaveLength(31);
		expect(new Set(RULES.map((r) => r.id)).size).toBe(31);
	});

	it('every rule belongs to a declared domain and tier', () => {
		for (const r of RULES) {
			expect(DOMAINS[r.domain]).toBeDefined();
			expect(TIERS[r.tier]).toBeDefined();
		}
	});

	it('every domain has at least one rule', () => {
		for (const d of Object.keys(DOMAINS)) {
			expect(RULES.some((r) => r.domain === d), d).toBe(true);
		}
	});

	it('only the blessed rules may subtract (constrained-subtractive principle)', () => {
		const subtractive = RULES.filter((r) => r.bounds[0] < 0).map((r) => r.id).sort();
		expect(subtractive).toEqual(['driving', 'dti', 'education', 'housing-stability', 'networth', 'utilization']);
	});

	it('every uncapped rule is wealth (uncapped principle)', () => {
		const uncapped = RULES.filter((r) => r.bounds[1] === Infinity).map((r) => r.id).sort();
		expect(uncapped).toEqual(['income', 'networth']);
	});
});
