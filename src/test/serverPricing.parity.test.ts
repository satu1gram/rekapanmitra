/**
 * Test paritas harga K3 (IO-14): implementasi server-side baru HARUS identik
 * dengan baseline "lama" (semantik telegram-bot saat ini) pada kasus emas:
 * threshold qty 3/10/40/200, bundle reseller BP 3=Rp650rb dengan pembulatan
 * dialokasikan ke item BP terakhir, dan produk beauty Belgie/Steffi.
 *
 * Sumber baru: src/lib/serverPricing.ts (mirror SQL 20260823000000_k3_server_side_pricing.sql)
 * Sumber lama: supabase/functions/telegram-bot/index.ts (port setia di bawah).
 */
import { describe, it, expect } from 'vitest';
import { applyServerPricing, getBuyPrice, CustomLevel, ServerPricingItemInput } from '@/lib/serverPricing';
import { recalcPricing } from '@/lib/pricing';

// ---------------------------------------------------------------------------
// BASELINE LAMA — port setia dari supabase/functions/telegram-bot/index.ts
// (getPricingForTier / getActiveTier / applyTierPricing). Angka harga di sini
// adalah FIXTURE GOLDEN yang disalin dari bot berjalan hari ini.
// ---------------------------------------------------------------------------
const BOT_PRICING_MAP: Record<string, { bp: number; beauty: number }> = {
  'satuan': { bp: 250000, beauty: 195000 },
  'reseller': { bp: 217000, beauty: 195000 },
  'agen': { bp: 198000, beauty: 195000 },
  'agen_plus': { bp: 180000, beauty: 180000 },
  'sap': { bp: 170000, beauty: 170000 },
  'se': { bp: 150000, beauty: 150000 },
};

function botGetPricingForTier(tier: string, isBeauty: boolean, customLevels: CustomLevel[] = []) {
  const custom = customLevels.find(l => l.level_code === tier);
  if (custom) return custom.buy_price_per_bottle;
  const data = BOT_PRICING_MAP[tier.toLowerCase()] || BOT_PRICING_MAP['satuan'];
  return isBeauty ? data.beauty : data.bp;
}

function botGetActiveTier(totalQty: number, selectedTier?: string) {
  let activeTier = (selectedTier || 'satuan').toLowerCase();
  if (activeTier === 'satuan' || !selectedTier) {
    if (totalQty >= 200) activeTier = 'se';
    else if (totalQty >= 40) activeTier = 'sap';
    else if (totalQty >= 10) activeTier = 'agen_plus';
    else if (totalQty >= 5) activeTier = 'agen';
    else if (totalQty >= 3) activeTier = 'reseller';
  }
  return activeTier;
}

interface BotItem { product_name: string; quantity: number }

function botApplyTierPricing(
  items: BotItem[],
  selectedTier: string,
  customLevels: CustomLevel[],
  myLevel: string
) {
  const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);
  const activeTier = botGetActiveTier(totalQty, selectedTier);

  let bpQty = 0;
  items.forEach(i => {
    const isBeauty = i.product_name.toUpperCase().includes('BELGIE') || i.product_name.toUpperCase().includes('STEFFI');
    if (!isBeauty) bpQty += i.quantity;
  });

  let bpBundleTotal = 0;
  if (activeTier === 'reseller') {
    const bundles = Math.floor(bpQty / 3);
    const remainder = bpQty % 3;
    bpBundleTotal = bundles * 650000 + remainder * 217000;
  }

  let totalModal = 0;
  const updatedItems = items.map(i => {
    const isBeauty = i.product_name.toUpperCase().includes('BELGIE') || i.product_name.toUpperCase().includes('STEFFI');
    const buyPrice = botGetPricingForTier(myLevel, isBeauty, customLevels || []);
    totalModal += buyPrice * i.quantity;

    let subtotal = 0;
    if (!isBeauty && activeTier === 'reseller') {
      if (bpQty > 0) {
        subtotal = Math.round((i.quantity / bpQty) * bpBundleTotal);
      }
    } else {
      subtotal = Math.round(botGetPricingForTier(activeTier, isBeauty)) * i.quantity;
    }

    return {
      product_name: i.product_name,
      quantity: i.quantity,
      price: Math.round(subtotal / i.quantity),
      subtotal,
      buy_price: buyPrice,
    };
  });

  if (activeTier === 'reseller' && bpQty > 0) {
    let assigned = 0;
    let lastBpIndex = -1;
    for (let i = 0; i < updatedItems.length; i++) {
      const it = updatedItems[i];
      const isB = it.product_name.toUpperCase().includes('BELGIE') || it.product_name.toUpperCase().includes('STEFFI');
      if (!isB) {
        assigned += it.subtotal!;
        lastBpIndex = i;
      }
    }
    if (assigned !== bpBundleTotal && lastBpIndex !== -1) {
      updatedItems[lastBpIndex].subtotal! += bpBundleTotal - assigned;
      updatedItems[lastBpIndex].price = Math.round(updatedItems[lastBpIndex].subtotal! / updatedItems[lastBpIndex].quantity);
    }
  }

  return { items: updatedItems, buy_price: totalModal, tier: activeTier };
}

// ---------------------------------------------------------------------------
// Helper: bandingkan hasil baru vs baseline bot
// ---------------------------------------------------------------------------
function expectParity(items: BotItem[], baseTier: string | null | undefined, tenantLevel: string, customLevels: CustomLevel[] = []) {
  const oldRes = botApplyTierPricing(items.map(i => ({ product_name: i.product_name, quantity: i.quantity })), baseTier || '', customLevels, tenantLevel);
  const newRes = applyServerPricing({
    items: items.map(i => ({ productName: i.product_name, quantity: i.quantity })),
    baseTier,
    tenantLevel,
    customLevels,
  });

  expect(newRes.tier).toBe(oldRes.tier);
  expect(newRes.totalPrice).toBe(oldRes.items.reduce((s, i) => s + i.subtotal, 0));
  expect(newRes.buyPrice).toBe(oldRes.buy_price);
  expect(newRes.items.map(p => ({ name: p.productName, qty: p.quantity, unit: p.pricePerBottle, sub: p.subtotal })))
    .toEqual(oldRes.items.map(i => ({ name: i.product_name, qty: i.quantity, unit: i.price, sub: i.subtotal })));
  return { oldRes, newRes };
}

describe('paritas harga K3: server-side baru vs baseline bot', () => {
  const T1 = 'reseller'; // level mitra pemilik toko

  it('kasus emas qty 3 → reseller, bundle BP 3 = Rp650rb', () => {
    const { newRes } = expectParity([{ product_name: 'BP Satuan', quantity: 3 }], 'satuan', T1);
    expect(newRes.tier).toBe('reseller');
    expect(newRes.totalPrice).toBe(650000); // 3 × ~Rp216.667
    expect(newRes.buyPrice).toBe(651000);   // modal level reseller 217rb × 3
  });

  it('kasus emas pembulatan bundle dialokasikan ke item BP terakhir (split 1+1+1)', () => {
    const { newRes } = expectParity(
      [{ product_name: 'BP', quantity: 1 }, { product_name: 'BP', quantity: 1 }, { product_name: 'BP', quantity: 1 }],
      'satuan', T1);
    expect(newRes.items.map(i => i.subtotal)).toEqual([216667, 216667, 216666]);
    expect(newRes.totalPrice).toBe(650000); // residu Rp1 masuk ke item terakhir
  });

  it('kasus emas qty 5 → agen', () => {
    const { newRes } = expectParity([{ product_name: 'BP Satuan', quantity: 5 }], 'satuan', T1);
    expect(newRes.tier).toBe('agen');
    expect(newRes.totalPrice).toBe(990000); // 198rb × 5
    expect(newRes.buyPrice).toBe(1085000);  // modal tetap level TENANT (reseller 217rb), bukan tier pelanggan
  });

  it('kasus emas qty 10 → agen_plus', () => {
    const { newRes } = expectParity([{ product_name: 'BP Satuan', quantity: 10 }], '', T1);
    expect(newRes.tier).toBe('agen_plus');
    expect(newRes.totalPrice).toBe(1800000);
  });

  it('kasus emas qty 40 → sap', () => {
    const { newRes } = expectParity([{ product_name: 'BP Satuan', quantity: 40 }], null, T1);
    expect(newRes.tier).toBe('sap');
    expect(newRes.totalPrice).toBe(6800000);
  });

  it('kasus emas qty 200 → se', () => {
    const { newRes } = expectParity([{ product_name: 'BP Satuan', quantity: 200 }], 'satuan', T1);
    expect(newRes.tier).toBe('se');
    expect(newRes.totalPrice).toBe(30000000);
  });

  it('produk beauty Belgie/Steffi memakai harga tier tanpa bundle', () => {
    const { newRes } = expectParity(
      [{ product_name: 'Belgie Satuan', quantity: 4 }],
      'satuan', T1);
    expect(newRes.tier).toBe('reseller'); // qty naik ke reseller…
    expect(newRes.totalPrice).toBe(780000); // …tapi beauty tetap 195rb × 4, bukan bundle BP
  });

  it('beauty + BP campur: hanya BP kena bundle reseller', () => {
    const { newRes } = expectParity(
      [{ product_name: 'Belgie Satuan', quantity: 1 }, { product_name: 'BP Satuan', quantity: 3 }],
      'satuan', T1);
    expect(newRes.items[0].subtotal).toBe(195000);
    expect(newRes.items[1].subtotal).toBe(650000);
    expect(newRes.totalPrice).toBe(845000);
    expect(newRes.buyPrice).toBe(846000);
  });

  it('level kustom tenant menang untuk modal (termasuk produk beauty)', () => {
    const gold: CustomLevel[] = [{ level_code: 'gold', buy_price_per_bottle: 200000 }];
    expect(getBuyPrice('BP', 'gold', gold)).toBe(200000);
    expect(getBuyPrice('Steffi', 'gold', gold)).toBe(200000);
    const { newRes } = expectParity([{ product_name: 'BP', quantity: 3 }], 'satuan', 'gold', gold);
    expect(newRes.buyPrice).toBe(600000); // modal 200rb × 3, jual tetap bundle 650rb
  });

  it('tier eksplisit non-satuan tidak naik via threshold (paritas bot)', () => {
    const { newRes } = expectParity([{ product_name: 'BP', quantity: 12 }], 'reseller', T1);
    expect(newRes.tier).toBe('reseller'); // bukan agen_plus walau qty 12
    expect(newRes.totalPrice).toBe(2600000); // 4 bundel × 650rb
  });
});

describe('uji negatif: angka uang dari client diabaikan penuh', () => {
  it('buy_price/subtotal/price_per_bottle palsu tidak mengubah hasil apa pun', () => {
    const clean = applyServerPricing({
      items: [{ productName: 'BP Satuan', quantity: 3 }],
      baseTier: 'satuan',
      tenantLevel: 'reseller',
    });
    // Simulasi payload berbahaya: field uang palsu diselundupkan bersama item
    const forgedItem = {
      buy_price: 999999999,
      pricePerBottle: 1,
      subtotal: 123,
      price_per_bottle: 1,
      productName: 'BP Satuan',
      quantity: 3,
    } as unknown as ServerPricingItemInput;
    const forged = applyServerPricing({
      items: [forgedItem],
      baseTier: 'satuan',
      tenantLevel: 'reseller',
    });
    expect(forged).toEqual(clean);
    expect(forged.totalPrice).toBe(650000);
    expect(forged.buyPrice).toBe(651000);
    expect(forged.buyPrice).not.toBe(999999999);
  });

  it('hasil independen dari nilai palsu yang berbeda-beda', () => {
    const forgedA = { subtotal: 1, productName: 'BP', quantity: 6 } as unknown as ServerPricingItemInput;
    const forgedB = { subtotal: 987654321, productName: 'BP', quantity: 6 } as unknown as ServerPricingItemInput;
    const a = applyServerPricing({ items: [forgedA], baseTier: 'reseller', tenantLevel: 'reseller' });
    const b = applyServerPricing({ items: [forgedB], baseTier: 'reseller', tenantLevel: 'reseller' });
    expect(a).toEqual(b);
    expect(a.totalPrice).toBe(1300000); // 2 bundel × 650rb
  });

  it('quantity 0 / non-integer ditolak sebelum perhitungan', () => {
    expect(() => applyServerPricing({ items: [{ productName: 'BP', quantity: 0 }] })).toThrow();
    expect(() => applyServerPricing({ items: [{ productName: 'BP', quantity: 2.5 } as unknown as ServerPricingItemInput] })).toThrow();
    expect(() => applyServerPricing({ items: [] })).toThrow();
  });
});

describe('catatan divergensi diketahui vs duplikat UI lama (untuk rewire)', () => {
  it('recalcPricing UI sama pada kasus single-line; split 1+1+1 beda residu Rp1 (bot = kanonik)', () => {
    const uiOld = recalcPricing(
      [
        { productName: 'BP', quantity: 1 },
        { productName: 'BP', quantity: 1 },
        { productName: 'BP', quantity: 1 },
      ],
      'satuan'
    );
    const server = applyServerPricing({
      items: [{ productName: 'BP', quantity: 1 }, { productName: 'BP', quantity: 1 }, { productName: 'BP', quantity: 1 }],
      baseTier: 'satuan',
      tenantLevel: 'reseller',
    });
    // Duplikat UI lama tidak mengoreksi residu pembulatan (total 650001),
    // sedangkan semantik kanonik (bot & SQL baru) selalu tepat 650000.
    expect(uiOld.reduce((s, i) => s + i.subtotal, 0)).toBe(650001);
    expect(server.totalPrice).toBe(650000);
  });
});
