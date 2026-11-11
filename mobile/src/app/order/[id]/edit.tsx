import { useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';
import type { TierType } from '@/types';

import { useCatalog, useOrderDetail } from '~/hooks/queries';
import { linesToDraft } from '~/lib/orderDraft';
import { productCategories } from '~/lib/orderMath';
import { errorMessage } from '~/lib/supabase';
import { ErrorState, LoadingState } from '~/ui/components';
import { OrderForm, type OrderFormInitial } from '~/ui/OrderForm';

export default function EditOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const detail = useOrderDetail(id);
  const catalog = useCatalog();

  const initial = useMemo<OrderFormInitial | null>(() => {
    if (!detail.data || !catalog.data) return null;
    const { order, items, expenses } = detail.data;
    const categories = productCategories(catalog.data);
    const byId = new Map(catalog.data.map(p => [p.id, p.category]));
    const draft = linesToDraft(items, categories, pid => byId.get(pid));
    return {
      date: new Date(order.created_at),
      customerName: order.customer_name,
      customerPhone: order.customer_phone ?? '',
      customerId: order.customer_id,
      tier: order.tier as TierType,
      ...draft,
      expenses: expenses.map(e => ({ name: e.name, amount: e.amount })),
      transferProofUrl: order.transfer_proof_url,
    };
  }, [detail.data, catalog.data]);

  if (detail.isPending || catalog.isPending) return <LoadingState />;
  if (detail.isError || catalog.isError) return <ErrorState message={errorMessage(detail.error ?? catalog.error)} onRetry={() => { detail.refetch(); catalog.refetch(); }} />;
  if (!initial) return <LoadingState />;
  return <OrderForm initial={initial} orderId={id} />;
}
