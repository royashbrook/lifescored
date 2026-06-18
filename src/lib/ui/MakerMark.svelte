<script lang="ts">
	// Roy's maker's mark — a reusable colophon for sites he builds. No props; the links are his,
	// so this drops into any repo as-is. Colors use the host's CSS vars with literal fallbacks, so
	// it looks right here and degrades gracefully elsewhere. The heart is an inline SVG (filled,
	// no icon-font or emoji dependency).
</script>

<div
	class="text-center"
	style:font-family="var(--font-mono, ui-monospace, monospace)"
	style:color="var(--ink-dim, #8b8f99)"
>
	made with <svg
		aria-hidden="true"
		viewBox="0 0 24 24"
		class="inline-block"
		style="width:.85em;height:.85em;fill:#e0746a;vertical-align:-.1em"
	><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg><span
		class="sr-only">love</span>
	by
	<a href="https://royashbrook.com" target="_blank" rel="noreferrer" class="underline" style:color="var(--ink, #e7e4dc)">roy</a>
	+
	<a href="https://royashbrook.com/agents" target="_blank" rel="noreferrer" class="underline" style:color="var(--ink, #e7e4dc)">ai</a>
	<span aria-hidden="true" style:opacity="0.45">·</span>
	<a href="https://github.com/sponsors/royashbrook" target="_blank" rel="noreferrer" class="underline" style:color="var(--moves, #d9a441)">sponsor me</a>
</div>
