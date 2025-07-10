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
import detectEthereumProvider from '@metamask/detect-provider';
import { useAccessCode } from '@/components/AccessCodeProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ProfileDialog } from './ProfileDialog';

interface Web3WalletButtonProps {}

export const Web3WalletButton: React.FC<Web3WalletButtonProps> = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { userProfile, refreshUserProfile } = useAccessCode();

  useEffect(() => {
    // 检查用户是否已绑定钱包地址
    if (userProfile?.wallet_address) {
      setWalletAddress(userProfile.wallet_address);
    }
  }, [userProfile]);

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      
      // 检测是否有Web3提供者
      const provider = await detectEthereumProvider();
      if (!provider) {
        toast.error('请安装MetaMask或其他Web3钱包');
        return;
      }

      // 请求连接钱包
      const ethProvider = new ethers.BrowserProvider(provider as any);
      const accounts = await ethProvider.send('eth_requestAccounts', []);
      
      if (accounts.length === 0) {
        toast.error('未能获取钱包地址');
        return;
      }

      const address = accounts[0];
      
      // 请求签名以验证钱包所有权
      const signer = await ethProvider.getSigner();
      const message = `连接钱包到访问码: ${userProfile?.access_code}`;
      const signature = await signer.signMessage(message);
      
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

      setWalletAddress(address);
      await refreshUserProfile();
      toast.success('钱包连接成功');
      
    } catch (error) {
      console.error('连接钱包失败:', error);
      toast.error('连接钱包失败');
    } finally {
      setIsConnecting(false);
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

      setWalletAddress(null);
      await refreshUserProfile();
      toast.success('钱包解绑成功');
    } catch (error) {
      console.error('解绑钱包失败:', error);
      toast.error('解绑钱包失败');
    }
  };

  const logout = () => {
    // 清除访问码，退出登录
    localStorage.removeItem('access_code');
    window.location.reload();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!walletAddress) {
    return (
      <Button 
        onClick={connectWallet} 
        disabled={isConnecting}
        className="flex items-center gap-2"
      >
        <Wallet className="h-4 w-4" />
        {isConnecting ? '连接中...' : '连接钱包'}
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            {formatAddress(walletAddress)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setShowProfile(true)}>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={unbindWallet}>
            <Unlink className="mr-2 h-4 w-4" />
            Unbind
          </DropdownMenuItem>
          <DropdownMenuItem onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <ProfileDialog
        open={showProfile}
        onOpenChange={setShowProfile}
        walletAddress={walletAddress}
      />
    </>
  );
};