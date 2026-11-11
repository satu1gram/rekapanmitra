import { describe, expect, it } from 'vitest';
import { aiDate, draftFromAiItems, matchCategory } from '../aiDraft';
import { linesToDraft } from '../orderDraft';

const categories = ['BP', 'KID', 'BLUE', 'STEFFI', 'BRE', 'BRO', 'NORWAY', 'BELGIE'];

describe('AI item mapping', () => {
  it('recognises common chat names', () => {
    expect(matchCategory('BP Green', categories)).toBe('KID');
    expect(matchCategory('propolis biru', categories)).toBe('BLUE');
    expect(matchCategory('British Propolis', categories)).toBe('BP');
    expect(matchCategory('Brassic Eye', categories)).toBe('BRE');
    expect(matchCategory('Belgie serum', categories)).toBe('BELGIE');
    expect(matchCategory('Kopi', categories)).toBeNull();
  });

  it('only maps to categories that exist in the catalog', () => {
    expect(matchCategory('BP Green', ['BP'])).toBe('BP');
  });

  it('adds up quantities and reports what needs checking', () => {
    const draft = draftFromAiItems(
      [{ nama: 'bp', qty: 2 }, { nama: 'BP', qty: 1 }, { nama: 'green', qty: 1, satuan: 'paket' }, { nama: 'kopi', qty: 1 }, { nama: 'blue', qty: 0 }],
      categories,
    );
    expect(draft.quantities).toEqual({ BP: 3, KID: 1 });
    expect(draft.unknown).toEqual(['kopi', 'blue']);
    expect(draft.packageLines).toEqual(['green']);
  });

  it('accepts only valid, non-future dates', () => {
    const now = new Date(2026, 10, 11);
    expect(aiDate('2026-11-10', now)?.getDate()).toBe(10);
    expect(aiDate('2026-11-31', now)).toBeNull();
    expect(aiDate('2026-12-01', now)).toBeNull();
    expect(aiDate('', now)).toBeNull();
  });
});


describe('editing a saved order', () => {
  it('maps lines to catalog categories by product id, then by name, and keeps the rest fixed', () => {
    const draft = linesToDraft(
      [
        { productName: 'Paket BP 3 Botol', productId: 'p-bp3', quantity: 3, pricePerBottle: 240000, subtotal: 720000 },
        { productName: 'BP Green', productId: null, quantity: 1, pricePerBottle: 285000, subtotal: 285000 },
        { productName: 'Madu Hutan', productId: null, quantity: 2, pricePerBottle: 90000, subtotal: 180000 },
      ],
      ['BP', 'KID'],
      id => (id === 'p-bp3' ? 'BP' : undefined),
    );
    expect(draft.quantities).toEqual({ BP: 3, KID: 1 });
    expect(draft.fixedLines).toEqual([{ productName: 'Madu Hutan', pricePerBottle: 90000, quantity: 2, productId: null }]);
    expect(draft.savedItems).toHaveLength(3);
  });
});
