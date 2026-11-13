import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, deleteMoneyEntry, saveMoneyEntry, type MoneyInput, type MoneyKind } from '~/data/finance';
import { useGeneralExpenses, useGeneralIncome, useRefreshingMutation } from '~/hooks/queries';
import { formatDate, parseDateLike, sameDay, toDateKey } from '~/lib/dates';
import { formatNumberInput, formatRupiah, parseRupiahInput } from '~/lib/money';
import { errorMessage } from '~/lib/supabase';
import { AppText, ErrorState, Notice } from '~/ui/components';
import { MoneyFormSkeleton } from '~/ui/skeleton';
import { Chips } from '~/ui/Chips';
import { DateCalendar } from '~/ui/DateField';
import { TrashIcon } from '~/ui/icons';
import { FieldRow, Group } from '~/ui/kit';
import { CapsuleButton, SheetHeader, SheetRow, StickyFooter } from '~/ui/sheet';
import { colors, space, accents, featureAccent } from '~/ui/theme';
import { DialogHost, showDialog } from '~/ui/dialog';

export default function MoneyFormScreen() {
  const params = useLocalSearchParams<{ kind?: string; id?: string }>();
  const kind: MoneyKind = params.kind === 'income' ? 'income' : 'expense';
  const expenses = useGeneralExpenses();
  const income = useGeneralIncome();
  const query = kind === 'expense' ? expenses : income;
  if (params.id && query.isPending) return <MoneyFormSkeleton title={`Ubah ${kind === 'expense' ? 'pengeluaran' : 'pemasukan'}`} />;
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
  const [dateOpen, setDateOpen] = useState(false);
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

  const isExpense = kind === 'expense';
  const tone = accents[isExpense ? featureAccent.expense : 'green'];
  const today = sameDay(date, new Date());

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SheetHeader title={title} onClose={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {error ? <Notice tone="danger">{error}</Notice> : null}

        <View style={styles.amountCard}>
          <AppText variant="small" color={colors.textMuted} style={{ fontWeight: '600' }}>Nominal</AppText>
          <View style={styles.amountRow}>
            <AppText variant="title" color={tone.fg} style={{ fontSize: 26 }}>Rp</AppText>
            <TextInput
              value={formatNumberInput(amount)}
              onChangeText={t => setAmount(parseRupiahInput(t))}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={colors.placeholder}
              accessibilityLabel="Nominal"
              style={[styles.amountInput, { color: tone.fg }]}
            />
          </View>
        </View>

        <Group>
          <FieldRow first label="Keterangan" value={name} onChangeText={setName} placeholder={isExpense ? 'mis. Plastik kemasan' : 'mis. Bonus bulanan'} />
          <SheetRow label="Tanggal" value={today ? `Hari ini, ${formatDate(date.toISOString())}` : formatDate(date.toISOString())} onPress={() => setDateOpen(v => !v)} />
          {dateOpen ? <View style={{ paddingBottom: space.md }}><DateCalendar value={date} onChange={d => { setDate(d); setDateOpen(false); }} /></View> : null}
          <FieldRow label="Catatan" value={notes} onChangeText={setNotes} placeholder="Opsional" />
        </Group>

        <View style={{ gap: space.sm }}>
          <AppText variant="heading" style={{ fontWeight: '800' }}>Kategori</AppText>
          <View style={styles.chipCard}><Chips options={categories} value={category} onChange={setCategory} /></View>
        </View>

        {entry ? (
          <Pressable onPress={confirmDelete} accessibilityRole="button" disabled={remove.isPending} style={({ pressed }) => [styles.delete, pressed && { opacity: 0.7 }]}>
            <TrashIcon size={18} color={colors.danger} />
            <AppText variant="bodyStrong" color={colors.danger}>Hapus catatan ini</AppText>
          </Pressable>
        ) : null}
      </ScrollView>
      <StickyFooter>
        <CapsuleButton label={entry ? 'Simpan perubahan' : 'Simpan'} value={amount ? formatRupiah(amount) : undefined} onPress={submit} loading={save.isPending} />
      </StickyFooter>
      <DialogHost />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl },
  amountCard: { backgroundColor: colors.white, borderRadius: 18, padding: 14, gap: 2 },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  amountInput: { flex: 1, minWidth: 0, fontSize: 30, fontWeight: '800', paddingVertical: 4 },
  chipCard: { backgroundColor: colors.white, borderRadius: 18, padding: 12 },
  delete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 46, borderRadius: 18, backgroundColor: colors.white },
});
