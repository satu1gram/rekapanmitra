import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useOrders } from '@/hooks/useOrdersDb';
import { useStock } from '@/hooks/useStockDb';
import { useCustomers } from '@/hooks/useCustomersDb';
import { useFileUpload } from '@/hooks/useFileUpload';
import { TierType, TIER_PRICING, MitraLevel, MITRA_LEVELS, OrderStatus, OrderExpense } from '@/types';
import { formatCurrency, formatDateTime, formatShortCurrency } from '@/lib/formatters';
import {
  Plus,
  Upload,
  X,
  Phone,
  User,
  Package,
  ChevronDown,
  ChevronUp,
  Check,
  Truck,
  Loader2,
  Edit,
  Store,
  UserPlus,
  Users,
  Calendar,
  PlusCircle,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Order = Tables<'orders'>;

export function OrdersPage() {
  const {
    orders,
    loading,
    addOrder,
    updateOrder,
    updateOrderStatus,
    fetchOrderExpenses,
    addOrderExpense,
    deleteOrderExpense
  } = useOrders();
  const { currentStock, reduceStock } = useStock();
  const { customers, addOrUpdateCustomer } = useCustomers();
  const { uploadTransferProof } = useFileUpload();

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Customer selection
  const [customerMode, setCustomerMode] = useState<'new' | 'existing'>('new');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const [selectedTier, setSelectedTier] = useState<TierType>('satuan');
  const [mitraLevel, setMitraLevel] = useState<MitraLevel>('reseller');
  const [quantity, setQuantity] = useState(1);
  const [sellPrice, setSellPrice] = useState(250000);
  const [transferProofUrl, setTransferProofUrl] = useState<string | null>(null);
  const [transferProofPreview, setTransferProofPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);

  // Expenses state
  const [orderExpenses, setOrderExpenses] = useState<OrderExpense[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number>(0);

  // Edit mode
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const tierInfo = TIER_PRICING[selectedTier];
  const mitraInfo = MITRA_LEVELS[mitraLevel];
  const totalBuyPrice = mitraInfo.buyPricePerBottle * quantity;
  const totalSellPrice = sellPrice * quantity;
  const estimatedMargin = totalSellPrice - totalBuyPrice;

  // When selecting existing customer, auto-fill fields
  useEffect(() => {
    if (customerMode === 'existing' && selectedCustomerId) {
      const customer = customers.find(c => c.id === selectedCustomerId);
      if (customer) {
        setCustomerName(customer.name);
        setCustomerPhone(customer.phone);
        // Set tier based on customer tier if available
        if (customer.tier && TIER_PRICING[customer.tier as TierType]) {
          setSelectedTier(customer.tier as TierType);
          setSellPrice(TIER_PRICING[customer.tier as TierType].pricePerBottle);
        }
      }
    }
  }, [customerMode, selectedCustomerId, customers]);

  // Fetch expenses when an order is expanded
  useEffect(() => {
    if (expandedOrder) {
      const loadExpenses = async () => {
        setLoadingExpenses(true);
        try {
          const expenses = await fetchOrderExpenses(expandedOrder);
          setOrderExpenses(expenses);
        } catch (error) {
          console.error('Error loading expenses:', error);
          toast.error('Gagal memuat data pengeluaran');
        } finally {
          setLoadingExpenses(false);
        }
      };
      loadExpenses();
    } else {
      setOrderExpenses([]);
    }
    // Reset expense form
    setExpenseName('');
    setExpenseAmount(0);
  }, [expandedOrder, fetchOrderExpenses]);

  const handleAddExpense = async (e: React.FormEvent, orderId: string) => {
    e.preventDefault();
    if (!expenseName.trim() || expenseAmount <= 0) {
      toast.error('Nama dan jumlah pengeluaran harus diisi');
      return;
    }

    setSubmitting(true);
    try {
      const newExpense = await addOrderExpense(orderId, expenseName.trim(), expenseAmount) as any;
      setOrderExpenses(prev => [...prev, {
        id: newExpense.id,
        orderId: newExpense.order_id,
        name: newExpense.name,
        amount: Number(newExpense.amount),
        createdAt: newExpense.created_at
      }]);
      setExpenseName('');
      setExpenseAmount(0);
      toast.success('Pengeluaran ditambahkan');
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Gagal menambah pengeluaran');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (expense: OrderExpense) => {
    try {
      await deleteOrderExpense(expense.id, expense.orderId, expense.amount);
      setOrderExpenses(prev => prev.filter(e => e.id !== expense.id));
      toast.success('Pengeluaran dihapus');
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Gagal menghapus pengeluaran');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setTransferProofPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const url = await uploadTransferProof(file);
      setTransferProofUrl(url);
      toast.success('Bukti transfer berhasil diupload');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Gagal upload bukti transfer');
      setTransferProofPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveProof = () => {
    setTransferProofUrl(null);
    setTransferProofPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setCustomerMode('new');
    setSelectedCustomerId('');
    setCustomerName('');
    setCustomerPhone('');
    setSelectedTier('satuan');
    setMitraLevel('reseller');
    setQuantity(1);
    setSellPrice(250000);
    setTransferProofPreview(null);
    setOrderDate(new Date().toISOString().split('T')[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error('Nama dan nomor WhatsApp wajib diisi');
      return;
    }

    if (quantity > currentStock) {
      toast.error(`Stok tidak cukup. Tersisa ${currentStock} botol`);
      return;
    }

    setSubmitting(true);
    try {
      const order = await addOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        tier: selectedTier,
        quantity,
        pricePerBottle: sellPrice,
        mitraLevel,
        transferProofUrl: transferProofUrl || undefined,
        customerId: selectedCustomerId || undefined,
        createdAt: orderDate ? new Date(orderDate).toISOString() : undefined
      });

      await reduceStock(quantity, order.id);

      await addOrUpdateCustomer({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        tier: selectedTier,
        totalPrice: totalSellPrice
      });

      toast.success('Order berhasil ditambahkan!');
      resetForm();
    } catch (error) {
      console.error('Error adding order:', error);
      toast.error('Gagal menambah order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success(`Status diubah ke ${newStatus}`);
    } catch (error) {
      toast.error('Gagal mengubah status');
    }
  };

  // Edit order handlers
  const openEditDialog = (order: Order) => {
    setEditingOrder(order);
    setCustomerName(order.customer_name);
    setCustomerPhone(order.customer_phone);
    setSelectedTier(order.tier as TierType);
    setQuantity(order.quantity);
    setSellPrice(order.price_per_bottle);
    setTransferProofPreview(order.transfer_proof_url);
    if (order.created_at) {
      setOrderDate(new Date(order.created_at).toISOString().split('T')[0]);
    }
    setShowEditDialog(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error('Nama dan nomor WhatsApp wajib diisi');
      return;
    }

    setSubmitting(true);
    try {
      await updateOrder(editingOrder.id, {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        tier: selectedTier,
        quantity,
        pricePerBottle: sellPrice,
        mitraLevel,
        transferProofUrl: transferProofUrl || undefined,
        createdAt: orderDate ? new Date(orderDate).toISOString() : undefined
      });

      toast.success('Order berhasil diupdate!');
      setShowEditDialog(false);
      setEditingOrder(null);
      resetForm();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Gagal mengupdate order');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter(o => o.status === filterStatus);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Order</h1>
          <p className="text-sm text-muted-foreground">{orders.length} total order</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {showForm ? 'Batal' : 'Tambah'}
        </Button>
      </div>

      {/* Add Order Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Baru</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Customer Mode Toggle */}
              <div className="space-y-2">
                <Label>Pilih Customer</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={customerMode === 'existing' ? 'default' : 'outline'}
                    onClick={() => setCustomerMode('existing')}
                    disabled={customers.length === 0}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Customer Lama
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={customerMode === 'new' ? 'default' : 'outline'}
                    onClick={() => {
                      setCustomerMode('new');
                      setSelectedCustomerId('');
                      setCustomerName('');
                      setCustomerPhone('');
                    }}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Customer Baru
                  </Button>
                </div>
              </div>

              {/* Order Date */}
              <div className="space-y-2">
                <Label htmlFor="orderDate">
                  <Calendar className="mr-1 inline h-4 w-4" />
                  Tanggal Order
                </Label>
                <Input
                  id="orderDate"
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>

              {/* Existing Customer Selection */}
              {customerMode === 'existing' && customers.length > 0 && (
                <div className="space-y-2">
                  <Label>Pilih Customer</Label>
                  <Select
                    value={selectedCustomerId}
                    onValueChange={setSelectedCustomerId}
                    disabled={submitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih customer..." />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>
                          <div className="flex items-center gap-2">
                            <span>{customer.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({customer.phone})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Customer Info (editable for new, read-only for existing) */}
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">
                    <User className="mr-1 inline h-4 w-4" />
                    Nama Customer
                  </Label>
                  <Input
                    id="customerName"
                    placeholder="Nama lengkap"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    disabled={submitting || (customerMode === 'existing' && !!selectedCustomerId)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">
                    <Phone className="mr-1 inline h-4 w-4" />
                    Nomor WhatsApp
                  </Label>
                  <Input
                    id="customerPhone"
                    placeholder="08xxxxxxxxxx"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                    disabled={submitting || (customerMode === 'existing' && !!selectedCustomerId)}
                  />
                </div>
              </div>

              {/* Jumlah Botol */}
              <div className="space-y-2">
                <Label htmlFor="quantity">Jumlah Botol</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={0}
                  value={quantity}
                  onChange={(e) => {
                    const val = e.target.value;
                    const parsed = parseInt(val.replace(/^0+/, '')) || 0;
                    setQuantity(parsed);
                  }}
                  disabled={submitting}
                />
                <p className="text-xs text-muted-foreground">
                  Stok tersedia: {currentStock} botol
                </p>
              </div>

              {/* Tier/Paket Selection */}
              <div className="space-y-2">
                <Label>
                  <Package className="mr-1 inline h-4 w-4" />
                  Tier Harga (Referensi)
                </Label>
                <Select
                  value={selectedTier}
                  onValueChange={(v) => {
                    setSelectedTier(v as TierType);
                    setSellPrice(TIER_PRICING[v as TierType].pricePerBottle);
                  }}
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(TIER_PRICING).map(tier => (
                      <SelectItem key={tier.tier} value={tier.tier}>
                        <div className="flex items-center justify-between gap-4">
                          <span>{tier.label}</span>
                          <span className="text-xs text-muted-foreground">
                            @ {formatShortCurrency(tier.pricePerBottle)}/btl
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mitra Level Selection */}
              <div className="space-y-2">
                <Label>
                  <Store className="mr-1 inline h-4 w-4" />
                  Level Mitra Anda
                </Label>
                <Select
                  value={mitraLevel}
                  onValueChange={(v) => setMitraLevel(v as MitraLevel)}
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(MITRA_LEVELS).map(level => (
                      <SelectItem key={level.level} value={level.level}>
                        <div className="flex items-center justify-between gap-4">
                          <span>{level.label}</span>
                          <span className="text-xs text-muted-foreground">
                            (Modal: {formatShortCurrency(level.buyPricePerBottle)}/btl)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sell Price */}
              <div className="space-y-2">
                <Label htmlFor="sellPrice">Harga Jual per Botol</Label>
                <Input
                  id="sellPrice"
                  type="number"
                  min={0}
                  step={1000}
                  value={sellPrice}
                  onChange={(e) => {
                    const val = e.target.value;
                    const parsed = parseInt(val.replace(/^0+/, '')) || 0;
                    setSellPrice(parsed);
                  }}
                  disabled={submitting}
                />
              </div>

              {/* Transfer Proof Upload */}
              <div className="space-y-2">
                <Label>Bukti Transfer</Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  className="hidden"
                  disabled={submitting}
                />
                {transferProofPreview ? (
                  <div className="relative">
                    {uploading && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/80">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    )}
                    <img
                      src={transferProofPreview}
                      alt="Bukti transfer"
                      className="h-32 w-full rounded-lg object-cover"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute right-2 top-2 h-8 w-8"
                      onClick={handleRemoveProof}
                      disabled={submitting || uploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={submitting}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Bukti Transfer
                  </Button>
                )}
              </div>

              {/* Summary */}
              <Card className="bg-muted/50">
                <CardContent className="space-y-2 py-4">
                  <div className="flex justify-between text-sm">
                    <span>Harga Modal ({quantity} btl)</span>
                    <span>{formatCurrency(totalBuyPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Harga Jual</span>
                    <span>{formatCurrency(totalSellPrice)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-primary">
                    <span>Estimasi Margin</span>
                    <span>{formatCurrency(estimatedMargin)}</span>
                  </div>
                </CardContent>
              </Card>

              <Button
                type="submit"
                className="w-full"
                disabled={quantity > currentStock || submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Order'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['all', 'pending', 'terkirim', 'selesai'] as const).map(status => (
          <Button
            key={status}
            size="sm"
            variant={filterStatus === status ? 'default' : 'outline'}
            onClick={() => setFilterStatus(status)}
          >
            {status === 'all' ? 'Semua' : status}
          </Button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Belum ada order
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map(order => (
            <Card key={order.id}>
              <CardContent className="py-4">
                <div
                  className="cursor-pointer"
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{order.customer_name}</p>
                      <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          order.status === 'selesai' ? 'default' :
                            order.status === 'terkirim' ? 'secondary' : 'outline'
                        }
                      >
                        {order.status}
                      </Badge>
                      {expandedOrder === order.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {order.quantity} botol • {TIER_PRICING[order.tier as TierType]?.label || order.tier}
                    </span>
                    <span className="font-semibold">{formatCurrency(Number(order.total_price))}</span>
                  </div>
                </div>

                {expandedOrder === order.id && (
                  <div className="mt-4 space-y-4 border-t pt-4">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Margin</p>
                        <p className="font-semibold text-primary">{formatCurrency(Number(order.margin))}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Tanggal</p>
                        <p>{formatDateTime(order.created_at)}</p>
                      </div>
                    </div>

                    {/* Expenses Section */}
                    <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">Pengeluaran Tambahan</p>
                        <p className="text-xs text-muted-foreground">
                          Total: {formatCurrency(orderExpenses.reduce((sum, e) => sum + e.amount, 0))}
                        </p>
                      </div>

                      {/* Expense List */}
                      <div className="space-y-2">
                        {loadingExpenses ? (
                          <div className="flex justify-center py-2">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        ) : orderExpenses.length === 0 ? (
                          <p className="py-2 text-center text-xs text-muted-foreground italic">
                            Belum ada pengeluaran tambahan
                          </p>
                        ) : (
                          orderExpenses.map(expense => (
                            <div key={expense.id} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">•</span>
                                <span>{expense.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{formatCurrency(expense.amount)}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive hover:bg-destructive/10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteExpense(expense);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Add Expense Form */}
                      <form
                        onSubmit={(e) => handleAddExpense(e, order.id)}
                        className="flex items-end gap-2 border-t pt-3"
                      >
                        <div className="flex-1 space-y-1">
                          <Label htmlFor="exp-name" className="text-[10px]">Nama</Label>
                          <Input
                            id="exp-name"
                            placeholder="Ongkir, dll"
                            className="h-8 text-xs"
                            value={expenseName}
                            onChange={(e) => setExpenseName(e.target.value)}
                            disabled={submitting}
                          />
                        </div>
                        <div className="w-24 space-y-1">
                          <Label htmlFor="exp-amount" className="text-[10px]">Jumlah</Label>
                          <Input
                            id="exp-amount"
                            type="number"
                            className="h-8 text-xs"
                            value={expenseAmount}
                            onChange={(e) => {
                              const val = e.target.value;
                              const parsed = parseInt(val.replace(/^0+/, '')) || 0;
                              setExpenseAmount(parsed);
                            }}
                            disabled={submitting}
                          />
                        </div>
                        <Button
                          type="submit"
                          size="icon"
                          className="h-8 w-8"
                          disabled={submitting || !expenseName.trim() || expenseAmount <= 0}
                        >
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>

                    {order.transfer_proof_url && (
                      <div>
                        <p className="mb-2 text-sm text-muted-foreground">Bukti Transfer</p>
                        <img
                          src={order.transfer_proof_url}
                          alt="Bukti transfer"
                          className="h-40 w-full rounded-lg object-cover"
                        />
                      </div>
                    )}

                    {/* Status Actions */}
                    <div className="flex gap-2">
                      {order.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDialog(order);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(order.id, 'terkirim');
                            }}
                          >
                            <Truck className="mr-2 h-4 w-4" />
                            Tandai Terkirim
                          </Button>
                        </>
                      )}
                      {order.status === 'terkirim' && (
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(order.id, 'selesai');
                          }}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Tandai Selesai
                        </Button>
                      )}
                      {order.status === 'selesai' && (
                        <Badge variant="default" className="flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          Selesai
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Order Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="editCustomerName">Nama Customer</Label>
                <Input
                  id="editCustomerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editCustomerPhone">Nomor WhatsApp</Label>
                <Input
                  id="editCustomerPhone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Edit Order Date */}
            <div className="space-y-2">
              <Label htmlFor="editOrderDate">Tanggal Order</Label>
              <Input
                id="editOrderDate"
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Jumlah Botol</Label>
              <Input
                type="number"
                min={0}
                value={quantity}
                onChange={(e) => {
                  const val = e.target.value;
                  const parsed = parseInt(val.replace(/^0+/, '')) || 0;
                  setQuantity(parsed);
                }}
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label>Tier Harga</Label>
              <Select
                value={selectedTier}
                onValueChange={(v) => {
                  setSelectedTier(v as TierType);
                  setSellPrice(TIER_PRICING[v as TierType].pricePerBottle);
                }}
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(TIER_PRICING).map(tier => (
                    <SelectItem key={tier.tier} value={tier.tier}>
                      {tier.label} - {formatShortCurrency(tier.pricePerBottle)}/btl
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Level Mitra</Label>
              <Select
                value={mitraLevel}
                onValueChange={(v) => setMitraLevel(v as MitraLevel)}
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(MITRA_LEVELS).map(level => (
                    <SelectItem key={level.level} value={level.level}>
                      {level.label} - Modal {formatShortCurrency(level.buyPricePerBottle)}/btl
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Harga Jual per Botol</Label>
              <Input
                type="number"
                min={0}
                step={1000}
                value={sellPrice}
                onChange={(e) => {
                  const val = e.target.value;
                  const parsed = parseInt(val.replace(/^0+/, '')) || 0;
                  setSellPrice(parsed);
                }}
                disabled={submitting}
              />
            </div>

            <Card className="bg-muted/50">
              <CardContent className="space-y-2 py-4">
                <div className="flex justify-between text-sm">
                  <span>Harga Modal ({quantity} btl)</span>
                  <span>{formatCurrency(totalBuyPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Harga Jual</span>
                  <span>{formatCurrency(totalSellPrice)}</span>
                </div>
                <div className="flex justify-between font-bold text-primary">
                  <span>Estimasi Margin</span>
                  <span>{formatCurrency(estimatedMargin)}</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowEditDialog(false);
                  setEditingOrder(null);
                }}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Perubahan'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
