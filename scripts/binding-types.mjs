import { readFile, writeFile } from 'node:fs/promises';

// The adapter's generated entry does not exist on a clean type-check; the class source does.
const file = new URL('../src/worker-configuration.d.ts', import.meta.url);
const types = await readFile(file, 'utf8');
await writeFile(file, types.replaceAll('../.svelte-kit/cloudflare/_worker', '../worker/budget'));
