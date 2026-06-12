import { describe, expect, it } from 'vitest';
import { CIVIC_RULES } from './civic';
import { EDUCATION_RULES } from './education';
import { DEFAULT_INPUTS, expectRuleInvariants } from './rule-test-utils';
import { SOCIAL_RULES } from './social';

const all = [...EDUCATION_RULES, ...SOCIAL_RULES, ...CIVIC_RULES];
const byId = (id: string) => all.find((r) => r.id === id)!;

describe('education / social / civic rules', () => {
	it('satisfy universal invariants and counts (3 + 6 + 2)', () => {
		expect(EDUCATION_RULES).toHaveLength(3);
		expect(SOCIAL_RULES).toHaveLength(6);
		expect(CIVIC_RULES).toHaveLength(2);
		for (const r of all) expectRuleInvariants(r);
	});

	it('social connection is monotonic (Holt-Lunstad)', () => {
		const r = byId('connection');
		const s = [0, 1, 2].map((c) => r.score!({ ...DEFAULT_INPUTS, socialConnection: c as 0 | 1 | 2 }, r.defaultWeight));
		expect(s[0]).toBeLessThan(s[1]);
		expect(s[1]).toBeLessThan(s[2]);
	});

	it('driving: incidents only ever lower the score, floor is mildly negative', () => {
		const r = byId('driving');
		const s = (n: number) => r.score!({ ...DEFAULT_INPUTS, drivingIncidents: n }, r.defaultWeight);
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

describe('education ladder (v2)', () => {
	const r = byId('education');
	const p = (education: 'none' | 'hs' | 'some' | 'bachelor' | 'graduate') =>
		r.position!({ ...DEFAULT_INPUTS, education });

	it('is monotonic up the ladder and subtractive only at the bottom', () => {
		expect(p('none')).toBeLessThan(0);
		expect(p('none')).toBeGreaterThanOrEqual(-0.2);
		expect(p('hs')).toBeGreaterThan(p('none'));
		expect(p('some')).toBeGreaterThan(p('hs'));
		expect(p('bachelor')).toBeGreaterThan(p('some'));
		expect(p('graduate')).toBe(p('bachelor')); // field-dependent premium: capped at the BA rung
	});

	it('finish-a-degree lever applies below bachelor only', () => {
		expect(r.whatIf!.applicable({ ...DEFAULT_INPUTS, education: 'hs' })).toBe(true);
		expect(r.whatIf!.applicable({ ...DEFAULT_INPUTS, education: 'bachelor' })).toBe(false);
		expect(r.whatIf!.transform({ ...DEFAULT_INPUTS, education: 'some' }).education).toBe('bachelor');
	});
});

describe('housing stability (v2)', () => {
	const r = SOCIAL_RULES.find((x) => x.id === 'housing-stability')!;
	it('subtracts only for unhoused, within declared bounds, not controllable', () => {
		const p = (housing: 'unhoused' | 'insecure' | 'stable') => r.position!({ ...DEFAULT_INPUTS, housing });
		expect(p('unhoused')).toBe(-0.5);
		expect(p('insecure')).toBeGreaterThan(0);
		expect(p('insecure')).toBeLessThan(p('stable'));
		expect(p('stable')).toBe(1);
		expect(r.controllable).toBe(false);
		expect(r.caveat).toBeTruthy();
	});
});
