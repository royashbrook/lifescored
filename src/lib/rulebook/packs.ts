import type { PackId } from './types';
export interface PackMeta { label: string; blurb: string; defaultOn: boolean; toggleable: boolean; }
export const PACKS: Record<PackId, PackMeta> = {
	core: { label: 'Core', blurb: 'The default set — concrete, cited, and surveillance-free.', defaultOn: true, toggleable: false },
	foundations: { label: 'Foundations', blurb: 'The floor you were handed — water, power, food, peace. You were born ahead of most of human history.', defaultOn: false, toggleable: true },
	underwriting: { label: 'Underwriting', blurb: 'How a life insurer prices you. (Coming soon.)', defaultOn: false, toggleable: true },
	speculative: { label: 'Speculative', blurb: 'Flagged guesses — real signals, but no clean per-person dataset.', defaultOn: false, toggleable: true }
};
export const TOGGLEABLE_PACKS = (Object.keys(PACKS) as PackId[]).filter((id) => PACKS[id].toggleable && PACKS[id].label && id !== 'underwriting');
