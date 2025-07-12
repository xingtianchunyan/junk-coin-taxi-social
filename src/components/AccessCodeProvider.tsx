
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

interface AccessCodeContextType {
  accessCode: string | null;
  setAccessCode: (code: string) => void;
  clearAccessCode: () => void;
  hasAccess: boolean;
  userProfile: Tables<'users'> | null;
  refreshUserProfile: () => Promise<void>;
}

const AccessCodeContext = createContext<AccessCodeContextType | undefined>(undefined);

export const useAccessCode = () => {
  const context = useContext(AccessCodeContext);
  if (context === undefined) {
    throw new Error('useAccessCode must be used within an AccessCodeProvider');
  }
  return context;
};

export const AccessCodeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accessCode, setAccessCodeState] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<Tables<'users'> | null>(null);

  useEffect(() => {
    // 从 localStorage 恢复访问码
    const savedCode = localStorage.getItem('access_code');
    if (savedCode) {
      setAccessCodeState(savedCode);
    }
  }, []);

  useEffect(() => {
    if (accessCode) {
      refreshUserProfile();
      // 设置 JWT claims 以便数据库 RLS 策略可以访问 access_code
      updateJWTClaims(accessCode);
    } else {
      setUserProfile(null);
    }
  }, [accessCode]);

  const updateJWTClaims = async (code: string) => {
    try {
      // 确保用户存在，如果不存在则创建
      const { data: userData, error: userError } = await supabase.rpc('get_or_create_user_by_access_code', {
        input_access_code: code
      });

      if (userError) {
        console.error('获取或创建用户失败:', userError);
      }
    } catch (error) {
      console.error('更新用户数据失败:', error);
    }
  };

  const setAccessCode = (code: string) => {
    setAccessCodeState(code);
    localStorage.setItem('access_code', code);
  };

  const clearAccessCode = () => {
    setAccessCodeState(null);
    setUserProfile(null);
    // 清除所有可能的访问码存储键名
    localStorage.removeItem('access_code');
    localStorage.removeItem('userAccessCode');
    localStorage.removeItem('rideAccessCode');
  };

  const refreshUserProfile = async () => {
    if (!accessCode) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('access_code', accessCode)
        .single();

      if (error) {
        console.error('获取用户配置文件失败:', error);
        return;
      }

      setUserProfile(data);
    } catch (error) {
      console.error('获取用户配置文件失败:', error);
    }
  };

  const hasAccess = accessCode !== null;

  const value = {
    accessCode,
    setAccessCode,
    clearAccessCode,
    hasAccess,
    userProfile,
    refreshUserProfile,
  };

  return <AccessCodeContext.Provider value={value}>{children}</AccessCodeContext.Provider>;
};
