import { CIVIC_RULES } from './civic';
import { EDUCATION_RULES } from './education';
import { FINANCE_RULES } from './finance';
import { HEALTH_RULES } from './health';
import { ORIGIN_RULES } from './origin';
import { SOCIAL_RULES } from './social';
import type { Domain, Rule, Tier } from './types';

export const RULES: Rule[] = [
	...ORIGIN_RULES,
	...HEALTH_RULES,
	...FINANCE_RULES,
	...EDUCATION_RULES,
	...SOCIAL_RULES,
	...CIVIC_RULES
];

export const TIERS: Record<Tier, { label: string; sub: string; accent: string }> = {
	starting_point: {
		label: 'Your starting point',
		sub: 'mostly out of your hands — luck of where and to whom you were born',
		accent: 'var(--start)'
	},
	your_moves: {
		label: 'Your moves',
		sub: "things you've actually influenced — where motivation lives",
		accent: 'var(--moves)'
	}
};

export const DOMAINS: Record<Domain, { label: string; blurb: string }> = {
	origin: { label: 'Origin', blurb: 'where and to whom you were born' },
	health: { label: 'Health / actuarial', blurb: 'how a life insurer prices you' },
	finance: { label: 'Finance / credit', blurb: 'how lenders and bureaus score you' },
	education: { label: 'Education / work', blurb: 'how the labor market values you' },
	social: { label: 'Social', blurb: 'connection, record, and footprint' },
	civic: { label: 'Civic / legal', blurb: 'how institutional ledgers read you' }
};

export * from './help';
export * from './inputs';
export * from './types';
