<script lang="ts">
	import { encodeProfile, type Profile } from '$lib/share/codec';

	let { profile }: { profile: Profile } = $props();
	let copied = $state(false);
	let failed = $state(false);
	let shareUrl = $state('');

	// Precompute the link whenever the profile changes. The click handler must call
	// clipboard.writeText synchronously — an `await` between the user's click and the
	// clipboard call drops transient user activation (Safari/WebKit reject it), which
	// is why an await-then-copy pattern silently fails. encodeProfile is async (it uses
	// CompressionStream), so we do it ahead of time, not in the gesture.
	$effect(() => {
		const snapshot = profile;
		let cancelled = false;
		encodeProfile(snapshot).then((encoded) => {
			if (!cancelled) shareUrl = `${location.origin}/#p=${encoded}`;
		});
		return () => {
			cancelled = true;
		};
	});

	function share() {
		if (!shareUrl) return;
		// Called synchronously in the gesture — no preceding await — so activation holds.
		navigator.clipboard.writeText(shareUrl).then(
			() => {
				copied = true;
				failed = false;
				setTimeout(() => (copied = false), 2000);
			},
			() => {
				// Clipboard blocked (older browser, embedded webview, denied permission):
				// fall back to revealing the link for manual copy.
				failed = true;
			}
		);
	}

	function selectAll(e: Event) {
		(e.currentTarget as HTMLInputElement).select();
	}
</script>

<div class="flex flex-col items-end gap-1.5">
	<button
		class="rounded-full border px-3 py-1 text-[11px]"
		style:font-family="var(--font-mono)"
		style:color={copied ? 'var(--sourced)' : 'var(--ink-dim)'}
		style:border-color="var(--line)"
		disabled={!shareUrl}
		onclick={share}
	>{copied ? 'link copied ✓' : 'share — inputs travel in the link, not to a server'}</button>

	{#if failed}
		<input
			readonly
			value={shareUrl}
			onfocus={selectAll}
			onclick={selectAll}
			class="w-full max-w-[420px] rounded border px-2 py-1 text-[10px]"
			style:font-family="var(--font-mono)"
			style:background="var(--panel)"
			style:color="var(--ink)"
			style:border-color="var(--line)"
			aria-label="Shareable link — select and copy"
		/>
		<span class="text-[10px]" style:color="var(--spec)">couldn't reach the clipboard — copy the link above</span>
	{/if}
</div>
