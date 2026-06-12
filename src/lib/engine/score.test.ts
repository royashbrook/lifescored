import { describe, expect, it } from 'vitest';
import { DEFAULT_INPUTS, RULES } from '../rulebook';
import { BASELINE_WEIGHT, computeScore, pointsFor } from './score';
import type { Rule } from '../rulebook';

describe('computeScore', () => {
	it('produces one entry per rule and consistent totals', () => {
		const r = computeScore(DEFAULT_INPUTS);
		expect(r.perRule).toHaveLength(RULES.length);
		const sum = r.perRule.filter((p) => p.enabled).reduce((a, p) => a + p.value, 0);
		expect(r.composite).toBe(sum);
		expect(r.tierSubtotals.starting_point + r.tierSubtotals.your_moves).toBe(r.composite);
		const domainSum = Object.values(r.domainSubtotals).reduce((a, b) => a + b, 0);
		expect(domainSum).toBe(r.composite);
	});

	it('weight override scales a rule; enabled:false excludes it from totals but keeps the row', () => {
		const base = computeScore(DEFAULT_INPUTS);
		const doubled = computeScore(DEFAULT_INPUTS, { country: { weight: 48 } });
		const baseCountry = base.perRule.find((p) => p.id === 'country')!;
		const dblCountry = doubled.perRule.find((p) => p.id === 'country')!;
		// exact doubling holds for this rule because 0.75×24 and 0.75×48 are both integers; not a general guarantee under rounding
		expect(dblCountry.value).toBe(baseCountry.value * 2);
		expect(dblCountry.max).toBe(48);
		expect(doubled.tierSubtotals.starting_point).toBe(base.tierSubtotals.starting_point + baseCountry.value);
		expect(doubled.domainSubtotals.origin).toBe(base.domainSubtotals.origin + baseCountry.value);

		const disabled = computeScore(DEFAULT_INPUTS, { country: { enabled: false } });
		const row = disabled.perRule.find((p) => p.id === 'country')!;
		expect(row.enabled).toBe(false);
		expect(disabled.composite).toBe(base.composite - baseCountry.value);
	});

	it('clamps raw inputs before scoring', () => {
		const r = computeScore({ ...DEFAULT_INPUTS, age: 9999, creditUtil: -50 });
		expect(r.perRule.every((p) => Number.isFinite(p.value))).toBe(true);
	});

	it('what-ifs: only applicable levers appear, and applying one reproduces the delta', () => {
		const inputs = { ...DEFAULT_INPUTS, debt: 20000, education: 'hs' as const };
		const r = computeScore(inputs);
		const ids = r.whatIfs.map((w) => w.ruleId);
		expect(ids).toContain('dti'); // has debt → clear-the-debt lever
		expect(ids).toContain('education');
		expect(ids).not.toContain('smoking'); // default is never-smoker

		const clear = r.whatIfs.find((w) => w.ruleId === 'dti')!;
		const after = computeScore({ ...inputs, debt: 0 });
		expect(clear.delta).toBe(after.composite - r.composite);
		expect(clear.delta).toBeGreaterThan(0);
	});

	it('a disabled rule contributes no what-if lever', () => {
		const inputs = { ...DEFAULT_INPUTS, debt: 20000 };
		const r = computeScore(inputs, { dti: { enabled: false } });
		expect(r.whatIfs.map((w) => w.ruleId)).not.toContain('dti');
	});

	it('a trillionaire profile survives input clamping end-to-end (uncapped wealth)', () => {
		const r = computeScore({ ...DEFAULT_INPUTS, age: 54, netWorth: 1e12 });
		const nw = r.perRule.find((p) => p.id === 'networth')!;
		expect(nw.value).toBeGreaterThan(100);
		expect(Number.isFinite(r.composite)).toBe(true);
	});

	it('never produces NaN from hostile input values', () => {
		const hostile = { ...DEFAULT_INPUTS, smoker: 'yes', familySupport: 99 } as unknown as typeof DEFAULT_INPUTS;
		const r = computeScore(hostile);
		expect(Number.isFinite(r.composite)).toBe(true);
		expect(r.perRule.every((p) => Number.isFinite(p.value))).toBe(true);
	});
});

const syntheticRule = {
	id: 'synthetic', domain: 'finance', tier: 'your_moves', label: 'Synthetic',
	controllable: true, defaultWeight: 10,
	logic: 'test', evidence: 'SOURCED',
	source: { name: 't', finding: 't', url: 'https://example.com', accessed: '2026-06-12' },
	inputs: [], describe: () => 'synthetic',
	position: (i: typeof DEFAULT_INPUTS) => i.age / 100,
	bounds: [-0.5, Infinity] as [number, number],
	weightRationale: 'test'
} as unknown as Rule;

describe('engine formula (position × weight)', () => {
	it('computes points = round(position × weight), clamped to bounds', () => {
		const i = { ...DEFAULT_INPUTS, age: 75 };
		expect(pointsFor(syntheticRule, i, 10)).toBe(8); // round(0.75 × 10)
		expect(pointsFor(syntheticRule, i, 0)).toBe(0);
	});
	it('clamps position to declared lower bound and tolerates Infinity upper', () => {
		const lowRule = { ...syntheticRule, position: () => -3 } as Rule;
		expect(pointsFor(lowRule, DEFAULT_INPUTS, 10)).toBe(-5); // clamped to -0.5
		const highRule = { ...syntheticRule, position: () => 6.6 } as Rule;
		expect(pointsFor(highRule, DEFAULT_INPUTS, 10)).toBe(66); // uncapped above
	});
	it('exports the baseline weight', () => {
		expect(BASELINE_WEIGHT).toBe(10);
	});
});
