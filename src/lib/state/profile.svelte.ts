import type { Profile } from '../share/codec';
import { DEFAULT_INPUTS, migrateLegacyInputs } from '../rulebook';

const KEY = 'lifescore:profile';

export function loadStoredProfile(storage: Storage | null): Profile {
	const fresh: Profile = { inputs: { ...DEFAULT_INPUTS }, overrides: {} };
	if (!storage) return fresh;
	try {
		const raw = storage.getItem(KEY);
		if (!raw) return fresh;
		const parsed = JSON.parse(raw) as Partial<Profile>;
		const migrated = migrateLegacyInputs((parsed.inputs ?? {}) as Record<string, unknown>);
		return {
			inputs: { ...DEFAULT_INPUTS, ...migrated } as Profile['inputs'],
			overrides: parsed.overrides ?? {}
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
	return {
		get inputs() { return inputs; },
		get overrides() { return overrides; },
		setInput<K extends keyof Profile['inputs']>(key: K, value: Profile['inputs'][K]) {
			inputs = { ...inputs, [key]: value };
		},
		setOverride(ruleId: string, patch: { weight?: number; enabled?: boolean }) {
			overrides = { ...overrides, [ruleId]: { ...overrides[ruleId], ...patch } };
		},
		resetOverrides() { overrides = {}; },
		replace(profile: Profile) { inputs = profile.inputs; overrides = profile.overrides; },
		snapshot(): Profile { return { inputs, overrides }; }
	};
}
