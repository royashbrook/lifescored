import { describe, expect, it } from 'vitest';
import { FIELD_HELP } from './help';
import { DEFAULT_INPUTS } from './inputs';
import { RULES } from './index';

describe('FIELD_HELP', () => {
	it('covers every input field exactly', () => {
		const inputKeys = Object.keys(DEFAULT_INPUTS).sort();
		expect(Object.keys(FIELD_HELP).sort()).toEqual(inputKeys);
	});

	it('every entry has a non-trivial help sentence and a real rule id', () => {
		const ruleIds = new Set(RULES.map((r) => r.id));
		for (const [key, entry] of Object.entries(FIELD_HELP)) {
			expect(entry.help.length, `${key} help`).toBeGreaterThan(20);
			expect(ruleIds.has(entry.ruleId), `${key} → ${entry.ruleId} is a real rule`).toBe(true);
		}
	});
});
