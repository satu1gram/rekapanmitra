import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatInterface } from './ChatInterface';
import { parseWithAI } from '@/lib/orderParser';

vi.mock('@/lib/orderParser', () => ({
  parseWithAI: vi.fn(), saveLearningPattern: vi.fn(), getLearningPatterns: () => [],
}));
vi.mock('@/hooks/useCustomersDb', () => ({
  useCustomers: () => ({ customers: [], getCustomerByName: () => undefined, findCustomerFuzzy: () => undefined }),
}));
vi.mock('@/hooks/useProducts', () => ({
  useProducts: () => ({ products: [{
    id: 'bp-reseller', name: 'British Propolis', category: 'British Propolis',
    package_type: '3_botol', quantity_per_package: 3, default_sell_price: 650000, is_active: true,
  }] }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  Element.prototype.scrollIntoView = vi.fn();
  vi.mocked(parseWithAI).mockResolvedValue({
    intent: 'order', pelanggan: 'Bu Ani', hp: '', items: [{ nama: 'British Propolis', qty: 3 }], catatan: '', raw: '3 bp Bu Ani',
  });
});

async function send() {
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '3 bp Bu Ani' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
}

describe('AI confirmation workflow', () => {
  it('applies a correction to the actual order payload and uses catalog prices', async () => {
    const confirm = vi.fn().mockResolvedValue(true);
    render(<ChatInterface mode="order" mitraLevel="agen" onConfirmOrder={confirm} />);
    await send();
    await screen.findByText('Bu Ani', {}, { timeout: 3000 });
    expect(confirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Hasil kurang tepat? Koreksi & latih AI'));
    fireEvent.change(screen.getByDisplayValue('Bu Ani'), { target: { value: 'Bu Siti' } });
    fireEvent.click(screen.getByText('Simpan & Latih AI'));
    expect(screen.getByText('Bu Siti')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Konfirmasi & Simpan Order'));
    await waitFor(() => expect(confirm).toHaveBeenCalledTimes(1));
    expect(confirm.mock.calls[0][0].pelanggan).toBe('Bu Siti');
    expect(confirm.mock.calls[0][1].items[0].pricePerBottle).toBe(216667);
    expect(confirm.mock.calls[0][1].tier).toBe('reseller');
  });

  it('does not allow an order to be confirmed in the restock flow', async () => {
    const confirm = vi.fn();
    render(<ChatInterface mode="restok" mitraLevel="agen" onConfirmRestok={confirm} />);
    await send();
    await screen.findByText(/Pesan terbaca sebagai order pelanggan/, {}, { timeout: 3000 });
    expect(screen.queryByText('Konfirmasi Restok')).not.toBeInTheDocument();
    expect(confirm).not.toHaveBeenCalled();
  });

  it('blocks unknown products instead of saving fallback prices', async () => {
    vi.mocked(parseWithAI).mockResolvedValue({
      intent: 'order', pelanggan: 'Bu Ani', hp: '', items: [{ nama: 'Produk tidak dikenal', qty: 1 }], catatan: '', raw: 'pesanan',
    });
    render(<ChatInterface mode="order" mitraLevel="agen" onConfirmOrder={vi.fn()} />);
    await send();
    const button = await screen.findByText('Konfirmasi & Simpan Order', {}, { timeout: 3000 });
    expect(button).toBeDisabled();
    expect(screen.getByText(/Katalog belum lengkap/)).toBeInTheDocument();
  });

  it('sends only one confirmation while a save is in flight', async () => {
    let finish: (value: boolean) => void;
    const confirm = vi.fn(() => new Promise<boolean>(resolve => { finish = resolve; }));
    render(<ChatInterface mode="order" mitraLevel="agen" onConfirmOrder={confirm} />);
    await send();
    const button = await screen.findByText('Konfirmasi & Simpan Order', {}, { timeout: 3000 });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(confirm).toHaveBeenCalledTimes(1);
    finish(false);
    await waitFor(() => expect(screen.getByText('Konfirmasi & Simpan Order')).not.toBeDisabled());
  });
});
