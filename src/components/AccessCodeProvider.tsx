
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { createSupabaseWithToken } from '@/integrations/supabase/tokenClient';
import type { SupabaseClient } from '@supabase/supabase-js';
import { rideRequestService } from '@/services/rideRequestService';

interface AccessCodeContextType {
  accessCode: string | null;
  setAccessCode: (code: string) => void;
  clearAccessCode: () => void;
  hasAccess: boolean;
  userProfile: Tables<'users'> | null;
  refreshUserProfile: () => Promise<void>;
  client: SupabaseClient; // 暴露给全局使用（优先使用私有客户端）
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
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [privClient, setPrivClient] = useState<SupabaseClient | null>(null);

  useEffect(() => {
    // 从 localStorage 恢复访问码
    const savedCode = localStorage.getItem('access_code');
    if (savedCode) {
      setAccessCodeState(savedCode);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      if (!accessCode) return;
      try {
        // 向 Edge Function 申请 JWT（会自动创建或获取用户）
        const { data, error } = await supabase.functions.invoke('issue-access-token', {
          body: { access_code: accessCode },
        });
        if (error) {
          console.error('获取访问令牌失败:', error);
          return;
        }
        if (data?.token) {
          setJwtToken(data.token);
          const client = createSupabaseWithToken(data.token);
          setPrivClient(client);

          // 同步私有客户端到服务层，确保后续所有查询/写入走带 JWT 的客户端
          rideRequestService.setClient(client);

          // 先用返回的用户信息预填充
          if (data.user) {
            setUserProfile(data.user);
            // 将当前用户同步给服务层，便于服务层在需要时填充 admin_user_id 等
            rideRequestService.setCurrentUser(data.user);
          }

          // 再拉取最新用户信息
          await refreshUserProfile();
        }
      } catch (e) {
        console.error('初始化私有会话失败:', e);
      }
    };

    if (accessCode) {
      init();
    } else {
      setUserProfile(null);
      setJwtToken(null);
      setPrivClient(null);
      // 清理服务层状态
      rideRequestService.clearClient();
      rideRequestService.setCurrentUser(null);
    }
  }, [accessCode]);

  const setAccessCode = (code: string) => {
    setAccessCodeState(code);
    localStorage.setItem('access_code', code);
  };

  const clearAccessCode = () => {
    setAccessCodeState(null);
    setUserProfile(null);
    setJwtToken(null);
    setPrivClient(null);
    // 清除所有可能的访问码存储键名
    localStorage.removeItem('access_code');
    localStorage.removeItem('userAccessCode');
    localStorage.removeItem('rideAccessCode');
    // 清理服务层状态
    rideRequestService.clearClient();
    rideRequestService.setCurrentUser(null);
  };

  const refreshUserProfile = async () => {
    if (!accessCode) return;

    try {
      const client = privClient ?? supabase;
      const { data, error } = await client
        .from('users')
        .select('*')
        .eq('access_code', accessCode)
        .single();

      if (error) {
        console.error('获取用户配置文件失败:', error);
        return;
      }

      setUserProfile(data);
      // 同步给服务层
      rideRequestService.setCurrentUser(data);
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
    client: privClient ?? supabase,
  };

  return <AccessCodeContext.Provider value={value}>{children}</AccessCodeContext.Provider>;
};
