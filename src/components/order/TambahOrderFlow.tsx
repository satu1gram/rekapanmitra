import React, { useState, useMemo } from 'react';
import { X, ArrowRight, ShoppingCart, CheckCircle2, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProfile } from '@/hooks/useProfile';
import { useProducts, Product } from '@/hooks/useProducts';
import { formatCurrency } from '@/lib/formatters';
import type { Tables } from '@/integrations/supabase/types';
import { StepIndicator } from './StepIndicator';
import { PilihPelanggan } from './step1/PilihPelanggan';
import { PilihProduk } from './step2/PilihProduk';
import { KonfirmasiOrder } from './step3/KonfirmasiOrder';
import { BottomActionBar } from './shared/BottomActionBar';

type Customer = Tables<'customers'>;

interface TambahOrderFlowProps {
  customers: Customer[];
  currentStock: number;
  submitting: boolean;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  onEditCustomer?: (customer: Customer) => void;
}

export function TambahOrderFlow({
  customers,
  currentStock,
  submitting,
  onSubmit,
  onCancel,
  onEditCustomer
}: TambahOrderFlowProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [orderDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSuccess, setIsSuccess] = useState(false);

  const { products } = useProducts();
  const { mitraLevel } = useProfile();

  // Mapped Data
  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => {
        const product = products.find(p => p.id === id);
        return product ? { product, quantity: qty } : null;
      })
      .filter((item): item is { product: Product; quantity: number } => item !== null);
  }, [cart, products]);

  const totalQty = useMemo(() => cartItems.reduce((acc, item) => acc + item.quantity, 0), [cartItems]);
  const totalHarga = useMemo(() => cartItems.reduce((acc, item) => acc + (item.product.default_sell_price * item.quantity), 0), [cartItems]);
  const totalProfit = useMemo(() => {
    // In this app, profit is margin = total_price - total_buy
    // We'll use a placeholder or better: pass the profit calculation from the parent or use a default margin per bottle
    const marginPerBottle = 70000; // Default margin for BP as fallback
    return cartItems.reduce((acc, item) => acc + (marginPerBottle * item.quantity), 0);
  }, [cartItems]);

  // Handlers
  const handleNext = () => {
    if (step === 1 && selectedCustomer) setStep(2);
    else if (step === 2 && totalQty > 0) setStep(3);
    else if (step === 3) handleFinalSubmit();
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  };

  const handleChangeQty = (id: string, delta: number) => {
    setCart(prev => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + delta)
    }));
  };

  const handleDeleteProduct = (id: string) => {
    setCart(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleFinalSubmit = async () => {
    if (!selectedCustomer) return;
    
    await onSubmit({
      customerName: selectedCustomer.name,
      customerPhone: selectedCustomer.phone,
      customerAddress: (selectedCustomer as any).address,
      province: (selectedCustomer as any).province,
      city: (selectedCustomer as any).city,
      tier: selectedCustomer.tier || 'satuan',
      items: cartItems.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        pricePerBottle: item.product.default_sell_price,
        subtotal: item.product.default_sell_price * item.quantity
      })),
      customerId: selectedCustomer.id,
      createdAt: new Date(orderDate).toISOString()
    });
    
    setIsSuccess(true);
  };

  if (isSuccess && selectedCustomer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white px-6 py-12 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-[#059669]" />
        </div>
        <h2 className="text-2xl font-black text-slate-800">Order Tersimpan!</h2>
        <p className="text-slate-500 font-medium mt-2">
          Untuk <span className="text-slate-900 font-bold">{selectedCustomer.name}</span> senilai <span className="text-emerald-600 font-bold">{formatCurrency(totalHarga)}</span>
        </p>

        <div className="mt-8 w-full max-w-xs bg-emerald-50 rounded-[22px] p-4 border border-emerald-100">
          <p className="text-[11px] text-emerald-600 font-bold uppercase tracking-widest">Profit Estimasi</p>
          <p className="text-[24px] font-black text-[#059669] mt-1">+{formatCurrency(totalProfit)}</p>
        </div>

        <div className="mt-12 flex flex-col gap-3 w-full max-w-xs">
          <button 
            onClick={() => {
              setStep(1);
              setSelectedCustomer(null);
              setCart({});
              setIsSuccess(false);
            }}
            className="h-14 bg-[#1E293B] text-white rounded-[18px] font-bold shadow-lg shadow-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-5 h-5 text-yellow-400" />
            Tambah Order Lain
          </button>
          <button 
            onClick={onCancel}
            className="h-14 bg-white text-slate-500 rounded-[18px] font-bold border border-slate-200 active:scale-95 transition-all"
          >
            Selesai
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F4F6F9]">
      <header className="sticky top-0 z-20 bg-white">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Package className="w-5 h-5 text-[#059669]" />
            </div>
            <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Tambah Order</span>
          </div>
          <button 
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 active:bg-slate-100 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <StepIndicator currentStep={step} />
      </header>

      <main className="flex-1 overflow-y-auto py-6">
        {step === 1 && (
          <PilihPelanggan
            customers={customers}
            selectedCustomerId={selectedCustomer?.id || null}
            onSelect={(c) => setSelectedCustomer(c)}
            onAddNew={() => onEditCustomer?.({} as any)}
          />
        )}
        
        {step === 2 && selectedCustomer && (
          <PilihProduk
            selectedCustomer={selectedCustomer}
            products={products}
            cart={cart}
            onChangeQty={handleChangeQty}
            onDeleteProduct={handleDeleteProduct}
            onToggleCustomerMode={() => setStep(1)}
            totalHarga={totalHarga}
            totalProfit={totalProfit}
            totalQty={totalQty}
          />
        )}

        {step === 3 && selectedCustomer && (
          <KonfirmasiOrder
            customer={selectedCustomer}
            date={orderDate}
            cartItems={cartItems}
            totalHarga={totalHarga}
            totalProfit={totalProfit}
          />
        )}
      </main>

      <BottomActionBar
        onBack={step > 1 ? handleBack : undefined}
        onNext={handleNext}
        disabled={(step === 1 && !selectedCustomer) || (step === 2 && totalQty === 0) || submitting}
        nextLabel={step === 3 ? 'Simpan Order' : 'Lanjut'}
        nextIcon={submitting ? <ShoppingCart className="w-4 h-4 animate-bounce" /> : <ArrowRight className="w-4 h-4" />}
        leftContent={step === 2 ? (
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Harga</span>
            <div className="flex items-center gap-2">
              <span className="text-[18px] font-black text-[#1E293B]">{formatCurrency(totalHarga)}</span>
              {totalProfit > 0 && (
                <span className="bg-[#F0FDF4] text-[#059669] text-[10px] font-bold px-1.5 py-0.5 rounded">
                  +{formatCurrency(totalProfit)}
                </span>
              )}
            </div>
          </div>
        ) : undefined}
      />
    </div>
  );
}
