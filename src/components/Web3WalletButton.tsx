import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Wallet, User, Unlink, LogOut } from 'lucide-react';
import { ethers } from 'ethers';
import { useAuthStore } from '@/store/useAuthStore';
import { useWalletStore } from '@/store/useWalletStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ProfileDialog } from './ProfileDialog';

interface Web3WalletButtonProps {}

export const Web3WalletButton: React.FC<Web3WalletButtonProps> = () => {
  const [showProfile, setShowProfile] = useState(false);
  const { userProfile, refreshUserProfile, clearAccessCode } = useAuthStore();
  const { 
    walletAddress, 
    isConnecting, 
    connect, 
    disconnect: disconnectWalletStore,
    signMessage 
  } = useWalletStore();

  useEffect(() => {
    // 检查用户是否已绑定钱包地址，如果已绑定且 store 中没有，则尝试连接
    // 注意：这里我们不自动调用 connect，因为这会弹出 MetaMask
    // 但我们可以将 userProfile 中的地址同步到 store (如果需要的话，但 store 主要是运行时连接)
  }, [userProfile]);

  const handleConnect = async () => {
    const address = await connect();
    if (!address) return;

    try {
      // 请求签名以验证钱包所有权
      const message = `连接钱包到访问码: ${userProfile?.access_code}`;
      const signature = await signMessage(message);
      
      if (!signature) return;
      
      // 将钱包地址绑定到当前访问码
      const { error } = await supabase
        .from('users')
        .update({ wallet_address: address })
        .eq('access_code', userProfile?.access_code);

      if (error) {
        console.error('绑定钱包地址失败:', error);
        toast.error('绑定钱包地址失败');
        return;
      }

      await refreshUserProfile();
      toast.success('钱包连接成功');
    } catch (error) {
      console.error('连接钱包流程失败:', error);
    }
  };

  const unbindWallet = async () => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ wallet_address: null })
        .eq('access_code', userProfile?.access_code);

      if (error) {
        console.error('解绑钱包失败:', error);
        toast.error('解绑钱包失败');
        return;
      }

      disconnectWalletStore();
      await refreshUserProfile();
      toast.success('钱包解绑成功');
    } catch (error) {
      console.error('解绑钱包失败:', error);
      toast.error('解绑钱包失败');
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const logout = () => {
    clearAccessCode();
    disconnectWalletStore();
  };

  if (!userProfile?.wallet_address && !walletAddress) {
    return (
      <Button 
        onClick={handleConnect} 
        disabled={isConnecting}
        className="flex items-center gap-2"
      >
        <Wallet className="h-4 w-4" />
        {isConnecting ? '连接中...' : '连接钱包'}
      </Button>
    );
  }

  const displayAddress = userProfile?.wallet_address || walletAddress;

  return (    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            {displayAddress ? formatAddress(displayAddress) : '已连接'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setShowProfile(true)}>
            <User className="mr-2 h-4 w-4" />
            个人资料
          </DropdownMenuItem>
          <DropdownMenuItem onClick={unbindWallet}>
            <Unlink className="mr-2 h-4 w-4" />
            解绑钱包
          </DropdownMenuItem>
          <DropdownMenuItem onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            退出登录
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {displayAddress && (
        <ProfileDialog
          open={showProfile}
          onOpenChange={setShowProfile}
          walletAddress={displayAddress}
        />
      )}
    </>
  );
};