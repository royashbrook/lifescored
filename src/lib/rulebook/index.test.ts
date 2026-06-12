import { describe, expect, it } from 'vitest';
import { DOMAINS, RULES, TIERS } from './index';

describe('rulebook aggregate', () => {
	it('contains all 29 rules with unique ids', () => {
		expect(RULES).toHaveLength(29);
		expect(new Set(RULES.map((r) => r.id)).size).toBe(29);
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
});
