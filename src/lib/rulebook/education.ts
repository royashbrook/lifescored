import type { Rule } from './types';

const ACCESSED = '2026-06-11';

export const EDUCATION_RULES: Rule[] = [
	{
		id: 'education',
		domain: 'education',
		tier: 'your_moves',
		label: 'Education ladder',
		controllable: true,
		defaultWeight: 12,
		logic: "The labor market prices each rung: no diploma is actively penalized (unemployment runs roughly twice the bachelor's-holder rate), each step up narrows the gap, and the graduate premium over a bachelor's is field-dependent — so this rule caps at the bachelor's rung. 'Controllable' only if the time and tuition were affordable to you.",
		evidence: 'SOURCED',
		source: {
			name: 'BLS — Education pays',
			finding: "Median earnings rise and unemployment falls with every rung of attainment; workers without a high-school diploma face roughly double the unemployment rate of bachelor's holders.",
			url: 'https://www.bls.gov/careeroutlook/2025/data-on-display/education-pays.htm',
			accessed: '2026-06-12'
		},
		inputs: ['education'],
		position: (i) => ({ none: -0.2, hs: 0.4, some: 0.6, bachelor: 1, graduate: 1 })[i.education],
		bounds: [-0.2, 1],
		weightRationale: "A ~60% earnings premium compounding over a working life — 1.2× the baseline. The negative floor exists because the market genuinely penalizes no-diploma, not merely fails to reward it.",
		describe: (i) => ({
			none: 'no diploma — the one rung the labor market actively penalizes',
			hs: 'high-school diploma — the market floor, not a ceiling',
			some: 'some college — partial premium, often with the debt and not the credential',
			bachelor: "bachelor's — the ~60% premium is priced in",
			graduate: "graduate degree — premium over a bachelor's is field-dependent, so this rule caps here"
		})[i.education],
		whatIf: {
			label: 'Finish a degree',
			applicable: (i) => i.education === 'none' || i.education === 'hs' || i.education === 'some',
			transform: (i) => ({ ...i, education: 'bachelor' })
		}
	},
	{
		id: 'employment',
		domain: 'education',
		tier: 'your_moves',
		label: 'Employment status',
		controllable: true,
		defaultWeight: 8,
		logic: 'Employed or self-employed scores full; students and retirees partial (different life phase, not failure); unemployed zero — which is how every lender reads it.',
		evidence: 'SOURCED',
		source: {
			name: 'BLS — Labor Force Statistics (CPS)',
			finding: 'Unemployment correlates with sharp income loss and scarring effects on future earnings, especially for long spells.',
			url: 'https://www.bls.gov/cps/',
			accessed: ACCESSED
		},
		inputs: ['employment'],
		position: (i) => ({ employed: 1, self: 1, student: 0.6, retired: 0.7, unemployed: 0 })[i.employment],
		bounds: [0, 1],
		weightRationale: 'The income flow is already counted by the baseline rule; this 0.8× prices the status gate every lender and landlord reads first.',
		describe: (i) => ({ employed: 'employed — steady income, the input every other system keys on', self: 'self-employed — same credit, more paperwork', student: 'student — partial credit; the system reads this as investment phase', retired: 'retired — drawing down rather than earning', unemployed: 'unemployed — the status every scoring system punishes hardest' })[i.employment]
	},
	{
		id: 'outlook',
		domain: 'education',
		tier: 'your_moves',
		label: 'Occupation outlook',
		controllable: true,
		defaultWeight: 6,
		logic: "Whether your field is projected to grow or shrink — BLS publishes ten-year projections for every occupation. Self-assessed band here.",
		evidence: 'SOURCED',
		source: {
			name: 'BLS — Occupational Outlook Handbook',
			finding: 'Projects employment change by occupation over a 10-year window; growth varies from double-digit increases to steep declines.',
			url: 'https://www.bls.gov/ooh/',
			accessed: ACCESSED
		},
		inputs: ['outlook'],
		position: (i) => ({ declining: 0.2, stable: 0.6, growing: 1 })[i.outlook],
		bounds: [0, 1],
		weightRationale: 'Ten-year BLS projections are directional, not destiny — 0.6×.',
		describe: (i) => ({ declining: 'a shrinking field — the projection, not a prophecy', stable: 'a stable field', growing: 'a growing field — demand tailwind' })[i.outlook]
	}
];
