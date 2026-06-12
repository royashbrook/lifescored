import { clamp, usd, type Rule } from './types';

const ACCESSED = '2026-06-11';
const DTI_BENCHMARK = 0.43; // CFPB Qualified Mortgage affordability line
const MEDIAN_INCOME = 60000; // ≈ BLS median full-time earnings, annualized

// Fed SCF 2022: median household net worth by age band. [ageBelow, median]
const NW_MEDIANS: [number, number][] = [
	[35, 39000], [45, 135600], [55, 247200], [65, 364500], [75, 409900], [Infinity, 335600]
];

export const medianNetWorthForAge = (age: number): number =>
	NW_MEDIANS.find(([below]) => age < below)![1];

export const FINANCE_RULES: Rule[] = [
	{
		id: 'networth',
		domain: 'finance',
		tier: 'your_moves',
		label: 'Net-worth position',
		controllable: false, // your number now is partly past luck; the levers below move it
		defaultWeight: 16,
		logic: 'Net worth measured against the median for your age band, not in a vacuum. Above the age-median scores up; far below scores down.',
		evidence: 'SOURCED',
		source: {
			name: 'Federal Reserve — Survey of Consumer Finances (2022)',
			finding: "Median net worth runs ~$39k for households under 35, rising to ~$410k for 65–74 — comparing a 27-year-old to a 60-year-old is meaningless.",
			url: 'https://www.federalreserve.gov/econres/scfindex.htm',
			accessed: ACCESSED
		},
		inputs: ['netWorth', 'age'],
		score: (i, w) => {
			const median = medianNetWorthForAge(i.age);
			return Math.round(clamp((i.netWorth - median) / (2 * median), -0.5, 1) * w) || 0;
		},
		describe: (i) => {
			const median = medianNetWorthForAge(i.age);
			const d = i.netWorth - median;
			return d >= 0
				? `${usd(i.netWorth)} — about ${usd(d)} above your age-band median (${usd(median)})`
				: `${usd(i.netWorth)} — ${usd(-d)} below your age-band median (${usd(median)})`;
		}
	},
	{
		id: 'dti',
		domain: 'finance',
		tier: 'your_moves',
		label: 'Debt load (DTI, not raw $)',
		controllable: true,
		defaultWeight: 14,
		logic: "Debt scored as leverage against income, benchmarked to the lending world's ~43% affordability line. Zero debt scores best; the same asset bought on a loan drags here.",
		evidence: 'SOURCED',
		source: {
			name: 'CFPB — Ability-to-Repay / Qualified Mortgage rule',
			finding: 'The long-standing affordability benchmark caps total debt-to-income at 43%. Lenders judge the ratio, not the sticker price of what you bought.',
			url: 'https://www.consumerfinance.gov/about-us/blog/qualified-mortgages-what-are-they-and-what-do-they-mean-for-you/',
			accessed: ACCESSED
		},
		inputs: ['debt', 'income'],
		score: (i, w) => {
			const ratio = i.income > 0 ? i.debt / i.income : i.debt > 0 ? Infinity : 0;
			return Math.round(clamp((DTI_BENCHMARK - ratio) / DTI_BENCHMARK, -1, 1) * w) || 0;
		},
		describe: (i) => {
			if (i.debt === 0) return 'no debt — a quiet advantage that never shows up on a paycheck';
			const ratio = i.income > 0 ? (i.debt / i.income).toFixed(2) : '∞';
			return `${usd(i.debt)} against ${usd(i.income)} income (ratio ${ratio}) — scored like a lender would`;
		},
		whatIf: {
			label: 'Clear the debt',
			applicable: (i) => i.debt > 0,
			transform: (i) => ({ ...i, debt: 0 })
		}
	},
	{
		id: 'payment-history',
		domain: 'finance',
		tier: 'your_moves',
		label: 'Payment history',
		controllable: true,
		defaultWeight: 12,
		logic: "The single heaviest input in FICO's published model (35%). One late payment costs most of it; multiple zero it out.",
		evidence: 'SOURCED',
		source: {
			name: "myFICO — What's in my FICO Scores?",
			finding: 'Payment history accounts for about 35% of a FICO score — the largest single component.',
			url: 'https://www.myfico.com/credit-education/whats-in-your-credit-score',
			accessed: ACCESSED
		},
		inputs: ['latePayments'],
		score: (i, w) => Math.round([1, 0.4, 0][i.latePayments] * w),
		describe: (i) => ['clean 24 months — the heaviest FICO input, fully banked', 'one recent late payment — FICO forgives slowly', 'multiple recent lates — the heaviest FICO input, zeroed'][i.latePayments]
	},
	{
		id: 'utilization',
		domain: 'finance',
		tier: 'your_moves',
		label: 'Credit utilization',
		controllable: true,
		defaultWeight: 10,
		logic: 'Share of available revolving credit in use — 30% of FICO. Under ~10% is ideal; over 30% starts costing; near-maxed goes negative.',
		evidence: 'SOURCED',
		source: {
			name: 'myFICO / Experian — credit utilization guidance',
			finding: 'Amounts owed are ~30% of a FICO score; commonly cited guidance keeps utilization below 30%, with top scorers in single digits.',
			url: 'https://www.experian.com/blogs/ask-experian/credit-education/score-basics/credit-utilization-rate/',
			accessed: ACCESSED
		},
		inputs: ['creditUtil'],
		score: (i, w) => {
			const u = i.creditUtil;
			const frac = u <= 9 ? 1 : u <= 30 ? 0.8 : u <= 50 ? 0.4 : u <= 80 ? 0.1 : -0.3;
			return Math.round(frac * w) || 0;
		},
		describe: (i) => `${i.creditUtil}% of available revolving credit in use — bureaus reprice this monthly`
	},
	{
		id: 'emergency-fund',
		domain: 'finance',
		tier: 'your_moves',
		label: 'Emergency fund',
		controllable: true,
		defaultWeight: 10,
		logic: "Months of expenses covered by liquid savings, scored against the standard 3-month test. Saturates at 3 — this measures shock absorption, not hoarding.",
		evidence: 'SOURCED',
		source: {
			name: 'Federal Reserve — Survey of Household Economics and Decisionmaking (SHED)',
			finding: 'A large share of US adults could not cover three months of expenses with savings; many could not cover a $400 emergency in cash.',
			url: 'https://www.federalreserve.gov/consumerscommunities/shed.htm',
			accessed: ACCESSED
		},
		inputs: ['emergencyMonths'],
		score: (i, w) => Math.round(clamp(i.emergencyMonths / 3, 0, 1) * w),
		describe: (i) => (i.emergencyMonths >= 3 ? `${i.emergencyMonths} months covered — the Fed's resilience test, passed` : `${i.emergencyMonths} month(s) covered — the 3-month line is the difference between a setback and a spiral`),
		whatIf: {
			label: 'Save a 3-month fund',
			applicable: (i) => i.emergencyMonths < 3,
			transform: (i) => ({ ...i, emergencyMonths: 3 })
		}
	},
	{
		id: 'income',
		domain: 'finance',
		tier: 'your_moves',
		label: 'Income vs. median',
		controllable: true,
		defaultWeight: 10,
		logic: 'Annual income against the US full-time median (~$60k). Saturates at 2× median — beyond that, income stops differentiating life outcomes in this model.',
		evidence: 'SOURCED',
		source: {
			name: 'BLS — Usual Weekly Earnings of Wage and Salary Workers',
			finding: 'Median usual weekly earnings of full-time workers, annualized, run near $60,000.',
			url: 'https://www.bls.gov/news.release/wkyeng.toc.htm',
			accessed: ACCESSED
		},
		inputs: ['income'],
		score: (i, w) => Math.round(clamp(i.income / (2 * MEDIAN_INCOME), 0, 1) * w),
		describe: (i) => `${usd(i.income)}/yr vs. the ~${usd(MEDIAN_INCOME)} full-time median`
	},
	{
		id: 'homeownership',
		domain: 'finance',
		tier: 'your_moves',
		label: 'Homeownership',
		controllable: true,
		defaultWeight: 6,
		logic: 'Owning is the dominant US wealth-building vehicle — and gatekept by everything above. Renters get partial credit; this measures system position, not virtue.',
		evidence: 'SOURCED',
		source: {
			name: 'Federal Reserve SCF — homeowner vs. renter net worth',
			finding: 'Median homeowner net worth (~$400k) is roughly 40× median renter net worth (~$10k) in the 2022 SCF.',
			url: 'https://www.federalreserve.gov/econres/scfindex.htm',
			accessed: ACCESSED
		},
		inputs: ['homeowner'],
		score: (i, w) => Math.round((i.homeowner ? 1 : 0.3) * w),
		describe: (i) => (i.homeowner ? 'owner — riding the main US wealth escalator' : 'renting — the 40× median-wealth gap is the system, not a verdict')
	}
];
