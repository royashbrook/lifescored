import type { Rule } from './types';

const ACCESSED = '2026-06-11';

export const SOCIAL_RULES: Rule[] = [
	{
		id: 'connection',
		domain: 'social',
		pack: 'core',
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
		pack: 'core',
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
		id: 'parenthood',
		domain: 'social',
		pack: 'core',
		tier: 'your_moves',
		label: 'Children',
		controllable: false, // you don't have a child to move a score
		defaultWeight: 6,
		logic: 'Parents show modestly lower mortality in old age — a Swedish registry cohort of ~1.4M people tracked from 60 found roughly a 2-year (men) / 1.5-year (women) life-expectancy edge that widens with age, consistent with adult children providing late-life support. Scored as a mild positive that saturates by two or three kids; childless sits at a neutral half, not a deficit. The financial cost of children is counted separately, in the income rule.',
		evidence: 'SOURCED',
		caveat: "Heavy selection: healthier, more stable people are likelier to both have children and to live longer, and the day-to-day wellbeing research is mixed. Childlessness is not a deficit — this scores a measured association, not a verdict on your family.",
		source: {
			name: 'Modig et al. — Payback time? Influence of having children on mortality in old age (J Epidemiol Community Health, 2017)',
			finding: 'Tracking ~1.4 million Swedes from age 60, parents had lower old-age mortality than the childless — about a 2-year (men) / 1.5-year (women) life-expectancy gap at 60 that widened with age, consistent with late-life support from adult children.',
			url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5484032/',
			accessed: '2026-06-14'
		},
		inputs: ['children'],
		position: (i) => Math.min(1, 0.5 + i.children * 0.18),
		bounds: [0.5, 1],
		weightRationale: 'The old-age-mortality association is real but small and selection-confounded (see caveat) — 0.6×, matched to partnership, the other family-ties rule.',
		describe: (i) =>
			i.children === 0
				? 'no children — the modest old-age-support and longevity edge the data links to parenthood is not in play (heavy selection caveats apply)'
				: `${i.children} child${i.children === 1 ? '' : 'ren'} — parents show modestly lower old-age mortality and more late-life support; the cost side is counted in income`
	},
	{
		id: 'volunteering',
		domain: 'social',
		pack: 'core',
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
		pack: 'core',
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
		pack: 'speculative',
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
		pack: 'core',
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
