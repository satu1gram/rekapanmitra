// Logika murni untuk saran versi (tanpa akses git/file) agar mudah dites.
// Aturan mengikuti docs/VERSIONING.md.

export const PRODUCTS = {
  web: { label: 'Web (app.mitrabp.biz.id)', tagPrefix: 'web-v', versionFiles: ['package.json', 'package-lock.json'], changelog: 'CHANGELOG.md' },
  mobile: { label: 'Aplikasi mobile (iOS/Android)', tagPrefix: 'mobile-v', versionFiles: ['mobile/app.json', 'mobile/package.json', 'mobile/package-lock.json'], changelog: 'mobile/CHANGELOG.md' },
};

/** Jenis commit yang tidak mengubah apa yang sampai ke pengguna. */
const NO_RELEASE = new Set(['docs', 'test', 'ci', 'style', 'chore']);
const LEVELS = ['none', 'patch', 'minor', 'major'];

export function parseCommit(subject, body = '') {
  const m = /^(\w+)(?:\(([^)]+)\))?(!)?: (.+)$/.exec(subject.trim());
  const breaking = !!(m && m[3]) || /^BREAKING[ -]CHANGE:/m.test(body);
  if (!m) return { type: 'other', scope: null, breaking, desc: subject.trim(), conventional: false };
  return { type: m[1].toLowerCase(), scope: m[2] ?? null, breaking, desc: m[4].trim(), conventional: true };
}

const MOBILE_NON_SHIPPING = /^mobile\/(store|e2e|scripts|README|CHANGELOG|AGENTS)/;
const SHARED = /^(src\/(lib|integrations|types)\/|supabase\/(functions|migrations)\/)/;
const WEB_SHIPPING = /^(src\/|public\/|index\.html|vite\.config|tailwind\.config|supabase\/)/;
const SRC_TEST = /(\.test\.|\.spec\.|\/__tests__\/|^src\/test\/)/;

/** Produk mana yang terkena oleh daftar file sebuah commit. */
export function productsTouched(files) {
  const out = new Set();
  for (const f of files) {
    if (SRC_TEST.test(f)) continue;
    if (f.startsWith('mobile/')) { if (!MOBILE_NON_SHIPPING.test(f)) out.add('mobile'); continue; }
    if (SHARED.test(f)) { out.add('web'); out.add('mobile'); continue; }
    if (WEB_SHIPPING.test(f)) out.add('web');
  }
  return out;
}

export function levelFor(c) {
  if (c.breaking) return 'major';
  if (c.type === 'feat') return 'minor';
  if (NO_RELEASE.has(c.type)) return 'none';
  return 'patch'; // fix, perf, refactor, build, dan commit tanpa format
}

export const maxLevel = (a, b) => (LEVELS.indexOf(a) >= LEVELS.indexOf(b) ? a : b);

export function bump(version, level) {
  const [maj, min, pat] = version.split('.').map(n => parseInt(n, 10) || 0);
  if (level === 'major') return `${maj + 1}.0.0`;
  if (level === 'minor') return `${maj}.${min + 1}.0`;
  if (level === 'patch') return `${maj}.${min}.${pat + 1}`;
  return version;
}

export const DUE_DAYS = 14;
export const DUE_FEATURES = 3;

/**
 * commits: [{ hash, subject, body, date (ISO), files }]; hanya commit yang menyentuh `product` dihitung.
 */
export function advise(product, current, commits, now = new Date(), { firstRelease = false } = {}) {
  if (firstRelease) return { product, current, level: 'none', next: current, counts: { major: 0, feat: 0, fix: 0, other: 0 }, shipping: [], days: 0, due: false, firstRelease: true };
  const shipping = [];
  for (const c of commits) {
    if (!productsTouched(c.files).has(product)) continue;
    const parsed = { ...parseCommit(c.subject, c.body), hash: c.hash, date: c.date };
    parsed.level = levelFor(parsed);
    if (parsed.level !== 'none') shipping.push(parsed);
  }
  let level = 'none';
  for (const c of shipping) level = maxLevel(level, c.level);
  const counts = { major: 0, feat: 0, fix: 0, other: 0 };
  for (const c of shipping) {
    if (c.breaking) counts.major++;
    else if (c.type === 'feat') counts.feat++;
    else if (c.type === 'fix') counts.fix++;
    else counts.other++;
  }
  const oldest = shipping.length ? shipping.reduce((a, b) => (a.date < b.date ? a : b)).date : null;
  const days = oldest ? Math.floor((now - new Date(oldest)) / 86400000) : 0;
  const due = level !== 'none' && (level === 'major' || days >= DUE_DAYS || counts.feat >= DUE_FEATURES);
  return { product, current, level, next: bump(current, level), counts, shipping, days, due };
}

const SECTIONS = [
  ['feat', '✨ Added'],
  ['fix', '🔧 Fixed'],
  ['changed', '⚙️ Changed'],
];
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

export function renderChangelogEntry(version, date, level, shipping) {
  const groups = { feat: [], fix: [], changed: [] };
  const seen = new Set();
  for (const c of shipping) {
    const key = c.desc.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    (c.type === 'feat' ? groups.feat : c.type === 'fix' ? groups.fix : groups.changed).push(c);
  }
  const lines = [`## [${version}] - ${date}`];
  for (const [k, title] of SECTIONS) {
    if (!groups[k].length) continue;
    lines.push(`### ${title}`, ...groups[k].map(c => `- ${cap(c.desc)}${c.breaking ? ' **(BREAKING)**' : ''}`), '');
  }
  const why = { major: 'perubahan besar yang memutus alur atau data lama', minor: 'fitur baru yang kompatibel', patch: 'perbaikan tanpa fitur baru' }[level];
  lines.push('### 📋 Release Type', `- **${cap(level)}**: ${why}.`, '');
  return lines.join('\n');
}

const LABEL = { major: 'MAJOR', minor: 'MINOR', patch: 'PATCH', none: 'tidak perlu rilis' };

export function renderReport(r, baseline, { markdown = false } = {}) {
  const h = markdown ? s => `### ${s}` : s => s;
  const out = [h(`${PRODUCTS[r.product].label}: versi sekarang ${r.current}`)];
  if (!r.firstRelease) out.push(`Dihitung sejak ${baseline}.`);
  if (r.firstRelease) {
    out.push(`Belum pernah dirilis. Versi ${r.current} sudah benar untuk rilis pertama, tidak perlu naik versi.`, `Setelah dikirim ke store, tandai dengan: git tag ${PRODUCTS[r.product].tagPrefix}${r.current} && git push --tags`, 'Mulai dari tag itu, saran versi berikutnya akan dihitung otomatis.');
    return out.join('\n');
  }
  if (r.level === 'none') {
    out.push('Saran: tidak perlu rilis. Belum ada perubahan yang sampai ke pengguna.');
    return out.join('\n');
  }
  out.push(`Saran: naik ke **${r.next}** (${LABEL[r.level]}).`.replace(/\*\*/g, markdown ? '**' : ''));
  out.push(`Isi: ${r.counts.major} perubahan besar, ${r.counts.feat} fitur, ${r.counts.fix} perbaikan, ${r.counts.other} lainnya. Perubahan tertua ${r.days} hari lalu.`);
  out.push(r.due
    ? `Waktunya rilis: ${r.level === 'major' ? 'ada perubahan besar' : r.counts.feat >= DUE_FEATURES ? `sudah ${r.counts.feat} fitur menumpuk` : `sudah lewat ${DUE_DAYS} hari`}.`
    : 'Boleh ditunda dulu. Rilis saat sudah ada beberapa perubahan atau sudah lewat 14 hari.');
  const bullets = r.shipping.slice(0, 12).map(c => `- ${c.type}: ${c.desc}`);
  out.push('', ...bullets, ...(r.shipping.length > 12 ? [`- ...dan ${r.shipping.length - 12} lainnya`] : []));
  return out.join('\n');
}
