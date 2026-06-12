import { describe, expect, it } from 'vitest';
import { FINANCE_RULES, medianNetWorthForAge } from './finance';
import { DEFAULT_INPUTS, expectRuleInvariants } from './rule-test-utils';

const byId = (id: string) => FINANCE_RULES.find((r) => r.id === id)!;

describe('finance rules', () => {
	it('satisfy universal invariants', () => {
		expect(FINANCE_RULES).toHaveLength(8);
		for (const r of FINANCE_RULES) {
			expectRuleInvariants(r);
			expect(r.domain).toBe('finance');
			expect(r.tier).toBe('your_moves');
		}
	});

	it('net worth medians are age-banded and increasing toward retirement', () => {
		expect(medianNetWorthForAge(27)).toBe(39000);
		expect(medianNetWorthForAge(50)).toBeGreaterThan(medianNetWorthForAge(30));
	});

	it('networth: above the age median scores positive, far below scores negative', () => {
		const r = byId('networth');
		// v2: position-based (log scale above median, linear below)
		expect(r.position!({ ...DEFAULT_INPUTS, age: 27, netWorth: 100000 })).toBeGreaterThan(0);
		expect(r.position!({ ...DEFAULT_INPUTS, age: 27, netWorth: -40000 })).toBeLessThan(0);
	});

	it('dti: more debt never raises the score; zero debt scores max', () => {
		const r = byId('dti');
		const w = r.defaultWeight;
		const s = (debt: number) => Math.round(Math.max(-1, Math.min(1, r.position!({ ...DEFAULT_INPUTS, debt }))) * w);
		expect(s(0)).toBe(w);
		expect(s(10000)).toBeLessThan(s(0));
		expect(s(60000)).toBeLessThan(s(10000));
		expect(s(500000)).toBe(-w); // clamped at -weight via bounds [-1, 1]
	});

	it('dti handles zero income without dividing by zero', () => {
		const r = byId('dti');
		const w = r.defaultWeight;
		const v = Math.round(Math.max(-1, Math.min(1, r.position!({ ...DEFAULT_INPUTS, income: 0, debt: 50000 }))) * w);
		expect(Number.isFinite(v)).toBe(true);
		expect(v).toBe(-w);
	});

	it('utilization: lower is better, very high goes negative', () => {
		const r = byId('utilization');
		const w = r.defaultWeight;
		const s = (u: number) => Math.round(r.position!({ ...DEFAULT_INPUTS, creditUtil: u }) * w) || 0;
		expect(s(5)).toBeGreaterThan(s(40));
		expect(s(95)).toBeLessThan(0);
	});

	it('emergency fund saturates at 3 months and has a lever', () => {
		const r = byId('emergency-fund');
		const w = r.defaultWeight;
		const s = (m: number) => Math.round(Math.min(1, r.position!({ ...DEFAULT_INPUTS, emergencyMonths: m })) * w);
		expect(s(0)).toBe(0);
		expect(s(3)).toBe(w);
		expect(s(12)).toBe(s(3));
		expect(r.whatIf!.applicable({ ...DEFAULT_INPUTS, emergencyMonths: 1 })).toBe(true);
		expect(r.whatIf!.transform({ ...DEFAULT_INPUTS, emergencyMonths: 1 }).emergencyMonths).toBe(3);
	});
});

describe('power-law wealth (v2.1)', () => {
	const nw = byId('networth');
	const inc = byId('income');
	const at = (netWorth: number, age = 27) => nw.position!({ ...DEFAULT_INPUTS, age, netWorth });

	it('networth: continuous at the median seam and monotonic', () => {
		const median = medianNetWorthForAge(27);
		expect(at(median)).toBeCloseTo(0, 5);
		expect(at(median - 1)).toBeLessThanOrEqual(0);
		expect(at(median * 4)).toBeCloseTo(1, 5);    // sqrt(4)-1 = 1
		expect(at(median * 100)).toBeCloseTo(9, 5);  // sqrt(100)-1 = 9
		expect(at(median * 100)).toBeGreaterThan(at(median * 10));
	});

	it('networth: below-median behavior unchanged from v1 (linear, floored at -0.5)', () => {
		const median = medianNetWorthForAge(27);
		expect(at(0)).toBeCloseTo(-0.5, 5);
		expect(at(-1_000_000)).toBe(-0.5); // bounds floor
	});

	it('networth: a trillionaire visibly dominates (the uncapped principle)', () => {
		const v = Math.round(Math.max(-0.5, at(1e12, 54)) * nw.defaultWeight);
		expect(v).toBeGreaterThan(30000);
	});

	it('income: 0.5 at median, sqrt above, floor 0, monotonic', () => {
		const p = (income: number) => inc.position!({ ...DEFAULT_INPUTS, income });
		expect(p(60000)).toBeCloseTo(0.5, 5);
		expect(p(240000)).toBeCloseTo(1.5, 5);  // 0.5 + sqrt(4) - 1 = 1.5
		expect(p(0)).toBe(0);
		expect(p(30000)).toBeCloseTo(0.25, 5);
		expect(p(6_000_000)).toBeGreaterThan(p(600000));
	});

	it('describe states the raw multiple of the median (dominance line)', () => {
		const d = nw.describe({ ...DEFAULT_INPUTS, age: 54, netWorth: 1e12 });
		expect(d).toMatch(/4,0\d{2},\d{3}×/); // ~4,045,xxx× of the 247,200 median
		expect(inc.describe({ ...DEFAULT_INPUTS, income: 600000 })).toContain('10×');
	});
});

describe('banked (v2)', () => {
	const r = byId('banked');
	it('prices the poverty premium: unbanked 0, underbanked half, banked full', () => {
		const p = (banking: 'unbanked' | 'underbanked' | 'banked') => r.position!({ ...DEFAULT_INPUTS, banking });
		expect(p('unbanked')).toBe(0);
		expect(p('underbanked')).toBe(0.5);
		expect(p('banked')).toBe(1);
	});
});
