import { readFile, writeFile } from 'node:fs/promises';

// The adapter owns this entrypoint; add the DO export after it generates the SvelteKit handler.
const file = new URL('../.svelte-kit/cloudflare/_worker.js', import.meta.url);
const entry = await readFile(file, 'utf8');
const extra = '\nexport { NarrativeBudget } from "../../worker/budget.js";\n';
if (!entry.includes(extra.trim())) await writeFile(file, entry + extra);
