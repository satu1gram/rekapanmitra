import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useGeneralIncome, INCOME_CATEGORIES, GeneralIncome } from '@/hooks/useGeneralIncome';
import { formatShortCurrency } from '@/lib/formatters';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Plus,
  Loader2,
  TrendingUp,
  Edit2,
  Trash2,
  Calendar,
  CircleDollarSign
} from 'lucide-react';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export function IncomePage() {
  const {
    income,
    loading,
    addIncome,
    updateIncome,
    deleteIncome,
    getMonthIncome,
    getTotalIncome
  } = useGeneralIncome();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingIncome, setEditingIncome] = useState<GeneralIncome | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState(0);
  const [formCategory, setFormCategory] = useState('other');
  const [formNotes, setFormNotes] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);

  const monthIncome = getMonthIncome();
  const totalMonthIncome = getTotalIncome(monthIncome);
  const totalAllIncome = getTotalIncome(income);

  const resetForm = () => {
    setFormName('');
    setFormAmount(0);
    setFormCategory('other');
    setFormNotes('');
    setFormDate(new Date().toISOString().split('T')[0]);
  };

  const openAddDialog = () => {
    resetForm();
    setShowAddDialog(true);
  };

  const openEditDialog = (item: GeneralIncome) => {
    setFormName(item.name);
    setFormAmount(item.amount);
    setFormCategory(item.category);
    setFormNotes(item.notes || '');
    setFormDate(item.incomeDate);
    setEditingIncome(item);
  };

  const handleSubmit = async () => {
    if (!formName.trim()) {
      toast.error('Nama pemasukan harus diisi');
      return;
    }
    if (formAmount <= 0) {
      toast.error('Jumlah harus lebih dari 0');
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        name: formName.trim(),
        amount: formAmount,
        category: formCategory,
        notes: formNotes.trim() || undefined,
        incomeDate: formDate,
      };

      if (editingIncome) {
        await updateIncome(editingIncome.id, data);
        toast.success('Pemasukan diperbarui');
        setEditingIncome(null);
      } else {
        await addIncome(data);
        toast.success('Pemasukan ditambahkan');
        setShowAddDialog(false);
      }
      resetForm();
    } catch (error) {
      console.error('Error saving income:', error);
      toast.error('Gagal menyimpan pemasukan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (incomeId: string) => {
    try {
      await deleteIncome(incomeId);
      toast.success('Pemasukan dihapus');
    } catch (error) {
      console.error('Error deleting income:', error);
      toast.error('Gagal menghapus pemasukan');
    }
    setDeleteConfirm(null);
  };

  const getCategoryLabel = (value: string) => {
    return INCOME_CATEGORIES.find(c => c.value === value)?.label || value;
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pemasukan Lain</h1>
          <p className="text-sm text-muted-foreground">Catat pemasukan di luar order</p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Bulan Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-primary">{formatShortCurrency(totalMonthIncome)}</p>
            <p className="text-xs text-muted-foreground">{monthIncome.length} pemasukan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CircleDollarSign className="h-4 w-4" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{formatShortCurrency(totalAllIncome)}</p>
            <p className="text-xs text-muted-foreground">{income.length} pemasukan</p>
          </CardContent>
        </Card>
      </div>

      {/* Income List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Daftar Pemasukan</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-400px)]">
            <div className="space-y-2">
              {income.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Belum ada pemasukan
                </p>
              ) : (
                income.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{item.name}</p>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {getCategoryLabel(item.category)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(item.incomeDate), 'd MMM yyyy', { locale: id })}
                      </div>
                      {item.notes && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">{item.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <p className="font-medium text-primary whitespace-nowrap">
                        +{formatShortCurrency(item.amount)}
                      </p>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(item)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteConfirm(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog || !!editingIncome} onOpenChange={(open) => {
        if (!open) {
          setShowAddDialog(false);
          setEditingIncome(null);
          resetForm();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingIncome ? 'Edit Pemasukan' : 'Tambah Pemasukan'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Pemasukan</Label>
              <Input
                placeholder="Contoh: Bonus, Freelance, dll"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Jumlah (Rp)</Label>
              <Input
                type="number"
                placeholder="0"
                value={formAmount || ''}
                onChange={(e) => setFormAmount(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INCOME_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tanggal</Label>
              <Input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Catatan (Opsional)</Label>
              <Textarea
                placeholder="Catatan tambahan..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false);
              setEditingIncome(null);
              resetForm();
            }}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingIncome ? 'Simpan' : 'Tambah'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pemasukan?</AlertDialogTitle>
            <AlertDialogDescription>
              Pemasukan ini akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
