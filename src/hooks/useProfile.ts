import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { MitraLevel } from '@/types';

interface Profile {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  location: string | null;
  mitra_level: MitraLevel;
  onboarding_completed: boolean | null;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
    } else if (data) {
      setProfile({
        ...data,
        mitra_level: (data as any).mitra_level || 'reseller'
      } as Profile);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const mitraLevel: MitraLevel = profile?.mitra_level || 'reseller';

  const updateMitraLevel = useCallback(async (level: MitraLevel) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('profiles')
      .update({ mitra_level: level } as any)
      .eq('user_id', user.id);

    if (error) throw error;

    setProfile(prev => prev ? { ...prev, mitra_level: level } : null);
  }, [user]);

  const updateProfile = useCallback(async (data: {
    name?: string;
    phone?: string;
    location?: string;
  }) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('user_id', user.id);

    if (error) throw error;
    await fetchProfile();
  }, [user, fetchProfile]);

  return {
    profile,
    loading,
    mitraLevel,
    updateMitraLevel,
    updateProfile,
    refetch: fetchProfile
  };
}
