export type Domain = 'origin' | 'health' | 'finance' | 'education' | 'social' | 'civic';
export type Tier = 'starting_point' | 'your_moves';
export type Evidence = 'SOURCED' | 'SPECULATIVE';

export interface Source {
	name: string;
	finding: string;
	url: string;
	accessed: string;
}

export type CountryCode = 'us' | 'nl' | 'de' | 'jp' | 'br' | 'mx' | 'in' | 'ng' | 'af';

export interface Inputs {
	// origin
	country: CountryCode;
	familySupport: 0 | 1 | 2;
	parentsDegree: boolean;
	neighborhood: 0 | 1 | 2; // low / average / high opportunity area
	// health
	age: number;
	sex: 'f' | 'm';
	smoker: 'never' | 'former' | 'current';
	exerciseMins: number; // per week
	alcohol: 'none' | 'moderate' | 'heavy';
	sleepHours: number;
	insured: boolean;
	bmiBand: 'under' | 'normal' | 'over' | 'obese';
	// finance
	income: number;
	netWorth: number;
	debt: number;
	latePayments: 0 | 1 | 2; // none in 24mo / one / multiple
	creditUtil: number; // percent of available revolving credit used
	emergencyMonths: number;
	homeowner: boolean;
	// education / work
	education: 'none' | 'hs' | 'some' | 'bachelor' | 'graduate';
	employment: 'employed' | 'self' | 'unemployed' | 'student' | 'retired';
	outlook: 'declining' | 'stable' | 'growing';
	// social
	housing: 'unhoused' | 'insecure' | 'stable';
	socialConnection: 0 | 1 | 2; // rarely / sometimes / regularly see people you're close to
	partnered: boolean;
	volunteers: boolean;
	drivingIncidents: number; // at-fault accidents + moving violations, last 3y
	digitalFootprint: 0 | 1 | 2; // risky / neutral / curated public footprint
	// finance / banking
	banking: 'unbanked' | 'underbanked' | 'banked';
	// civic
	criminalRecord: boolean;
	voterRegistered: boolean;
}

export type InputKey = keyof Inputs;

export interface WhatIf {
	label: string;
	applicable(i: Inputs): boolean;
	transform(i: Inputs): Inputs;
}

export interface Rule {
	id: string;
	domain: Domain;
	tier: Tier;
	label: string;
	controllable: boolean;
	defaultWeight: number;
	logic: string;
	evidence: Evidence;
	source: Source;
	inputs: InputKey[];
	/** Measured fact, normalized: 1.0 = full marks. May exceed bounds; engine clamps. */
	position(i: Inputs): number;
	/** Declared position bounds; upper may be Infinity (uncapped). */
	bounds: [number, number];
	/** Why this default weight, relative to the 1.0× income baseline. */
	weightRationale: string;
	describe(i: Inputs): string;
	whatIf?: WhatIf;
	caveat?: string; // known criticisms of the measure, shown in-app
}

export const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
export const usd = (n: number) => '$' + Math.round(n).toLocaleString('en-US');
