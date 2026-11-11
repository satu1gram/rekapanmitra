import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getCatalog } from '~/data/catalog';
import { listCustomers } from '~/data/customers';
import { listGeneralExpenses, listGeneralIncome, listTargets } from '~/data/finance';
import { getOrderDetail, listOrders } from '~/data/orders';
import { getProfile } from '~/data/profile';
import { getStock } from '~/data/stock';
import { useAuth } from '~/providers/AuthProvider';

export const keys = {
  profile: (u: string) => ['profile', u] as const,
  orders: (u: string) => ['orders', u] as const,
  order: (id: string) => ['order', id] as const,
  stock: (u: string) => ['stock', u] as const,
  customers: (u: string) => ['customers', u] as const,
  catalog: ['catalog'] as const,
  expenses: (u: string) => ['expenses', u] as const,
  income: (u: string) => ['income', u] as const,
  targets: (u: string) => ['targets', u] as const,
};

function useUserId() {
  const { userId } = useAuth();
  return userId ?? '';
}

export function useProfile() {
  const u = useUserId();
  return useQuery({ queryKey: keys.profile(u), queryFn: () => getProfile(u), enabled: !!u });
}
export function useOrders() {
  const u = useUserId();
  return useQuery({ queryKey: keys.orders(u), queryFn: () => listOrders(u), enabled: !!u });
}
export function useOrderDetail(id: string) {
  return useQuery({ queryKey: keys.order(id), queryFn: () => getOrderDetail(id), enabled: !!id });
}
export function useStock() {
  const u = useUserId();
  return useQuery({ queryKey: keys.stock(u), queryFn: () => getStock(u), enabled: !!u });
}
export function useCustomers() {
  const u = useUserId();
  return useQuery({ queryKey: keys.customers(u), queryFn: () => listCustomers(u), enabled: !!u });
}
export function useCatalog() {
  return useQuery({ queryKey: keys.catalog, queryFn: getCatalog, staleTime: 10 * 60_000 });
}
export function useGeneralExpenses() {
  const u = useUserId();
  return useQuery({ queryKey: keys.expenses(u), queryFn: () => listGeneralExpenses(u), enabled: !!u });
}
export function useGeneralIncome() {
  const u = useUserId();
  return useQuery({ queryKey: keys.income(u), queryFn: () => listGeneralIncome(u), enabled: !!u });
}
export function useTargets() {
  const u = useUserId();
  return useQuery({ queryKey: keys.targets(u), queryFn: () => listTargets(u), enabled: !!u });
}

/** Mutation that refreshes the given data sets when it succeeds. */
export function useRefreshingMutation<TInput, TResult>(
  fn: (input: TInput) => Promise<TResult>,
  invalidate: ('profile' | 'orders' | 'stock' | 'customers' | 'expenses' | 'income' | 'targets' | 'order')[],
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: async () => {
      await Promise.all(invalidate.map(key => client.invalidateQueries({ queryKey: [key] })));
    },
  });
}
