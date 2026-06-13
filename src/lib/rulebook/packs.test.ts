import { describe, expect, it } from 'vitest';
import { RULES } from './index';
import { PACKS, TOGGLEABLE_PACKS } from './packs';

describe('packs', () => {
	it('every rule has a pack that exists in PACKS', () => {
		for (const r of RULES) expect(PACKS[r.pack], r.id).toBeDefined();
	});
	it('only digital and voting are speculative; foundations rules are pack foundations; rest are core', () => {
		const speculative = RULES.filter((r) => r.pack === 'speculative').map((r) => r.id).sort();
		expect(speculative).toEqual(['digital', 'voting']);
		const foundations = RULES.filter((r) => r.pack === 'foundations').map((r) => r.id).sort();
		expect(foundations).toEqual(['food-security', 'peace-rule-of-law', 'utilities', 'water-sanitation']);
		expect(RULES.filter((r) => r.pack === 'core').length).toBe(RULES.length - 2 - 4);
	});
	it('core is always-on and not user-toggleable; foundations/speculative are opt-in toggles', () => {
		expect(PACKS.core.defaultOn).toBe(true);
		expect(PACKS.core.toggleable).toBe(false);
		expect(PACKS.foundations.defaultOn).toBe(false);
		expect(PACKS.foundations.toggleable).toBe(true);
		expect(TOGGLEABLE_PACKS).toContain('foundations');
		expect(TOGGLEABLE_PACKS).toContain('speculative');
		expect(TOGGLEABLE_PACKS).not.toContain('core');
		expect(TOGGLEABLE_PACKS).not.toContain('underwriting');
	});
});
