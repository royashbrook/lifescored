<script lang="ts">
	import { encodeProfile, type Profile } from '$lib/share/codec';

	let {
		profile,
		composite
	}: { profile: Profile; composite: number } = $props();

	let copied = $state(false);
	let failed = $state(false);
	let shareUrl = $state('');

	// Precompute the link so the click handler can call share/clipboard synchronously —
	// an await between the user's click and the API call drops user activation (Safari rejects it).
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

	function flash(which: 'copied' | 'failed') {
		copied = which === 'copied';
		failed = which === 'failed';
		setTimeout(() => {
			copied = false;
			if (which === 'copied') failed = false;
		}, 2000);
	}

	function copyFallback() {
		navigator.clipboard.writeText(shareUrl).then(
			() => flash('copied'),
			() => (failed = true)
		);
	}

	function share() {
		if (!shareUrl) return;
		const text = `My life, scored: ${Math.round(composite).toLocaleString('en-US')}`;
		const data: ShareData = { title: 'life. scored.', text, url: shareUrl };
		if (navigator.share) {
			navigator.share(data).then(
				() => {},
				(e: DOMException) => {
					if (e?.name !== 'AbortError') copyFallback();
				}
			);
		} else {
			copyFallback();
		}
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
	>{copied ? 'shared ✓' : 'share — inputs travel in the link, not to a server'}</button>

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
