import { clamp, type CountryCode, type Inputs } from './types';

export interface CountryMeta {
	name: string;
	tier: 'high' | 'upper-middle' | 'lower-middle' | 'low';
	henleyBand: 0 | 1 | 2; // weak / mid / strong passport
	note: string;
}

// Country base is set purely by World Bank income tier (no per-country editorial tuning):
// every high-income country gets the same base; the rule's only other signal is passport strength.
export const TIER_BASE: Record<CountryMeta['tier'], number> = {
	high: 0.82,
	'upper-middle': 0.45,
	'lower-middle': 0.28,
	low: 0.15
};

export const COUNTRIES: Record<CountryCode, CountryMeta> = {
	af: { name: 'Afghanistan', tier: 'low', henleyBand: 0, note: 'low-income, conflict-affected' },
	ar: { name: 'Argentina', tier: 'upper-middle', henleyBand: 2, note: 'upper-middle-income' },
	au: { name: 'Australia', tier: 'high', henleyBand: 2, note: 'high-income economy' },
	at: { name: 'Austria', tier: 'high', henleyBand: 2, note: 'high-income economy' },
	bd: { name: 'Bangladesh', tier: 'lower-middle', henleyBand: 0, note: 'lower-middle-income' },
	be: { name: 'Belgium', tier: 'high', henleyBand: 2, note: 'high-income economy' },
	br: { name: 'Brazil', tier: 'upper-middle', henleyBand: 2, note: 'upper-middle-income, high inequality' },
	ca: { name: 'Canada', tier: 'high', henleyBand: 2, note: 'high-income economy' },
	cl: { name: 'Chile', tier: 'high', henleyBand: 2, note: 'high-income economy' },
	cn: { name: 'China', tier: 'upper-middle', henleyBand: 1, note: 'upper-middle-income' },
	co: { name: 'Colombia', tier: 'upper-middle', henleyBand: 1, note: 'upper-middle-income' },
	cz: { name: 'Czechia', tier: 'high', henleyBand: 2, note: 'high-income economy' },
	dk: { name: 'Denmark', tier: 'high', henleyBand: 2, note: 'high-income economy' },
	eg: { name: 'Egypt', tier: 'lower-middle', henleyBand: 0, note: 'lower-middle-income' },
	ee: { name: 'Estonia', tier: 'high', henleyBand: 2, note: 'high-income economy' },
	et: { name: 'Ethiopia', tier: 'low', henleyBand: 0, note: 'low-income' },
	fi: { name: 'Finland', tier: 'high', henleyBand: 2, note: 'high-income economy' },
	fr: { name: 'France', tier: 'high', henleyBand: 2, note: 'high-income economy' },
	de: { name: 'Germany', tier: 'high', henleyBand: 2, note: 'high-income economy, strong safety net' },
	gh: { name: 'Ghana', tier: 'lower-middle', henleyBand: 0, note: 'lower-middle-income' },
	gr: { name: 'Greece', tier: 'high', henleyBand: 2, note: 'high-income economy' },
	hu: { name: 'Hungary', tier: 'high', henleyBand: 2, note: 'high-income economy' },
	in: { name: 'India', tier: 'lower-middle', henleyBand: 0, note: 'lower-middle-income, fast-growing' },
	id: { name: 'Indonesia', tier: 'upper-middle', henleyBand: 1, note: 'upper-middle-income' },
	ie: { name: 'Ireland', tier: 'high', henleyBand: 2, note: 'high-income economy' },
	il: { name: 'Israel', tier: 'high', henleyBand: 2, note: 'high-income economy' },
	it: { name: 'Italy', tier: 'high', henleyBand: 2, note: 'high-income economy' },
	jp: { name: 'Japan', tier: 'high', henleyBand: 2, note: 'high-income economy, aging demographics' },
	kz: { name: 'Kazakhstan', tier: 'upper-middle', henleyBand: 1, note: 'upper-middle-income' },
	ke: { name: 'Kenya', tier: 'lower-middle', henleyBand: 0, note: 'lower-middle-income' },
	lv: { name: 'Latvia', tier: 'high', henleyBand: 2, note: 'high-income economy' },
	my: { name: 'Malaysia', tier: 'upper-middle', henleyBand: 1, note: 'upper-middle-income' },
	mx: { name: 'Mexico', tier: 'upper-middle', henleyBand: 2, note: 'upper-middle-income' },
	ma: { name: 'Morocco', tier: 'lower-middle', henleyBand: 0, note: 'lower-middle-income' },
	nl: { name: 'Netherlands', tier: 'high', henleyBand: 2, note: 'high-income economy, strong safety net' },
	nz: { name: 'New Zealand', tier: 'high', henleyBand: 2, note: 'high-income economy' },
	ng: { name: 'Nigeria', tier: 'lower-middle', henleyBand: 0, note: 'lower-middle-income, young population' },
	no: { name: 'Norway', tier: 'high', henleyBand: 2, note: 'high-income economy' },
	pk: { name: 'Pakistan', tier: 'lower-middle', henleyBand: 0, note: 'lower-middle-income' },
	ph: { name: 'Philippines', tier: 'lower-middle', henleyBand: 0, note: 'lower-middle-income' },
	pl: { name: 'Poland', tier: 'high', henleyBand: 2, note: 'high-income economy' },
	pt: { name: 'Portugal', tier: 'high', henleyBand: 2, note: 'high-income economy' },
	ro: { name: 'Romania', tier: 'high', henleyBand: 2, note: 'high-income economy' },
	ru: { name: 'Russia', tier: 'high', henleyBand: 1, note: 'high-income economy' },
	sa: { name: 'Saudi Arabia', tier: 'high', henleyBand: 1, note: 'high-income economy' },
	sg: { name: 'Singapore', tier: 'high', henleyBand: 2, note: 'high-income economy' },
	za: { name: 'South Africa', tier: 'upper-middle', henleyBand: 1, note: 'upper-middle-income, high inequality' },
	kr: { name: 'South Korea', tier: 'high', henleyBand: 2, note: 'high-income economy' },
	es: { name: 'Spain', tier: 'high', henleyBand: 2, note: 'high-income economy' },
	se: { name: 'Sweden', tier: 'high', henleyBand: 2, note: 'high-income economy' },
	ch: { name: 'Switzerland', tier: 'high', henleyBand: 2, note: 'high-income economy' },
	th: { name: 'Thailand', tier: 'upper-middle', henleyBand: 1, note: 'upper-middle-income' },
	tr: { name: 'Türkiye', tier: 'upper-middle', henleyBand: 1, note: 'upper-middle-income' },
	ug: { name: 'Uganda', tier: 'low', henleyBand: 0, note: 'low-income' },
	ua: { name: 'Ukraine', tier: 'upper-middle', henleyBand: 2, note: 'upper-middle-income' },
	ae: { name: 'United Arab Emirates', tier: 'high', henleyBand: 2, note: 'high-income economy' },
	gb: { name: 'United Kingdom', tier: 'high', henleyBand: 2, note: 'high-income economy' },
	us: { name: 'United States', tier: 'high', henleyBand: 2, note: 'high-income economy, weaker safety net' },
	vn: { name: 'Vietnam', tier: 'lower-middle', henleyBand: 0, note: 'lower-middle-income' },
	'other-high': { name: 'Other — high-income country', tier: 'high', henleyBand: 2, note: 'high-income economy (income-tier estimate)' },
	'other-um': { name: 'Other — upper-middle-income', tier: 'upper-middle', henleyBand: 1, note: 'upper-middle-income economy (income-tier estimate)' },
	'other-lm': { name: 'Other — lower-middle-income', tier: 'lower-middle', henleyBand: 0, note: 'lower-middle-income economy (income-tier estimate)' },
	'other-low': { name: 'Other — low-income country', tier: 'low', henleyBand: 0, note: 'low-income economy (income-tier estimate)' }
};

// The spike's "son" scenario, extended across all domains.
export const DEFAULT_INPUTS: Inputs = {
	country: 'us',
	familySupport: 1,
	parentsDegree: false,
	neighborhood: 1,
	age: 27,
	sex: 'm',
	smoker: 'never',
	exerciseMins: 90,
	alcohol: 'moderate',
	sleepHours: 7,
	insured: true,
	bmiBand: 'normal',
	income: 46000,
	assets: 6000,
	debt: 0,
	creditScore: 720,
	emergencyMonths: 1,
	homeowner: false,
	education: 'hs',
	employment: 'employed',
	outlook: 'stable',
	housing: 'stable',
	socialConnection: 1,
	partnered: false,
	children: 0,
	volunteers: false,
	drivingIncidents: 0,
	digitalFootprint: 1,
	banking: 'banked',
	criminalRecord: false,
	voterRegistered: true,
	wash: 'safe',
	infrastructure: 'both',
	foodSecurity: 'secure',
	stability: 'stable'
};

type NumericKey = 'age' | 'exerciseMins' | 'sleepHours' | 'income' | 'assets' | 'debt' | 'creditScore' | 'emergencyMonths' | 'drivingIncidents' | 'children';

export const NUMERIC_CLAMPS: Record<NumericKey, [number, number]> = {
	age: [16, 100],
	exerciseMins: [0, 2000],
	sleepHours: [3, 12],
	income: [0, 10_000_000_000],
	assets: [0, 1_000_000_000_000_000],
	debt: [0, 100_000_000],
	creditScore: [300, 850],
	emergencyMonths: [0, 60],
	drivingIncidents: [0, 10],
	children: [0, 12]
};

export const STRING_ENUMS = {
	sex: ['f', 'm'],
	smoker: ['never', 'former', 'current'],
	alcohol: ['none', 'moderate', 'heavy'],
	bmiBand: ['under', 'normal', 'over', 'obese'],
	education: ['none', 'hs', 'some', 'bachelor', 'graduate'],
	employment: ['employed', 'self', 'unemployed', 'student', 'retired'],
	outlook: ['declining', 'stable', 'growing'],
	housing: ['unhoused', 'insecure', 'stable'],
	banking: ['unbanked', 'underbanked', 'banked'],
	wash: ['none', 'basic', 'safe'],
	infrastructure: ['neither', 'electricity', 'both'],
	foodSecurity: ['insecure', 'marginal', 'secure'],
	stability: ['conflict', 'fragile', 'stable']
} as const;

export const ORDINALS = ['familySupport', 'neighborhood', 'socialConnection', 'digitalFootprint'] as const;

export const BOOLEANS = ['parentsDegree', 'insured', 'homeowner', 'partnered', 'volunteers', 'criminalRecord', 'voterRegistered'] as const;

/**
 * Migrate older stored/shared profiles.
 * - v1 used `degree: boolean`; map it onto the education ladder.
 * - pre-split profiles stored `netWorth` (already net of debt). We now store gross
 *   `assets` and derive net worth = assets − debt, so assets = netWorth + debt
 *   (floored at 0, since assets can't be negative). This preserves the old net worth.
 */
export function migrateLegacyInputs(raw: Record<string, unknown>): Record<string, unknown> {
	const out = { ...raw };
	if (!('education' in out) && 'degree' in out) {
		out.education = out.degree === true ? 'bachelor' : 'hs';
	}
	delete out.degree;
	if (!('assets' in out) && 'netWorth' in out) {
		const nw = Number(out.netWorth) || 0;
		const debt = Number(out.debt) || 0;
		out.assets = Math.max(0, nw + debt);
	}
	delete out.netWorth;
	// Credit score replaced the two FICO-component inputs. Estimate a score from the old
	// payment-history + utilization so existing profiles keep a sensible creditworthiness.
	if (!('creditScore' in out) && ('latePayments' in out || 'creditUtil' in out)) {
		let s = 740;
		const lp = Number(out.latePayments) || 0;
		s -= lp >= 2 ? 120 : lp === 1 ? 60 : 0;
		const u = Number(out.creditUtil);
		if (Number.isFinite(u)) s -= u > 80 ? 110 : u > 50 ? 70 : u > 30 ? 40 : u > 10 ? 10 : 0;
		out.creditScore = Math.max(300, Math.min(850, s));
	}
	delete out.latePayments;
	delete out.creditUtil;
	return out;
}

export function clampInputs(i: Inputs): Inputs {
	const out = { ...i };
	for (const [key, [lo, hi]] of Object.entries(NUMERIC_CLAMPS) as [NumericKey, [number, number]][]) {
		const v = Number(out[key]);
		out[key] = clamp(Number.isFinite(v) ? v : lo, lo, hi);
	}
	if (!COUNTRIES[out.country]) out.country = 'us';
	for (const key of Object.keys(STRING_ENUMS) as (keyof typeof STRING_ENUMS)[]) {
		const valid = STRING_ENUMS[key] as readonly string[];
		if (!valid.includes(out[key] as string)) {
			(out as Record<string, unknown>)[key] = DEFAULT_INPUTS[key];
		}
	}
	for (const key of ORDINALS) {
		const v = Number(out[key]);
		const rounded = Number.isFinite(v) ? Math.round(v) : (DEFAULT_INPUTS[key] as number);
		out[key] = clamp(rounded, 0, 2) as 0 | 1 | 2;
	}
	for (const key of BOOLEANS) {
		out[key] = Boolean(out[key]) as never;
	}
	return out;
}
