import { describe, expect, it } from 'vitest';
import { FOUNDATIONS_RULES } from './foundations';
import { DEFAULT_INPUTS, expectRuleInvariants } from './rule-test-utils';

describe('foundations pack', () => {
	it('has 4 sourced starting-point rules in the foundations pack', () => {
		expect(FOUNDATIONS_RULES).toHaveLength(4);
		for (const r of FOUNDATIONS_RULES) {
			expectRuleInvariants(r);
			expect(r.pack).toBe('foundations');
			expect(r.tier).toBe('starting_point');
			expect(r.controllable).toBe(false);
			expect(r.evidence).toBe('SOURCED');
		}
	});
	it('water-sanitation is monotonic none < basic < safe', () => {
		const r = FOUNDATIONS_RULES.find((x) => x.id === 'water-sanitation')!;
		const p = (wash: 'none' | 'basic' | 'safe') => r.position({ ...DEFAULT_INPUTS, wash });
		expect(p('none')).toBeLessThan(p('basic'));
		expect(p('basic')).toBeLessThan(p('safe'));
	});
	it('food-security and peace go negative at the worst band', () => {
		const food = FOUNDATIONS_RULES.find((x) => x.id === 'food-security')!;
		const peace = FOUNDATIONS_RULES.find((x) => x.id === 'peace-rule-of-law')!;
		expect(food.position({ ...DEFAULT_INPUTS, foodSecurity: 'insecure' })).toBeLessThan(0);
		expect(peace.position({ ...DEFAULT_INPUTS, stability: 'conflict' })).toBeLessThan(0);
	});
});
