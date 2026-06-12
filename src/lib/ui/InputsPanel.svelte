<script lang="ts">
	import { COUNTRIES } from '$lib/rulebook';
	import type { createProfileState } from '$lib/state/profile.svelte';
	import Field from './Field.svelte';
	import NumInput from './NumInput.svelte';
	import SelectInput from './SelectInput.svelte';
	import Toggle from './Toggle.svelte';

	let { profile }: { profile: ReturnType<typeof createProfileState> } = $props();
	let expanded = $state(false);

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
		voterRegistered: field('voterRegistered')
	};
</script>

<div class="mb-5 rounded-lg p-3.5" style:background="var(--panel)" style:border="1px solid var(--line)">
	<div class="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
		<Field label="Country"><SelectInput bind:value={f.country.value} opts={countryOpts} /></Field>
		<Field label="Age"><NumInput bind:value={f.age.value} step={1} prefix="" /></Field>
		<Field label="Family support"><SelectInput bind:value={f.familySupport.value} opts={[[0, 'None'], [1, 'Some'], [2, 'Substantial']]} /></Field>
		<Field label="Income / yr"><NumInput bind:value={f.income.value} /></Field>
		<Field label="Net worth"><NumInput bind:value={f.netWorth.value} /></Field>
		<Field label="Total debt"><NumInput bind:value={f.debt.value} /></Field>
		<Field label="Education"><SelectInput bind:value={f.education.value} opts={[['none', 'No diploma'], ['hs', 'High school'], ['some', 'Some college'], ['bachelor', "Bachelor's"], ['graduate', 'Graduate']]} /></Field>
		<Field label="Smoker"><SelectInput bind:value={f.smoker.value} opts={[['never', 'Never'], ['former', 'Former'], ['current', 'Current']]} /></Field>
	</div>

	<button class="mt-3 text-[11px]" style:font-family="var(--font-mono)" style:color="var(--ink-dim)" onclick={() => (expanded = !expanded)}>
		{expanded ? '− less detail' : '+ add detail (23 more inputs — each one feeds a cited rule)'}
	</button>

	{#if expanded}
		<div class="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-3 sm:grid-cols-3" style:border-color="var(--line)">
			<Field label="Sex (actuarial)"><SelectInput bind:value={f.sex.value} opts={[['f', 'Female'], ['m', 'Male']]} /></Field>
			<Field label="Parent has degree"><Toggle bind:value={f.parentsDegree.value} /></Field>
			<Field label="Grew up in"><SelectInput bind:value={f.neighborhood.value} opts={[[0, 'Low-opportunity area'], [1, 'Average area'], [2, 'High-opportunity area']]} /></Field>
			<Field label="Exercise min/wk"><NumInput bind:value={f.exerciseMins.value} step={15} prefix="" /></Field>
			<Field label="Alcohol"><SelectInput bind:value={f.alcohol.value} opts={[['none', 'None'], ['moderate', 'Moderate'], ['heavy', 'Heavy']]} /></Field>
			<Field label="Sleep hrs/night"><NumInput bind:value={f.sleepHours.value} step={1} prefix="" /></Field>
			<Field label="Health insured"><Toggle bind:value={f.insured.value} /></Field>
			<Field label="BMI band"><SelectInput bind:value={f.bmiBand.value} opts={[['under', 'Underweight'], ['normal', 'Normal'], ['over', 'Overweight'], ['obese', 'Obese']]} /></Field>
			<Field label="Late payments 24mo"><SelectInput bind:value={f.latePayments.value} opts={[[0, 'None'], [1, 'One'], [2, 'Multiple']]} /></Field>
			<Field label="Credit util %"><NumInput bind:value={f.creditUtil.value} step={5} prefix="" suffix="%" /></Field>
			<Field label="Emergency fund (months)"><NumInput bind:value={f.emergencyMonths.value} step={1} prefix="" /></Field>
			<Field label="Homeowner"><Toggle bind:value={f.homeowner.value} /></Field>
			<Field label="Employment"><SelectInput bind:value={f.employment.value} opts={[['employed', 'Employed'], ['self', 'Self-employed'], ['student', 'Student'], ['retired', 'Retired'], ['unemployed', 'Unemployed']]} /></Field>
			<Field label="Field outlook"><SelectInput bind:value={f.outlook.value} opts={[['declining', 'Declining'], ['stable', 'Stable'], ['growing', 'Growing']]} /></Field>
			<Field label="See close people"><SelectInput bind:value={f.socialConnection.value} opts={[[0, 'Rarely'], [1, 'Sometimes'], [2, 'Regularly']]} /></Field>
			<Field label="Partnered"><Toggle bind:value={f.partnered.value} /></Field>
			<Field label="Volunteers"><Toggle bind:value={f.volunteers.value} /></Field>
			<Field label="Driving incidents 3y"><NumInput bind:value={f.drivingIncidents.value} step={1} prefix="" /></Field>
			<Field label="Public footprint"><SelectInput bind:value={f.digitalFootprint.value} opts={[[0, 'Screens badly'], [1, 'Neutral'], [2, 'Curated']]} /></Field>
			<Field label="Housing"><SelectInput bind:value={f.housing.value} opts={[['stable', 'Stable'], ['insecure', 'Insecure'], ['unhoused', 'Unhoused']]} /></Field>
			<Field label="Banking"><SelectInput bind:value={f.banking.value} opts={[['banked', 'Banked'], ['underbanked', 'Underbanked'], ['unbanked', 'Unbanked']]} /></Field>
			<Field label="Criminal record"><Toggle bind:value={f.criminalRecord.value} /></Field>
			<Field label="Registered to vote"><Toggle bind:value={f.voterRegistered.value} /></Field>
		</div>
	{/if}
</div>
