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
		position: (i) => [0.1, 0.5, 1][i.socialConnection],
		bounds: [0, 1],
		weightRationale: "Holt-Lunstad's ~50% survival effect rivals smoking cessation — weighted equal to the baseline and to smoking at 1.0×, the most underpriced rule in the book.",
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
		position: (i) => (i.partnered ? 1 : 0.5),
		bounds: [0, 1],
		weightRationale: 'The longevity association is real but heavily selection-confounded (see caveat) — discounted to 0.6×.',
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
		position: (i) => (i.volunteers ? 1 : 0.4),
		bounds: [0, 1],
		weightRationale: 'The smallest sourced effect in the book — 0.4×, the floor for sourced rules.',
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
		position: (i) => 1 - i.drivingIncidents * 0.4,
		bounds: [-0.2, 1],
		weightRationale: 'Insurer-priced with a 3–5 year decay — 0.6×. Mildly subtractive because license points literally subtract.',
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
		position: (i) => [0.2, 0.6, 1][i.digitalFootprint],
		bounds: [0, 1],
		weightRationale: 'Survey evidence only, no outcome dataset — speculative, so pinned to the 0.4× floor.',
		describe: (i) => ['a public footprint that screens badly — recruiters do look', 'an unremarkable public footprint', 'a curated public footprint — passive credentialing'][i.digitalFootprint]
	},
	{
		id: 'housing-stability',
		domain: 'social',
		tier: 'your_moves',
		label: 'Housing stability',
		controllable: false,
		defaultWeight: 12,
		logic: 'Where you sleep is the gateway condition for everything else scored here. Stable housing scores full; doubled-up or eviction-threatened partial; unhoused subtracts — because the systems above (credit, employment, health) all actively punish it.',
		evidence: 'SOURCED',
		caveat: "Marked not-controllable deliberately: eviction research shows housing loss precedes and causes the poverty that follows it — people rarely choose their way into or out of it. Its place in the 'your moves' tier reflects where existing systems file it, not fault.",
		source: {
			name: 'Eviction Lab (Desmond et al.)',
			finding: 'Eviction causes job loss, depression, and long-run instability — Milwaukee cohort studies show eviction precedes, not merely follows, deepened poverty.',
			url: 'https://evictionlab.org/',
			accessed: '2026-06-12'
		},
		inputs: ['housing'],
		position: (i) => ({ unhoused: -0.5, insecure: 0.3, stable: 1 })[i.housing],
		bounds: [-0.5, 1],
		weightRationale: 'Eviction sits upstream of job loss, credit destruction, and health collapse — weighted with education at 1.2×. The negative floor qualifies under the subtractive principle: every cited system actively punishes housing loss.',
		describe: (i) => ({
			unhoused: 'unhoused — every other system on this page is currently scoring this against you',
			insecure: 'housing-insecure — doubled-up or one notice from the cliff',
			stable: 'stably housed — the precondition the other rules quietly assume'
		})[i.housing]
	}
];
