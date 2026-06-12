// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env: {
				NARRATIVE_KV: {
					get(key: string): Promise<string | null>;
					put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
				};
				GEMINI_API_KEY?: string;
			};
		}
	}
}

export {};
