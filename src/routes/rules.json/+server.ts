import { json } from '@sveltejs/kit';
import {
	RULES,
	DOMAINS,
	TIERS,
	PACKS,
	COUNTRIES,
	DEFAULT_INPUTS,
	NUMERIC_CLAMPS,
	STRING_ENUMS,
	ORDINALS,
	BOOLEANS,
	FIELD_HELP,
	type Inputs
} from '$lib/rulebook';
import { BASELINE_WEIGHT } from '$lib/engine/score';
import { MEDIAN_HOUSEHOLD_INCOME, EQUIV_MEDIAN_INCOME, NW_ANCHORS } from '$lib/rulebook/finance';

// Static, prerendered, PII-free: the complete rulebook + the exact math, so any agent can
// compute a life score on its OWN side. No inputs are ever sent to this server.
export const prerender = true;

const ordinalSet = new Set<string>(ORDINALS);
const booleanSet = new Set<string>(BOOLEANS);

/** Describe each input so an agent knows what to ask the user and how to validate it. */
function inputSchema() {
	return (Object.keys(DEFAULT_INPUTS) as (keyof Inputs)[]).map((key) => {
		const help = FIELD_HELP[key]?.help ?? '';
		const feedsRule = FIELD_HELP[key]?.ruleId ?? null;
		const base = { key, help, feedsRule, default: DEFAULT_INPUTS[key] };
		if (key === 'country') {
			return { ...base, type: 'enum', values: Object.keys(COUNTRIES) };
		}
		if (key in NUMERIC_CLAMPS) {
			const [min, max] = NUMERIC_CLAMPS[key as keyof typeof NUMERIC_CLAMPS];
			return { ...base, type: 'number', min, max };
		}
		if (key in STRING_ENUMS) {
			return { ...base, type: 'enum', values: STRING_ENUMS[key as keyof typeof STRING_ENUMS] };
		}
		if (ordinalSet.has(key)) {
			return { ...base, type: 'ordinal', values: [0, 1, 2], note: '0 = least, 2 = most' };
		}
		if (booleanSet.has(key)) {
			return { ...base, type: 'boolean', values: [true, false] };
		}
		return { ...base, type: 'unknown' };
	});
}

export function GET() {
	const body = {
		name: 'life. scored.',
		url: 'https://lifescored.com',
		schemaVersion: 1,
		rulesCount: RULES.length,
		description:
			'A transparency tool that exposes how real-world systems (credit bureaus, actuarial tables, lenders, audit studies) already turn a person into a number. This file is the complete rulebook and the exact math behind lifescored.com.',
		privacy:
			'Compute scores on your OWN side. This file contains only the rules — no personal inputs are ever sent to lifescored.com, by the website or by any API/MCP. The whole point falls apart the moment the thing scoring you has something to sell you.',
		usage:
			'Ask the user for the fields in `inputs` (only the ones you do not already know — missing fields fall back to `default`). For each rule in `rules`, compute its position per `engine.positionContract`, then points = round(clamp(position, bounds[0], bounds[1]) × weight). Sum points over enabled rules for the composite. The breakdown is the point; the composite is the least useful number.',
		engine: {
			formula: 'points = round(clamp(position, bounds[0], bounds[1]) × weight)',
			composite: 'sum of points over enabled rules (core pack always on; other packs opt-in)',
			positionContract:
				'position is a normalized fact where 1.0 = full marks. It may exceed 1 or go negative; the engine clamps it to the rule’s declared bounds before weighting. Two rules (income, networth) are uncapped above (bounds upper = null/Infinity).',
			baselineWeight: BASELINE_WEIGHT,
			weightInterpretation: `weight is editorial and tunable; shown as a multiple of the ${BASELINE_WEIGHT} income baseline (1.0×). weightMultiple = weight / ${BASELINE_WEIGHT}.`,
			tiers: TIERS,
			domains: DOMAINS,
			packs: PACKS
		},
		constants: {
			income: {
				medianHouseholdIncome: MEDIAN_HOUSEHOLD_INCOME,
				avgHouseholdSize: 2.5,
				equivMedianIncome: Math.round(EQUIV_MEDIAN_INCOME),
				householdSize: 'householdSize = 1 + (partnered ? 1 : 0) + children',
				equivalence: 'adjustedIncome = income / sqrt(householdSize) (OECD square-root scale)',
				position:
					'let a = adjustedIncome; if a <= equivMedianIncome: a / (2 × equivMedianIncome); else: 0.5 + (sqrt(a / equivMedianIncome) − 1)'
			},
			netWorth: {
				value: 'netWorth = assets − debt',
				medianByAge: NW_ANCHORS,
				medianNote: 'linearly interpolate the median between [age, value] anchors; clamp at the ends',
				position:
					'let m = medianForAge(age); if netWorth < m: max(-0.5, (netWorth − m) / (2 × m)); else: sqrt(netWorth / m) − 1'
			},
			dti: { benchmark: 0.43, position: '(0.43 − debt/income) / 0.43, clamped to [-1, 1]; income 0 with debt > 0 ⇒ worst' },
			creditScore: { position: 'clamp((score − 580) / (760 − 580), 0, 1) — subprime floor 580, best-rate plateau 760' }
		},
		inputs: inputSchema(),
		rules: RULES.map((r) => ({
			id: r.id,
			label: r.label,
			domain: r.domain,
			tier: r.tier,
			pack: r.pack,
			controllable: r.controllable,
			weight: r.defaultWeight,
			weightMultiple: r.defaultWeight / BASELINE_WEIGHT,
			evidence: r.evidence,
			bounds: [r.bounds[0], r.bounds[1] === Infinity ? null : r.bounds[1]],
			inputs: r.inputs,
			logic: r.logic,
			weightRationale: r.weightRationale,
			...(r.caveat ? { caveat: r.caveat } : {}),
			source: r.source
		})),
		feedback: {
			summary:
				'Weights are editorial and the rules are arguable — that is the design. If a weight looks wrong, a source is stale, or a rule is missing, propose it. Improvements from many users are aggregated in the open.',
			how: 'Open a GitHub issue with the rule id, what you would change (weight, source, bounds, or a new rule), and a public citation if you have one.',
			issuesUrl: 'https://github.com/royashbrook/lifescored/issues',
			contributing: 'https://github.com/royashbrook/lifescored/blob/main/CONTRIBUTING.md'
		}
	};

	return json(body, {
		headers: { 'cache-control': 'public, max-age=3600' }
	});
}
