import { useState, useEffect } from 'react';
import { useAccessCode } from '@/components/AccessCodeProvider';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'passenger' | 'driver' | 'community_admin';

export interface UserProfile {
  id: string;
  access_code: string;
  role: string | null;
  created_at: string;
  updated_at: string;
}

export const useUserProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { accessCode } = useAccessCode();

  const fetchProfile = async () => {
    if (!accessCode) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('access_code', accessCode)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // 用户不存在，创建新用户
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert([{ access_code: accessCode }])
            .select()
            .single();

          if (createError) throw createError;
          setProfile(newUser);
        } else {
          throw error;
        }
      } else {
        setProfile(data);
      }
    } catch (err: any) {
      console.error('获取用户资料失败:', err);
      setError(err.message || '获取用户资料失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [accessCode]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile) throw new Error('No profile found');

    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      return data;
    } catch (err: any) {
      console.error('更新用户资料失败:', err);
      throw err;
    }
  };

  const hasRole = (role: UserRole): boolean => {
    return profile?.role === role;
  };

  const isDriver = (): boolean => hasRole('driver');
  const isAdmin = (): boolean => hasRole('community_admin');
  const isPassenger = (): boolean => hasRole('passenger');

  return {
    profile,
    loading,
    error,
    updateProfile,
    refetch: fetchProfile,
    hasRole,
    isDriver,
    isAdmin,
    isPassenger,
  };
};