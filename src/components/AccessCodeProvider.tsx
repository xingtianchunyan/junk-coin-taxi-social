
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
      // 设置 JWT claims 以便数据库 RLS 策略可以访问 access_code
      updateJWTClaims(accessCode);
    } else {
      setUserProfile(null);
    }
  }, [accessCode]);

  const updateJWTClaims = async (code: string) => {
    try {
      // 创建一个临时会话来设置 JWT claims
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // 如果没有会话，创建匿名会话
        await supabase.auth.signInAnonymously({
          options: {
            data: {
              access_code: code
            }
          }
        });
      } else {
        // 更新现有会话的元数据
        await supabase.auth.updateUser({
          data: {
            access_code: code
          }
        });
      }
    } catch (error) {
      console.error('更新 JWT claims 失败:', error);
    }
  };

  const setAccessCode = (code: string) => {
    setAccessCodeState(code);
    localStorage.setItem('userAccessCode', code);
  };

  const clearAccessCode = () => {
    setAccessCodeState(null);
    setUserProfile(null);
    localStorage.clear();
    // 清除会话
    supabase.auth.signOut();
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
