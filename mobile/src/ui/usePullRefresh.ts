import { useCallback, useState } from 'react';

/**
 * State for a RefreshControl that only spins while the person is actually pulling.
 * Binding `refreshing` to a query's isRefetching made iOS show a frozen spinner (and push the page down)
 * whenever data refetched in the background, e.g. on focus or after saving.
 */
export function usePullRefresh(refetch: () => Promise<unknown> | unknown) {
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await refetch(); } catch { /* the screen shows its own error panel */ } finally { setRefreshing(false); }
  }, [refetch]);
  return { refreshing, onRefresh };
}
