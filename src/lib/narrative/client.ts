import { quantizeForNarrative } from '../engine/quantize';
import type { ScoreResult } from '../engine/score';
import { composeLocalNarrative } from './local';

export interface Narrative {
	text: string;
	source: 'ai' | 'local';
}

export async function fetchNarrative(result: ScoreResult, fetchFn: typeof fetch = fetch): Promise<Narrative> {
	try {
		const res = await fetchFn('/api/narrative', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(quantizeForNarrative(result))
		});
		if (res.ok) {
			const data = (await res.json()) as { text?: string; fallback?: boolean };
			if (data.text) return { text: data.text, source: 'ai' };
		}
	} catch {
		// fall through to local
	}
	return { text: composeLocalNarrative(result), source: 'local' };
}
