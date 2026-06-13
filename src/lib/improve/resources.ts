export interface Resource {
	name: string;
	url: string;
	note: string;
}

export interface ImproveArea {
	id: string;
	label: string;
	group: string;
	simple: string;
	free: Resource[];
	ruleIds: string[];
}

export const IMPROVE: ImproveArea[] = [
	// ── Health & habits ──────────────────────────────────────────────────────
	{
		id: 'exercise',
		label: 'Exercise',
		group: 'Health & habits',
		simple:
			'Active time is active time — walk, run, lift, dance, skip. The guideline is 150 minutes a week, and the cheapest version costs nothing.',
		free: [
			{
				name: 'CDC Move Your Way',
				url: 'https://www.cdc.gov/physical-activity-basics/',
				note: 'Plain-language activity basics and how much you actually need.'
			},
			{
				name: 'WHO Physical Activity',
				url: 'https://www.who.int/news-room/fact-sheets/detail/physical-activity',
				note: 'The global guideline, with the why behind the numbers.'
			}
		],
		ruleIds: ['exercise']
	},
	{
		id: 'nicotine',
		label: 'Nicotine',
		group: 'Health & habits',
		simple:
			"Quitting is the single biggest health move on this page. It's free, and there's a coach on the phone (1-800-QUIT-NOW).",
		free: [
			{
				name: 'smokefree.gov',
				url: 'https://smokefree.gov/',
				note: 'Free quit plans, texts, and an app from the NIH.'
			},
			{
				name: 'CDC Quit Smoking',
				url: 'https://www.cdc.gov/tobacco/about/index.html',
				note: 'How to quit and where the free help is.'
			}
		],
		ruleIds: ['smoking']
	},
	{
		id: 'alcohol',
		label: 'Alcohol',
		group: 'Health & habits',
		simple:
			"Cutting back is free. If it's hard, that's common — and the help is confidential and costs nothing.",
		free: [
			{
				name: 'NIAAA Rethinking Drinking',
				url: 'https://rethinkingdrinking.niaaa.nih.gov/',
				note: 'Check your own numbers and learn what cutting back looks like.'
			},
			{
				name: 'SAMHSA National Helpline',
				url: 'https://www.samhsa.gov/find-help/helplines/national-helpline',
				note: 'Free, confidential, 24/7: 1-800-662-HELP.'
			}
		],
		ruleIds: ['alcohol']
	},
	{
		id: 'sleep',
		label: 'Sleep',
		group: 'Health & habits',
		simple:
			'Seven to nine hours. The fixes are mostly free: a consistent schedule, a dark room, screens off early.',
		free: [
			{
				name: 'CDC Sleep',
				url: 'https://www.cdc.gov/sleep/about/index.html',
				note: 'How much sleep you need and habits that help you get it.'
			}
		],
		ruleIds: ['sleep']
	},
	{
		id: 'health-coverage',
		label: 'Health coverage',
		group: 'Health & habits',
		simple:
			"You may qualify for free or subsidized coverage — most people who assume they can't afford it actually can.",
		free: [
			{
				name: 'HealthCare.gov',
				url: 'https://www.healthcare.gov/',
				note: 'The federal marketplace — see what you qualify for.'
			},
			{
				name: 'Medicaid',
				url: 'https://www.medicaid.gov/',
				note: 'Free or low-cost coverage if your income qualifies.'
			}
		],
		ruleIds: ['insurance']
	},

	// ── Money ─────────────────────────────────────────────────────────────────
	{
		id: 'savings',
		label: 'Savings',
		group: 'Money',
		simple: 'Start tiny — even $10 a paycheck. The habit matters more than the amount.',
		free: [
			{
				name: 'CFPB Building an Emergency Fund',
				url: 'https://www.consumerfinance.gov/an-essential-guide-to-building-an-emergency-fund/',
				note: 'Government guidance on building a savings habit from nothing.'
			},
			{
				name: 'MyMoney.gov',
				url: 'https://www.mymoney.gov/',
				note: 'The federal hub for the basics of managing money.'
			}
		],
		ruleIds: ['emergency-fund']
	},
	{
		id: 'debt',
		label: 'Debt',
		group: 'Money',
		simple: "Nonprofit credit counseling is free or low-cost — and it's not a loan or a scam.",
		free: [
			{
				name: 'NFCC',
				url: 'https://www.nfcc.org/',
				note: 'Find a vetted nonprofit credit counselor near you.'
			},
			{
				name: 'CFPB Debt Help',
				url: 'https://www.consumerfinance.gov/consumer-tools/debt-collection/',
				note: 'Your rights and free tools for dealing with debt.'
			}
		],
		ruleIds: ['dti']
	},
	{
		id: 'credit',
		label: 'Credit',
		group: 'Money',
		simple:
			'Your credit report is free, by law, every week. Check it before anyone else scores you on it.',
		free: [
			{
				name: 'AnnualCreditReport.com',
				url: 'https://www.annualcreditreport.com/',
				note: 'The only federally authorized free credit report site.'
			},
			{
				name: 'CFPB Credit Reports & Scores',
				url: 'https://www.consumerfinance.gov/consumer-tools/credit-reports-and-scores/',
				note: 'How scoring works and how to fix errors for free.'
			}
		],
		ruleIds: ['payment-history', 'utilization']
	},
	{
		id: 'banking',
		label: 'Banking',
		group: 'Money',
		simple:
			'A free or low-fee account ends the check-cashing tax. These programs vet the accounts for you.',
		free: [
			{
				name: 'FDIC GetBanked',
				url: 'https://www.fdic.gov/getbanked',
				note: 'How to open an account, even with a rocky banking history.'
			},
			{
				name: 'Bank On',
				url: 'https://joinbankon.org/',
				note: 'Certified low-cost accounts with no overdraft surprises.'
			}
		],
		ruleIds: ['banked']
	},

	// ── Work & learning ─────────────────────────────────────────────────────
	{
		id: 'education',
		label: 'Education',
		group: 'Work & learning',
		simple:
			'You can learn almost anything for free before you ever pay for a credential. Start there.',
		free: [
			{
				name: 'Khan Academy',
				url: 'https://www.khanacademy.org/',
				note: 'Free courses from grade school through early college.'
			},
			{
				name: 'Federal Student Aid',
				url: 'https://studentaid.gov/',
				note: 'Grants and aid before you take on any debt.'
			}
		],
		ruleIds: ['education']
	},
	{
		id: 'employment',
		label: 'Employment',
		group: 'Work & learning',
		simple: 'Free job centers, resume help, and training exist in every state — already funded by your taxes.',
		free: [
			{
				name: 'CareerOneStop',
				url: 'https://www.careeronestop.org/',
				note: 'Department of Labor tools for jobs, training, and resumes.'
			},
			{
				name: 'Find an American Job Center',
				url: 'https://www.careeronestop.org/LocalHelp/local-help.aspx',
				note: 'Free in-person help near you, paid for by your taxes.'
			}
		],
		ruleIds: ['employment', 'outlook']
	},
	{
		id: 'volunteering',
		label: 'Volunteering',
		group: 'Work & learning',
		simple:
			'Volunteering is free and the research links it to better health. Find something near you.',
		free: [
			{
				name: 'VolunteerMatch',
				url: 'https://www.idealist.org/volunteermatch',
				note: 'Search local causes that need a hand.'
			},
			{
				name: 'AmeriCorps',
				url: 'https://americorps.gov/',
				note: 'Service positions, some with a stipend or education award.'
			}
		],
		ruleIds: ['volunteering']
	},

	// ── Stability & safety net ──────────────────────────────────────────────
	{
		id: 'social-connection',
		label: 'Social connection',
		group: 'Stability & safety net',
		simple:
			"The cheapest mortality hedge there is: a regular phone call, a standing coffee, showing up. If you're isolated, these can point to local people.",
		free: [
			{
				name: '211',
				url: 'https://www.211.org/',
				note: 'Free, confidential line to local programs and community.'
			},
			{
				name: '988 Suicide & Crisis Lifeline',
				url: 'https://988lifeline.org/',
				note: 'Call or text 988 any time — free and confidential.'
			}
		],
		ruleIds: ['connection']
	},
	{
		id: 'housing',
		label: 'Housing',
		group: 'Stability & safety net',
		simple:
			"If housing is shaky, you have rights and there's free help — legal aid, rental assistance, and a hotline that knows your local options.",
		free: [
			{
				name: '211',
				url: 'https://www.211.org/',
				note: 'Rental assistance and local housing programs.'
			},
			{
				name: 'Find Legal Aid',
				url: 'https://www.lsc.gov/about-lsc/what-legal-aid/i-need-legal-help',
				note: 'Free civil legal help, including eviction defense.'
			},
			{
				name: 'HUD Find Shelter',
				url: 'https://www.hud.gov/findshelter',
				note: 'Search nearby shelter, housing, and health services.'
			}
		],
		ruleIds: ['housing-stability']
	},
	{
		id: 'food',
		label: 'Food',
		group: 'Stability & safety net',
		simple:
			"Nobody should ration food. SNAP and food banks exist for exactly this — no shame in using what's there.",
		free: [
			{
				name: 'SNAP Eligibility',
				url: 'https://www.fna.usda.gov/snap/recipient/eligibility',
				note: 'Check whether you qualify for food assistance.'
			},
			{
				name: 'Find a Food Bank',
				url: 'https://www.feedingamerica.org/find-your-local-foodbank',
				note: 'Locate a food bank near you, today.'
			},
			{
				name: '211',
				url: 'https://www.211.org/',
				note: 'Local pantries and meal programs.'
			}
		],
		ruleIds: []
	},
	{
		id: 'criminal-record',
		label: 'Criminal record',
		group: 'Stability & safety net',
		simple:
			"A record isn't the end of the road. Expungement, reentry programs, and free legal aid can reopen doors.",
		free: [
			{
				name: 'National Reentry Resource Center',
				url: 'https://nationalreentryresourcecenter.org/',
				note: 'Reentry programs and support after incarceration.'
			},
			{
				name: 'Find Legal Aid',
				url: 'https://www.lsc.gov/about-lsc/what-legal-aid/i-need-legal-help',
				note: 'Free legal help, including expungement questions.'
			}
		],
		ruleIds: ['criminal-record']
	}
];
