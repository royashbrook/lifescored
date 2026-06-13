import type { InputKey } from './types';

export interface FieldHelp {
	help: string;
	ruleId: string;
}

/** One plain-language sentence per input, plus the rule it feeds (for the source link). */
export const FIELD_HELP: Record<InputKey, FieldHelp> = {
	country: { ruleId: 'country', help: 'Where you live now — sets a baseline from its World Bank income tier.' },
	familySupport: { ruleId: 'generational', help: "Money you could fall back on in a crisis — a parent who'd cover a month's rent, a loan you wouldn't have to beg for. Not your income; the cushion behind it." },
	parentsDegree: { ruleId: 'parental-education', help: 'Whether a parent holds a college degree — first-generation students face measurably steeper odds.' },
	neighborhood: { ruleId: 'neighborhood', help: 'The opportunity level of the area you grew up in — the census-tract effect on adult income.' },
	age: { ruleId: 'life-table', help: 'Your age — an insurer reads it straight off the life table; younger means more runway.' },
	sex: { ruleId: 'life-table', help: 'Used only for the actuarial life-table baseline; women outlive men by about five years on average.' },
	smoker: { ruleId: 'smoking', help: 'Your smoking status — the single largest behavioral factor insurers price.' },
	exerciseMins: { ruleId: 'exercise', help: 'Minutes of moderate exercise per week; the guideline is 150.' },
	alcohol: { ruleId: 'alcohol', help: 'Your typical alcohol use.' },
	sleepHours: { ruleId: 'sleep', help: 'Hours of sleep per night; 7 to 9 is the guideline band.' },
	insured: { ruleId: 'insurance', help: 'Whether you have health insurance — being uninsured is a leading path to catastrophic debt.' },
	bmiBand: { ruleId: 'bmi', help: "Your BMI band — included because underwriters price it, not because it's a good measure of a person." },
	income: { ruleId: 'income', help: 'Your annual income before tax.' },
	netWorth: { ruleId: 'networth', help: 'Everything you own minus everything you owe.' },
	debt: { ruleId: 'dti', help: 'Total debt you owe — scored as a ratio to your income, not a raw dollar amount.' },
	latePayments: { ruleId: 'payment-history', help: 'Late payments in the last 24 months — the heaviest single input in a credit score.' },
	creditUtil: { ruleId: 'utilization', help: "Share of your available credit you're using; under about 10% is ideal." },
	emergencyMonths: { ruleId: 'emergency-fund', help: 'Months of expenses your savings could cover; the 3-month line is the resilience test.' },
	homeowner: { ruleId: 'homeownership', help: 'Whether you own your home — the main US wealth-building escalator.' },
	education: { ruleId: 'education', help: "Highest level of school you've completed." },
	employment: { ruleId: 'employment', help: 'Your current employment status.' },
	outlook: { ruleId: 'outlook', help: 'Whether your field is projected to grow or shrink over the next decade.' },
	socialConnection: { ruleId: 'connection', help: "How often you see people you're close to — isolation rivals smoking in the mortality data." },
	partnered: { ruleId: 'partnership', help: 'Whether you have a partner or spouse.' },
	volunteers: { ruleId: 'volunteering', help: 'Whether you volunteer in your community regularly.' },
	drivingIncidents: { ruleId: 'driving', help: 'At-fault accidents and moving violations in the last 3 years — priced by every auto insurer.' },
	digitalFootprint: { ruleId: 'digital', help: 'How your public online presence reads to an employer or landlord screening you.' },
	housing: { ruleId: 'housing-stability', help: 'How stable your housing is — stable, insecure, or unhoused.' },
	banking: { ruleId: 'banked', help: 'Whether you have a bank account; without one, basic transactions carry check-cashing fees.' },
	criminalRecord: { ruleId: 'criminal-record', help: 'Whether you have a criminal record — it roughly halves employer callbacks in audit studies.' },
	voterRegistered: { ruleId: 'voting', help: 'Whether you are registered to vote — it appears in civic data used by campaigns and some screens.' }
};
