// useProfile is a thin wrapper around ProfileContext.
// Profile data is fetched once at the top of the tree and shared here —
// no per-component fetches, no duplicate API calls.
export { useProfileContext as useProfile } from '@/contexts/ProfileContext';
