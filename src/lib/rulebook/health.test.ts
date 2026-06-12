import { describe, expect, it } from 'vitest';
import { HEALTH_RULES } from './health';
import { DEFAULT_INPUTS, expectRuleInvariants } from './rule-test-utils';

const byId = (id: string) => HEALTH_RULES.find((r) => r.id === id)!;

describe('health rules', () => {
	it('satisfy universal invariants', () => {
		expect(HEALTH_RULES).toHaveLength(7);
		for (const r of HEALTH_RULES) {
			expectRuleInvariants(r);
			expect(r.domain).toBe('health');
		}
	});

	it('life-table is starting_point; behaviors are your_moves', () => {
		expect(byId('life-table').tier).toBe('starting_point');
		for (const id of ['smoking', 'exercise', 'alcohol', 'sleep', 'insurance', 'bmi']) {
			expect(byId(id).tier).toBe('your_moves');
		}
	});

	it('life-table: younger scores higher; women slightly higher at same age', () => {
		const r = byId('life-table');
		const young = r.score!({ ...DEFAULT_INPUTS, age: 25 }, r.defaultWeight);
		const old = r.score!({ ...DEFAULT_INPUTS, age: 70 }, r.defaultWeight);
		expect(young).toBeGreaterThan(old);
		const f = r.score!({ ...DEFAULT_INPUTS, age: 50, sex: 'f' }, r.defaultWeight);
		const m = r.score!({ ...DEFAULT_INPUTS, age: 50, sex: 'm' }, r.defaultWeight);
		expect(f).toBeGreaterThanOrEqual(m);
	});

	it('smoking: never > former > current; quit lever applies only to current smokers', () => {
		const r = byId('smoking');
		const s = (smoker: 'never' | 'former' | 'current') => r.score!({ ...DEFAULT_INPUTS, smoker }, r.defaultWeight);
		expect(s('never')).toBeGreaterThan(s('former'));
		expect(s('former')).toBeGreaterThan(s('current'));
		expect(r.whatIf!.applicable({ ...DEFAULT_INPUTS, smoker: 'current' })).toBe(true);
		expect(r.whatIf!.applicable({ ...DEFAULT_INPUTS, smoker: 'never' })).toBe(false);
		expect(r.whatIf!.transform({ ...DEFAULT_INPUTS, smoker: 'current' }).smoker).toBe('former');
	});

	it('exercise: more minutes never lowers the score; saturates at guideline', () => {
		const r = byId('exercise');
		const s = (m: number) => r.score!({ ...DEFAULT_INPUTS, exerciseMins: m }, r.defaultWeight);
		expect(s(0)).toBeLessThan(s(75));
		expect(s(75)).toBeLessThan(s(150));
		expect(s(150)).toBe(s(600));
	});

	it('sleep: 7–9h band scores best', () => {
		const r = byId('sleep');
		const s = (h: number) => r.score!({ ...DEFAULT_INPUTS, sleepHours: h }, r.defaultWeight);
		expect(s(8)).toBeGreaterThan(s(6));
		expect(s(6)).toBeGreaterThan(s(4));
		expect(s(8)).toBeGreaterThan(s(11));
	});

	it('bmi carries a caveat about the measure itself', () => {
		expect(byId('bmi').caveat).toBeTruthy();
	});

	it('alcohol: none > moderate > heavy', () => {
		const r = byId('alcohol');
		const s = (alcohol: 'none' | 'moderate' | 'heavy') => r.score!({ ...DEFAULT_INPUTS, alcohol }, r.defaultWeight);
		expect(s('none')).toBeGreaterThan(s('moderate'));
		expect(s('moderate')).toBeGreaterThan(s('heavy'));
	});
});
