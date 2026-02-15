import { OrderItem } from '@/types';

interface ReceiptData {
  customerName: string;
  customerPhone: string;
  orderDate: string;
  items: OrderItem[];
  totalQuantity: number;
  totalPrice: number;
}

export function generateReceiptText(data: ReceiptData): string {
  const date = new Date(data.orderDate).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const lines: string[] = [];

  lines.push(`*List Orderan ${data.customerName}*`);
  lines.push(date);
  lines.push('');

  // Items - only show items with quantity > 0
  const activeItems = data.items.filter(item => item.quantity > 0);
  activeItems.forEach(item => {
    lines.push(`${item.productName}: ${item.quantity} botol`);
  });

  lines.push('');
  lines.push(`No. HP: ${data.customerPhone}`);
  lines.push('');

  const formattedPrice = new Intl.NumberFormat('id-ID').format(data.totalPrice);
  lines.push(`*Total: ${data.totalQuantity} botol = Rp${formattedPrice}*`);

  return lines.join('\n');
}
