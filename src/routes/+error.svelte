<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head><title>{page.status} · life. scored.</title></svelte:head>

<div class="mt-16 text-center">
	<div class="text-[40px] font-semibold" style:font-family="var(--font-display)">{page.status}</div>
	<p class="mt-2 text-[15px]" style:color="var(--ink-dim)">that page doesn't score.</p>
	<a href="/" class="mt-4 inline-block rounded-full border px-4 py-1.5 text-[13px]" style:font-family="var(--font-mono)" style:border-color="var(--line)" style:color="var(--ink)">back to the rulebook</a>
</div>
