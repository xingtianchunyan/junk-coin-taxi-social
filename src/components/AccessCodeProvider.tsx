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
    const savedCode = localStorage.getItem('userAccessCode');
    if (savedCode) {
      setAccessCodeState(savedCode);
    }
  }, []);

  useEffect(() => {
    if (accessCode) {
      refreshUserProfile();
    } else {
      setUserProfile(null);
    }
  }, [accessCode]);

  const setAccessCode = (code: string) => {
    setAccessCodeState(code);
    localStorage.setItem('userAccessCode', code);
  };

  const clearAccessCode = () => {
    setAccessCodeState(null);
    setUserProfile(null);
    localStorage.clear();
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