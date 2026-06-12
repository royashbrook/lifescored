import { describe, expect, it } from 'vitest';
import { DEFAULT_INPUTS } from '../rulebook';
import { computeScore } from '../engine/score';
import { composeLocalNarrative } from './local';

describe('composeLocalNarrative', () => {
	it('mentions the strongest and weakest enabled rules and stays prose-length', () => {
		const result = computeScore({ ...DEFAULT_INPUTS, debt: 30000 });
		const text = composeLocalNarrative(result);
		const sorted = [...result.perRule].filter((p) => p.enabled).sort((a, b) => b.value / b.max - a.value / a.max);
		expect(text).toContain(sorted[0].label);
		expect(text).toContain(sorted[sorted.length - 1].label);
		expect(text.length).toBeGreaterThan(100);
		expect(text.length).toBeLessThan(1200);
	});

	it('mentions the biggest available lever when one exists', () => {
		const result = computeScore({ ...DEFAULT_INPUTS, debt: 30000 });
		const best = [...result.whatIfs].sort((a, b) => b.delta - a.delta)[0];
		expect(composeLocalNarrative(result)).toContain(best.label);
	});

	it('is deterministic', () => {
		const result = computeScore(DEFAULT_INPUTS);
		expect(composeLocalNarrative(result)).toBe(composeLocalNarrative(result));
	});
});
