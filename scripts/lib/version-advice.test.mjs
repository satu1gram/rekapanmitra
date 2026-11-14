import { describe, expect, it } from 'vitest';
import { advise, bump, levelFor, parseCommit, productsTouched, renderChangelogEntry } from './version-advice.mjs';

const c = (subject, files, date = '2026-11-01T00:00:00Z', body = '') => ({ hash: subject, subject, body, date, files });
const NOW = new Date('2026-11-10T00:00:00Z');

describe('parseCommit + levelFor', () => {
  it('membaca tipe, cakupan, dan tanda breaking', () => {
    expect(parseCommit('feat(mobile): fitur baru')).toMatchObject({ type: 'feat', scope: 'mobile', breaking: false, desc: 'fitur baru' });
    expect(parseCommit('fix!: ubah format')).toMatchObject({ type: 'fix', breaking: true });
    expect(parseCommit('feat: x', 'BREAKING CHANGE: data lama tidak cocok').breaking).toBe(true);
  });
  it('memetakan jenis commit ke tingkat versi', () => {
    expect(levelFor(parseCommit('feat: a'))).toBe('minor');
    expect(levelFor(parseCommit('fix: a'))).toBe('patch');
    expect(levelFor(parseCommit('perf: a'))).toBe('patch');
    expect(levelFor(parseCommit('feat!: a'))).toBe('major');
    for (const t of ['docs', 'test', 'ci', 'style', 'chore']) expect(levelFor(parseCommit(`${t}: a`))).toBe('none');
  });
});

describe('productsTouched', () => {
  it('memisahkan web, mobile, dan kode bersama', () => {
    expect([...productsTouched(['mobile/src/app/x.tsx'])]).toEqual(['mobile']);
    expect([...productsTouched(['src/components/a.tsx'])]).toEqual(['web']);
    expect([...productsTouched(['src/lib/pricing.ts']).values()].sort()).toEqual(['mobile', 'web']);
    expect([...productsTouched(['supabase/migrations/1.sql']).values()].sort()).toEqual(['mobile', 'web']);
  });
  it('mengabaikan file yang tidak ikut dikirim ke pengguna', () => {
    expect(productsTouched(['mobile/store/LISTING.md', 'mobile/e2e/release.cjs', 'docs/x.md', '.github/workflows/a.yml', 'src/lib/a.test.ts']).size).toBe(0);
  });
});

describe('advise', () => {
  it('memilih tingkat tertinggi dan hanya menghitung produk yang terkena', () => {
    const r = advise('mobile', '1.2.3', [c('fix: a', ['mobile/src/a.ts']), c('feat: b', ['mobile/src/b.ts']), c('feat: web saja', ['src/pages/a.tsx'])], NOW);
    expect(r.level).toBe('minor');
    expect(r.next).toBe('1.3.0');
    expect(r.counts).toMatchObject({ feat: 1, fix: 1 });
  });
  it('commit tanpa dampak ke pengguna tidak memicu rilis', () => {
    const r = advise('mobile', '1.0.0', [c('docs: a', ['mobile/README.md']), c('test: b', ['mobile/e2e/x.cjs']), c('fix: c', ['mobile/store/a.md'])], NOW);
    expect(r.level).toBe('none');
    expect(r.due).toBe(false);
  });
  it('breaking menaikkan major dan langsung waktunya rilis', () => {
    const r = advise('web', '2.8.0', [c('feat!: skema baru', ['src/a.ts'])], NOW);
    expect(r).toMatchObject({ level: 'major', next: '3.0.0', due: true });
  });
  it('mengingatkan setelah 14 hari atau 3 fitur', () => {
    expect(advise('web', '1.0.0', [c('fix: a', ['src/a.ts'], '2026-10-20T00:00:00Z')], NOW).due).toBe(true);
    expect(advise('web', '1.0.0', [c('fix: a', ['src/a.ts'], '2026-11-08T00:00:00Z')], NOW).due).toBe(false);
    const three = ['a', 'b', 'c'].map(n => c(`feat: ${n}`, ['src/a.ts'], '2026-11-09T00:00:00Z'));
    expect(advise('web', '1.0.0', three, NOW).due).toBe(true);
  });
  it('rilis pertama tidak menyarankan kenaikan', () => {
    expect(advise('mobile', '1.0.0', [], NOW, { firstRelease: true })).toMatchObject({ firstRelease: true, level: 'none', next: '1.0.0' });
  });
});

describe('bump + changelog', () => {
  it('menaikkan versi dan mereset angka di kanan', () => {
    expect(bump('1.2.3', 'patch')).toBe('1.2.4');
    expect(bump('1.2.3', 'minor')).toBe('1.3.0');
    expect(bump('1.2.3', 'major')).toBe('2.0.0');
  });
  it('menulis entri changelog per kelompok tanpa duplikat', () => {
    const r = advise('web', '1.0.0', [c('feat: Fitur A', ['src/a.ts']), c('fix: bug B', ['src/a.ts']), c('fix: bug B', ['src/b.ts'])], NOW);
    const text = renderChangelogEntry('1.1.0', '2026-11-10', 'minor', r.shipping);
    expect(text).toContain('## [1.1.0] - 2026-11-10');
    expect(text).toContain('### ✨ Added\n- Fitur A');
    expect(text.match(/Bug B/g)).toHaveLength(1);
    expect(text).toContain('- **Minor**');
  });
});
