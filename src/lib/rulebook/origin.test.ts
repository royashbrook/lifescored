import { describe, expect, it } from 'vitest';
import { ORIGIN_RULES } from './origin';
import { DEFAULT_INPUTS, expectRuleInvariants } from './rule-test-utils';

const byId = (id: string) => ORIGIN_RULES.find((r) => r.id === id)!;

describe('origin rules', () => {
	it('satisfy universal invariants', () => {
		expect(ORIGIN_RULES).toHaveLength(5);
		for (const r of ORIGIN_RULES) {
			expectRuleInvariants(r);
			expect(r.domain).toBe('origin');
			expect(r.tier).toBe('starting_point');
			expect(r.controllable).toBe(false);
		}
	});

	it('country: higher income tier scores higher', () => {
		const r = byId('country');
		const nl = r.score({ ...DEFAULT_INPUTS, country: 'nl' }, r.defaultWeight);
		const br = r.score({ ...DEFAULT_INPUTS, country: 'br' }, r.defaultWeight);
		const af = r.score({ ...DEFAULT_INPUTS, country: 'af' }, r.defaultWeight);
		expect(nl).toBeGreaterThan(br);
		expect(br).toBeGreaterThan(af);
	});

	it('generational support is monotonic and flagged speculative', () => {
		const r = byId('generational');
		expect(r.evidence).toBe('SPECULATIVE');
		const s = [0, 1, 2].map((f) => r.score({ ...DEFAULT_INPUTS, familySupport: f as 0 | 1 | 2 }, r.defaultWeight));
		expect(s[0]).toBeLessThan(s[1]);
		expect(s[1]).toBeLessThan(s[2]);
	});

	it('passport strength follows the country henley band', () => {
		const r = byId('passport');
		expect(r.score({ ...DEFAULT_INPUTS, country: 'us' }, 6)).toBeGreaterThan(
			r.score({ ...DEFAULT_INPUTS, country: 'in' }, 6)
		);
	});
});
