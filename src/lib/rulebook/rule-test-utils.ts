import { expect } from 'vitest';
import { COUNTRIES, DEFAULT_INPUTS } from './inputs';
import type { Inputs, Rule } from './types';

// A spread of profiles that exercises extremes of every input.
export const SAMPLE_INPUTS: Inputs[] = [
	DEFAULT_INPUTS,
	{
		...DEFAULT_INPUTS, country: 'af', familySupport: 0, parentsDegree: false, neighborhood: 0,
		age: 72, sex: 'f', smoker: 'current', exerciseMins: 0, alcohol: 'heavy', sleepHours: 4,
		insured: false, bmiBand: 'obese', income: 0, netWorth: -40000, debt: 90000,
		latePayments: 2, creditUtil: 95, emergencyMonths: 0, homeowner: false, education: 'hs',
		employment: 'unemployed', outlook: 'declining', housing: 'unhoused', socialConnection: 0,
		partnered: false, volunteers: false, drivingIncidents: 4, digitalFootprint: 0,
		banking: 'unbanked', criminalRecord: true, voterRegistered: false
	},
	{
		...DEFAULT_INPUTS, country: 'nl', familySupport: 2, parentsDegree: true, neighborhood: 2,
		age: 35, sex: 'f', smoker: 'never', exerciseMins: 300, alcohol: 'none', sleepHours: 8,
		insured: true, bmiBand: 'normal', income: 250000, netWorth: 900000, debt: 0,
		latePayments: 0, creditUtil: 3, emergencyMonths: 12, homeowner: true, education: 'graduate',
		employment: 'self', outlook: 'growing', housing: 'stable', socialConnection: 2,
		partnered: true, volunteers: true, drivingIncidents: 0, digitalFootprint: 2,
		banking: 'banked', criminalRecord: false, voterRegistered: true
	}
];

/** Universal invariants every rule must satisfy. */
export function expectRuleInvariants(rule: Rule) {
	const score = (r: Rule, i: Inputs, w: number) =>
		Math.round(Math.max(r.bounds[0], Math.min(r.bounds[1], r.position(i))) * w) || 0;

	for (const i of SAMPLE_INPUTS) {
		for (const w of [rule.defaultWeight, 1, 40]) {
			const v = score(rule, i, w);
			expect(Number.isInteger(v), `${rule.id} returns integers`).toBe(true);
			expect(Number.isFinite(v), `${rule.id} returns finite scores`).toBe(true);
			const [lo, hi] = rule.bounds;
			expect(v, `${rule.id} score ≥ lo×w`).toBeGreaterThanOrEqual(Math.round(lo * w));
			if (hi !== Infinity) expect(v, `${rule.id} score ≤ hi×w`).toBeLessThanOrEqual(Math.round(hi * w));
		}
		expect(score(rule, i, 0), `${rule.id} zero weight → zero`).toBe(0);
		expect(rule.describe(i).length, `${rule.id} describes every profile`).toBeGreaterThan(0);
	}
	expect(rule.bounds, `${rule.id}: position requires bounds`).toBeDefined();
	expect(rule.weightRationale.length, `${rule.id}: position contract requires weightRationale`).toBeGreaterThan(0);
	expect(rule.source.url).toMatch(/^https:\/\//);
	expect(['2026-06-11', '2026-06-12']).toContain(rule.source.accessed);
	if (rule.whatIf) {
		expect(rule.controllable, `${rule.id}: only controllable rules get levers`).toBe(true);
	}
}

export { COUNTRIES, DEFAULT_INPUTS };
