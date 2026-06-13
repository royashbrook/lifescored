import { usd, type Rule } from './types';

const ACCESSED = '2026-06-11';

/** Format a raw multiple for the dominance line: one decimal below 10×, thousands-separated integer at/above. */
function multiple(m: number): string {
	return m < 10 ? m.toFixed(1) : Math.round(m).toLocaleString('en-US');
}
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
		pack: 'core',
		tier: 'your_moves',
		label: 'Net-worth position',
		controllable: false, // your number now is partly past luck; the levers below move it
		defaultWeight: 16,
		logic: 'Net worth against the median for your age band. Below the median: a linear drag, floored at half this weight. Above it, points grow as the square root of your wealth multiple — quadruple your money to double your points — uncapped, because the real world does not cap the advantage of money.',
		evidence: 'SOURCED',
		source: {
			name: 'Federal Reserve — Survey of Consumer Finances (2022)',
			finding: "Median net worth runs ~$39k for households under 35, rising to ~$410k for 65–74 — comparing a 27-year-old to a 60-year-old is meaningless.",
			url: 'https://www.federalreserve.gov/econres/scfindex.htm',
			accessed: ACCESSED
		},
		inputs: ['netWorth', 'age'],
		position: (i) => {
			const median = medianNetWorthForAge(i.age);
			if (i.netWorth < median) return Math.max(-0.5, (i.netWorth - median) / (2 * median));
			return Math.sqrt(i.netWorth / median) - 1;
		},
		bounds: [-0.5, Infinity],
		weightRationale: 'Stock beats flow: wealth absorbs shocks income cannot, and SCF gaps between wealth deciles exceed income gaps — 1.6× the baseline, uncapped above because the world does not cap it.',
		describe: (i) => {
			const median = medianNetWorthForAge(i.age);
			if (i.netWorth >= median) {
				const m = i.netWorth / median;
				return `${usd(i.netWorth)} — ${multiple(m)}× your age-band median (${usd(median)}); uncapped, because the world doesn't cap it`;
			}
			const d = i.netWorth - median;
			return `${usd(i.netWorth)} — ${usd(-d)} below your age-band median (${usd(median)})`;
		}
	},
	{
		id: 'dti',
		domain: 'finance',
		pack: 'core',
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
		position: (i) => {
			const ratio = i.income > 0 ? i.debt / i.income : i.debt > 0 ? Infinity : 0;
			return (DTI_BENCHMARK - ratio) / DTI_BENCHMARK;
		},
		bounds: [-1, 1],
		weightRationale: "The lending world's primary gate (the CFPB 43% line) — 1.4×. The only symmetric rule in the book: the cited system punishes exactly as hard as it rewards.",
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
		pack: 'core',
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
		position: (i) => [1, 0.4, 0][i.latePayments],
		bounds: [0, 1],
		weightRationale: '35% of FICO — the heaviest input in the most consequential consumer score — 1.2×.',
		describe: (i) => ['clean 24 months — the heaviest FICO input, fully banked', 'one recent late payment — FICO forgives slowly', 'multiple recent lates — the heaviest FICO input, zeroed'][i.latePayments]
	},
	{
		id: 'utilization',
		domain: 'finance',
		pack: 'core',
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
		position: (i) => {
			const u = i.creditUtil;
			return u <= 9 ? 1 : u <= 30 ? 0.8 : u <= 50 ? 0.4 : u <= 80 ? 0.1 : -0.3;
		},
		bounds: [-0.3, 1],
		weightRationale: '30% of FICO, just behind payment history — 1.0×. Mildly subtractive at near-maxed because the bureaus genuinely reprice that downward.',
		describe: (i) => `${i.creditUtil}% of available revolving credit in use — bureaus reprice this monthly`
	},
	{
		id: 'emergency-fund',
		domain: 'finance',
		pack: 'core',
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
		position: (i) => i.emergencyMonths / 3,
		bounds: [0, 1],
		weightRationale: "The Fed's own resilience test: the 3-month line is what separates a setback from a spiral — 1.0×.",
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
		pack: 'core',
		tier: 'your_moves',
		label: 'Income vs. median',
		controllable: true,
		defaultWeight: 10,
		logic: 'Annual income against the US full-time median: half marks at the median, then points grow as the square root of your income multiple, uncapped — see the net-worth rule for why.',
		evidence: 'SOURCED',
		source: {
			name: 'BLS — Usual Weekly Earnings of Wage and Salary Workers',
			finding: 'Median usual weekly earnings of full-time workers, annualized, run near $60,000.',
			url: 'https://www.bls.gov/news.release/wkyeng.toc.htm',
			accessed: ACCESSED
		},
		inputs: ['income'],
		position: (i) => (i.income <= MEDIAN_INCOME ? i.income / (2 * MEDIAN_INCOME) : 0.5 + (Math.sqrt(i.income / MEDIAN_INCOME) - 1)),
		bounds: [0, Infinity],
		weightRationale: 'THE BASELINE (1.0×). Income is the dimension every other system prices most legibly; every other weight in this book is a stated deviation from this one.',
		describe: (i) => {
			if (i.income > MEDIAN_INCOME) {
				const m = i.income / MEDIAN_INCOME;
				return `${usd(i.income)}/yr — ${multiple(m)}× the ~${usd(MEDIAN_INCOME)} full-time median`;
			}
			return `${usd(i.income)}/yr vs. the ~${usd(MEDIAN_INCOME)} full-time median`;
		}
	},
	{
		id: 'homeownership',
		domain: 'finance',
		pack: 'core',
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
		position: (i) => (i.homeowner ? 1 : 0.3),
		bounds: [0, 1],
		weightRationale: 'The wealth effect is already counted in net worth; this 0.6× prices only the access premium to the main US wealth escalator.',
		describe: (i) => (i.homeowner ? 'owner — riding the main US wealth escalator' : 'renting — the 40× median-wealth gap is the system, not a verdict')
	},
	{
		id: 'banked',
		domain: 'finance',
		pack: 'core',
		tier: 'your_moves',
		label: 'Banked status',
		controllable: true,
		defaultWeight: 6,
		logic: 'No bank account means check-cashing fees, money orders, and no credit-building rail — a measured tax on being poor. Underbanked (account, but relying on payday/check-cashing services) pays part of it.',
		evidence: 'SOURCED',
		source: {
			name: 'FDIC — National Survey of Unbanked and Underbanked Households',
			finding: 'Millions of US households lack any bank account; unbanked households pay fees for basic transactions that banked households get free, and cannot build credit history from ordinary payments.',
			url: 'https://www.fdic.gov/household-survey',
			accessed: '2026-06-12'
		},
		inputs: ['banking'],
		position: (i) => ({ unbanked: 0, underbanked: 0.5, banked: 1 })[i.banking],
		bounds: [0, 1],
		weightRationale: "The FDIC's measured poverty premium — fees where wealth earns interest — at 0.6× the baseline, kept low because its dollar magnitude is small even though its direction is vicious.",
		describe: (i) => ({
			unbanked: 'unbanked — paying fees for what wealth gets free, building no credit history',
			underbanked: 'underbanked — an account, plus the payday-services tax',
			banked: 'banked — the free rail everyone above assumes'
		})[i.banking],
		whatIf: {
			label: 'Open a bank account',
			applicable: (i) => i.banking !== 'banked',
			transform: (i) => ({ ...i, banking: 'banked' })
		}
	}
];
