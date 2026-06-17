import { describe, expect, it } from 'vitest';
import { rulebookExport } from './export';
import { RULES, DEFAULT_INPUTS } from './index';

const exp = rulebookExport();
const rules = exp.rules as Array<{
	id: string;
	positions?: { input: string; byValue: Record<string, number> };
}>;

// Numeric-input rules have no finite `positions` table — they are reproduced from `constants`.
const NUMERIC_RULES = [
	'income',
	'networth',
	'dti',
	'credit-score',
	'life-table',
	'exercise',
	'sleep',
	'emergency-fund',
	'parenthood',
	'driving'
];

describe('rulebookExport position tables', () => {
	it('published positions match the engine exactly (single source of truth, no drift)', () => {
		for (const r of rules) {
			if (!r.positions) continue;
			const rule = RULES.find((x) => x.id === r.id)!;
			const key = r.positions.input;
			for (const [value, published] of Object.entries(r.positions.byValue)) {
				// Ordinals/booleans were stringified for the JSON keys — reconstruct the typed value.
				let v: string | number | boolean = value;
				if (value === 'true') v = true;
				else if (value === 'false') v = false;
				else if (/^-?\d+$/.test(value)) v = Number(value);
				const real = Math.round(rule.position({ ...DEFAULT_INPUTS, [key]: v } as never) * 1e6) / 1e6;
				expect(published).toBe(real);
			}
		}
	});

	it('includes methodology prose so the HTTPS payload has parity with the MCP', () => {
		expect(typeof (exp as { methodology?: unknown }).methodology).toBe('string');
		expect((exp as { methodology: string }).methodology.length).toBeGreaterThan(200);
	});

	it('every rule is reproducible: a positions table OR a constants formula', () => {
		const withoutTable = rules
			.filter((r) => !r.positions)
			.map((r) => r.id)
			.sort();
		// Exact match catches a NEW numeric rule slipping through with neither a table nor a formula.
		expect(withoutTable).toEqual([...NUMERIC_RULES].sort());
		// And each of those has a constants entry (keyed per the engine's own naming).
		const RULE_TO_CONSTANT: Record<string, string> = {
			income: 'income',
			networth: 'netWorth',
			dti: 'dti',
			'credit-score': 'creditScore',
			'life-table': 'lifeTable',
			exercise: 'exercise',
			sleep: 'sleep',
			'emergency-fund': 'emergencyFund',
			parenthood: 'parenthood',
			driving: 'driving'
		};
		const constantKeys = new Set(Object.keys(exp.constants));
		for (const id of NUMERIC_RULES) expect(constantKeys.has(RULE_TO_CONSTANT[id])).toBe(true);
	});
});
