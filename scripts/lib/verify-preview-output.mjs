import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

export function verifyPreviewOutput(directory) {
  const html = readFileSync(path.join(directory, 'index.html'), 'utf8');
  const modules = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/g)].map(match => match[1]);
  if (!modules.length || modules.some(source => !/^\/?assets\/[^?#]+\.js$/.test(source))) {
    throw new Error('Preview must publish compiled assets/*.js, not main.tsx or another source entry. Publish dist/, not preview/.');
  }
  for (const source of modules) {
    if (!statSync(path.join(directory, source.replace(/^\//, ''))).isFile()) {
      throw new Error(`Missing compiled JavaScript asset: ${source}`);
    }
  }
  function scan(folder) {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const file = path.join(folder, entry.name);
      if (entry.isDirectory()) { scan(file); continue; }
      if (/\.(tsx?|jsx|map)$/.test(entry.name)) throw new Error(`Source files must not be published: ${file}`);
      if (/\.(html|js|css)$/.test(entry.name) && /kqoitztjohxjnjoxctoz|sb_publishable_|supabase\.co/.test(readFileSync(file, 'utf8'))) {
        throw new Error(`Production backend reference found in isolated preview: ${file}`);
      }
    }
  }
  scan(directory);
}
