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
  initialSelectedCustomerId?: string | null;
  onRefetchCustomers?: () => Promise<void>;
}

export function TambahOrderFlow({
  customers,
  currentStock,
  submitting,
  onSubmit,
  onCancel,
  onEditCustomer,
  initialSelectedCustomerId,
  onRefetchCustomers
}: TambahOrderFlowProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [orderDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSuccess, setIsSuccess] = useState(false);

  const { products } = useProducts();
  const { mitraLevel } = useProfile();
  
  // Group products by category
  const productCategories = useMemo(() => {
    const categories: Record<string, Product[]> = {};
    for (const p of products) {
      if (!p.category) continue;
      if (!categories[p.category]) categories[p.category] = [];
      categories[p.category].push(p);
    }
    // Sort by package size descending so we can find the highest applicable tier
    for (const cat of Object.keys(categories)) {
      categories[cat].sort((a, b) => b.quantity_per_package - a.quantity_per_package);
    }
    return categories;
  }, [products]);

  // Derived cart items with tiered pricing logic
  const cartItems = useMemo(() => {
    const totalSelectedQty = Object.values(cart).reduce((sum, q) => sum + q, 0);
    
    return Object.entries(cart)
      .filter(([_, qty]) => qty > 0)
      .map(([categoryName, qty]) => {
        const tiers = productCategories[categoryName] || [];
        
        // Find applicable tier based on TOTAL quantity across all categories
        let applicableTier = tiers[tiers.length - 1]; // Default to smallest tier
        for (const tier of tiers) {
          if (totalSelectedQty >= tier.quantity_per_package) {
            applicableTier = tier;
            break;
          }
        }

        if (!applicableTier) return null;

        return {
          product: applicableTier,
          quantity: qty,
          pricePerBottle: applicableTier.default_sell_price / (applicableTier.quantity_per_package || 1),
          subtotal: qty * (applicableTier.default_sell_price / (applicableTier.quantity_per_package || 1))
        };
      })
      .filter((item): item is { product: Product; quantity: number; pricePerBottle: number; subtotal: number } => item !== null);
  }, [cart, productCategories]);

  const totalQty = useMemo(() => cartItems.reduce((acc, item) => acc + item.quantity, 0), [cartItems]);
  const totalHarga = useMemo(() => cartItems.reduce((acc, item) => acc + item.subtotal, 0), [cartItems]);
  const totalProfit = useMemo(() => {
    // Standard margin logic: total_sell - total_buy
    // Since we don't have explicit buy price in master_products yet, 
    // we use a simplified estimation or specific margins if known.
    // For now, let's keep it simple or use a default margin.
    const marginPerBottle = 70000; 
    return cartItems.reduce((acc, item) => acc + (marginPerBottle * item.quantity), 0);
  }, [cartItems]);

  // Handlers
  const handleNext = () => {
    if (step === 1) {
      if (totalQty === 0) return;
      setStep(2);
    } else if (step === 2) {
      if (!selectedCustomer) return;
      setStep(3);
    } else if (step === 3) handleFinalSubmit();
  };

  const handleBack = () => {
    if (step === 1) onCancel();
    else setStep((prev) => (prev - 1) as any);
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
        productName: item.product.category, // Use category name for clarity in invoice
        quantity: item.quantity,
        pricePerBottle: item.pricePerBottle,
        subtotal: item.subtotal
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

      <main className="flex-1 overflow-y-auto pt-6 pb-20">
        {step === 1 && (
          <PilihProduk
            productCategories={productCategories}
            cart={cart}
            onChangeQty={handleChangeQty}
            onToggleCustomerMode={() => setStep(2)}
            cartItems={cartItems}
            totalHarga={totalHarga}
            totalProfit={totalProfit}
            totalQty={totalQty}
          />
        )}

        {step === 2 && (
          <PilihPelanggan
            customers={customers}
            selectedCustomerId={selectedCustomer?.id || null}
            onSelect={(c) => setSelectedCustomer(c)}
            onAddNew={() => onEditCustomer?.({} as any)}
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
        onBack={handleBack}
        onNext={step === 3 ? handleFinalSubmit : handleNext}
        nextLabel={step === 3 ? 'Kirim Pesanan' : 'Lanjutkan'}
        disabled={step === 1 ? totalQty === 0 : step === 2 ? !selectedCustomer : false}
        leftContent={step >= 1 && totalQty > 0 ? (
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              {step === 1 ? 'Estimasi Total' : 'Total Pesanan'}
            </span>
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
