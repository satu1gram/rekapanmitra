import { useLocalSearchParams } from 'expo-router';

import { useStock } from '~/hooks/queries';
import { errorMessage } from '~/lib/supabase';
import { ErrorState } from '~/ui/components';
import { RestockFormSkeleton } from '~/ui/skeleton';
import { RestockForm } from '~/ui/RestockForm';

export default function EditRestockScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const stock = useStock();
  if (stock.isPending) return <RestockFormSkeleton title="Ubah restok" />;
  if (stock.isError) return <ErrorState message={errorMessage(stock.error)} onRetry={() => stock.refetch()} />;
  const entry = stock.data.entries.find(e => e.id === id);
  if (!entry) return <ErrorState message="Catatan stok tidak ditemukan atau sudah dihapus." />;
  return <RestockForm entry={entry} />;
}
