import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useStock } from '@/hooks/useStockDb';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useProfile } from '@/hooks/useProfile';
import { TierType, TIER_PRICING, MITRA_LEVELS } from '@/types';
import { formatCurrency, formatDateTime, formatShortCurrency } from '@/lib/formatters';
import {
  Plus,
  Upload,
  X,
  Package,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Loader2,
  Edit,
  Trash2,
  Calendar,
  Minus,
  ChevronDown,
  ChevronUp,
  Settings2
} from 'lucide-react';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type StockEntry = Tables<'stock_entries'>;

export function StockPage() {
  const { currentStock, stockEntries, loading, addStock, updateStockEntry, deleteStockEntry, isLowStock } = useStock();
  const { uploadTransferProof } = useFileUpload();
  const { mitraLevel } = useProfile();

  const mitraInfo = MITRA_LEVELS[mitraLevel];

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [buyPrice, setBuyPrice] = useState(mitraInfo.buyPricePerBottle);

  // Update buyPrice when mitraLevel changes (e.g. after profile loads)
  useEffect(() => {
    setBuyPrice(MITRA_LEVELS[mitraLevel].buyPricePerBottle);
  }, [mitraLevel]);
  const [transferProofUrl, setTransferProofUrl] = useState<string | null>(null);
  const [transferProofPreview, setTransferProofPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [stockDate, setStockDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterType, setFilterType] = useState<'all' | 'in' | 'out'>('all');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit mode
  const [editingEntry, setEditingEntry] = useState<StockEntry | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Delete confirmation
  const [deletingEntry, setDeletingEntry] = useState<StockEntry | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const totalBuyPrice = quantity * buyPrice;

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
      toast.success('Bukti bayar berhasil diupload');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Gagal upload bukti bayar');
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
    setQuantity(1);
    setBuyPrice(mitraInfo.buyPricePerBottle);
    setTransferProofUrl(null);
    setTransferProofPreview(null);
    setNotes('');
    setStockDate(new Date().toISOString().split('T')[0]);
    setShowAdvanced(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (quantity < 1) {
      toast.error('Jumlah minimal 1 botol');
      return;
    }

    setSubmitting(true);
    try {
      await addStock({
        quantity,
        tier: mitraLevel as TierType,
        buyPricePerBottle: buyPrice,
        transferProofUrl: transferProofUrl || undefined,
        notes: notes.trim() || undefined,
        createdAt: stockDate ? new Date(stockDate).toISOString() : undefined
      });

      toast.success(`Berhasil menambah ${quantity} botol ke stok!`);
      resetForm();
    } catch (error) {
      console.error('Error adding stock:', error);
      toast.error('Gagal menambah stok');
    } finally {
      setSubmitting(false);
    }
  };

  // Edit handlers
  const openEditDialog = (entry: StockEntry) => {
    setEditingEntry(entry);
    setQuantity(entry.quantity);
    setBuyPrice(entry.buy_price_per_bottle || mitraInfo.buyPricePerBottle);
    setTransferProofUrl(entry.transfer_proof_url);
    setTransferProofPreview(entry.transfer_proof_url);
    setNotes(entry.notes || '');
    if (entry.created_at) {
      setStockDate(new Date(entry.created_at).toISOString().split('T')[0]);
    }
    setShowEditDialog(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    if (quantity < 1) {
      toast.error('Jumlah minimal 1 botol');
      return;
    }

    setSubmitting(true);
    try {
      await updateStockEntry(editingEntry.id, {
        quantity,
        tier: mitraLevel as TierType,
        buyPricePerBottle: buyPrice,
        transferProofUrl: transferProofUrl || undefined,
        notes: notes.trim() || undefined,
        createdAt: stockDate ? new Date(stockDate).toISOString() : undefined
      }, editingEntry.quantity);

      toast.success('Restok berhasil diupdate!');
      setShowEditDialog(false);
      setEditingEntry(null);
      resetForm();
    } catch (error) {
      console.error('Error updating stock entry:', error);
      toast.error('Gagal mengupdate restok');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete handlers
  const openDeleteDialog = (entry: StockEntry) => {
    setDeletingEntry(entry);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!deletingEntry) return;

    setSubmitting(true);
    try {
      await deleteStockEntry(deletingEntry.id, deletingEntry.quantity, deletingEntry.type);
      toast.success('Riwayat stok berhasil dihapus!');
      setShowDeleteDialog(false);
      setDeletingEntry(null);
    } catch (error) {
      console.error('Error deleting stock entry:', error);
      toast.error('Gagal menghapus riwayat stok');
    } finally {
      setSubmitting(false);
    }
  };

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
          <h1 className="text-2xl font-bold">Stok</h1>
          <p className="text-sm text-muted-foreground">Kelola persediaan produk</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="lg">
          {showForm ? <X className="mr-2 h-5 w-5" /> : <Plus className="mr-2 h-5 w-5" />}
          {showForm ? 'Batal' : 'Restok'}
        </Button>
      </div>

      {/* Current Stock Card */}
      <Card className={isLowStock ? 'border-destructive' : ''}>
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`rounded-full p-3 ${isLowStock ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                <Package className={`h-6 w-6 ${isLowStock ? 'text-destructive' : 'text-primary'}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Stok Saat Ini</p>
                <p className="text-3xl font-bold">{currentStock}</p>
                <p className="text-xs text-muted-foreground">botol</p>
              </div>
            </div>
            {isLowStock && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium text-destructive">
                  Stok Rendah!
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Stock Form - Simplified */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Restok dari Distributor</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Quantity with +/- Buttons */}
              <div className="space-y-2">
                <Label className="text-base font-medium">Jumlah Botol</Label>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 shrink-0 text-lg"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={submitting || quantity <= 1}
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <Input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => {
                      const parsed = parseInt(e.target.value.replace(/^0+/, '')) || 1;
                      setQuantity(parsed);
                    }}
                    disabled={submitting}
                    className="h-12 text-center text-xl font-bold"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 shrink-0 text-lg"
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={submitting}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Buy Price - Auto from profile */}
              <div className="space-y-2">
                <Label className="text-base font-medium">Harga Beli per Botol</Label>
                <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
                  <span className="text-lg font-bold">{formatCurrency(buyPrice)}</span>
                  <span className="text-sm text-muted-foreground">
                    (Level: {mitraInfo.label})
                  </span>
                </div>
              </div>

              {/* Summary - Always Visible */}
              <Card className="bg-muted/50">
                <CardContent className="py-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Pembelian</span>
                    <span>{formatCurrency(totalBuyPrice)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {quantity} botol × {formatCurrency(buyPrice)}
                  </p>
                </CardContent>
              </Card>

              {/* Collapsible Advanced Options */}
              <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="ghost" className="w-full gap-2 text-muted-foreground">
                    <Settings2 className="h-4 w-4" />
                    Lainnya (Tanggal, Catatan, Bukti)
                    {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-2">
                  {/* Stock Date */}
                  <div className="space-y-2">
                    <Label htmlFor="stockDate" className="text-base font-medium">
                      <Calendar className="mr-1 inline h-4 w-4" />
                      Tanggal
                    </Label>
                    <Input
                      id="stockDate"
                      type="date"
                      value={stockDate}
                      onChange={(e) => setStockDate(e.target.value)}
                      disabled={submitting}
                      className="h-12 text-base"
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-base font-medium">Catatan</Label>
                    <Input
                      id="notes"
                      placeholder="Contoh: Beli dari Pak Budi"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      disabled={submitting}
                      className="h-12 text-base"
                    />
                  </div>

                  {/* Transfer Proof Upload */}
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Bukti Bayar</Label>
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
                          alt="Bukti bayar"
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
                        className="w-full h-12 text-base"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={submitting}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Bukti Bayar
                      </Button>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Tambah ke Stok'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Stock History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Riwayat Stok</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
            {(['all', 'in', 'out'] as const).map(type => (
              <Button
                key={type}
                size="sm"
                variant={filterType === type ? 'default' : 'outline'}
                onClick={() => setFilterType(type)}
              >
                {type === 'all' ? 'Semua' : type === 'in' ? 'Masuk' : 'Keluar'}
              </Button>
            ))}
          </div>
          {stockEntries.filter(e => filterType === 'all' || e.type === filterType).length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Belum ada riwayat stok
            </p>
          ) : (
            stockEntries.filter(e => filterType === 'all' || e.type === filterType).map(entry => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
              >
                <div className="flex items-center gap-3">
                  <div className={`rounded-full p-2 ${entry.type === 'in' ? 'bg-primary/10' : 'bg-destructive/10'}`}>
                    {entry.type === 'in' ? (
                      <ArrowDown className="h-4 w-4 text-primary" />
                    ) : (
                      <ArrowUp className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {entry.type === 'in' ? 'Restok' : 'Keluar'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(entry.created_at)}
                    </p>
                    {entry.notes && (
                      <p className="text-xs text-muted-foreground">{entry.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className={`font-bold ${entry.type === 'in' ? 'text-primary' : 'text-destructive'}`}>
                      {entry.type === 'in' ? '+' : '-'}{entry.quantity} botol
                    </p>
                    {entry.total_buy_price && (
                      <p className="text-xs text-muted-foreground">
                        {formatShortCurrency(Number(entry.total_buy_price))}
                      </p>
                    )}
                  </div>
                  {entry.type === 'in' && (
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(entry)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => openDeleteDialog(entry)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Edit Stock Entry Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Restok</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {/* Quantity with +/- */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Jumlah Botol</Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 shrink-0"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={submitting || quantity <= 1}
                >
                  <Minus className="h-5 w-5" />
                </Button>
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value.replace(/^0+/, '')) || 1;
                    setQuantity(parsed);
                  }}
                  disabled={submitting}
                  className="h-12 text-center text-xl font-bold"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 shrink-0"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={submitting}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-base font-medium">Harga Beli per Botol</Label>
              <Input
                type="number"
                min={0}
                step={1000}
                value={buyPrice}
                onChange={(e) => {
                  const parsed = parseInt(e.target.value.replace(/^0+/, '')) || 0;
                  setBuyPrice(parsed);
                }}
                disabled={submitting}
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-base font-medium">Tanggal</Label>
              <Input
                type="date"
                value={stockDate}
                onChange={(e) => setStockDate(e.target.value)}
                disabled={submitting}
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-base font-medium">Catatan (opsional)</Label>
              <Input
                placeholder="Contoh: Beli dari Pak Budi"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={submitting}
                className="h-12 text-base"
              />
            </div>

            <Card className="bg-muted/50">
              <CardContent className="py-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Pembelian</span>
                  <span>{formatCurrency(totalBuyPrice)}</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-12"
                onClick={() => {
                  setShowEditDialog(false);
                  setEditingEntry(null);
                  resetForm();
                }}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button type="submit" className="flex-1 h-12" disabled={submitting}>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Riwayat Stok?</AlertDialogTitle>
            <AlertDialogDescription>
              Ini akan menghapus riwayat restok dan menyesuaikan stok saat ini.
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                'Hapus'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
