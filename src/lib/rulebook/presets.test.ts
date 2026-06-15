import { describe, expect, it } from 'vitest';
import { clampInputs, DEFAULT_INPUTS } from './inputs';
import { PRESETS } from './presets';

describe('PRESETS', () => {
	it('has the six named scenarios with unique ids and labels', () => {
		expect(PRESETS.map((p) => p.id)).toEqual(['single-us', 'family-us', 'global-median', 'born-ahead', 'started-behind', 'blank']);
		expect(new Set(PRESETS.map((p) => p.label)).size).toBe(6);
	});

	it('every preset is a complete, valid Inputs object (survives clamping unchanged)', () => {
		const keys = Object.keys(DEFAULT_INPUTS).sort();
		for (const p of PRESETS) {
			expect(Object.keys(p.inputs).sort()).toEqual(keys);
			expect(clampInputs(p.inputs)).toEqual(p.inputs);
		}
	});

	it('presets are meaningfully different from each other', () => {
		const serialized = PRESETS.map((p) => JSON.stringify(p.inputs));
		expect(new Set(serialized).size).toBe(PRESETS.length);
	});
});
