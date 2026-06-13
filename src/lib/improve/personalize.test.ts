import { describe, expect, it } from 'vitest';
import { DEFAULT_INPUTS } from '../rulebook';
import { computeScore } from '../engine/score';
import { personalizedAreas } from './personalize';

describe('personalizedAreas', () => {
	it('includes exercise and nicotine areas when those are clearly weak', () => {
		const result = computeScore({ ...DEFAULT_INPUTS, exerciseMins: 0, smoker: 'current' });
		const areas = personalizedAreas(result);
		const ids = areas.map((a) => a.id);
		expect(ids).toContain('exercise');
		expect(ids).toContain('nicotine');
	});

	it('returns at most n areas', () => {
		const result = computeScore({ ...DEFAULT_INPUTS, exerciseMins: 0, smoker: 'current' });
		expect(personalizedAreas(result, 3).length).toBeLessThanOrEqual(3);
		expect(personalizedAreas(result, 2).length).toBeLessThanOrEqual(2);
	});

	it('returns no duplicate area ids', () => {
		const result = computeScore({ ...DEFAULT_INPUTS, exerciseMins: 0, smoker: 'current' });
		const areas = personalizedAreas(result);
		const ids = areas.map((a) => a.id);
		expect(new Set(ids).size).toBe(ids.length);
	});
});
