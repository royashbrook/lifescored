import { describe, expect, it } from 'vitest';
import { DEFAULT_INPUTS } from '../rulebook';
import { loadStoredProfile, storeProfile } from './profile.svelte';

function memStorage(): Storage {
	const m = new Map<string, string>();
	return {
		getItem: (k) => m.get(k) ?? null,
		setItem: (k, v) => void m.set(k, v),
		removeItem: (k) => void m.delete(k),
		clear: () => m.clear(),
		key: () => null,
		get length() { return m.size; }
	} as Storage;
}

describe('profile persistence', () => {
	it('round-trips through storage', () => {
		const s = memStorage();
		const profile = { inputs: { ...DEFAULT_INPUTS, age: 44 }, overrides: { bmi: { enabled: false } } };
		storeProfile(s, profile);
		expect(loadStoredProfile(s)).toEqual(profile);
	});

	it('returns defaults for missing or corrupt storage', () => {
		const s = memStorage();
		expect(loadStoredProfile(s)).toEqual({ inputs: DEFAULT_INPUTS, overrides: {} });
		s.setItem('lifescore:profile', '{corrupt');
		expect(loadStoredProfile(s)).toEqual({ inputs: DEFAULT_INPUTS, overrides: {} });
	});

	it('merges stored inputs over defaults so new fields get default values', () => {
		const s = memStorage();
		s.setItem('lifescore:profile', JSON.stringify({ inputs: { age: 50 }, overrides: {} }));
		const p = loadStoredProfile(s);
		expect(p.inputs.age).toBe(50);
		expect(p.inputs.country).toBe(DEFAULT_INPUTS.country);
	});
});
