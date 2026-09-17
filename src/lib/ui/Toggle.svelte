<script lang="ts">
	import { getContext } from 'svelte';
	const field = getContext<{ id: string; labelId: string }>('field');
	let { value = $bindable(), onLabel = 'Yes', offLabel = 'No' }: { value: boolean; onLabel?: string; offLabel?: string } = $props();
</script>

<button
	id={field?.id}
	aria-labelledby={field?.labelId}
	role="switch"
	aria-checked={value}
	type="button"
	class="text-left text-[0.875rem]"
	style:color={value ? 'var(--moves)' : 'var(--ink-dim)'}
	onclick={() => (value = !value)}
>{value ? onLabel : offLabel} ▸</button>
