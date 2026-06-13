import { COUNTRIES, type Inputs } from '$lib/rulebook';

export interface WizardStep {
	key: keyof Inputs;
	question: string;
	kind: 'options' | 'number';
	// for 'options': value+label pairs (value must match the Inputs type for that key)
	options?: { value: string | number; label: string }[];
	// for 'number':
	prefix?: string;
	step?: number;
}

const COUNTRY_OPTIONS = Object.entries(COUNTRIES).map(([value, v]) => ({ value, label: v.name }));

export const WIZARD_STEPS: WizardStep[] = [
	{ key: 'country', question: 'Where do you live?', kind: 'options', options: COUNTRY_OPTIONS },
	{ key: 'age', question: 'How old are you?', kind: 'number', step: 1 },
	{
		key: 'familySupport',
		question: 'If a crisis hit, is there family money to fall back on?',
		kind: 'options',
		options: [
			{ value: 0, label: 'None' },
			{ value: 1, label: 'Some' },
			{ value: 2, label: 'Substantial' }
		]
	},
	{ key: 'income', question: 'Roughly, your income per year?', kind: 'number', prefix: '$', step: 1000 },
	{
		key: 'assets',
		question: 'Roughly, everything you own — savings, home, car, investments?',
		kind: 'number',
		prefix: '$',
		step: 1000
	},
	{ key: 'debt', question: 'And your total debt? (we subtract it to get net worth)', kind: 'number', prefix: '$', step: 1000 },
	{
		key: 'education',
		question: 'Highest level of school you finished?',
		kind: 'options',
		options: [
			{ value: 'none', label: 'No diploma' },
			{ value: 'hs', label: 'High school' },
			{ value: 'some', label: 'Some college' },
			{ value: 'bachelor', label: "Bachelor's" },
			{ value: 'graduate', label: 'Graduate' }
		]
	},
	{
		key: 'smoker',
		question: 'Do you use nicotine — cigarettes, vaping, anything?',
		kind: 'options',
		options: [
			{ value: 'never', label: 'Never' },
			{ value: 'former', label: 'Former' },
			{ value: 'current', label: 'Currently' }
		]
	}
];
