import { describe, expect, it } from 'vitest';
import { FINANCE_RULES, medianNetWorthForAge, EQUIV_MEDIAN_INCOME, householdSize } from './finance';
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

	it('net worth median rises continuously with age — no band-edge cliff', () => {
		expect(medianNetWorthForAge(27)).toBe(39000); // clamped at the youngest anchor
		expect(medianNetWorthForAge(50)).toBeGreaterThan(medianNetWorthForAge(30));
		// the old step model jumped ~$96k at 35; interpolation keeps each year's change small
		expect(Math.abs(medianNetWorthForAge(35) - medianNetWorthForAge(34))).toBeLessThan(15000);
		expect(medianNetWorthForAge(90)).toBe(335600); // clamped at the oldest anchor
	});

	it('networth: above the age median scores positive, far below scores negative', () => {
		const r = byId('networth');
		// v3: net worth derived from assets − debt; position-based (sqrt above median, linear below)
		expect(r.position!({ ...DEFAULT_INPUTS, age: 27, assets: 100000, debt: 0 })).toBeGreaterThan(0);
		expect(r.position!({ ...DEFAULT_INPUTS, age: 27, assets: 0, debt: 40000 })).toBeLessThan(0);
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
	// drive net worth through assets (debt 0), so assets value == net worth
	const at = (netWorth: number, age = 27) => nw.position!({ ...DEFAULT_INPUTS, age, assets: netWorth, debt: 0 });

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
		const v = Math.round(Math.max(-0.5, at(1e12, 50)) * nw.defaultWeight);
		expect(v).toBeGreaterThan(30000);
	});

	it('income: half marks at the size-adjusted median for a 1-person household, sqrt above, floor 0', () => {
		const p = (income: number) => inc.position!({ ...DEFAULT_INPUTS, income, partnered: false, children: 0 });
		expect(p(EQUIV_MEDIAN_INCOME)).toBeCloseTo(0.5, 5);
		expect(p(EQUIV_MEDIAN_INCOME * 4)).toBeCloseTo(1.5, 5);  // 0.5 + sqrt(4) - 1 = 1.5
		expect(p(0)).toBe(0);
		expect(p(EQUIV_MEDIAN_INCOME / 2)).toBeCloseTo(0.25, 5);
		expect(p(6_000_000)).toBeGreaterThan(p(600000));
	});

	it('describe states the raw multiple of the median (dominance line)', () => {
		const d = nw.describe({ ...DEFAULT_INPUTS, age: 50, assets: 1e12, debt: 0 });
		expect(d).toMatch(/4,0\d{2},\d{3}×/); // ~4,045,xxx× of the 247,200 median (age-50 anchor)
		expect(inc.describe({ ...DEFAULT_INPUTS, income: 600000, partnered: false, children: 0 })).toContain('×'); // a multiple of the size-adjusted median
	});
});

describe('income adequacy (household-sized, v3.1)', () => {
	const inc = byId('income');

	it('household size = self + partner + children', () => {
		expect(householdSize({ ...DEFAULT_INPUTS, partnered: false, children: 0 })).toBe(1);
		expect(householdSize({ ...DEFAULT_INPUTS, partnered: true, children: 0 })).toBe(2);
		expect(householdSize({ ...DEFAULT_INPUTS, partnered: true, children: 3 })).toBe(5);
	});

	it('the same income scores lower as dependents (partner or kids) are added', () => {
		const base = { ...DEFAULT_INPUTS, income: 100000, partnered: false, children: 0 };
		expect(inc.position!({ ...base, children: 3 })).toBeLessThan(inc.position!(base));
		expect(inc.position!({ ...base, partnered: true })).toBeLessThan(inc.position!(base));
	});

	it('a high earner with kids still clears the median; a thin income with the same kids does not', () => {
		expect(inc.position!({ ...DEFAULT_INPUTS, income: 250000, partnered: true, children: 3 })).toBeGreaterThan(0.5);
		expect(inc.position!({ ...DEFAULT_INPUTS, income: 30000, partnered: true, children: 3 })).toBeLessThan(0.5);
	});

	it('declares income, partnered and children as its inputs', () => {
		expect(inc.inputs).toEqual(['income', 'partnered', 'children']);
	});
});

describe('net worth = assets − debt (v3 split)', () => {
	const nw = byId('networth');

	it('scores assets minus debt, not assets alone', () => {
		// 200k assets, 200k debt → 0 net worth → far below median → negative
		expect(nw.position!({ ...DEFAULT_INPUTS, age: 40, assets: 200000, debt: 200000 })).toBeLessThan(0);
		// same assets, no debt → above the 40-yr median → positive
		expect(nw.position!({ ...DEFAULT_INPUTS, age: 40, assets: 200000, debt: 0 })).toBeGreaterThan(0);
	});

	it('debt can drive net worth negative even with positive assets', () => {
		const p = nw.position!({ ...DEFAULT_INPUTS, age: 27, assets: 10000, debt: 60000 });
		expect(p).toBeLessThan(0);
		expect(p).toBeGreaterThanOrEqual(nw.bounds[0]); // floored, not -Infinity
	});

	it('describe shows the assets − debt breakdown only when there is debt', () => {
		expect(nw.describe({ ...DEFAULT_INPUTS, assets: 50000, debt: 20000 })).toContain('assets − ');
		expect(nw.describe({ ...DEFAULT_INPUTS, assets: 50000, debt: 0 })).not.toContain('assets − ');
	});

	it('declares assets, debt and age as its inputs', () => {
		expect(nw.inputs).toEqual(['assets', 'debt', 'age']);
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
