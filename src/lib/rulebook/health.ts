import { clamp, type Rule } from './types';

const ACCESSED = '2026-06-11';

export const HEALTH_RULES: Rule[] = [
	{
		id: 'life-table',
		domain: 'health',
		tier: 'starting_point',
		label: 'Age & sex vs. the life table',
		controllable: false,
		defaultWeight: 10,
		logic: 'Insurers price you off remaining life expectancy: younger means more runway, and women outlive men by ~5 years on average. Pure actuarial position — no virtue involved.',
		evidence: 'SOURCED',
		source: {
			name: 'Social Security Administration — Actuarial Life Table',
			finding: 'Period life tables give remaining life expectancy by exact age and sex; US female life expectancy at birth runs ~5 years above male.',
			url: 'https://www.ssa.gov/oact/STATS/table4c6.html',
			accessed: ACCESSED
		},
		inputs: ['age', 'sex'],
		score: (i, w) => Math.round(clamp(((i.sex === 'f' ? 81 : 76) - i.age) / 60, 0, 1) * w),
		describe: (i) => `age ${i.age}, ${i.sex === 'f' ? 'female' : 'male'} — this is literally how a life insurer opens your file`
	},
	{
		id: 'smoking',
		domain: 'health',
		tier: 'your_moves',
		label: 'Smoking status',
		controllable: true,
		defaultWeight: 10,
		logic: 'The single largest behavioral mortality factor insurers price. Never-smokers score full; former smokers recover most of it; current smokers score zero here.',
		evidence: 'SOURCED',
		source: {
			name: 'CDC — Tobacco-Related Mortality',
			finding: 'Cigarette smoking reduces life expectancy by at least 10 years; quitting before 40 recovers nearly all of it.',
			url: 'https://archive.cdc.gov/www_cdc_gov/tobacco/data_statistics/fact_sheets/health_effects/tobacco_related_mortality/index.htm',
			accessed: ACCESSED
		},
		inputs: ['smoker'],
		score: (i, w) => Math.round({ never: 1, former: 0.6, current: 0 }[i.smoker] * w),
		describe: (i) => ({ never: 'never smoked — the cheapest points on the board', former: 'former smoker — most of the actuarial penalty fades with years quit', current: 'current smoker — the largest single behavioral penalty in any actuarial table' })[i.smoker],
		whatIf: {
			label: 'Quit smoking',
			applicable: (i) => i.smoker === 'current',
			transform: (i) => ({ ...i, smoker: 'former' })
		}
	},
	{
		id: 'exercise',
		domain: 'health',
		tier: 'your_moves',
		label: 'Physical activity',
		controllable: true,
		defaultWeight: 8,
		logic: 'Scored against the 150-minutes-per-week guideline; saturates there — this model gives no extra credit for marathon volume.',
		evidence: 'SOURCED',
		source: {
			name: 'WHO — Physical Activity Guidelines',
			finding: 'Adults should do 150–300 minutes of moderate aerobic activity weekly; meeting it is associated with 20–30% reduced all-cause mortality.',
			url: 'https://www.who.int/news-room/fact-sheets/detail/physical-activity',
			accessed: ACCESSED
		},
		inputs: ['exerciseMins'],
		score: (i, w) => Math.round(clamp(i.exerciseMins / 150, 0, 1) * w),
		describe: (i) => (i.exerciseMins >= 150 ? `${i.exerciseMins} min/week — meets the WHO guideline` : `${i.exerciseMins} min/week — guideline is 150; the gap is the cheapest health points available`),
		whatIf: {
			label: 'Hit 150 min/week',
			applicable: (i) => i.exerciseMins < 150,
			transform: (i) => ({ ...i, exerciseMins: 150 })
		}
	},
	{
		id: 'alcohol',
		domain: 'health',
		tier: 'your_moves',
		label: 'Alcohol use',
		controllable: true,
		defaultWeight: 6,
		logic: 'Heavy drinking carries large measured mortality and financial costs; moderate use a smaller penalty; none scores full.',
		evidence: 'SOURCED',
		source: {
			name: 'NIAAA — Alcohol Facts and Statistics',
			finding: 'Excessive alcohol use is a leading preventable cause of death in the US, responsible for roughly 178,000 deaths per year.',
			url: 'https://www.niaaa.nih.gov/alcohols-effects-health/alcohol-topics/alcohol-facts-and-statistics',
			accessed: ACCESSED
		},
		inputs: ['alcohol'],
		score: (i, w) => Math.round({ none: 1, moderate: 0.7, heavy: 0 }[i.alcohol] * w),
		describe: (i) => ({ none: 'no alcohol — full marks on a measure most people assume is binary', moderate: 'moderate use — a small penalty current research no longer waves away', heavy: 'heavy use — a leading preventable mortality factor' })[i.alcohol]
	},
	{
		id: 'sleep',
		domain: 'health',
		tier: 'your_moves',
		label: 'Sleep duration',
		controllable: true,
		defaultWeight: 6,
		logic: '7–9 hours scores full; 6 or 10 hours partial; outside that, the short-sleep mortality association bites.',
		evidence: 'SOURCED',
		source: {
			name: 'CDC / AASM — How Much Sleep Do I Need?',
			finding: 'Adults need 7 or more hours per night; short sleep is associated with obesity, diabetes, and cardiovascular disease.',
			url: 'https://www.cdc.gov/sleep/about/index.html',
			accessed: ACCESSED
		},
		inputs: ['sleepHours'],
		score: (i, w) => {
			const h = i.sleepHours;
			const frac = h >= 7 && h <= 9 ? 1 : h >= 6 && h <= 10 ? 0.6 : 0.2;
			return Math.round(frac * w);
		},
		describe: (i) => (i.sleepHours >= 7 && i.sleepHours <= 9 ? `${i.sleepHours}h — inside the guideline band` : `${i.sleepHours}h — outside the 7–9h band the research keeps converging on`)
	},
	{
		id: 'insurance',
		domain: 'health',
		tier: 'your_moves',
		label: 'Health insurance coverage',
		controllable: true,
		defaultWeight: 8,
		logic: 'Being uninsured is both a health risk and the most common path to catastrophic financial shock. Controllable only to the degree coverage is affordable where you live — flagged in the description.',
		evidence: 'SOURCED',
		source: {
			name: 'KFF — Key Facts about the Uninsured Population',
			finding: 'Uninsured adults are far more likely to delay or forgo care and to carry medical debt; medical debt is a leading driver of US bankruptcy.',
			url: 'https://www.kff.org/uninsured/issue-brief/key-facts-about-the-uninsured-population/',
			accessed: ACCESSED
		},
		inputs: ['insured'],
		score: (i, w) => Math.round((i.insured ? 1 : 0) * w),
		describe: (i) => (i.insured ? 'covered — one uncapped downside risk removed' : 'uninsured — one ER visit can rewrite the whole financial section of this scorecard'),
		whatIf: {
			label: 'Get covered',
			applicable: (i) => !i.insured,
			transform: (i) => ({ ...i, insured: true })
		}
	},
	{
		id: 'bmi',
		domain: 'health',
		tier: 'your_moves',
		label: 'BMI band',
		controllable: true,
		defaultWeight: 6,
		logic: 'Insurers still price by BMI band, so it appears here — scored as they score it, not as an endorsement of the measure.',
		evidence: 'SOURCED',
		caveat: 'BMI is a blunt population statistic: it misclassifies muscular builds and ignores fat distribution. It is included because underwriters use it, not because it is good.',
		source: {
			name: 'CDC — About Adult BMI',
			finding: 'BMI bands (under 18.5 / 18.5–24.9 / 25–29.9 / 30+) correlate with metabolic-disease risk at population scale; CDC notes it is a screening tool, not a diagnostic.',
			url: 'https://www.cdc.gov/bmi/about/index.html',
			accessed: ACCESSED
		},
		inputs: ['bmiBand'],
		score: (i, w) => Math.round({ under: 0.5, normal: 1, over: 0.6, obese: 0.2 }[i.bmiBand] * w),
		describe: (i) => ({ under: 'underweight band — priced as risk by underwriters', normal: 'the band underwriters price cheapest', over: 'overweight band — a modest underwriting penalty', obese: 'obese band — a significant underwriting penalty' })[i.bmiBand]
	}
];
