// Shared, PII-free rulebook export — the single source for both /rules.json and the MCP
// discovery server. Pure data + the exact math, so any agent computes on its own side.
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
} from './index';
import { BASELINE_WEIGHT } from '../engine/score';
import { MEDIAN_HOUSEHOLD_INCOME, EQUIV_MEDIAN_INCOME, NW_ANCHORS } from './finance';

const ISSUES_URL = 'https://github.com/royashbrook/lifescored/issues';
const CONTRIBUTING_URL = 'https://github.com/royashbrook/lifescored/blob/main/CONTRIBUTING.md';

const ordinalSet = new Set<string>(ORDINALS);
const booleanSet = new Set<string>(BOOLEANS);

/** Describe each input so an agent knows what to ask the user and how to validate it. */
export function inputSchema() {
	return (Object.keys(DEFAULT_INPUTS) as (keyof Inputs)[]).map((key) => {
		const help = FIELD_HELP[key]?.help ?? '';
		const feedsRule = FIELD_HELP[key]?.ruleId ?? null;
		const base = { key, help, feedsRule, default: DEFAULT_INPUTS[key] };
		if (key === 'country') return { ...base, type: 'enum', values: Object.keys(COUNTRIES) };
		if (key in NUMERIC_CLAMPS) {
			const [min, max] = NUMERIC_CLAMPS[key as keyof typeof NUMERIC_CLAMPS];
			return { ...base, type: 'number', min, max };
		}
		if (key in STRING_ENUMS) return { ...base, type: 'enum', values: STRING_ENUMS[key as keyof typeof STRING_ENUMS] };
		if (ordinalSet.has(key)) return { ...base, type: 'ordinal', values: [0, 1, 2], note: '0 = least, 2 = most' };
		if (booleanSet.has(key)) return { ...base, type: 'boolean', values: [true, false] };
		return { ...base, type: 'unknown' };
	});
}

/** The complete machine-readable rulebook + exact math. No personal data, ever. */
export function rulebookExport() {
	return {
		name: 'life. scored.',
		url: 'https://lifescored.com',
		schemaVersion: 1,
		rulesCount: RULES.length,
		description:
			'A transparency tool that exposes how real-world systems (credit bureaus, actuarial tables, lenders, audit studies) already turn a person into a number. This is the complete rulebook and the exact math behind lifescored.com.',
		privacy:
			'Compute scores on your OWN side. This contains only the rules — no personal inputs are ever sent to lifescored.com, by the website or by the MCP/API. The whole point falls apart the moment the thing scoring you has something to sell you.',
		usage:
			'Ask the user for the fields in `inputs` (only the ones you do not already know — missing fields fall back to `default`). For each rule, compute its position per `engine.positionContract` and `constants`, then points = round(clamp(position, bounds[0], bounds[1]) × weight). Sum points over enabled rules for the composite. The breakdown is the point; the composite is the least useful number.',
		engine: {
			formula: 'points = round(clamp(position, bounds[0], bounds[1]) × weight)',
			composite: 'sum of points over enabled rules (core pack always on; other packs opt-in)',
			positionContract:
				'position is a normalized fact where 1.0 = full marks. It may exceed 1 or go negative; clamp it to the rule’s declared bounds before weighting. Two rules (income, networth) are uncapped above (bounds upper = null).',
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
				position: 'let m = medianForAge(age); if netWorth < m: max(-0.5, (netWorth − m) / (2 × m)); else: sqrt(netWorth / m) − 1'
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
			issuesUrl: ISSUES_URL,
			contributing: CONTRIBUTING_URL
		}
	};
}

export const METHODOLOGY_TEXT = `life. scored. rebuilds the scores that real systems already run on you — credit bureaus, actuarial life tables, lenders, audit-study research — in the open.

How scoring works:
- Every rule is a pure function from your inputs to a position (0..1, where 1.0 = full marks), with declared bounds and an editorial weight.
- points = round(clamp(position, bounds) × weight). The composite is the sum over enabled rules. The breakdown is the point; the composite is the least useful number.
- Weights are stated as multiples of the income baseline (1.0× = weight 10) and are tunable — every one shows its own justification.
- Rules are split into "your starting point" (luck of where/to whom you were born) and "your moves" (what you influence).

Two principles govern every rule:
- Constrained-subtractive: a rule may score negative only where the cited system itself subtracts (FICO delinquency, license points, underwater net worth, eviction), and never more than it can add unless the system does exactly that.
- Uncapped wealth: income and net worth grow as the square root of your multiple of the median, with no upper limit, matching how wealth actually distributes.

Deliberately left out:
- Protected characteristics (race, religion, etc.) and identity/"otherness": real, and they absolutely change how others score you, but we won't hand anyone a number that docks them for who they are — that's the machinery this exists to expose. They stay an unscored asterisk.
- Pure luck (a recession at graduation, illness, timing): real but unmeasurable honestly, so also an unscored asterisk.

Privacy: inputs never leave the user's device. The website computes client-side; this MCP/API serves only the rules and never receives answers. No tracking, no accounts, no data sales, no affiliate links.`;

export const FEEDBACK_TEXT = `The weights are editorial and the rules are arguable — that's the design, and improvements from many people are aggregated in the open.

To suggest a change, open a GitHub issue (${ISSUES_URL}) with:
1. The rule id (e.g. credit-score, networth, parenthood) — see get_rulebook.
2. What you'd change: the weight, the bounds, the formula, the source, or a proposed new rule.
3. A public citation if you have one (a URL to the data or study). SOURCED beats opinion.
4. One or two sentences on what's wrong with the current treatment.

Full contributor guide: ${CONTRIBUTING_URL}`;
