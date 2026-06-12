import { clamp, clampInputs, RULES } from '../rulebook';
import type { Domain, Evidence, Inputs, Rule, Tier } from '../rulebook';

export interface RuleOverride {
	weight?: number;
	enabled?: boolean;
}
export type Overrides = Partial<Record<string, RuleOverride>>;

/** Weight 1.0× ≡ this many points; income is the anchor rule. */
export const BASELINE_WEIGHT = 10;

const clampPosition = (rule: Rule, inputs: Inputs) => clamp(rule.position(inputs), rule.bounds[0], rule.bounds[1]);

/** Shared arithmetic: round(position × weight), coercing -0 to 0. */
export function pointsFromPosition(position: number, weight: number): number {
	return Math.round(position * weight) || 0;
}

/** The one place the formula lives: points = round(clamped position × weight). */
export function pointsFor(rule: Rule, inputs: Inputs, weight: number): number {
	return pointsFromPosition(clampPosition(rule, inputs), weight);
}

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
	position: number;
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
		total += pointsFor(rule, inputs, clampWeight(o?.weight ?? rule.defaultWeight));
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
		const position = clampPosition(rule, inputs);
		const value = pointsFromPosition(position, max);
		if (enabled) {
			tierSubtotals[rule.tier] += value;
			domainSubtotals[rule.domain] += value;
		}
		return {
			id: rule.id, label: rule.label, domain: rule.domain, tier: rule.tier,
			evidence: rule.evidence, controllable: rule.controllable,
			value, max, enabled, description: rule.describe(inputs), position
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
