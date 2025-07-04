import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'passenger' | 'driver' | 'owner' | 'admin';

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  phone: string | null;
  roles: UserRole[];
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error is ok
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
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
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
    return profile?.roles?.includes(role) || false;
  };

  const isDriver = (): boolean => hasRole('driver');
  const isOwner = (): boolean => hasRole('owner');
  const isPassenger = (): boolean => hasRole('passenger');

  useEffect(() => {
    fetchProfile();
  }, [user]);

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