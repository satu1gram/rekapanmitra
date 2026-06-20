import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MitraLevel } from '@/types';

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  location: string | null;
  mitra_level: MitraLevel;
  custom_buy_price: number | null;
  custom_level_name: string | null;
  onboarding_completed: boolean | null;
  role?: 'admin' | 'mitra';
  created_at: string;
  updated_at: string;
}

interface ProfileContextType {
  profile: Profile | null;
  /** True while the profile for the *current* user has not been fetched yet */
  loading: boolean;
  mitraLevel: MitraLevel;
  customBuyPrice: number | null;
  updateMitraLevel: (level: MitraLevel, customData?: { customLevelName: string; customBuyPrice: number }) => Promise<void>;
  updateProfile: (data: { name?: string; phone?: string; location?: string }) => Promise<void>;
  refetch: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  // Track which userId we last completed a fetch for.
  // loading is derived: true whenever fetchedForUserId doesn't match the current user.
  const [fetchedForUserId, setFetchedForUserId] = useState<string | null | undefined>(undefined);
  const loading = fetchedForUserId !== (user?.id ?? null);

  // Prevent stale async results from overwriting fresh ones
  const fetchCounterRef = useRef(0);

  const fetchProfile = useCallback(async () => {
    const myCount = ++fetchCounterRef.current;

    if (!user) {
      setProfile(null);
      setFetchedForUserId(null);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    // Discard result if a newer fetch was started
    if (myCount !== fetchCounterRef.current) return;

    if (error) {
      console.error('Error fetching profile:', error);
    } else {
      setProfile(data
        ? ({ ...data, mitra_level: (data as any).mitra_level || 'reseller' } as Profile)
        : null
      );
    }
    setFetchedForUserId(user.id);
  }, [user?.id]); // stable unless user ID actually changes

  useEffect(() => {
    // Reset fetchedForUserId immediately so `loading` becomes true synchronously
    // before the async fetch completes — prevents stale-profile race conditions
    setFetchedForUserId(undefined);
    fetchProfile();
  }, [fetchProfile]);

  const mitraLevel: MitraLevel = profile?.mitra_level || 'reseller';
  const customBuyPrice: number | null = profile?.custom_buy_price ?? null;

  const updateMitraLevel = useCallback(async (level: MitraLevel, customData?: { customLevelName: string; customBuyPrice: number }) => {
    if (!user) throw new Error('User not authenticated');
    const updatePayload: any = { mitra_level: level };
    if (level === 'custom' && customData) {
      updatePayload.custom_level_name = customData.customLevelName;
      updatePayload.custom_buy_price = customData.customBuyPrice;
    }
    const { error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('user_id', user.id);
    if (error) throw error;
    await fetchProfile(); // refetch to get updated custom fields
  }, [user?.id, fetchProfile]);

  const updateProfile = useCallback(async (data: { name?: string; phone?: string; location?: string }) => {
    if (!user) throw new Error('User not authenticated');
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('user_id', user.id);
    if (error) throw error;
    await fetchProfile();
  }, [user?.id, fetchProfile]);

  return (
    <ProfileContext.Provider value={{ profile, loading, mitraLevel, customBuyPrice, updateMitraLevel, updateProfile, refetch: fetchProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfileContext() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfileContext must be used inside ProfileProvider');
  return ctx;
}
