#!/usr/bin/env node
// Saran versi otomatis untuk web dan mobile.
//
//   npm run version:advice                    laporan kedua produk
//   npm run version:advice -- --markdown      format untuk komentar PR / issue
//   npm run version:advice -- --exit-code     keluar kode 3 bila sudah waktunya rilis (untuk CI)
//   npm run release:bump -- mobile            rencana naik versi (tanpa mengubah file)
//   npm run release:bump -- mobile minor --write   tulis app.json, package.json, dan changelog
//
// Rilis ditandai dengan git tag: web-vX.Y.Z dan mobile-vX.Y.Z. Skrip ini tidak membuat tag atau commit.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { PRODUCTS, advise, bump, renderChangelogEntry, renderReport } from './lib/version-advice.mjs';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim();

function currentVersion(product) {
  if (product === 'mobile') return JSON.parse(readFileSync('mobile/app.json', 'utf8')).expo.version;
  return JSON.parse(readFileSync('package.json', 'utf8')).version;
}

/** Titik awal: tag rilis terakhir; untuk web tanpa tag, commit terakhir yang mengubah versi di package.json. */
function baselineFor(product) {
  const tags = git('tag', '--list', `${PRODUCTS[product].tagPrefix}*`, '--sort=-v:refname').split('\n').filter(Boolean);
  if (tags.length) return { ref: tags[0], label: `tag ${tags[0]}` };
  if (product === 'web') {
    const h = git('log', '-1', '--format=%H', '-G"version"', '--', 'package.json');
    if (h) return { ref: h, label: `commit ${h.slice(0, 7)} (perubahan versi terakhir)` };
  }
  return { ref: null, label: null };
}

function commitsSince(ref) {
  const range = ref ? [`${ref}..HEAD`] : ['HEAD'];
  const raw = git('log', ...range, '--no-merges', '--format=%H%x1f%aI%x1f%s%x1f%b%x1e');
  return raw.split('\x1e').map(s => s.trim()).filter(Boolean).map(rec => {
    const [hash, date, subject, body = ''] = rec.split('\x1f');
    const files = git('diff-tree', '--no-commit-id', '--name-only', '-r', '--root', hash).split('\n').filter(Boolean);
    return { hash, date, subject, body, files };
  });
}

function report(product) {
  const { ref, label } = baselineFor(product);
  const firstRelease = !ref;
  const r = advise(product, currentVersion(product), firstRelease ? [] : commitsSince(ref), new Date(), { firstRelease });
  return { r, label };
}

const args = process.argv.slice(2);
const flag = f => args.includes(f);
const pos = args.filter(a => !a.startsWith('--'));

if (pos[0] === 'bump') {
  const product = pos[1];
  if (!PRODUCTS[product]) { console.error('Pakai: release:bump <web|mobile> [auto|major|minor|patch] [--write]'); process.exit(1); }
  const { r, label } = report(product);
  if (r.firstRelease) { console.log(renderReport(r, label)); process.exit(0); }
  const want = pos[2] && pos[2] !== 'auto' ? pos[2] : r.level;
  if (!['major', 'minor', 'patch'].includes(want)) { console.log(renderReport(r, label)); console.log('\nTidak ada yang perlu dirilis.'); process.exit(0); }
  const next = bump(r.current, want);
  const date = new Date().toISOString().slice(0, 10);
  const entry = renderChangelogEntry(next, date, want, r.shipping);
  console.log(`${PRODUCTS[product].label}: ${r.current} -> ${next} (${want})\n`);
  console.log(entry);
  if (!flag('--write')) { console.log('Ini baru rencana. Tambahkan --write untuk menulis file.'); process.exit(0); }
  for (const f of PRODUCTS[product].versionFiles) {
    if (!existsSync(f)) continue;
    let text = readFileSync(f, 'utf8');
    let n = 0;
    text = text.replace(new RegExp(`"version": "${r.current.replace(/\./g, '\\.')}"`, 'g'), m => (n++ < 2 ? `"version": "${next}"` : m));
    writeFileSync(f, text);
  }
  const clFile = PRODUCTS[product].changelog;
  const cl = existsSync(clFile) ? readFileSync(clFile, 'utf8') : '# Changelog\n\n';
  const at = cl.search(/^## \[/m);
  writeFileSync(clFile, at === -1 ? `${cl.trimEnd()}\n\n${entry}\n` : `${cl.slice(0, at)}${entry}\n---\n\n${cl.slice(at)}`);
  const tag = `${PRODUCTS[product].tagPrefix}${next}`;
  console.log(`Selesai. Periksa perubahan, lalu:\n  git add -A && git commit -m "chore(release): ${product} ${next}"\n  git tag ${tag}\n  git push --follow-tags`);
  process.exit(0);
}

const only = pos.filter(p => PRODUCTS[p]);
const products = only.length ? only : Object.keys(PRODUCTS);
const results = products.map(p => ({ ...report(p) }));
if (flag('--json')) console.log(JSON.stringify(results.map(x => ({ ...x.r, shipping: undefined, items: x.r.shipping.length })), null, 2));
else console.log(results.map(x => renderReport(x.r, x.label, { markdown: flag('--markdown') })).join('\n\n'));
if (flag('--exit-code') && results.some(x => x.r.due)) process.exit(3);
