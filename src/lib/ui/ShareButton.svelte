<script lang="ts">
	import { encodeProfile, type Profile } from '$lib/share/codec';

	let { profile }: { profile: Profile } = $props();
	let copied = $state(false);

	async function share() {
		const encoded = await encodeProfile(profile);
		const url = `${location.origin}/#p=${encoded}`;
		await navigator.clipboard.writeText(url);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<button
	class="rounded-full border px-3 py-1 text-[11px]"
	style:font-family="var(--font-mono)"
	style:color={copied ? 'var(--sourced)' : 'var(--ink-dim)'}
	style:border-color="var(--line)"
	onclick={share}
>{copied ? 'link copied ✓' : 'share — inputs travel in the link, not to a server'}</button>
