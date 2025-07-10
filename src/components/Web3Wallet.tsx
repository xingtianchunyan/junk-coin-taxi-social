import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Wallet, User, LogOut, Coins, Image, Unlink } from 'lucide-react';
import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { formatEther } from 'viem';
import { toast } from 'sonner';
import { useAccessCode } from './AccessCodeProvider';
import { localWalletBinding } from '@/utils/walletBinding';

interface NFT {
  tokenId: string;
  name: string;
  image: string;
  description?: string;
}

interface TokenBalance {
  symbol: string;
  balance: string;
  decimals: number;
  contractAddress: string;
}

const Web3Wallet: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });
  const { accessCode, bindWallet, unbindWallet, isWalletBound } = useAccessCode();
  
  const [showProfile, setShowProfile] = useState(false);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);

  // 获取用户资产
  const fetchUserAssets = async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      // 这里需要第三方API来获取NFT和Token数据
      // 推荐使用以下服务之一：
      // 1. Alchemy API - 需要API Key
      // 2. Moralis API - 需要API Key  
      // 3. OpenSea API - 部分免费
      // 4. Etherscan API - 需要API Key
      
      // 示例：使用Alchemy API获取NFT
      // const alchemyApiKey = 'YOUR_ALCHEMY_API_KEY';
      // const nftResponse = await fetch(`https://eth-mainnet.g.alchemy.com/nft/v2/${alchemyApiKey}/getNFTs?owner=${address}`);
      
      // 示例：使用Moralis API获取Token余额
      // const moralisApiKey = 'YOUR_MORALIS_API_KEY';
      // const tokenResponse = await fetch(`https://deep-index.moralis.io/api/v2/${address}/erc20`, {
      //   headers: { 'X-API-Key': moralisApiKey }
      // });
      
      // 临时模拟数据
      setNfts([
        {
          tokenId: '1',
          name: 'Sample NFT #1',
          image: '/placeholder.svg',
          description: 'This is a sample NFT'
        }
      ]);
      
      setTokens([
        {
          symbol: 'USDC',
          balance: '100.50',
          decimals: 6,
          contractAddress: '0xa0b86a33e6ba3e0e4ca4ba5d4e6b1b1b1b1b1b1b'
        }
      ]);
      
    } catch (error) {
      console.error('获取资产失败:', error);
      toast.error('获取资产失败');
    } finally {
      setLoading(false);
    }
  };

  // 监听连接状态变化并自动绑定
  useEffect(() => {
    if (isConnected && address && accessCode) {
      console.log('钱包已连接:', address);
      
      // 检查是否需要自动绑定
      const currentBoundWallet = localWalletBinding.getBoundWallet(accessCode);
      if (!currentBoundWallet) {
        // 检查钱包是否被其他访问码绑定
        if (!localWalletBinding.isWalletBoundToOther(address, accessCode)) {
          // 自动绑定钱包
          bindWallet(address).catch(error => {
            console.error('自动绑定钱包失败:', error);
          });
        }
      }
    } else if (!isConnected) {
      console.log('钱包已断开');
    }
  }, [isConnected, address, accessCode, bindWallet]);

  useEffect(() => {
    if (isConnected && showProfile) {
      fetchUserAssets();
    }
  }, [isConnected, showProfile, address]);

  const handleConnect = () => {
    const connector = connectors[0]; // 使用第一个可用的连接器
    if (connector) {
      connect({ connector });
    }
  };



  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <Button onClick={handleConnect} variant="outline" className="flex items-center gap-2">
        <Wallet className="h-4 w-4" />
        连接钱包
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              {address?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="hidden md:inline">{formatAddress(address!)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{formatAddress(address!)}</p>
          {balance && (
            <p className="text-xs text-muted-foreground">
              {parseFloat(formatEther(balance.value)).toFixed(4)} {balance.symbol}
            </p>
          )}
        </div>
        <DropdownMenuSeparator />
        <Dialog open={showProfile} onOpenChange={setShowProfile}>
          <DialogTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <User className="mr-2 h-4 w-4" />
              个人中心
            </DropdownMenuItem>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>个人资产</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* 钱包信息 */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">钱包信息</h3>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">地址</p>
                  <p className="font-mono text-sm">{address}</p>
                  {balance && (
                    <>
                      <p className="text-sm text-gray-600 mt-2">余额</p>
                      <p className="text-lg font-semibold">
                        {parseFloat(formatEther(balance.value)).toFixed(4)} {balance.symbol}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Token余额 */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  代币余额
                </h3>
                {loading ? (
                  <div className="text-center py-4">加载中...</div>
                ) : tokens.length > 0 ? (
                  <div className="space-y-2">
                    {tokens.map((token, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">{token.symbol}</span>
                        <span>{token.balance}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">暂无代币</p>
                )}
              </div>

              {/* NFT收藏 */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  NFT收藏
                </h3>
                {loading ? (
                  <div className="text-center py-4">加载中...</div>
                ) : nfts.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {nfts.map((nft) => (
                      <div key={nft.tokenId} className="border rounded-lg p-3">
                        <img 
                          src={nft.image} 
                          alt={nft.name}
                          className="w-full h-32 object-cover rounded mb-2"
                        />
                        <p className="text-sm font-medium truncate">{nft.name}</p>
                        <p className="text-xs text-gray-500">#{nft.tokenId}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">暂无NFT</p>
                )}
              </div>

              {/* API说明 */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">获取链上资产需要第三方API</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• <strong>Alchemy API</strong> - 推荐，功能全面，需要API Key</p>
                  <p>• <strong>Moralis API</strong> - 易用，需要API Key</p>
                  <p>• <strong>Etherscan API</strong> - 免费额度，需要API Key</p>
                  <p>• <strong>OpenSea API</strong> - NFT专用，部分免费</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        {isWalletBound && (
          <DropdownMenuItem
            onClick={() => {
              unbindWallet().catch(error => {
                console.error('解绑钱包失败:', error);
              });
            }}
            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
          >
            <Unlink className="mr-2 h-4 w-4" />
            解绑钱包
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => disconnect()}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="mr-2 h-4 w-4" />
          断开连接
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Web3Wallet;