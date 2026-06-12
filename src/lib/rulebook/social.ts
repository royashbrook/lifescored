import type { Rule } from './types';

const ACCESSED = '2026-06-11';

export const SOCIAL_RULES: Rule[] = [
	{
		id: 'connection',
		domain: 'social',
		tier: 'your_moves',
		label: 'Social connection',
		controllable: true,
		defaultWeight: 10,
		logic: 'Regular contact with people you are close to. The mortality effect of isolation rivals smoking in meta-analysis — the most underpriced rule in this book.',
		evidence: 'SOURCED',
		source: {
			name: 'Holt-Lunstad et al. — Social Relationships and Mortality Risk (meta-analysis)',
			finding: 'Stronger social relationships associated with ~50% increased odds of survival — an effect comparable to quitting smoking.',
			url: 'https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.1000316',
			accessed: ACCESSED
		},
		inputs: ['socialConnection'],
		score: (i, w) => Math.round([0.1, 0.5, 1][i.socialConnection] * w),
		describe: (i) => ['rarely see people you are close to — the meta-analysis prices this like a pack-a-day habit', 'some regular contact', 'regular close contact — a mortality hedge nobody invoices you for'][i.socialConnection]
	},
	{
		id: 'partnership',
		domain: 'social',
		tier: 'your_moves',
		label: 'Partnership status',
		controllable: true,
		defaultWeight: 6,
		logic: 'Married/partnered people show better longevity and household finances in the data — partly pooling, partly selection.',
		evidence: 'SOURCED',
		caveat: 'Selection effects are real: healthier, wealthier people marry more. The data cannot fully separate cause from sorting, and single is not a deficit — this scores the system, not you.',
		source: {
			name: 'Harvard Health / NIH — marriage and longevity research',
			finding: 'Married adults show lower mortality and cardiovascular risk in large cohorts, with effect sizes that shrink after controlling for selection.',
			url: 'https://www.health.harvard.edu/staying-healthy/marriage-and-mens-health',
			accessed: ACCESSED
		},
		inputs: ['partnered'],
		score: (i, w) => Math.round((i.partnered ? 1 : 0.5) * w),
		describe: (i) => (i.partnered ? 'partnered — pooled risk, pooled rent' : 'single — half credit, and the caveat on this rule matters')
	},
	{
		id: 'volunteering',
		domain: 'social',
		tier: 'your_moves',
		label: 'Volunteering / community',
		controllable: true,
		defaultWeight: 4,
		logic: 'Regular volunteering correlates with health and well-being outcomes — and is the closest thing to a real-world "social karma" ledger.',
		evidence: 'SOURCED',
		source: {
			name: 'AmeriCorps — Health Benefits of Volunteering',
			finding: 'Volunteers report better health and lower depression; older volunteers show reduced mortality in longitudinal studies.',
			url: 'https://www.americorps.gov/about/our-impact/volunteering-civic-life',
			accessed: ACCESSED
		},
		inputs: ['volunteers'],
		score: (i, w) => Math.round((i.volunteers ? 1 : 0.4) * w),
		describe: (i) => (i.volunteers ? 'regular volunteer — the one score here you donate your way into' : 'no regular volunteering — partial credit, not a demerit')
	},
	{
		id: 'driving',
		domain: 'social',
		tier: 'your_moves',
		label: 'Driving record',
		controllable: true,
		defaultWeight: 6,
		logic: 'At-fault accidents and moving violations in the last 3 years, scored the way an auto insurer rates you. Clean record full; each incident bites.',
		evidence: 'SOURCED',
		source: {
			name: 'Insurance Information Institute — What determines the price of an auto insurance policy?',
			finding: 'Driving record is a primary rating factor; accidents and violations raise premiums for 3–5 years.',
			url: 'https://www.iii.org/article/what-determines-price-my-auto-insurance-policy',
			accessed: ACCESSED
		},
		inputs: ['drivingIncidents'],
		score: (i, w) => Math.round(Math.max(1 - i.drivingIncidents * 0.4, -0.2) * w) || 0,
		describe: (i) => (i.drivingIncidents === 0 ? 'clean record — the cheapest insurance tier' : `${i.drivingIncidents} incident(s) in 3 years — your insurer has already done this math`)
	},
	{
		id: 'digital',
		domain: 'social',
		tier: 'your_moves',
		label: 'Digital footprint',
		controllable: true,
		defaultWeight: 4,
		logic: 'Employers and landlords screen public profiles, but no public dataset quantifies the effect on outcomes — so the weight is a flagged guess.',
		evidence: 'SPECULATIVE',
		source: {
			name: 'CareerBuilder — social media screening survey (2018)',
			finding: 'Majorities of employers report screening candidates online and rejecting some on what they find — survey evidence, not an outcome dataset. Hence speculative.',
			url: 'https://www.prnewswire.com/news-releases/more-than-half-of-employers-have-found-content-on-social-media-that-caused-them-not-to-hire-a-candidate-according-to-recent-careerbuilder-survey-300694437.html',
			accessed: ACCESSED
		},
		inputs: ['digitalFootprint'],
		score: (i, w) => Math.round([0.2, 0.6, 1][i.digitalFootprint] * w),
		describe: (i) => ['a public footprint that screens badly — recruiters do look', 'an unremarkable public footprint', 'a curated public footprint — passive credentialing'][i.digitalFootprint]
	}
];
