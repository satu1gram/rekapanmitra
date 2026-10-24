import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { verifyPreviewOutput } from './lib/verify-preview-output.mjs';

function fixture(run) {
  const directory = mkdtempSync(path.join(tmpdir(), 'preview-output-'));
  try { run(directory); } finally { rmSync(directory, { recursive: true, force: true }); }
}

test('rejects raw TSX HTML entry that causes the Cloudflare MIME error', () => fixture(directory => {
  writeFileSync(path.join(directory, 'index.html'), '<script type="module" src="./main.tsx"></script>');
  assert.throws(() => verifyPreviewOutput(directory), /compiled assets/);
}));

test('accepts compiled preview with an existing JavaScript asset', () => fixture(directory => {
  mkdirSync(path.join(directory, 'assets'));
  writeFileSync(path.join(directory, 'index.html'), '<script type="module" crossorigin src="/assets/index-123.js"></script>');
  writeFileSync(path.join(directory, 'assets/index-123.js'), 'console.log("demo");');
  assert.doesNotThrow(() => verifyPreviewOutput(directory));
}));

test('rejects compiled HTML referencing a missing JavaScript asset', () => fixture(directory => {
  writeFileSync(path.join(directory, 'index.html'), '<script type="module" src="/assets/missing.js"></script>');
  assert.throws(() => verifyPreviewOutput(directory));
}));

test('rejects compiled demo carrying a production backend reference', () => fixture(directory => {
  mkdirSync(path.join(directory, 'assets'));
  writeFileSync(path.join(directory, 'index.html'), '<script type="module" src="/assets/index.js"></script>');
  writeFileSync(path.join(directory, 'assets/index.js'), 'fetch("https://example.supabase.co");');
  assert.throws(() => verifyPreviewOutput(directory), /Production backend/);
}));
