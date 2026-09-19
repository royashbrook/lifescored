import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

test('publisher install stops before extraction on a corrupt archive or failed download', () => {
  const workflow = readFileSync(new URL('../.github/workflows/publish-mcp.yml', import.meta.url), 'utf8');
  const block = workflow.match(/- name: Install mcp-publisher\n +run: \|\n((?: {10}.+\n)+)/)?.[1];
  assert.ok(block, 'find the actual workflow install step');
  const script = block.split('\n').map(line => line.slice(10)).join('\n');
  for (const curl of ['printf tampered > mcp-publisher.tar.gz', 'exit 22']) {
    const dir = mkdtempSync(join(tmpdir(), 'publisher-test-'));
    try {
      writeFileSync(join(dir, 'curl'), '#!/bin/sh\n' + curl + '\n', { mode: 0o755 });
      writeFileSync(join(dir, 'tar'), '#!/bin/sh\ntouch extracted\n', { mode: 0o755 });
      const result = spawnSync('bash', ['-e', '-o', 'pipefail', '-c', script], { cwd: dir, env: { ...process.env, PATH: dir + ':' + process.env.PATH }, encoding: 'utf8' });
      assert.notEqual(result.status, 0);
      assert.equal(existsSync(join(dir, 'extracted')), false);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  }
});
