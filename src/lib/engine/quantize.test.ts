import { describe, expect, it } from 'vitest';
import { DEFAULT_INPUTS } from '../rulebook';
import { quantizeForNarrative } from './quantize';
import { computeScore } from './score';

describe('quantizeForNarrative', () => {
	it('rounds all subtotals to nearest 5 and sorts lever ids', () => {
		const result = computeScore({ ...DEFAULT_INPUTS, debt: 20000 });
		const q = quantizeForNarrative(result);
		expect(q.v).toBe(1);
		for (const v of [...Object.values(q.domains), q.tiers.starting_point, q.tiers.your_moves]) {
			expect(v % 5).toBe(0);
		}
		expect(q.levers).toEqual([...q.levers].sort());
	});

	it('nearby profiles land in the same bucket (cache efficiency)', () => {
		const a = quantizeForNarrative(computeScore({ ...DEFAULT_INPUTS, assets: 6000 }));
		const b = quantizeForNarrative(computeScore({ ...DEFAULT_INPUTS, assets: 6400 }));
		expect(a).toEqual(b);
	});
});
