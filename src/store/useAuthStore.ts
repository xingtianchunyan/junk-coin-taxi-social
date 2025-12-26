import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { createSupabaseWithToken } from '@/integrations/supabase/tokenClient';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Tables } from '@/integrations/supabase/types';
import type { ExtendedDatabase } from '@/types/supabase';
import { rideRequestService } from '@/services/rideRequestService';
import { vehicleService } from '@/services/vehicleService';

interface AuthState {
  accessCode: string | null;
  userProfile: Tables<'users'> | null;
  jwtToken: string | null;
  privClient: SupabaseClient<ExtendedDatabase> | null;
  hasAccess: boolean;
  
  // Actions
  setAccessCode: (code: string) => Promise<void>;
  clearAccessCode: () => void;
  refreshUserProfile: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessCode: null,
      userProfile: null,
      jwtToken: null,
      privClient: null,
      hasAccess: false,

      initialize: async () => {
        const { accessCode } = get();
        if (!accessCode) return;

        try {
          // 向 Edge Function 申请 JWT
          const { data, error } = await supabase.functions.invoke('issue-access-token', {
            body: { access_code: accessCode },
          });

          if (error) {
            console.error('获取访问令牌失败:', error);
            return;
          }

          if (data?.token) {
            const client = createSupabaseWithToken(data.token) as unknown as SupabaseClient<ExtendedDatabase>;
            
            set({ 
              jwtToken: data.token, 
              privClient: client,
              userProfile: data.user || null,
              hasAccess: true
            });

            // 同步私有客户端到服务层
            rideRequestService.setClient(client);
            vehicleService.setClient(client as any); // vehicleService still uses base Database

            if (data?.user) {
              rideRequestService.setCurrentUser(data.user);
            }

            // 刷新最新信息
            await get().refreshUserProfile();
          }
        } catch (e) {
          console.error('初始化私有会话失败:', e);
        }
      },

      setAccessCode: async (code: string) => {
        set({ accessCode: code });
        await get().initialize();
      },

      clearAccessCode: () => {
        set({
          accessCode: null,
          userProfile: null,
          jwtToken: null,
          privClient: null,
          hasAccess: false
        });
        
        // 清理服务层状态
        rideRequestService.clearClient();
        rideRequestService.setCurrentUser(null);
        vehicleService.setClient(null);
        
        // 清除所有可能的本地存储（Zustand persist 已经处理了 accessCode）
        localStorage.removeItem('userAccessCode');
        localStorage.removeItem('rideAccessCode');
      },

      refreshUserProfile: async () => {
        const { accessCode, privClient } = get();
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

          set({ userProfile: data });
          rideRequestService.setCurrentUser(data);
        } catch (error) {
          console.error('获取用户配置文件失败:', error);
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ accessCode: state.accessCode }), // 只持久化 accessCode
    }
  )
);
