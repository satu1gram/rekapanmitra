import { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, deleteMoneyEntry, saveMoneyEntry, type MoneyInput, type MoneyKind } from '~/data/finance';
import { useGeneralExpenses, useGeneralIncome, useRefreshingMutation } from '~/hooks/queries';
import { parseDateLike, toDateKey } from '~/lib/dates';
import { formatNumberInput, parseRupiahInput } from '~/lib/money';
import { errorMessage } from '~/lib/supabase';
import { AppText, Button, Card, ErrorState, LoadingState, Notice, Screen, TextField } from '~/ui/components';
import { Chips } from '~/ui/Chips';
import { DateField } from '~/ui/DateField';
import { SheetHeader } from '~/ui/sheet';
import { colors } from '~/ui/theme';
import { DialogHost, showDialog } from '~/ui/dialog';

export default function MoneyFormScreen() {
  const params = useLocalSearchParams<{ kind?: string; id?: string }>();
  const kind: MoneyKind = params.kind === 'income' ? 'income' : 'expense';
  const expenses = useGeneralExpenses();
  const income = useGeneralIncome();
  const query = kind === 'expense' ? expenses : income;
  if (params.id && query.isPending) return <LoadingState />;
  if (params.id && query.isError) return <ErrorState message={errorMessage(query.error)} onRetry={() => query.refetch()} />;
  const entry = params.id ? query.data?.find(e => e.id === params.id) : undefined;
  if (params.id && !entry) return <ErrorState message="Catatan tidak ditemukan atau sudah dihapus." />;
  return <MoneyForm kind={kind} entry={entry} />;
}

function MoneyForm({ kind, entry }: { kind: MoneyKind; entry?: { id: string; name: string; amount: number; category: string; notes: string | null; date: string } }) {
  const categories = kind === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const [name, setName] = useState(entry?.name ?? '');
  const [amount, setAmount] = useState<number | null>(entry?.amount ?? null);
  const [category, setCategory] = useState<string>(entry?.category ?? 'other');
  const [notes, setNotes] = useState(entry?.notes ?? '');
  const [date, setDate] = useState(entry ? parseDateLike(entry.date) : new Date());
  const [error, setError] = useState<string | null>(null);
  const invalidate = kind === 'expense' ? 'expenses' : 'income';
  const save = useRefreshingMutation((input: MoneyInput) => saveMoneyEntry(kind, input, entry?.id), [invalidate]);
  const entryId = entry?.id;
  const remove = useRefreshingMutation(async () => {
    if (!entryId) return;
    await deleteMoneyEntry(kind, entryId);
  }, [invalidate]);
  const title = `${entry ? 'Ubah' : 'Catat'} ${kind === 'expense' ? 'pengeluaran' : 'pemasukan'}`;

  const submit = () => {
    setError(null);
    save.mutate(
      { name, amount: amount ?? 0, category, notes, date: toDateKey(date) },
      { onSuccess: () => router.back(), onError: e => setError(errorMessage(e)) },
    );
  };

  const confirmDelete = () =>
    showDialog('Hapus catatan ini?', undefined, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => remove.mutate(undefined, { onSuccess: () => router.back(), onError: e => setError(errorMessage(e)) }) },
    ]);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.white }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SheetHeader title={title} onClose={() => router.back()} />
      <Screen contentStyle={{ backgroundColor: colors.white }}>
        {error ? <Notice tone="danger">{error}</Notice> : null}
        <Card>
          <TextField label="Keterangan" value={name} onChangeText={setName} placeholder={kind === 'expense' ? 'Contoh: Plastik kemasan' : 'Contoh: Bonus bulanan'} />
          <TextField label="Nominal" value={formatNumberInput(amount)} onChangeText={t => setAmount(parseRupiahInput(t))} keyboardType="number-pad" placeholder="50.000" />
          <DateField label="Tanggal" value={date} onChange={setDate} />
          <AppText variant="small" color={colors.textMuted} style={{ fontWeight: '600' }}>Kategori</AppText>
          <Chips options={categories} value={category} onChange={setCategory} />
          <TextField label="Catatan (opsional)" value={notes} onChangeText={setNotes} />
        </Card>
        <Button label="Simpan" onPress={submit} loading={save.isPending} />
        {entry ? <Button label="Hapus" tone="danger" icon="trash-outline" onPress={confirmDelete} loading={remove.isPending} /> : null}
      </Screen>
      <DialogHost />
    </KeyboardAvoidingView>
  );
}
