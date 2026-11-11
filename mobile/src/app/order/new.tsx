import { useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';

import { OrderForm, type OrderFormInitial } from '~/ui/OrderForm';

/** New order. The Asisten AI screen can pass a draft as JSON in the `draft` param. */
export default function NewOrderScreen() {
  const { draft } = useLocalSearchParams<{ draft?: string }>();
  const initial = useMemo<OrderFormInitial>(() => {
    if (!draft) return {};
    try {
      const parsed = JSON.parse(draft) as OrderFormInitial & { date?: string };
      return { ...parsed, date: parsed.date ? new Date(parsed.date) : undefined };
    } catch {
      return {};
    }
  }, [draft]);
  return <OrderForm initial={initial} />;
}
