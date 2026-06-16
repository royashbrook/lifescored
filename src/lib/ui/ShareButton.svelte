<script lang="ts">
	import { encodeProfile, type Profile } from '$lib/share/codec';

	let {
		profile,
		composite
	}: { profile: Profile; composite: number } = $props();

	// idle → a flash state → back to idle. `failed` shows the manual-copy input.
	let flashState = $state<'idle' | 'score-copied' | 'data-copied'>('idle');
	let failedText = $state('');
	let showData = $state(false);
	let dataUrl = $state('');

	const scoreN = $derived(Math.round(composite).toLocaleString('en-US'));
	// What lands on the clipboard / in the share sheet: the number and the brand, no data.
	const scoreText = $derived(`My life score is ${scoreN} — lifescored.com`);

	// Precompute the data link so the explicit "share my answers" click can run synchronously —
	// an await between the user's click and the clipboard/share call drops user activation (Safari).
	$effect(() => {
		const snapshot = profile;
		let cancelled = false;
		encodeProfile(snapshot).then((encoded) => {
			if (!cancelled) dataUrl = `${location.origin}/#p=${encoded}`;
		});
		return () => {
			cancelled = true;
		};
	});

	function flash(which: 'score-copied' | 'data-copied') {
		flashState = which;
		setTimeout(() => (flashState = 'idle'), 2000);
	}

	function copy(text: string, which: 'score-copied' | 'data-copied') {
		failedText = '';
		navigator.clipboard.writeText(text).then(
			() => flash(which),
			() => (failedText = text)
		);
	}

	function shareScore() {
		// Share the score as TEXT only — no `url`. When a url is present, most share targets
		// surface only the link and drop the text, so the number never travels. The brand
		// (lifescored.com) rides along inside the text instead, as plain words.
		if (navigator.share) {
			navigator.share({ title: 'life. scored.', text: scoreText }).then(
				() => {},
				(e: DOMException) => {
					if (e?.name !== 'AbortError') copy(scoreText, 'score-copied');
				}
			);
		} else {
			copy(scoreText, 'score-copied');
		}
	}

	function shareData() {
		if (!dataUrl) return;
		if (navigator.share) {
			navigator.share({ title: 'life. scored. — my exact answers', text: scoreText, url: dataUrl }).then(
				() => {},
				(e: DOMException) => {
					if (e?.name !== 'AbortError') copy(dataUrl, 'data-copied');
				}
			);
		} else {
			copy(dataUrl, 'data-copied');
		}
	}

	function selectAll(e: Event) {
		(e.currentTarget as HTMLInputElement).select();
	}
</script>

<div class="flex flex-col items-end gap-1.5">
	<button
		class="rounded-full border px-3 py-1 text-[12px]"
		style:font-family="var(--font-mono)"
		style:color={flashState === 'score-copied' ? 'var(--sourced)' : 'var(--ink-dim)'}
		style:border-color="var(--line)"
		onclick={shareScore}
	>{flashState === 'score-copied' ? 'copied ✓ — just the number' : 'share my score'}</button>

	<button
		class="text-[11px] underline"
		style:font-family="var(--font-mono)"
		style:color="var(--ink-dim)"
		onclick={() => (showData = !showData)}
	>{showData ? 'never mind' : 'or share my exact answers →'}</button>

	{#if showData}
		<div class="flex max-w-[300px] flex-col items-end gap-1.5 text-right">
			<span class="text-[11px] leading-snug" style:color="var(--spec)">
				This is different from the score. It puts the exact answers you typed — income, assets, debt, all of
				them — right into the link, encoded. Nothing is sent to a server, but whoever opens the link can read
				every answer back out of it. Only send it to someone you'd show these numbers to.
			</span>
			<button
				class="rounded-full border px-3 py-1 text-[12px]"
				style:font-family="var(--font-mono)"
				style:color={flashState === 'data-copied' ? 'var(--sourced)' : 'var(--moves)'}
				style:border-color="var(--line)"
				disabled={!dataUrl}
				onclick={shareData}
			>{flashState === 'data-copied' ? 'answer link copied ✓' : 'share the full answer link'}</button>
		</div>
	{/if}

	{#if failedText}
		<input
			readonly
			value={failedText}
			onfocus={selectAll}
			onclick={selectAll}
			class="w-full max-w-[420px] rounded border px-2 py-1 text-[11px]"
			style:font-family="var(--font-mono)"
			style:background="var(--panel)"
			style:color="var(--ink)"
			style:border-color="var(--line)"
			aria-label="Copy this text"
		/>
		<span class="text-[11px]" style:color="var(--spec)">couldn't reach the clipboard — copy the text above</span>
	{/if}
</div>
