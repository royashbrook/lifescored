<script lang="ts">
	import { COUNTRIES, FIELD_HELP } from '$lib/rulebook';
	import { activePacks } from '$lib/state/profile.svelte';
	import type { createProfileState } from '$lib/state/profile.svelte';
	import Field from './Field.svelte';
	import NumInput from './NumInput.svelte';
	import SelectInput from './SelectInput.svelte';
	import Toggle from './Toggle.svelte';

	let { profile }: { profile: ReturnType<typeof createProfileState> } = $props();
	let expanded = $state(false);
	const packs = $derived(activePacks(profile));

	// bind: helpers — components bind to these proxies, writes route through setInput
	function field<K extends keyof typeof profile.inputs>(key: K) {
		return {
			get value() { return profile.inputs[key]; },
			set value(v) { profile.setInput(key, v); }
		};
	}
	const countryOpts = Object.entries(COUNTRIES).map(([k, v]) => [k, v.name]) as [string, string][];
	const f = {
		country: field('country'), familySupport: field('familySupport'), age: field('age'),
		sex: field('sex'), income: field('income'), netWorth: field('netWorth'), debt: field('debt'),
		education: field('education'), parentsDegree: field('parentsDegree'), neighborhood: field('neighborhood'),
		smoker: field('smoker'), exerciseMins: field('exerciseMins'), alcohol: field('alcohol'),
		sleepHours: field('sleepHours'), insured: field('insured'), bmiBand: field('bmiBand'),
		latePayments: field('latePayments'), creditUtil: field('creditUtil'),
		emergencyMonths: field('emergencyMonths'), homeowner: field('homeowner'),
		employment: field('employment'), outlook: field('outlook'),
		housing: field('housing'), banking: field('banking'),
		socialConnection: field('socialConnection'), partnered: field('partnered'),
		volunteers: field('volunteers'), drivingIncidents: field('drivingIncidents'),
		digitalFootprint: field('digitalFootprint'), criminalRecord: field('criminalRecord'),
		voterRegistered: field('voterRegistered'),
		wash: field('wash'), infrastructure: field('infrastructure'),
		foodSecurity: field('foodSecurity'), stability: field('stability')
	};
</script>

<div class="mb-5 rounded-lg p-3.5" style:background="var(--panel)" style:border="1px solid var(--line)">
	<div class="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
		<Field label="Country" help={FIELD_HELP.country}><SelectInput bind:value={f.country.value} opts={countryOpts} /></Field>
		<Field label="Age" help={FIELD_HELP.age}><NumInput bind:value={f.age.value} step={1} prefix="" /></Field>
		<Field label="Family support" help={FIELD_HELP.familySupport}><SelectInput bind:value={f.familySupport.value} opts={[[0, 'None'], [1, 'Some'], [2, 'Substantial']]} /></Field>
		<Field label="Income / yr" help={FIELD_HELP.income}><NumInput bind:value={f.income.value} /></Field>
		<Field label="Net worth" help={FIELD_HELP.netWorth}><NumInput bind:value={f.netWorth.value} /></Field>
		<Field label="Total debt" help={FIELD_HELP.debt}><NumInput bind:value={f.debt.value} /></Field>
		<Field label="Education" help={FIELD_HELP.education}><SelectInput bind:value={f.education.value} opts={[['none', 'No diploma'], ['hs', 'High school'], ['some', 'Some college'], ['bachelor', "Bachelor's"], ['graduate', 'Graduate']]} /></Field>
		<Field label="Smoker" help={FIELD_HELP.smoker}><SelectInput bind:value={f.smoker.value} opts={[['never', 'Never'], ['former', 'Former'], ['current', 'Current']]} /></Field>
	</div>

	<button class="mt-3 text-[11px]" style:font-family="var(--font-mono)" style:color="var(--ink-dim)" onclick={() => (expanded = !expanded)}>
		{expanded ? '− less detail' : '+ add detail (23 more inputs — each one feeds a cited rule)'}
	</button>

	{#if expanded}
		<div class="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-3 sm:grid-cols-3" style:border-color="var(--line)">
			<Field label="Sex (actuarial)" help={FIELD_HELP.sex}><SelectInput bind:value={f.sex.value} opts={[['f', 'Female'], ['m', 'Male']]} /></Field>
			<Field label="Parent has degree" help={FIELD_HELP.parentsDegree}><Toggle bind:value={f.parentsDegree.value} /></Field>
			<Field label="Grew up in" help={FIELD_HELP.neighborhood}><SelectInput bind:value={f.neighborhood.value} opts={[[0, 'Low-opportunity area'], [1, 'Average area'], [2, 'High-opportunity area']]} /></Field>
			<Field label="Exercise min/wk" help={FIELD_HELP.exerciseMins}><NumInput bind:value={f.exerciseMins.value} step={15} prefix="" /></Field>
			<Field label="Alcohol" help={FIELD_HELP.alcohol}><SelectInput bind:value={f.alcohol.value} opts={[['none', 'None'], ['moderate', 'Moderate'], ['heavy', 'Heavy']]} /></Field>
			<Field label="Sleep hrs/night" help={FIELD_HELP.sleepHours}><NumInput bind:value={f.sleepHours.value} step={1} prefix="" /></Field>
			<Field label="Health insured" help={FIELD_HELP.insured}><Toggle bind:value={f.insured.value} /></Field>
			<Field label="BMI band" help={FIELD_HELP.bmiBand}><SelectInput bind:value={f.bmiBand.value} opts={[['under', 'Underweight'], ['normal', 'Normal'], ['over', 'Overweight'], ['obese', 'Obese']]} /></Field>
			<Field label="Late payments 24mo" help={FIELD_HELP.latePayments}><SelectInput bind:value={f.latePayments.value} opts={[[0, 'None'], [1, 'One'], [2, 'Multiple']]} /></Field>
			<Field label="Credit util %" help={FIELD_HELP.creditUtil}><NumInput bind:value={f.creditUtil.value} step={5} prefix="" suffix="%" /></Field>
			<Field label="Emergency fund (months)" help={FIELD_HELP.emergencyMonths}><NumInput bind:value={f.emergencyMonths.value} step={1} prefix="" /></Field>
			<Field label="Homeowner" help={FIELD_HELP.homeowner}><Toggle bind:value={f.homeowner.value} /></Field>
			<Field label="Employment" help={FIELD_HELP.employment}><SelectInput bind:value={f.employment.value} opts={[['employed', 'Employed'], ['self', 'Self-employed'], ['student', 'Student'], ['retired', 'Retired'], ['unemployed', 'Unemployed']]} /></Field>
			<Field label="Field outlook" help={FIELD_HELP.outlook}><SelectInput bind:value={f.outlook.value} opts={[['declining', 'Declining'], ['stable', 'Stable'], ['growing', 'Growing']]} /></Field>
			<Field label="See close people" help={FIELD_HELP.socialConnection}><SelectInput bind:value={f.socialConnection.value} opts={[[0, 'Rarely'], [1, 'Sometimes'], [2, 'Regularly']]} /></Field>
			<Field label="Partnered" help={FIELD_HELP.partnered}><Toggle bind:value={f.partnered.value} /></Field>
			<Field label="Volunteers" help={FIELD_HELP.volunteers}><Toggle bind:value={f.volunteers.value} /></Field>
			<Field label="Driving incidents 3y" help={FIELD_HELP.drivingIncidents}><NumInput bind:value={f.drivingIncidents.value} step={1} prefix="" /></Field>
			{#if packs.has('speculative')}
			<Field label="Public footprint" help={FIELD_HELP.digitalFootprint}><SelectInput bind:value={f.digitalFootprint.value} opts={[[0, 'Screens badly'], [1, 'Neutral'], [2, 'Curated']]} /></Field>
			{/if}
			<Field label="Housing" help={FIELD_HELP.housing}><SelectInput bind:value={f.housing.value} opts={[['stable', 'Stable'], ['insecure', 'Insecure'], ['unhoused', 'Unhoused']]} /></Field>
			<Field label="Banking" help={FIELD_HELP.banking}><SelectInput bind:value={f.banking.value} opts={[['banked', 'Banked'], ['underbanked', 'Underbanked'], ['unbanked', 'Unbanked']]} /></Field>
			<Field label="Criminal record" help={FIELD_HELP.criminalRecord}><Toggle bind:value={f.criminalRecord.value} /></Field>
			{#if packs.has('speculative')}
			<Field label="Registered to vote" help={FIELD_HELP.voterRegistered}><Toggle bind:value={f.voterRegistered.value} /></Field>
			{/if}
		</div>
	{/if}

	{#if packs.has('foundations')}
		<div class="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-3 sm:grid-cols-3" style:border-color="var(--line)">
			<Field label="Clean water" help={FIELD_HELP.wash}><SelectInput bind:value={f.wash.value} opts={[['safe', 'Safe water + sanitation'], ['basic', 'Basic'], ['none', 'Unsafe / none']]} /></Field>
			<Field label="Electricity + internet" help={FIELD_HELP.infrastructure}><SelectInput bind:value={f.infrastructure.value} opts={[['both', 'Both'], ['electricity', 'Electricity only'], ['neither', 'Neither']]} /></Field>
			<Field label="Food security" help={FIELD_HELP.foodSecurity}><SelectInput bind:value={f.foodSecurity.value} opts={[['secure', 'Secure'], ['marginal', 'Marginal'], ['insecure', 'Insecure']]} /></Field>
			<Field label="Peace + rule of law" help={FIELD_HELP.stability}><SelectInput bind:value={f.stability.value} opts={[['stable', 'Stable'], ['fragile', 'Fragile'], ['conflict', 'Active conflict']]} /></Field>
		</div>
	{/if}
</div>
