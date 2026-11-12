import type { MitraLevel, OrderStatus, TierType } from '@/types';
import { getCanonicalProductLabel } from '@/lib/productNames';
import { calculateOrderStockReversal } from '@/lib/orderDeletion';
import { supabase } from '~/lib/supabase';
import { buyPricePerBottle, computeOrderTotals, type CostRule, type DraftExpense, type DraftItem } from '~/lib/orderMath';
import { fetchAllPages, requireUserId, untyped, type OrderExpenseRow, type OrderRow } from './db';

export async function listOrders(userId: string): Promise<OrderRow[]> {
  return fetchAllPages<OrderRow>((from, to) =>
    supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to),
  );
}

export interface OrderLine {
  id: string;
  productName: string;
  productId: string | null;
  quantity: number;
  pricePerBottle: number;
  subtotal: number;
}

export async function getOrderDetail(orderId: string) {
  const [orderRes, itemsRes, expensesRes] = await Promise.all([
    supabase.from('orders').select('*').eq('id', orderId).maybeSingle(),
    supabase.from('order_items').select('*').eq('order_id', orderId).order('created_at', { ascending: true }),
    untyped.from('order_expenses').select('*').eq('order_id', orderId).order('created_at', { ascending: true }),
  ]);
  if (orderRes.error) throw orderRes.error;
  if (!orderRes.data) throw new Error('Order tidak ditemukan atau sudah dihapus.');
  if (itemsRes.error) throw itemsRes.error;
  // order_expenses may not exist on very old databases (PGRST205); treat as no expenses.
  if (expensesRes.error && (expensesRes.error as { code?: string }).code !== 'PGRST205') throw expensesRes.error;

  const items: OrderLine[] = (itemsRes.data ?? []).map(item => ({
    id: item.id,
    productName: getCanonicalProductLabel(item.product_name),
    productId: item.product_id,
    quantity: item.quantity,
    pricePerBottle: Number(item.price_per_bottle),
    subtotal: Number(item.subtotal),
  }));
  const expenses = ((expensesRes.data ?? []) as OrderExpenseRow[]).map(e => ({ id: e.id, name: e.name, amount: Number(e.amount) }));
  return { order: orderRes.data, items, expenses };
}

export interface NewOrderInput {
  customerName: string;
  customerPhone: string;
  customerId?: string | null;
  tier: TierType;
  items: DraftItem[];
  expenses: DraftExpense[];
  mitraLevel: MitraLevel;
  customBuyPrice: number | null;
  /** Cost per bottle per product (mitraCostLookup); defaults to the single profile cost. */
  cost?: CostRule;
  createdAt: string;
  transferProofUrl?: string | null;
}

/**
 * Save an order the same way the web app does (header, then items, then expenses), but every
 * step is checked: if items or expenses fail, the header is removed so no half order is left behind.
 * A server-side atomic RPC is still the long-term fix (docs/MOBILE_AI_BLUEPRINT.md, Tahap B).
 */
export async function createOrder(input: NewOrderInput): Promise<OrderRow> {
  const userId = await requireUserId();
  const items = input.items.filter(item => item.quantity > 0);
  if (items.length === 0) throw new Error('Pilih minimal satu produk.');
  if (items.some(item => !Number.isInteger(item.quantity) || item.quantity <= 0)) throw new Error('Jumlah produk harus bilangan bulat positif.');

  const totals = computeOrderTotals(items, input.expenses, input.cost ?? buyPricePerBottle(input.mitraLevel, input.customBuyPrice));

  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      customer_id: input.customerId || null,
      customer_name: input.customerName.trim(),
      customer_phone: input.customerPhone.trim(),
      tier: input.tier,
      quantity: totals.totalQuantity,
      price_per_bottle: totals.avgPricePerBottle,
      total_price: totals.totalPrice,
      buy_price: totals.buyPrice,
      margin: totals.margin,
      transfer_proof_url: input.transferProofUrl || null,
      status: 'selesai',
      created_at: input.createdAt,
    })
    .select()
    .single();
  if (error) throw error;

  try {
    const { error: itemsError } = await supabase.from('order_items').insert(
      items.map(item => ({
        order_id: order.id,
        user_id: userId,
        product_name: item.productName,
        product_id: item.productId || null,
        quantity: item.quantity,
        price_per_bottle: item.pricePerBottle,
        subtotal: item.subtotal,
      })),
    );
    if (itemsError) throw itemsError;

    if (input.expenses.length > 0) {
      const { error: expensesError } = await untyped.from('order_expenses').insert(
        input.expenses.map(expense => ({
          order_id: order.id,
          user_id: userId,
          name: expense.name.trim(),
          amount: Number(expense.amount),
        })),
      );
      if (expensesError) throw expensesError;
    }
  } catch (stepError) {
    // Roll back the header (order_items/order_expenses cascade on delete).
    await supabase.from('orders').delete().eq('id', order.id).eq('user_id', userId);
    throw stepError;
  }

  return order;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const userId = await requireUserId();
  const { error } = await supabase.from('orders').update({ status }).eq('id', orderId).eq('user_id', userId);
  if (error) throw error;
}

/** Mirrors the web delete: return stock taken by the order, remove its stock log, then the order. */
export async function deleteOrder(orderId: string) {
  const userId = await requireUserId();
  const { data: entries, error: entriesError } = await supabase
    .from('stock_entries')
    .select('id, order_id, type, quantity')
    .eq('user_id', userId)
    .eq('order_id', orderId);
  if (entriesError) throw entriesError;

  const { totalQuantity, entryIds } = calculateOrderStockReversal(entries ?? []);
  if (totalQuantity > 0) {
    const { data: stock, error: stockError } = await supabase
      .from('user_stock')
      .select('current_stock')
      .eq('user_id', userId)
      .maybeSingle();
    if (stockError) throw stockError;
    if (stock) {
      const { error: updateError } = await supabase
        .from('user_stock')
        .update({ current_stock: Number(stock.current_stock ?? 0) + totalQuantity })
        .eq('user_id', userId);
      if (updateError) throw updateError;
    }
  }
  if (entryIds.length > 0) {
    const { error } = await supabase.from('stock_entries').delete().in('id', entryIds);
    if (error) throw error;
  }
  const { error } = await supabase.from('orders').delete().eq('id', orderId).eq('user_id', userId);
  if (error) throw error;
}

function itemRows(orderId: string, userId: string, items: DraftItem[]) {
  return items.map(item => ({
    order_id: orderId,
    user_id: userId,
    product_name: item.productName,
    product_id: item.productId || null,
    quantity: item.quantity,
    price_per_bottle: item.pricePerBottle,
    subtotal: item.subtotal,
  }));
}

/**
 * Edit an order (same result as the web app's updateOrder). To avoid losing lines if the network
 * drops halfway, the new items/expenses are inserted first, then the old ones are removed by id,
 * and only then is the header updated. On failure the newly inserted rows are removed again.
 */
export async function updateOrder(orderId: string, input: NewOrderInput) {
  const userId = await requireUserId();
  const items = input.items.filter(item => item.quantity > 0);
  if (items.length === 0) throw new Error('Pilih minimal satu produk.');
  const totals = computeOrderTotals(items, input.expenses, input.cost ?? buyPricePerBottle(input.mitraLevel, input.customBuyPrice));

  const [oldItems, oldExpenses] = await Promise.all([
    supabase.from('order_items').select('id').eq('order_id', orderId),
    untyped.from('order_expenses').select('id').eq('order_id', orderId),
  ]);
  if (oldItems.error) throw oldItems.error;
  if (oldExpenses.error && (oldExpenses.error as { code?: string }).code !== 'PGRST205') throw oldExpenses.error;
  const oldItemIds = (oldItems.data ?? []).map(r => r.id);
  const oldExpenseIds = ((oldExpenses.data ?? []) as { id: string }[]).map(r => r.id);

  const insertedItemIds: string[] = [];
  const insertedExpenseIds: string[] = [];
  try {
    const { data: newItems, error: itemsError } = await supabase.from('order_items').insert(itemRows(orderId, userId, items)).select('id');
    if (itemsError) throw itemsError;
    insertedItemIds.push(...(newItems ?? []).map(r => r.id));

    if (input.expenses.length > 0) {
      const { data: newExpenses, error: expensesError } = await untyped
        .from('order_expenses')
        .insert(input.expenses.map(e => ({ order_id: orderId, user_id: userId, name: e.name.trim(), amount: Number(e.amount) })))
        .select('id');
      if (expensesError) throw expensesError;
      insertedExpenseIds.push(...((newExpenses ?? []) as { id: string }[]).map(r => r.id));
    }

    const { error: headerError } = await supabase
      .from('orders')
      .update({
        customer_id: input.customerId || null,
        customer_name: input.customerName.trim(),
        customer_phone: input.customerPhone.trim(),
        tier: input.tier,
        quantity: totals.totalQuantity,
        price_per_bottle: totals.avgPricePerBottle,
        total_price: totals.totalPrice,
        buy_price: totals.buyPrice,
        margin: totals.margin,
        transfer_proof_url: input.transferProofUrl || null,
        created_at: input.createdAt,
      })
      .eq('id', orderId)
      .eq('user_id', userId);
    if (headerError) throw headerError;
  } catch (error) {
    if (insertedItemIds.length) await supabase.from('order_items').delete().in('id', insertedItemIds);
    if (insertedExpenseIds.length) await untyped.from('order_expenses').delete().in('id', insertedExpenseIds);
    throw error;
  }

  // The order now points at the new lines; remove the previous ones.
  if (oldItemIds.length) {
    const { error } = await supabase.from('order_items').delete().in('id', oldItemIds);
    if (error) throw error;
  }
  if (oldExpenseIds.length) {
    const { error } = await untyped.from('order_expenses').delete().in('id', oldExpenseIds);
    if (error) throw error;
  }
}

export async function setOrderProof(orderId: string, url: string | null) {
  const userId = await requireUserId();
  const { error } = await supabase.from('orders').update({ transfer_proof_url: url }).eq('id', orderId).eq('user_id', userId);
  if (error) throw error;
}

/** Orders of one customer: linked by id, or (older rows) by the same name. */
export function ordersForCustomer(orders: OrderRow[], customer: { id: string; name: string }) {
  const name = customer.name.trim().toLowerCase();
  return orders.filter(o => o.customer_id === customer.id || (!o.customer_id && o.customer_name?.trim().toLowerCase() === name));
}
