import { describe, expect, it } from 'vitest';
import { DEFAULT_INPUTS, RULES } from '../rulebook';
import { computeScore } from './score';

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
		const inputs = { ...DEFAULT_INPUTS, debt: 20000, degree: false };
		const r = computeScore(inputs);
		const ids = r.whatIfs.map((w) => w.ruleId);
		expect(ids).toContain('dti'); // has debt → clear-the-debt lever
		expect(ids).toContain('degree');
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
});
