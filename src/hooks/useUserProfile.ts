
import { useState, useEffect } from 'react';
import { useAccessCode } from '@/components/AccessCodeProvider';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'passenger' | 'driver' | 'owner' | 'admin';

export interface UserProfile {
  id: string;
  access_code: string;
  role: string | null;
  created_at: string;
  updated_at: string;
}

export const useUserProfile = () => {
  const { userProfile: accessCodeProfile, accessCode } = useAccessCode();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (accessCodeProfile) {
      setProfile(accessCodeProfile);
      setLoading(false);
    } else if (accessCode) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [accessCodeProfile, accessCode]);

  const fetchProfile = async () => {
    if (!accessCode) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('access_code', accessCode)
        .maybeSingle();

      if (error) {
        throw error;
      }

      setProfile(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('获取用户资料失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!accessCode || !profile) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .upsert({
          ...profile,
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      return data;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const hasRole = (role: UserRole): boolean => {
    return profile?.role === role;
  };

  const isDriver = (): boolean => hasRole('driver');
  const isOwner = (): boolean => hasRole('owner');
  const isPassenger = (): boolean => hasRole('passenger');

  return {
    profile,
    loading,
    error,
    updateProfile,
    refetch: fetchProfile,
    hasRole,
    isDriver,
    isOwner,
    isPassenger,
  };
};
