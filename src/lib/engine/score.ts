import { clampInputs, RULES } from '../rulebook';
import type { Domain, Evidence, Inputs, Tier } from '../rulebook';

export interface RuleOverride {
	weight?: number;
	enabled?: boolean;
}
export type Overrides = Partial<Record<string, RuleOverride>>;

export interface RuleScore {
	id: string;
	label: string;
	domain: Domain;
	tier: Tier;
	evidence: Evidence;
	controllable: boolean;
	value: number;
	max: number;
	enabled: boolean;
	description: string;
}

export interface WhatIfDelta {
	ruleId: string;
	label: string;
	delta: number;
}

export interface ScoreResult {
	perRule: RuleScore[];
	tierSubtotals: Record<Tier, number>;
	domainSubtotals: Record<Domain, number>;
	composite: number;
	whatIfs: WhatIfDelta[];
}

export const MAX_WEIGHT = 50;

function compositeOf(inputs: Inputs, overrides: Overrides): number {
	inputs = clampInputs(inputs);
	let total = 0;
	for (const rule of RULES) {
		const o = overrides[rule.id];
		if (o?.enabled === false) continue;
		total += rule.score(inputs, clampWeight(o?.weight ?? rule.defaultWeight));
	}
	return total;
}

/** Weights are clamped to [0, 50]; negative overrides become 0 (rule contributes nothing but stays enabled). */
const clampWeight = (w: number) => Math.max(0, Math.min(MAX_WEIGHT, w));

export function computeScore(rawInputs: Inputs, overrides: Overrides = {}): ScoreResult {
	const inputs = clampInputs(rawInputs);
	const tierSubtotals: Record<Tier, number> = { starting_point: 0, your_moves: 0 };
	const domainSubtotals: Record<Domain, number> = { origin: 0, health: 0, finance: 0, education: 0, social: 0, civic: 0 };

	const perRule: RuleScore[] = RULES.map((rule) => {
		const o = overrides[rule.id];
		const enabled = o?.enabled !== false;
		const max = clampWeight(o?.weight ?? rule.defaultWeight);
		const value = rule.score(inputs, max);
		if (enabled) {
			tierSubtotals[rule.tier] += value;
			domainSubtotals[rule.domain] += value;
		}
		return {
			id: rule.id, label: rule.label, domain: rule.domain, tier: rule.tier,
			evidence: rule.evidence, controllable: rule.controllable,
			value, max, enabled, description: rule.describe(inputs)
		};
	});

	const composite = tierSubtotals.starting_point + tierSubtotals.your_moves;

	const whatIfs: WhatIfDelta[] = RULES.filter(
		(r) => r.whatIf && overrides[r.id]?.enabled !== false && r.whatIf.applicable(inputs)
	).map((r) => ({
		ruleId: r.id,
		label: r.whatIf!.label,
		delta: compositeOf(r.whatIf!.transform(inputs), overrides) - composite
	}));

	return { perRule, tierSubtotals, domainSubtotals, composite, whatIfs };
}
