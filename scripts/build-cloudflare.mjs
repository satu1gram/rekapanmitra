import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const isolatedPreview = process.env.CF_PAGES_BRANCH === 'preview/mobile-ai';
const args = isolatedPreview
  ? ['scripts/build-isolated-preview.mjs', '--cloudflare']
  : ['node_modules/vite/bin/vite.js', 'build'];

console.log(isolatedPreview
  ? 'Building isolated mobile AI demo for Cloudflare preview/mobile-ai → dist/'
  : 'Building the regular web application → dist/');
const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
