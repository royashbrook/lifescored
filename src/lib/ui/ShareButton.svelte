<script lang="ts">
	import { encodeProfile, type Profile } from '$lib/share/codec';
	import { renderScoreCard } from '$lib/share/scorecard';
	import type { ScoreResult } from '$lib/engine/score';

	let {
		profile,
		composite,
		result
	}: { profile: Profile; composite: number; result: ScoreResult } = $props();

	// idle → a flash state → back to idle. `failed` shows the manual-copy input.
	let flashState = $state<'idle' | 'score-copied' | 'data-copied'>('idle');
	let failedText = $state('');
	let showData = $state(false);
	let dataUrl = $state('');
	// The branded PNG card, rendered on-device. Precomputed so the share/download click runs
	// synchronously — an await between click and navigator.share drops user activation (Safari).
	let cardFile = $state<File | null>(null);

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

	// Precompute the score-card PNG whenever the result changes (cheap flat-colour draw), so a
	// share/download click has the File ready synchronously.
	$effect(() => {
		const snapshot = result;
		let cancelled = false;
		renderScoreCard(snapshot)
			.then((blob) => {
				if (!cancelled) cardFile = new File([blob], 'life-scored.png', { type: 'image/png' });
			})
			.catch(() => {});
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
		// Prefer sharing the branded card image — it carries the number AND the brand as a visual,
		// generated entirely on-device (nothing sent anywhere). The image rides with the text.
		if (cardFile && navigator.canShare?.({ files: [cardFile] })) {
			navigator.share({ files: [cardFile], text: scoreText }).then(
				() => {},
				(e: DOMException) => {
					if (e?.name !== 'AbortError') copy(scoreText, 'score-copied');
				}
			);
			return;
		}
		// No file-share support (most desktop browsers): share/copy the score as TEXT only — no
		// `url`, since most targets drop the text when a link is present, so the number wouldn't travel.
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

	function downloadCard() {
		if (!cardFile) return;
		const url = URL.createObjectURL(cardFile);
		const a = document.createElement('a');
		a.href = url;
		a.download = cardFile.name;
		a.click();
		// Defer revoke — revoking immediately can abort the download before the browser reads the blob.
		setTimeout(() => URL.revokeObjectURL(url), 10000);
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
		class="rounded-full border px-3 py-1 text-[0.75rem]"
		style:font-family="var(--font-mono)"
		style:color={flashState === 'score-copied' ? 'var(--sourced)' : 'var(--ink-dim)'}
		style:border-color="var(--line)"
		onclick={shareScore}
	>{flashState === 'score-copied' ? 'copied ✓ — just the number' : 'share my score'}</button>

	<button
		class="text-[0.6875rem] underline"
		style:font-family="var(--font-mono)"
		style:color="var(--ink-dim)"
		disabled={!cardFile}
		onclick={downloadCard}
	>download score card ↓</button>

	<button
		class="text-[0.6875rem] underline"
		style:font-family="var(--font-mono)"
		style:color="var(--ink-dim)"
		onclick={() => (showData = !showData)}
	>{showData ? 'never mind' : 'or share my exact answers →'}</button>

	{#if showData}
		<div class="flex max-w-[18.75rem] flex-col items-end gap-1.5 text-right">
			<span class="text-[0.6875rem] leading-snug" style:color="var(--spec)">
				This is different from the score. It puts the exact answers you typed — income, assets, debt, all of
				them — right into the link, encoded. Nothing is sent to a server, but whoever opens the link can read
				every answer back out of it. Only send it to someone you'd show these numbers to.
			</span>
			<button
				class="rounded-full border px-3 py-1 text-[0.75rem]"
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
			class="w-full max-w-[26.25rem] rounded border px-2 py-1 text-[0.6875rem]"
			style:font-family="var(--font-mono)"
			style:background="var(--panel)"
			style:color="var(--ink)"
			style:border-color="var(--line)"
			aria-label="Copy this text"
		/>
		<span class="text-[0.6875rem]" style:color="var(--spec)">couldn't reach the clipboard — copy the text above</span>
	{/if}
</div>
