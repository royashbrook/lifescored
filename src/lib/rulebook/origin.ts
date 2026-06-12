import { COUNTRIES } from './inputs';
import type { Rule } from './types';

const ACCESSED = '2026-06-11';

export const ORIGIN_RULES: Rule[] = [
	{
		id: 'country',
		domain: 'origin',
		tier: 'starting_point',
		label: 'Country of residence',
		controllable: false,
		defaultWeight: 24,
		logic: 'Residence sets a baseline from its World Bank income tier. High-income country → high base; low-income or conflict-affected → low base.',
		evidence: 'SOURCED',
		source: {
			name: 'World Bank — country income classifications',
			finding: 'Economies grouped high / upper-middle / lower-middle / low income by GNI per capita; used here as the baseline tier.',
			url: 'https://datahelpdesk.worldbank.org/knowledgebase/articles/906519',
			accessed: ACCESSED
		},
		inputs: ['country'],
		score: (i, w) => Math.round(COUNTRIES[i.country].baseFrac * w),
		describe: (i) => COUNTRIES[i.country].note
	},
	{
		id: 'generational',
		domain: 'origin',
		tier: 'starting_point',
		label: 'Generational support',
		controllable: false,
		defaultWeight: 16,
		logic: 'A family financial floor raises your position. No clean public dataset maps this to an individual, so the weight is a flagged guess, not a measurement.',
		evidence: 'SPECULATIVE',
		source: {
			name: 'Opportunity Insights (Chetty et al.) — intergenerational mobility',
			finding: 'Documents how parental resources shape adult outcomes — real at population scale, but NOT directly operationalizable into a personal number. Hence speculative.',
			url: 'https://opportunityinsights.org/',
			accessed: ACCESSED
		},
		inputs: ['familySupport'],
		score: (i, w) => Math.round([0, 0.4, 0.9][i.familySupport] * w),
		describe: (i) => ['no family floor', 'some family support', 'substantial family backing'][i.familySupport]
	},
	{
		id: 'parental-education',
		domain: 'origin',
		tier: 'starting_point',
		label: 'Parental education',
		controllable: false,
		defaultWeight: 8,
		logic: "Children of degree-holding parents are far likelier to earn degrees themselves and start with more navigational capital. You didn't choose this.",
		evidence: 'SOURCED',
		source: {
			name: 'NCES — First-Generation Students',
			finding: "College enrollment and completion rates are substantially higher for students whose parents hold bachelor's degrees than for first-generation students.",
			url: 'https://nces.ed.gov/pubs2018/2018421.pdf',
			accessed: ACCESSED
		},
		inputs: ['parentsDegree'],
		score: (i, w) => Math.round((i.parentsDegree ? 1 : 0.3) * w),
		describe: (i) => (i.parentsDegree ? 'a parent holds a degree — inherited navigational capital' : 'first-generation territory — every form is unfamiliar the first time')
	},
	{
		id: 'passport',
		domain: 'origin',
		tier: 'starting_point',
		label: 'Passport strength',
		controllable: false,
		defaultWeight: 6,
		logic: 'Your passport determines visa-free access to work, study, and flee. Derived from your country of residence in this model.',
		evidence: 'SOURCED',
		source: {
			name: 'Henley Passport Index',
			finding: 'Ranks passports by visa-free destination count; the gap between the strongest and weakest passports exceeds 160 destinations.',
			url: 'https://www.henleyglobal.com/passport-index',
			accessed: ACCESSED
		},
		inputs: ['country'],
		score: (i, w) => Math.round([0.2, 0.6, 1][COUNTRIES[i.country].henleyBand] * w),
		describe: (i) => ['weak passport — much of the world needs a visa application', 'mid-tier passport', 'strong passport — most borders open on arrival'][COUNTRIES[i.country].henleyBand]
	},
	{
		id: 'neighborhood',
		domain: 'origin',
		tier: 'starting_point',
		label: 'Neighborhood opportunity',
		controllable: false,
		defaultWeight: 8,
		logic: 'The census tract you grew up in measurably shifts adult income. Self-assessed band here (low / average / high opportunity area).',
		evidence: 'SOURCED',
		source: {
			name: 'Opportunity Atlas (Chetty, Friedman, Hendren)',
			finding: 'Children who grow up in high-upward-mobility tracts earn substantially more as adults, holding parental income constant.',
			url: 'https://www.opportunityatlas.org/',
			accessed: ACCESSED
		},
		inputs: ['neighborhood'],
		score: (i, w) => Math.round([0.1, 0.5, 1][i.neighborhood] * w),
		describe: (i) => ['low-opportunity area — the Atlas says this drag is real', 'average-opportunity area', 'high-opportunity area — an invisible tailwind'][i.neighborhood]
	}
];
