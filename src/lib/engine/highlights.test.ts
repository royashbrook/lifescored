import { describe, expect, it } from 'vitest';
import { DEFAULT_INPUTS } from '../rulebook';
import { computeScore } from './score';
import { topMovers } from './highlights';

describe('topMovers', () => {
	it('returns the biggest positive contributors and the weakest rows, enabled only', () => {
		const result = computeScore({ ...DEFAULT_INPUTS, netWorth: -40000, debt: 50000 });
		const { lifting, weakest } = topMovers(result, 3);
		expect(lifting.length).toBeLessThanOrEqual(3);
		expect(weakest.length).toBeLessThanOrEqual(3);
		// lifting sorted descending by value, all positive
		expect(lifting.every((r) => r.value > 0)).toBe(true);
		expect([...lifting].sort((a, b) => b.value - a.value)).toEqual(lifting);
		// weakest sorted ascending by value (most negative / lowest first)
		expect([...weakest].sort((a, b) => a.value - b.value)).toEqual(weakest);
		// a deeply negative rule (networth) must be in weakest, not lifting
		expect(weakest.some((r) => r.id === 'networth')).toBe(true);
		expect(lifting.some((r) => r.id === 'networth')).toBe(false);
	});

	it('excludes disabled rules from both lists', () => {
		const result = computeScore(DEFAULT_INPUTS, { country: { enabled: false } });
		const { lifting, weakest } = topMovers(result, 3);
		expect([...lifting, ...weakest].some((r) => r.id === 'country')).toBe(false);
	});

	it('lifting and weakest never share a rule', () => {
		const result = computeScore(DEFAULT_INPUTS);
		const { lifting, weakest } = topMovers(result, 3);
		const ids = new Set(lifting.map((r) => r.id));
		expect(weakest.every((r) => !ids.has(r.id))).toBe(true);
	});
});
