import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, Shield, Loader2, Home } from 'lucide-react';
import { ethers } from 'ethers';
import { useWalletStore } from '@/store/useWalletStore';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { SUPER_ADMIN_CONFIG, isAuthorizedSuperAdmin } from '@/config/admin-config';
import { supabase } from '@/integrations/supabase/client';

interface SuperAdminWalletAuthProps {
  onAuthenticated: (walletAddress: string, signature: string) => void;
}

export const SuperAdminWalletAuth: React.FC<SuperAdminWalletAuthProps> = ({ onAuthenticated }) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const navigate = useNavigate();
  const { walletAddress, isConnecting, connect, signMessage } = useWalletStore();

  const handleConnect = async () => {
    await connect();
  };

  const authenticateAsAdmin = async () => {
    if (!walletAddress) {
      toast.error('请先连接钱包');
      return;
    }

    try {
      setIsAuthenticating(true);
      
      // 验证钱包地址是否为授权的超级管理员
      if (!isAuthorizedSuperAdmin(walletAddress)) {
        toast.error('未授权的钱包地址');
        return;
      }
      
      // 创建签名消息
      const message = `${SUPER_ADMIN_CONFIG.SIGNATURE_MESSAGE}\n时间戳: ${Date.now()}\n钱包地址: ${walletAddress}`;
      const signature = await signMessage(message);
      
      if (!signature) return;
      
      onAuthenticated(walletAddress, signature);
      toast.success('身份验证成功');
      
    } catch (error) {
      console.error('身份验证失败:', error);
      toast.error('身份验证失败');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
            <CardTitle className="text-2xl font-bold text-gray-800">超级管理员认证</CardTitle>
          </div>
          <p className="text-gray-600">请使用授权钱包进行身份验证</p>
        </CardHeader>

        <CardContent className="space-y-4">
          {!walletAddress ? (
            <Button 
              onClick={handleConnect} 
              disabled={isConnecting}
              className="w-full flex items-center gap-2"
              size="lg"
            >
              {isConnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wallet className="h-4 w-4" />
              )}
              {isConnecting ? '连接中...' : '连接钱包'}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <p className="text-sm text-green-800 mb-2">已连接钱包</p>
                <p className="font-mono text-green-900">{formatAddress(walletAddress)}</p>
              </div>
              
              <Button 
                onClick={authenticateAsAdmin} 
                disabled={isAuthenticating}
                className="w-full flex items-center gap-2"
                size="lg"
              >
                {isAuthenticating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Shield className="h-4 w-4" />
                )}
                {isAuthenticating ? '验证中...' : '验证超级管理员身份'}
              </Button>
              
              <Button 
                onClick={() => navigate('/')} 
                variant="outline"
                className="w-full flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                返回首页
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};