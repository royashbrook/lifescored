import type { Rule } from './types';

const ACCESSED = '2026-06-11';

export const CIVIC_RULES: Rule[] = [
	{
		id: 'criminal-record',
		domain: 'civic',
		tier: 'your_moves',
		label: 'Criminal record',
		controllable: false,
		defaultWeight: 8,
		logic: 'A record roughly halves employer callbacks in audit studies. Scored as the labor market scores it — which is exactly the kind of opaque penalty this app exists to expose.',
		evidence: 'SOURCED',
		caveat: 'Enforcement and conviction rates are themselves racially and economically skewed, so this rule inherits that bias from the system it measures. Shown because the penalty is real, not because it is just.',
		source: {
			name: 'Pager — The Mark of a Criminal Record (audit study)',
			finding: 'Matched-pair audits found a criminal record cut employer callbacks by ~50%, with effects compounding across race.',
			url: 'https://www.journals.uchicago.edu/doi/10.1086/374403',
			accessed: ACCESSED
		},
		inputs: ['criminalRecord'],
		score: (i, w) => Math.round((i.criminalRecord ? 0 : 1) * w),
		describe: (i) => (i.criminalRecord ? 'record present — the callback penalty is measured and brutal' : 'no record — full marks on a gate most people never see')
	},
	{
		id: 'voting',
		domain: 'civic',
		tier: 'your_moves',
		label: 'Voter registration',
		controllable: true,
		defaultWeight: 4,
		logic: 'Registered voters appear in civic data used by campaigns, jury pools, and some tenant screens; the personal-outcome effect is unquantified — flagged guess.',
		evidence: 'SPECULATIVE',
		source: {
			name: 'US Census — Voting and Registration tables',
			finding: 'Registration rates are tracked demographically, but no public dataset ties individual registration to life outcomes. Hence speculative.',
			url: 'https://www.census.gov/topics/public-sector/voting.html',
			accessed: ACCESSED
		},
		inputs: ['voterRegistered'],
		score: (i, w) => Math.round((i.voterRegistered ? 1 : 0.4) * w),
		describe: (i) => (i.voterRegistered ? 'registered — present in the civic ledger' : 'not registered — absent from the civic ledger')
	}
];
