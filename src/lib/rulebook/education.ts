import type { Rule } from './types';

const ACCESSED = '2026-06-11';

export const EDUCATION_RULES: Rule[] = [
	{
		id: 'degree',
		domain: 'education',
		tier: 'your_moves',
		label: 'Degree attainment',
		controllable: true,
		defaultWeight: 12,
		logic: "Holding a degree raises modeled marketability, reflecting the measured earnings premium. 'Controllable' only if the time and tuition were affordable to you.",
		evidence: 'SOURCED',
		source: {
			name: 'BLS — Education pays',
			finding: "Among full-time workers 25–34, bachelor's-degree holders' median earnings run roughly 60% above high-school-only earnings.",
			url: 'https://www.bls.gov/careeroutlook/2025/data-on-display/education-pays.htm',
			accessed: ACCESSED
		},
		inputs: ['degree'],
		score: (i, w) => Math.round((i.degree ? 1 : 0.33) * w),
		describe: (i) => (i.degree ? 'degree held — the ~60% earnings premium is priced in' : 'no degree yet — see the what-if lever for the delta'),
		whatIf: {
			label: 'Finish a degree',
			applicable: (i) => !i.degree,
			transform: (i) => ({ ...i, degree: true })
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
		score: (i, w) => Math.round({ employed: 1, self: 1, student: 0.6, retired: 0.7, unemployed: 0 }[i.employment] * w),
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
		score: (i, w) => Math.round({ declining: 0.2, stable: 0.6, growing: 1 }[i.outlook] * w),
		describe: (i) => ({ declining: 'a shrinking field — the projection, not a prophecy', stable: 'a stable field', growing: 'a growing field — demand tailwind' })[i.outlook]
	}
];
