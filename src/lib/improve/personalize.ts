import type { ScoreResult } from '../engine/score';
import { IMPROVE, type ImproveArea } from './resources';

/** The improve areas for the user's weakest *controllable* rules, worst first. */
export function personalizedAreas(result: ScoreResult, n = 3): ImproveArea[] {
	const weakRuleIds = result.perRule
		.filter((p) => p.controllable && p.enabled && p.max > 0)
		.sort((a, b) => a.value / a.max - b.value / b.max)
		.map((p) => p.id);
	const seen = new Set<string>();
	const ordered: ImproveArea[] = [];
	for (const ruleId of weakRuleIds) {
		const area = IMPROVE.find((ar) => ar.ruleIds.includes(ruleId) && !seen.has(ar.id));
		if (area) {
			seen.add(area.id);
			ordered.push(area);
		}
		if (ordered.length >= n) break;
	}
	return ordered;
}
