<script lang="ts">
	let { value = $bindable(), onLabel = 'Yes', offLabel = 'No' }: { value: boolean; onLabel?: string; offLabel?: string } = $props();
</script>

<button
	type="button"
	class="text-left text-[0.875rem]"
	style:color={value ? 'var(--moves)' : 'var(--ink-dim)'}
	onclick={() => (value = !value)}
>{value ? onLabel : offLabel} ▸</button>
