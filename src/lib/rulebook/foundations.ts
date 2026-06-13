import type { Rule } from './types';

// foundations defaults reflect the typical user — enabling the pack raises the starting-point tier

const ACCESSED = '2026-06-13';

export const FOUNDATIONS_RULES: Rule[] = [
	{
		id: 'water-sanitation',
		domain: 'origin',
		pack: 'foundations',
		tier: 'starting_point',
		label: 'Clean water & sanitation',
		controllable: false,
		defaultWeight: 14,
		logic: 'Clean water and sanitation is the gateway condition for health and human capital. 2.2 billion people lack safely managed drinking water; lacking it is among the strongest predictors of preventable disease burden and stunted development.',
		evidence: 'SOURCED',
		source: {
			name: 'WHO/UNICEF Joint Monitoring Programme for Water Supply, Sanitation and Hygiene (JMP)',
			finding: '2.2 billion people lack safely managed drinking water; 3.6 billion lack safely managed sanitation (JMP 2023). The difference between unsafe and safely managed water maps directly onto infant mortality and disease burden.',
			url: 'https://washdata.org/',
			accessed: ACCESSED
		},
		inputs: ['wash'],
		position: (i) => ({ none: 0, basic: 0.6, safe: 1 }[i.wash]),
		bounds: [0, 1],
		weightRationale: 'Safe water is the single most fundamental infrastructure condition — it enables every other human-capital outcome. At 1.4× the income baseline (weight 14), it sits just below country/residence in the starting-point tier. The 2.2B statistic (JMP) makes the global stakes concrete.',
		describe: (i) =>
			({
				none: 'no safely managed water or sanitation — the most fundamental infrastructure gap',
				basic: 'basic water access but not safely managed — reduced disease risk, not eliminated',
				safe: 'safely managed water and sanitation — the gateway condition met'
			})[i.wash]
	},
	{
		id: 'utilities',
		domain: 'origin',
		pack: 'foundations',
		tier: 'starting_point',
		label: 'Electricity & internet',
		controllable: false,
		defaultWeight: 12,
		logic: 'Reliable electricity and internet access enable education, economic participation, and communication. ~675 million people lack electricity; ~2.6 billion lack meaningful internet access.',
		evidence: 'SOURCED',
		source: {
			name: 'ITU Facts and Figures / IEA SDG7 Tracking',
			finding: 'ITU estimates ~2.6 billion people remain offline (2023); IEA SDG7 tracking shows ~675 million without electricity. Both are prerequisites for participation in the modern economy.',
			url: 'https://www.itu.int/en/ITU-D/Statistics/Pages/facts/default.aspx',
			accessed: ACCESSED
		},
		inputs: ['infrastructure'],
		position: (i) => ({ neither: 0, electricity: 0.5, both: 1 }[i.infrastructure]),
		bounds: [0, 1],
		weightRationale: 'Electricity + internet access together unlock education, telehealth, remote work, and banking — each of which routes into this rulebook. At 1.2× (weight 12), it sits just below clean water and alongside food security. Electricity alone (without internet) is scored at 0.5 because connectivity doubles the impact.',
		describe: (i) =>
			({
				neither: 'no electricity or internet — disconnected from the modern economy',
				electricity: 'electricity but no reliable internet — partial connectivity',
				both: 'electricity and internet — full infrastructure baseline'
			})[i.infrastructure]
	},
	{
		id: 'food-security',
		domain: 'origin',
		pack: 'foundations',
		tier: 'starting_point',
		label: 'Food security',
		controllable: false,
		defaultWeight: 12,
		logic: 'Food insecurity impairs cognitive development, immune function, and labor productivity. FAO documents that chronic undernourishment actively destroys human capital — justifying a negative floor. ~733 million people face hunger globally.',
		evidence: 'SOURCED',
		source: {
			name: 'FAO — The State of Food Security and Nutrition in the World (SOFI)',
			finding: 'FAO SOFI 2023: ~733 million people face hunger; food insecurity is causally linked to stunting, wasting, and reduced lifetime earnings. Negative human-capital effects are well-documented at both individual and population levels.',
			url: 'https://www.fao.org/publications/sofi',
			accessed: ACCESSED
		},
		inputs: ['foodSecurity'],
		position: (i) => ({ insecure: -0.2, marginal: 0.5, secure: 1 }[i.foodSecurity]),
		bounds: [-0.2, 1],
		weightRationale: 'Famine and chronic hunger actively destroy human capital (FAO SOFI), qualifying for a negative floor under the constrained-subtractive principle. Weight 12 (1.2×) equals utilities; food security and connectivity are co-equal prerequisites below clean water and peace.',
		describe: (i) =>
			({
				insecure: 'food insecure — hunger actively erodes health and human capital',
				marginal: 'marginal food security — enough most of the time, but unreliable',
				secure: 'food secure — reliable access to sufficient nutrition'
			})[i.foodSecurity]
	},
	{
		id: 'peace-rule-of-law',
		domain: 'origin',
		pack: 'foundations',
		tier: 'starting_point',
		label: 'Peace & rule of law',
		controllable: false,
		defaultWeight: 14,
		logic: 'Active armed conflict destroys human capital, displaces populations, and collapses institutions. Fragile states impair property rights and contract enforcement. The World Bank WGI documents that governance quality strongly predicts long-run development outcomes.',
		evidence: 'SOURCED',
		source: {
			name: 'World Bank Worldwide Governance Indicators (WGI)',
			finding: 'WGI tracks rule of law, political stability, and absence of violence across ~215 economies. Political stability and rule of law are among the strongest predictors of long-run income and human development.',
			url: 'https://www.worldbank.org/en/publication/worldwide-governance-indicators',
			accessed: ACCESSED
		},
		inputs: ['stability'],
		position: (i) => ({ conflict: -0.3, fragile: 0.5, stable: 1 }[i.stability]),
		bounds: [-0.3, 1],
		weightRationale: 'Active conflict is the most destructive starting condition catalogued here — it negates every other investment. Negative floor of −0.3 (the deepest in the rulebook) is justified by UCDP/WGI documentation of conflict destroying human capital. Weight 14 (1.4×) matches clean water as a co-equal gateway condition.',
		describe: (i) =>
			({
				conflict: 'active armed conflict — the most destructive starting condition; human capital destroyed',
				fragile: 'fragile state — institutions weakened, rule of law impaired',
				stable: 'peace and functioning rule of law — the political baseline met'
			})[i.stability]
	}
];
