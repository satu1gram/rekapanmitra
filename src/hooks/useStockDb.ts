import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { TierType, LOW_STOCK_THRESHOLD } from '@/types';
import type { Tables } from '@/integrations/supabase/types';

type StockEntry = Tables<'stock_entries'>;
type UserStock = Tables<'user_stock'>;

export function useStock() {
  const { user } = useAuth();
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [userStock, setUserStock] = useState<UserStock | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStock = useCallback(async () => {
    if (!user) {
      setStockEntries([]);
      setUserStock(null);
      setLoading(false);
      return;
    }

    const [entriesResult, stockResult] = await Promise.all([
      supabase
        .from('stock_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('user_stock')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
    ]);

    if (entriesResult.error) {
      console.error('Error fetching stock entries:', entriesResult.error);
    } else {
      setStockEntries(entriesResult.data || []);
    }

    if (stockResult.error) {
      console.error('Error fetching user stock:', stockResult.error);
    } else {
      setUserStock(stockResult.data);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  const currentStock = userStock?.current_stock ?? 0;
  const isLowStock = currentStock <= LOW_STOCK_THRESHOLD;

  const addStock = async (data: {
    quantity: number;
    tier: TierType;
    buyPricePerBottle?: number;
    transferProofUrl?: string;
    notes?: string;
    createdAt?: string;
    isInitialStock?: boolean;
  }) => {
    if (!user) throw new Error('User not authenticated');

    const insertData: any = {
      user_id: user.id,
      type: data.isInitialStock ? 'initial' : 'in',
      quantity: data.quantity,
      tier: data.tier,
      buy_price_per_bottle: data.buyPricePerBottle ?? null,
      total_buy_price: data.buyPricePerBottle ? data.quantity * data.buyPricePerBottle : null,
      transfer_proof_url: data.transferProofUrl || null,
      notes: data.notes || (data.isInitialStock ? 'Stok awal' : null)
    };

    if (data.createdAt) {
      insertData.created_at = data.createdAt;
    }

    // Add stock entry
    const { error: entryError } = await supabase
      .from('stock_entries')
      .insert(insertData);

    if (entryError) throw entryError;

    // Update current stock
    const newStock = currentStock + data.quantity;

    if (userStock) {
      const { error: updateError } = await supabase
        .from('user_stock')
        .update({ current_stock: newStock })
        .eq('user_id', user.id);
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from('user_stock')
        .insert({ user_id: user.id, current_stock: newStock });
      if (insertError) throw insertError;
    }

    await fetchStock();
  };

  const reduceStock = async (quantity: number, orderId?: string) => {
    if (!user) throw new Error('User not authenticated');
    if (currentStock < quantity) {
      throw new Error('Stok tidak mencukupi');
    }

    // Add stock entry
    const { error: entryError } = await supabase
      .from('stock_entries')
      .insert({
        user_id: user.id,
        type: 'out',
        quantity,
        order_id: orderId || null
      });

    if (entryError) throw entryError;

    // Update current stock
    const newStock = currentStock - quantity;
    const { error: updateError } = await supabase
      .from('user_stock')
      .update({ current_stock: newStock })
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    await fetchStock();
  };

  const updateStockEntry = async (entryId: string, data: {
    quantity: number;
    tier: TierType;
    buyPricePerBottle: number;
    transferProofUrl?: string;
    notes?: string;
    createdAt?: string;
  }, oldQuantity: number) => {
    if (!user) throw new Error('User not authenticated');

    const updateData: any = {
      quantity: data.quantity,
      tier: data.tier,
      buy_price_per_bottle: data.buyPricePerBottle,
      total_buy_price: data.quantity * data.buyPricePerBottle,
      transfer_proof_url: data.transferProofUrl || null,
      notes: data.notes || null
    };

    if (data.createdAt) {
      updateData.created_at = data.createdAt;
    }

    // Update stock entry
    const { error: entryError } = await supabase
      .from('stock_entries')
      .update(updateData)
      .eq('id', entryId);

    if (entryError) throw entryError;

    // Update current stock (adjust for difference)
    const diff = data.quantity - oldQuantity;
    const newStock = currentStock + diff;

    const { error: updateError } = await supabase
      .from('user_stock')
      .update({ current_stock: newStock })
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    await fetchStock();
  };

  const deleteStockEntry = async (entryId: string, entryQuantity: number, entryType: string) => {
    if (!user) throw new Error('User not authenticated');

    const { error: deleteError } = await supabase
      .from('stock_entries')
      .delete()
      .eq('id', entryId);

    if (deleteError) throw deleteError;

    // Adjust stock based on entry type
    const adjustment = entryType === 'in' ? -entryQuantity : entryQuantity;
    const newStock = currentStock + adjustment;

    const { error: updateError } = await supabase
      .from('user_stock')
      .update({ current_stock: Math.max(0, newStock) })
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    await fetchStock();
  };

  return {
    currentStock,
    stockEntries,
    loading,
    addStock,
    reduceStock,
    updateStockEntry,
    deleteStockEntry,
    isLowStock,
    refetch: fetchStock
  };
}
