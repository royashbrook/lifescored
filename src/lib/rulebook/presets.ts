import { DEFAULT_INPUTS } from './inputs';
import type { Inputs } from './types';

export interface Preset {
	id: string;
	label: string;
	inputs: Inputs;
}

/** Illustrative starting points. Numbers are rough, not census-exact — a place to begin, then tune. */
export const PRESETS: Preset[] = [
	{
		id: 'typical-us',
		label: 'Typical American',
		inputs: {
			...DEFAULT_INPUTS,
			country: 'us', age: 38, familySupport: 1, parentsDegree: false, neighborhood: 1, sex: 'm',
			smoker: 'never', exerciseMins: 60, alcohol: 'moderate', sleepHours: 7, insured: true, bmiBand: 'over',
			income: 60000, assets: 110000, debt: 30000, latePayments: 0, creditUtil: 30, emergencyMonths: 1, homeowner: true,
			education: 'hs', employment: 'employed', outlook: 'stable',
			socialConnection: 1, partnered: true, volunteers: false, drivingIncidents: 0, digitalFootprint: 1,
			housing: 'stable', banking: 'banked', criminalRecord: false, voterRegistered: true
		}
	},
	{
		id: 'global-median',
		label: 'Global median',
		inputs: {
			...DEFAULT_INPUTS,
			country: 'in', age: 30, familySupport: 0, parentsDegree: false, neighborhood: 1, sex: 'm',
			smoker: 'never', exerciseMins: 60, alcohol: 'none', sleepHours: 7, insured: false, bmiBand: 'normal',
			income: 5000, assets: 5000, debt: 0, latePayments: 0, creditUtil: 0, emergencyMonths: 0, homeowner: false,
			education: 'hs', employment: 'employed', outlook: 'stable',
			socialConnection: 2, partnered: true, volunteers: false, drivingIncidents: 0, digitalFootprint: 1,
			housing: 'stable', banking: 'underbanked', criminalRecord: false, voterRegistered: true
		}
	},
	{
		id: 'born-ahead',
		label: 'Born ahead',
		inputs: {
			...DEFAULT_INPUTS,
			country: 'nl', age: 30, familySupport: 2, parentsDegree: true, neighborhood: 2, sex: 'f',
			smoker: 'never', exerciseMins: 180, alcohol: 'none', sleepHours: 8, insured: true, bmiBand: 'normal',
			income: 120000, assets: 400000, debt: 0, latePayments: 0, creditUtil: 5, emergencyMonths: 12, homeowner: true,
			education: 'graduate', employment: 'self', outlook: 'growing',
			socialConnection: 2, partnered: true, volunteers: true, drivingIncidents: 0, digitalFootprint: 2,
			housing: 'stable', banking: 'banked', criminalRecord: false, voterRegistered: true
		}
	},
	{
		id: 'started-behind',
		label: 'Started behind',
		inputs: {
			...DEFAULT_INPUTS,
			country: 'ng', age: 24, familySupport: 0, parentsDegree: false, neighborhood: 0, sex: 'm',
			smoker: 'current', exerciseMins: 0, alcohol: 'heavy', sleepHours: 5, insured: false, bmiBand: 'obese',
			income: 8000, assets: 10000, debt: 15000, latePayments: 2, creditUtil: 95, emergencyMonths: 0, homeowner: false,
			education: 'none', employment: 'unemployed', outlook: 'declining',
			socialConnection: 0, partnered: false, volunteers: false, drivingIncidents: 2, digitalFootprint: 0,
			housing: 'insecure', banking: 'unbanked', criminalRecord: true, voterRegistered: false
		}
	},
	{
		id: 'blank',
		label: 'Blank slate',
		inputs: {
			...DEFAULT_INPUTS,
			country: 'us', age: 30, familySupport: 1, parentsDegree: false, neighborhood: 1, sex: 'f',
			smoker: 'never', exerciseMins: 75, alcohol: 'moderate', sleepHours: 7, insured: true, bmiBand: 'normal',
			income: 40000, assets: 30000, debt: 10000, latePayments: 0, creditUtil: 20, emergencyMonths: 2, homeowner: false,
			education: 'some', employment: 'employed', outlook: 'stable',
			socialConnection: 1, partnered: false, volunteers: false, drivingIncidents: 0, digitalFootprint: 1,
			housing: 'stable', banking: 'banked', criminalRecord: false, voterRegistered: true
		}
	}
];
