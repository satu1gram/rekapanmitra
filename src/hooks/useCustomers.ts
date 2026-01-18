import { useLocalStorage, generateId } from './useLocalStorage';
import { Customer, TierType, Order } from '@/types';

export function useCustomers() {
  const [customers, setCustomers] = useLocalStorage<Customer[]>('bp-customers', []);

  const addOrUpdateCustomer = (order: Order) => {
    setCustomers(prev => {
      const existingIndex = prev.findIndex(c => c.phone === order.customerPhone);
      
      if (existingIndex >= 0) {
        const existing = prev[existingIndex];
        const updatedCustomer: Customer = {
          ...existing,
          name: order.customerName,
          totalOrders: existing.totalOrders + 1,
          totalSpent: existing.totalSpent + order.totalPrice,
          tier: getUpgradedTier(existing.tier, order.tier),
          updatedAt: new Date().toISOString()
        };
        const newList = [...prev];
        newList[existingIndex] = updatedCustomer;
        return newList;
      } else {
        const newCustomer: Customer = {
          id: generateId(),
          name: order.customerName,
          phone: order.customerPhone,
          tier: order.tier,
          totalOrders: 1,
          totalSpent: order.totalPrice,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        return [newCustomer, ...prev];
      }
    });
  };

  const getUpgradedTier = (currentTier: TierType, newTier: TierType): TierType => {
    const tierOrder: TierType[] = ['satuan', 'reseller', 'agen', 'agen_plus', 'sap'];
    const currentIndex = tierOrder.indexOf(currentTier);
    const newIndex = tierOrder.indexOf(newTier);
    return newIndex > currentIndex ? newTier : currentTier;
  };

  const getCustomerByPhone = (phone: string) => {
    return customers.find(c => c.phone === phone);
  };

  return {
    customers,
    addOrUpdateCustomer,
    getCustomerByPhone
  };
}
