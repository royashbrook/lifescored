import type { ScoreResult } from '../engine/score';

/** Deterministic narrative from rule descriptions — used when AI is unavailable. */
export function composeLocalNarrative(result: ScoreResult): string {
	const enabled = result.perRule.filter((p) => p.enabled && p.max > 0);
	const byStrength = [...enabled].sort((a, b) => b.value / b.max - a.value / a.max);
	if (byStrength.length === 0) {
		return 'Every rule is currently excluded from your score — re-enable at least one on the Rulebook page to see what the numbers are saying.';
	}
	const strongest = byStrength[0];
	const weakest = byStrength[byStrength.length - 1];
	const start = result.tierSubtotals.starting_point;
	const moves = result.tierSubtotals.your_moves;

	const parts = [
		`Your starting point contributes ${start} points and your own moves contribute ${moves} — the split matters more than the ${result.composite} total.`,
		`Your strongest position is ${strongest.label}: ${strongest.description}.`,
		`The biggest drag is ${weakest.label}: ${weakest.description}.`
	];

	const best = [...result.whatIfs].sort((a, b) => b.delta - a.delta)[0];
	if (best && best.delta > 0) {
		parts.push(`Of the levers you control, “${best.label}” moves the most: +${best.delta} points. A delta, not a destiny.`);
	}
	return parts.join(' ');
}
