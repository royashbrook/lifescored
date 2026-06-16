<script lang="ts">
	let { text, label = 'copy' }: { text: string; label?: string } = $props();
	let copied = $state(false);

	function copy() {
		navigator.clipboard.writeText(text).then(
			() => {
				copied = true;
				setTimeout(() => (copied = false), 1500);
			},
			() => {}
		);
	}
</script>

<button
	type="button"
	onclick={copy}
	class="shrink-0 rounded-full border px-2.5 py-1 text-[0.75rem] transition-colors"
	style:font-family="var(--font-mono)"
	style:color={copied ? 'var(--sourced)' : 'var(--ink-dim)'}
	style:border-color="var(--line)"
>{copied ? 'copied ✓' : label}</button>
