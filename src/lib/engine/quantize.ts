import type { Domain, Tier } from '../rulebook';
import type { ScoreResult } from './score';

export interface NarrativePayload {
	v: 1;
	domains: Record<Domain, number>;
	tiers: Record<Tier, number>;
	levers: string[];
}

const to5 = (n: number) => Math.round(n / 5) * 5;

export function quantizeForNarrative(result: ScoreResult): NarrativePayload {
	const domains = Object.fromEntries(
		Object.entries(result.domainSubtotals).map(([d, v]) => [d, to5(v)])
	) as Record<Domain, number>;
	return {
		v: 1,
		domains,
		tiers: {
			starting_point: to5(result.tierSubtotals.starting_point),
			your_moves: to5(result.tierSubtotals.your_moves)
		},
		levers: result.whatIfs.map((w) => w.ruleId).sort()
	};
}
