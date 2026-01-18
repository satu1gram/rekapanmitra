import { useLocalStorage, generateId } from './useLocalStorage';
import { Order, OrderStatus, TierType, TIER_PRICING, MitraLevel, MITRA_LEVELS } from '@/types';

export function useOrders() {
  const [orders, setOrders] = useLocalStorage<Order[]>('bp-orders', []);

  const addOrder = (orderData: {
    customerName: string;
    customerPhone: string;
    tier: TierType;
    quantity: number;
    pricePerBottle: number;
    mitraLevel: MitraLevel;
    transferProofUrl?: string;
  }) => {
    const tierInfo = TIER_PRICING[orderData.tier];
    const mitraInfo = MITRA_LEVELS[orderData.mitraLevel];
    
    const totalBottles = orderData.quantity * tierInfo.bottles;
    const buyPrice = mitraInfo.buyPricePerBottle * totalBottles; // Harga modal dari level mitra
    const sellPrice = orderData.pricePerBottle;
    const totalPrice = sellPrice * totalBottles;
    const margin = totalPrice - buyPrice;

    const newOrder: Order = {
      id: generateId(),
      customerId: generateId(),
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      tier: orderData.tier,
      quantity: totalBottles,
      pricePerBottle: sellPrice,
      totalPrice,
      buyPrice,
      margin,
      transferProofUrl: orderData.transferProofUrl,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setOrders(prev => [newOrder, ...prev]);
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, status, updatedAt: new Date().toISOString() }
        : order
    ));
  };

  const deleteOrder = (orderId: string) => {
    setOrders(prev => prev.filter(order => order.id !== orderId));
  };

  const getOrdersByDateRange = (startDate: Date, endDate: Date) => {
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate && orderDate <= endDate;
    });
  };

  const getTodayOrders = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return getOrdersByDateRange(today, tomorrow);
  };

  const getWeekOrders = () => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return getOrdersByDateRange(weekAgo, today);
  };

  const getMonthOrders = () => {
    const today = new Date();
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return getOrdersByDateRange(monthAgo, today);
  };

  return {
    orders,
    addOrder,
    updateOrderStatus,
    deleteOrder,
    getOrdersByDateRange,
    getTodayOrders,
    getWeekOrders,
    getMonthOrders
  };
}
