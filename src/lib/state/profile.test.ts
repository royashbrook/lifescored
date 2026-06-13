import { describe, expect, it } from 'vitest';
import { DEFAULT_INPUTS } from '../rulebook';
import { activePacks, loadStoredProfile, storeProfile } from './profile.svelte';

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
		const profile = { inputs: { ...DEFAULT_INPUTS, age: 44 }, overrides: { bmi: { enabled: false } }, packs: {} };
		storeProfile(s, profile);
		expect(loadStoredProfile(s)).toEqual(profile);
	});

	it('returns defaults for missing or corrupt storage', () => {
		const s = memStorage();
		expect(loadStoredProfile(s)).toEqual({ inputs: DEFAULT_INPUTS, overrides: {}, packs: {} });
		s.setItem('lifescore:profile', '{corrupt');
		expect(loadStoredProfile(s)).toEqual({ inputs: DEFAULT_INPUTS, overrides: {}, packs: {} });
	});

	it('merges stored inputs over defaults so new fields get default values', () => {
		const s = memStorage();
		s.setItem('lifescore:profile', JSON.stringify({ inputs: { age: 50 }, overrides: {} }));
		const p = loadStoredProfile(s);
		expect(p.inputs.age).toBe(50);
		expect(p.inputs.country).toBe(DEFAULT_INPUTS.country);
	});

	it('migrates legacy stored profiles: degree maps to education', () => {
		const s = memStorage();
		s.setItem('lifescore:profile', JSON.stringify({ inputs: { degree: true }, overrides: {} }));
		expect(loadStoredProfile(s).inputs.education).toBe('bachelor');
	});

	it('sanitizes corrupt stored overrides', () => {
		const s = memStorage();
		s.setItem('lifescore:profile', JSON.stringify({ inputs: {}, overrides: { country: { weight: 'abc' }, dti: { enabled: false } } }));
		const p = loadStoredProfile(s);
		expect(p.overrides.country).toBeUndefined();
		expect(p.overrides.dti).toEqual({ enabled: false });
	});

	it('round-trips enabled packs and defaults missing packs to empty', () => {
		const s = memStorage();
		s.setItem('lifescore:profile', JSON.stringify({ inputs: {}, overrides: {}, packs: { foundations: true } }));
		expect(loadStoredProfile(s).packs).toEqual({ foundations: true });
		const s2 = memStorage();
		s2.setItem('lifescore:profile', JSON.stringify({ inputs: {}, overrides: {} }));
		expect(loadStoredProfile(s2).packs).toEqual({});
	});

	it('activePacks always includes core plus enabled packs', () => {
		expect([...activePacks({ packs: {} })]).toEqual(['core']);
		expect(new Set([...activePacks({ packs: { foundations: true, speculative: false } })])).toEqual(new Set(['core', 'foundations']));
	});
});
