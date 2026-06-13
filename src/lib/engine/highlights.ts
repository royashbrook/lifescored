import type { RuleScore, ScoreResult } from './score';

export interface Highlights {
	lifting: RuleScore[];
	weakest: RuleScore[];
}

/**
 * The biggest positive contributors (lifting) and the lowest-scoring rows (weakest),
 * over enabled rules only. lifting and weakest are disjoint: weakest is drawn from the
 * rows not already shown as lifting.
 */
export function topMovers(result: ScoreResult, n = 3): Highlights {
	const enabled = result.perRule.filter((p) => p.enabled);
	const byValueDesc = [...enabled].sort((a, b) => b.value - a.value);
	const lifting = byValueDesc.filter((p) => p.value > 0).slice(0, n);
	const liftingIds = new Set(lifting.map((p) => p.id));
	const weakest = [...enabled]
		.filter((p) => !liftingIds.has(p.id))
		.sort((a, b) => a.value - b.value)
		.slice(0, n);
	return { lifting, weakest };
}
