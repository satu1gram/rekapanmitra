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
import { useGeneralExpenses, EXPENSE_CATEGORIES, GeneralExpense } from '@/hooks/useGeneralExpenses';
import { formatCurrency, formatShortCurrency } from '@/lib/formatters';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Plus,
  Loader2,
  Wallet,
  Edit2,
  Trash2,
  Calendar,
  TrendingDown
} from 'lucide-react';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export function ExpensesPage() {
  const {
    expenses,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    getMonthExpenses,
    getTotalExpenses
  } = useGeneralExpenses();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<GeneralExpense | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState(0);
  const [formCategory, setFormCategory] = useState('other');
  const [formNotes, setFormNotes] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);

  const monthExpenses = getMonthExpenses();
  const totalMonthExpenses = getTotalExpenses(monthExpenses);
  const totalAllExpenses = getTotalExpenses(expenses);

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

  const openEditDialog = (expense: GeneralExpense) => {
    setFormName(expense.name);
    setFormAmount(expense.amount);
    setFormCategory(expense.category);
    setFormNotes(expense.notes || '');
    setFormDate(expense.expenseDate);
    setEditingExpense(expense);
  };

  const handleSubmit = async () => {
    if (!formName.trim()) {
      toast.error('Nama pengeluaran harus diisi');
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
        expenseDate: formDate,
      };

      if (editingExpense) {
        await updateExpense(editingExpense.id, data);
        toast.success('Pengeluaran diperbarui');
        setEditingExpense(null);
      } else {
        await addExpense(data);
        toast.success('Pengeluaran ditambahkan');
        setShowAddDialog(false);
      }
      resetForm();
    } catch (error) {
      console.error('Error saving expense:', error);
      toast.error('Gagal menyimpan pengeluaran');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (expenseId: string) => {
    try {
      await deleteExpense(expenseId);
      toast.success('Pengeluaran dihapus');
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Gagal menghapus pengeluaran');
    }
    setDeleteConfirm(null);
  };

  const getCategoryLabel = (value: string) => {
    return EXPENSE_CATEGORIES.find(c => c.value === value)?.label || value;
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pengeluaran</h1>
          <p className="text-sm text-muted-foreground">Catat pengeluaran dari keuntungan</p>
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
              <TrendingDown className="h-4 w-4" />
              Bulan Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-destructive">{formatShortCurrency(totalMonthExpenses)}</p>
            <p className="text-xs text-muted-foreground">{monthExpenses.length} pengeluaran</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Wallet className="h-4 w-4" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{formatShortCurrency(totalAllExpenses)}</p>
            <p className="text-xs text-muted-foreground">{expenses.length} pengeluaran</p>
          </CardContent>
        </Card>
      </div>

      {/* Expenses List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Daftar Pengeluaran</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-400px)]">
            <div className="space-y-2">
              {expenses.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Belum ada pengeluaran
                </p>
              ) : (
                expenses.map(expense => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{expense.name}</p>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {getCategoryLabel(expense.category)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(expense.expenseDate), 'd MMM yyyy', { locale: id })}
                        <span className="font-medium text-destructive">-{formatCurrency(expense.amount)}</span>
                      </div>
                      {expense.notes && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">{expense.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <p className="font-medium text-destructive whitespace-nowrap">
                        -{formatShortCurrency(expense.amount)}
                      </p>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(expense)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteConfirm(expense.id)}>
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
      <Dialog open={showAddDialog || !!editingExpense} onOpenChange={(open) => {
        if (!open) {
          setShowAddDialog(false);
          setEditingExpense(null);
          resetForm();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingExpense ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Pengeluaran</Label>
              <Input
                placeholder="Contoh: Bensin, Plastik, dll"
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
                  {EXPENSE_CATEGORIES.map(cat => (
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
              setEditingExpense(null);
              resetForm();
            }}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingExpense ? 'Simpan' : 'Tambah'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pengeluaran?</AlertDialogTitle>
            <AlertDialogDescription>
              Pengeluaran ini akan dihapus permanen.
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
