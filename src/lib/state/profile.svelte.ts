import { sanitizeOverrides, sanitizePacks, type Profile } from '../share/codec';
import { DEFAULT_INPUTS, migrateLegacyInputs } from '../rulebook';

const KEY = 'lifescore:profile';

export function loadStoredProfile(storage: Storage | null): Profile {
	const fresh: Profile = { inputs: { ...DEFAULT_INPUTS }, overrides: {}, packs: {} };
	if (!storage) return fresh;
	try {
		const raw = storage.getItem(KEY);
		if (!raw) return fresh;
		const parsed = JSON.parse(raw) as Partial<Profile>;
		const migrated = migrateLegacyInputs((parsed.inputs ?? {}) as Record<string, unknown>);
		return {
			inputs: { ...DEFAULT_INPUTS, ...migrated } as Profile['inputs'],
			overrides: sanitizeOverrides(parsed.overrides),
			packs: sanitizePacks((parsed as { packs?: unknown }).packs)
		};
	} catch {
		return fresh;
	}
}

export function storeProfile(storage: Storage | null, profile: Profile): void {
	try {
		storage?.setItem(KEY, JSON.stringify(profile));
	} catch {
		// storage unavailable (private mode, quota) — app stays in-memory
	}
}

/** Svelte 5 runes store. Instantiate once in the layout; pass via context or import. */
export function createProfileState(initial: Profile) {
	let inputs = $state(initial.inputs);
	let overrides = $state(initial.overrides);
	let packs = $state(initial.packs ?? {});
	return {
		get inputs() { return inputs; },
		get overrides() { return overrides; },
		get packs() { return packs; },
		setInput<K extends keyof Profile['inputs']>(key: K, value: Profile['inputs'][K]) {
			inputs = { ...inputs, [key]: value };
		},
		setInputs(next: Profile['inputs']) {
			inputs = { ...next };
		},
		setOverride(ruleId: string, patch: { weight?: number; enabled?: boolean }) {
			overrides = { ...overrides, [ruleId]: { ...overrides[ruleId], ...patch } };
		},
		resetOverrides() { overrides = {}; },
		setPack(id: string, on: boolean) { packs = { ...packs, [id]: on }; },
		replace(profile: Profile) { inputs = profile.inputs; overrides = profile.overrides; packs = profile.packs ?? {}; },
		snapshot(): Profile { return { inputs, overrides, packs }; }
	};
}

export function activePacks(profile: { packs: Record<string, boolean> }): Set<string> {
	return new Set(['core', ...Object.entries(profile.packs).filter(([, on]) => on).map(([id]) => id)]);
}
