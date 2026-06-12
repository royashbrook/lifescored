import { clamp, type CountryCode, type Inputs } from './types';

export interface CountryMeta {
	name: string;
	tier: 'high' | 'upper-middle' | 'lower-middle' | 'low';
	baseFrac: number; // fraction of the country rule's weight
	henleyBand: 0 | 1 | 2; // weak / mid / strong passport
	note: string;
}

// baseFrac is editorial within each World Bank income tier; the tier itself is sourced.
export const COUNTRIES: Record<CountryCode, CountryMeta> = {
	us: { name: 'United States', tier: 'high', baseFrac: 0.75, henleyBand: 2, note: 'high-income economy, weaker safety net' },
	nl: { name: 'Netherlands', tier: 'high', baseFrac: 0.92, henleyBand: 2, note: 'high-income economy, strong safety net' },
	de: { name: 'Germany', tier: 'high', baseFrac: 0.9, henleyBand: 2, note: 'high-income economy, strong safety net' },
	jp: { name: 'Japan', tier: 'high', baseFrac: 0.85, henleyBand: 2, note: 'high-income economy, aging demographics' },
	br: { name: 'Brazil', tier: 'upper-middle', baseFrac: 0.45, henleyBand: 1, note: 'upper-middle-income, high inequality' },
	mx: { name: 'Mexico', tier: 'upper-middle', baseFrac: 0.45, henleyBand: 1, note: 'upper-middle-income economy' },
	in: { name: 'India', tier: 'lower-middle', baseFrac: 0.3, henleyBand: 0, note: 'lower-middle-income, fast-growing' },
	ng: { name: 'Nigeria', tier: 'lower-middle', baseFrac: 0.25, henleyBand: 0, note: 'lower-middle-income, young population' },
	af: { name: 'Afghanistan', tier: 'low', baseFrac: 0.15, henleyBand: 0, note: 'low-income, conflict-affected' }
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
	netWorth: 6000,
	debt: 0,
	latePayments: 0,
	creditUtil: 12,
	emergencyMonths: 1,
	homeowner: false,
	degree: false,
	employment: 'employed',
	outlook: 'stable',
	socialConnection: 1,
	partnered: false,
	volunteers: false,
	drivingIncidents: 0,
	digitalFootprint: 1,
	criminalRecord: false,
	voterRegistered: true
};

type NumericKey = 'age' | 'exerciseMins' | 'sleepHours' | 'income' | 'netWorth' | 'debt' | 'creditUtil' | 'emergencyMonths' | 'drivingIncidents';

export const NUMERIC_CLAMPS: Record<NumericKey, [number, number]> = {
	age: [16, 100],
	exerciseMins: [0, 2000],
	sleepHours: [3, 12],
	income: [0, 10_000_000],
	netWorth: [-5_000_000, 100_000_000],
	debt: [0, 100_000_000],
	creditUtil: [0, 100],
	emergencyMonths: [0, 60],
	drivingIncidents: [0, 10]
};

const STRING_ENUMS = {
	sex: ['f', 'm'],
	smoker: ['never', 'former', 'current'],
	alcohol: ['none', 'moderate', 'heavy'],
	bmiBand: ['under', 'normal', 'over', 'obese'],
	employment: ['employed', 'self', 'unemployed', 'student', 'retired'],
	outlook: ['declining', 'stable', 'growing']
} as const;

const ORDINALS = ['familySupport', 'neighborhood', 'socialConnection', 'digitalFootprint', 'latePayments'] as const;

const BOOLEANS = ['parentsDegree', 'insured', 'homeowner', 'degree', 'partnered', 'volunteers', 'criminalRecord', 'voterRegistered'] as const;

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
