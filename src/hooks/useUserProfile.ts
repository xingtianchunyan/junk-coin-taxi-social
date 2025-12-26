
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

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
  const { accessCode, privClient: client } = useAuthStore();

  const fetchProfile = async () => {
    if (!accessCode || !client) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await client
        .from('users')
        .select('*')
        .eq('access_code', accessCode)
        .single();

      if (error) {
        // 不再在客户端创建用户（这会违反 RLS）；用户的创建由 Edge Function 完成
        console.error('获取用户资料失败:', error);
        setProfile(null);
        setError(error.message || '获取用户资料失败');
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('获取用户资料失败:', err);
      setError(err instanceof Error ? err.message : '获取用户资料失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessCode]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile) throw new Error('No profile found');

    const { data, error } = await client
      .from('users')
      .update(updates)
      .eq('id', profile.id)
      .select()
      .single();

    if (error) {
      console.error('更新用户资料失败:', error);
      throw error;
    }
    setProfile(data);
    return data;
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
