import { describe, expect, it } from 'vitest';
import { CIVIC_RULES } from './civic';
import { EDUCATION_RULES } from './education';
import { DEFAULT_INPUTS, expectRuleInvariants } from './rule-test-utils';
import { SOCIAL_RULES } from './social';

const all = [...EDUCATION_RULES, ...SOCIAL_RULES, ...CIVIC_RULES];
const byId = (id: string) => all.find((r) => r.id === id)!;

describe('education / social / civic rules', () => {
	it('satisfy universal invariants and counts (3 + 5 + 2)', () => {
		expect(EDUCATION_RULES).toHaveLength(3);
		expect(SOCIAL_RULES).toHaveLength(5);
		expect(CIVIC_RULES).toHaveLength(2);
		for (const r of all) expectRuleInvariants(r);
	});

	it('degree: holding one scores higher; lever only when missing', () => {
		const r = byId('degree');
		const w = r.defaultWeight;
		expect(r.score({ ...DEFAULT_INPUTS, degree: true }, w)).toBeGreaterThan(
			r.score({ ...DEFAULT_INPUTS, degree: false }, w)
		);
		expect(r.whatIf!.applicable({ ...DEFAULT_INPUTS, degree: false })).toBe(true);
		expect(r.whatIf!.applicable({ ...DEFAULT_INPUTS, degree: true })).toBe(false);
	});

	it('social connection is monotonic (Holt-Lunstad)', () => {
		const r = byId('connection');
		const s = [0, 1, 2].map((c) => r.score({ ...DEFAULT_INPUTS, socialConnection: c as 0 | 1 | 2 }, r.defaultWeight));
		expect(s[0]).toBeLessThan(s[1]);
		expect(s[1]).toBeLessThan(s[2]);
	});

	it('driving: incidents only ever lower the score, floor is mildly negative', () => {
		const r = byId('driving');
		const s = (n: number) => r.score({ ...DEFAULT_INPUTS, drivingIncidents: n }, r.defaultWeight);
		expect(s(0)).toBeGreaterThan(s(1));
		expect(s(1)).toBeGreaterThan(s(3));
		expect(s(10)).toBeGreaterThanOrEqual(-r.defaultWeight);
	});

	it('digital footprint and voting access are flagged speculative', () => {
		expect(byId('digital').evidence).toBe('SPECULATIVE');
		expect(byId('voting').evidence).toBe('SPECULATIVE');
	});

	it('criminal record rule carries a systemic-bias caveat and partnership a selection caveat', () => {
		expect(byId('criminal-record').caveat).toBeTruthy();
		expect(byId('partnership').caveat).toBeTruthy();
	});
});
