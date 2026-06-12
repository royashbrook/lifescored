import { describe, expect, it } from 'vitest';
import { FINANCE_RULES, medianNetWorthForAge } from './finance';
import { DEFAULT_INPUTS, expectRuleInvariants } from './rule-test-utils';

const byId = (id: string) => FINANCE_RULES.find((r) => r.id === id)!;

describe('finance rules', () => {
	it('satisfy universal invariants', () => {
		expect(FINANCE_RULES).toHaveLength(7);
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
		expect(r.score!({ ...DEFAULT_INPUTS, age: 27, netWorth: 100000 }, r.defaultWeight)).toBeGreaterThan(0);
		expect(r.score!({ ...DEFAULT_INPUTS, age: 27, netWorth: -40000 }, r.defaultWeight)).toBeLessThan(0);
	});

	it('dti: more debt never raises the score; zero debt scores max', () => {
		const r = byId('dti');
		const s = (debt: number) => r.score!({ ...DEFAULT_INPUTS, debt }, r.defaultWeight);
		expect(s(0)).toBe(r.defaultWeight);
		expect(s(10000)).toBeLessThan(s(0));
		expect(s(60000)).toBeLessThan(s(10000));
		expect(s(500000)).toBe(-r.defaultWeight); // clamped at -weight
	});

	it('dti handles zero income without dividing by zero', () => {
		const r = byId('dti');
		const v = r.score!({ ...DEFAULT_INPUTS, income: 0, debt: 50000 }, r.defaultWeight);
		expect(Number.isFinite(v)).toBe(true);
		expect(v).toBe(-r.defaultWeight);
	});

	it('utilization: lower is better, very high goes negative', () => {
		const r = byId('utilization');
		const s = (u: number) => r.score!({ ...DEFAULT_INPUTS, creditUtil: u }, r.defaultWeight);
		expect(s(5)).toBeGreaterThan(s(40));
		expect(s(95)).toBeLessThan(0);
	});

	it('emergency fund saturates at 3 months and has a lever', () => {
		const r = byId('emergency-fund');
		const s = (m: number) => r.score!({ ...DEFAULT_INPUTS, emergencyMonths: m }, r.defaultWeight);
		expect(s(0)).toBe(0);
		expect(s(3)).toBe(r.defaultWeight);
		expect(s(12)).toBe(s(3));
		expect(r.whatIf!.applicable({ ...DEFAULT_INPUTS, emergencyMonths: 1 })).toBe(true);
		expect(r.whatIf!.transform({ ...DEFAULT_INPUTS, emergencyMonths: 1 }).emergencyMonths).toBe(3);
	});
});
