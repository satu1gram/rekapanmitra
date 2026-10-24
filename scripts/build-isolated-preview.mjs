import { spawnSync } from 'node:child_process';
import { copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const outputDirectory = process.argv.includes('--cloudflare') ? 'dist' : 'preview-dist';
const outputPath = fileURLToPath(new URL(`../${outputDirectory}/`, import.meta.url));
const result = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--config', 'vite.preview.config.ts', '--outDir', outputPath], {
  cwd: root, stdio: 'inherit',
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
for (const name of ['_headers', '_redirects']) {
  copyFileSync(new URL(`../preview/${name}`, import.meta.url), new URL(`../${outputDirectory}/${name}`, import.meta.url));
}
console.log(`Standalone preview ready in ${outputDirectory}/ (no production backend).`);
