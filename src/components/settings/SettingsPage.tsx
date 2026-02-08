import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TIER_PRICING, MITRA_LEVELS, MitraLevel } from '@/types';
import { formatCurrency, formatShortCurrency } from '@/lib/formatters';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useProducts, Product } from '@/hooks/useProducts';
import { 
  Lock,
  User,
  Info,
  LogOut,
  Loader2,
  Store,
  Package,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const { profile, mitraLevel, updateMitraLevel, loading: profileLoading } = useProfile();
  const { products, loading: productsLoading, addProduct, updateProduct, deleteProduct } = useProducts();
  const [loggingOut, setLoggingOut] = useState(false);
  const [savingLevel, setSavingLevel] = useState(false);

  // Product form state
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState(250000);
  const [savingProduct, setSavingProduct] = useState(false);

  // Edit product state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState(0);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      toast.success('Berhasil keluar');
    } catch (error) {
      toast.error('Gagal keluar');
    } finally {
      setLoggingOut(false);
    }
  };

  const handleMitraLevelChange = async (level: MitraLevel) => {
    setSavingLevel(true);
    try {
      await updateMitraLevel(level);
      toast.success(`Level mitra diubah ke ${MITRA_LEVELS[level].label}`);
    } catch (error) {
      console.error('Error updating mitra level:', error);
      toast.error('Gagal mengubah level mitra');
    } finally {
      setSavingLevel(false);
    }
  };

  const handleAddProduct = async () => {
    if (!newProductName.trim()) {
      toast.error('Nama produk wajib diisi');
      return;
    }
    setSavingProduct(true);
    try {
      await addProduct(newProductName.trim(), newProductPrice);
      toast.success(`Produk "${newProductName}" ditambahkan`);
      setNewProductName('');
      setNewProductPrice(250000);
      setShowAddProduct(false);
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Gagal menambah produk');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleEditProduct = async () => {
    if (!editingProduct || !editName.trim()) return;
    setSavingProduct(true);
    try {
      await updateProduct(editingProduct.id, {
        name: editName.trim(),
        default_sell_price: editPrice,
      });
      toast.success('Produk berhasil diupdate');
      setEditingProduct(null);
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Gagal mengupdate produk');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    setSavingProduct(true);
    try {
      await deleteProduct(product.id);
      toast.success(`Produk "${product.name}" dihapus`);
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Gagal menghapus produk');
    } finally {
      setSavingProduct(false);
    }
  };

  const startEdit = (product: Product) => {
    setEditingProduct(product);
    setEditName(product.name);
    setEditPrice(product.default_sell_price);
  };

  return (
    <div className="space-y-4 pb-4">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">Konfigurasi aplikasi</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            Profil Mitra
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lokasi</span>
              <span className="font-medium">{profile?.location || 'Malang, Jawa Timur'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mitra Level Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Store className="h-4 w-4" />
            Level Mitra Anda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Level ini menentukan harga modal Anda saat restok dan menghitung margin di setiap order.
            </p>
            {profileLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Select
                value={mitraLevel}
                onValueChange={(v) => handleMitraLevelChange(v as MitraLevel)}
                disabled={savingLevel}
              >
                <SelectTrigger className="h-12 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(MITRA_LEVELS).map(level => (
                    <SelectItem key={level.level} value={level.level}>
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{level.label}</span>
                        <span className="text-xs text-muted-foreground">
                          Modal {formatShortCurrency(level.buyPricePerBottle)}/btl
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {savingLevel && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Menyimpan...
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Products Catalog */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4" />
              Daftar Produk
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddProduct(!showAddProduct)}
            >
              {showAddProduct ? <X className="mr-1 h-4 w-4" /> : <Plus className="mr-1 h-4 w-4" />}
              {showAddProduct ? 'Batal' : 'Tambah'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Produk yang bisa dipilih saat membuat order. Harga bisa diubah per order.
            </p>

            {/* Add Product Form */}
            {showAddProduct && (
              <div className="space-y-3 rounded-lg border p-3">
                <div className="space-y-2">
                  <Label className="text-base font-medium">Nama Produk</Label>
                  <Input
                    placeholder="Contoh: BP Merah, Steffi, dll"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    disabled={savingProduct}
                    className="h-11 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-medium">Harga Jual Default</Label>
                  <Input
                    type="number"
                    min={0}
                    step={1000}
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(parseInt(e.target.value) || 0)}
                    disabled={savingProduct}
                    className="h-11 text-base"
                  />
                </div>
                <Button
                  className="w-full h-11"
                  onClick={handleAddProduct}
                  disabled={savingProduct || !newProductName.trim()}
                >
                  {savingProduct ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Simpan Produk
                </Button>
              </div>
            )}

            {/* Product List */}
            {productsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : products.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground italic">
                Belum ada produk. Tambahkan produk untuk mempermudah input order.
              </div>
            ) : (
              products.map(product => (
                <div key={product.id} className="rounded-lg border p-3">
                  {editingProduct?.id === product.id ? (
                    <div className="space-y-3">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-11 text-base"
                        disabled={savingProduct}
                      />
                      <Input
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(parseInt(e.target.value) || 0)}
                        className="h-11 text-base"
                        disabled={savingProduct}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingProduct(null)}
                          disabled={savingProduct}
                        >
                          <X className="mr-1 h-3 w-3" /> Batal
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleEditProduct}
                          disabled={savingProduct || !editName.trim()}
                        >
                          <Check className="mr-1 h-3 w-3" /> Simpan
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Harga default: {formatCurrency(product.default_sell_price)}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => startEdit(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteProduct(product)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pricing Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4" />
            Tabel Harga (Terkunci)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.values(TIER_PRICING).map(tier => (
              <div 
                key={tier.tier}
                className="rounded-lg border p-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{tier.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {tier.bottles} botol • {formatShortCurrency(tier.pricePerBottle)}/btl
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(tier.totalPrice)}</p>
                    {tier.marginPerBottle > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        Margin {formatShortCurrency(tier.marginPerBottle)}/btl
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-muted/50 p-3">
            <Info className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium">Aturan Harga:</p>
              <ul className="mt-1 list-inside list-disc space-y-1">
                <li>Harga jual bebas, bisa input berapa saja</li>
                <li>Minimal 3 botol untuk jual ulang (menjadi Reseller)</li>
                <li>1 botol hanya untuk konsumsi pribadi</li>
                <li>Tier otomatis naik setelah beli paket lebih besar</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button 
        variant="destructive" 
        className="w-full" 
        onClick={handleLogout}
        disabled={loggingOut}
      >
        {loggingOut ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Keluar...
          </>
        ) : (
          <>
            <LogOut className="mr-2 h-4 w-4" />
            Keluar
          </>
        )}
      </Button>

      {/* App Info */}
      <Card>
        <CardContent className="py-4 text-center">
          <p className="font-semibold">BP Community Manager</p>
          <p className="text-xs text-muted-foreground">Versi 1.1.0 • Made in Malang 🇮🇩</p>
        </CardContent>
      </Card>
    </div>
  );
}
