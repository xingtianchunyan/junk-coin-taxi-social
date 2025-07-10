import React, { createContext, useContext, useEffect, useState } from 'react';
import { userService, User } from '@/services/userService';
import { localWalletBinding } from '@/utils/walletBinding';
import { toast } from 'sonner';

interface AccessCodeContextType {
  accessCode: string | null;
  setAccessCode: (code: string) => void;
  clearAccessCode: () => void;
  hasAccess: boolean;
  user: User | null;
  bindWallet: (walletAddress: string) => Promise<void>;
  unbindWallet: () => Promise<void>;
  isWalletBound: boolean;
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
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // 从 localStorage 恢复访问码
    const savedCode = localStorage.getItem('userAccessCode');
    if (savedCode) {
      setAccessCodeState(savedCode);
      loadUser(savedCode);
    }
  }, []);

  const loadUser = async (code: string) => {
    try {
      const userData = await userService.getUserByAccessCode(code);
      setUser(userData);
    } catch (error) {
      console.error('加载用户信息失败:', error);
    }
  };

  const setAccessCode = async (code: string) => {
    setAccessCodeState(code);
    localStorage.setItem('userAccessCode', code);
    await loadUser(code);
  };

  const clearAccessCode = () => {
    setAccessCodeState(null);
    setUser(null);
    localStorage.clear();
  };

  const bindWallet = async (walletAddress: string) => {
    if (!accessCode) {
      throw new Error('没有访问码');
    }

    try {
      // 使用本地存储绑定钱包
      localWalletBinding.bindWallet(accessCode, walletAddress);
      
      // 尝试同时更新数据库（如果字段存在）
      try {
        await userService.bindWalletToAccessCode(accessCode, walletAddress);
      } catch (dbError) {
        console.log('数据库更新失败，使用本地存储:', dbError);
      }
      
      // 重新加载用户信息
      await loadUser(accessCode);
      toast.success('钱包地址绑定成功');
    } catch (error) {
      console.error('绑定钱包失败:', error);
      toast.error(error instanceof Error ? error.message : '绑定钱包失败');
      throw error;
    }
  };

  const unbindWallet = async () => {
    if (!accessCode) {
      throw new Error('没有访问码');
    }

    try {
      // 使用本地存储解绑钱包
      localWalletBinding.unbindWallet(accessCode);
      
      // 尝试同时更新数据库（如果字段存在）
      try {
        await userService.unbindWalletFromAccessCode(accessCode);
      } catch (dbError) {
        console.log('数据库更新失败，使用本地存储:', dbError);
      }
      
      // 重新加载用户信息
      await loadUser(accessCode);
      toast.success('钱包地址解绑成功');
    } catch (error) {
      console.error('解绑钱包失败:', error);
      toast.error('解绑钱包失败');
      throw error;
    }
  };

  const hasAccess = accessCode !== null;
  // 检查钱包绑定状态：优先使用本地存储，然后检查数据库
  const isWalletBound = accessCode ? (
    localWalletBinding.isWalletBound(accessCode) || 
    (user?.wallet_address !== null && user?.wallet_address !== undefined)
  ) : false;

  const value = {
    accessCode,
    setAccessCode,
    clearAccessCode,
    hasAccess,
    user,
    bindWallet,
    unbindWallet,
    isWalletBound,
  };

  return <AccessCodeContext.Provider value={value}>{children}</AccessCodeContext.Provider>;
};