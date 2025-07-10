import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ethers } from 'ethers';
import { toast } from 'sonner';
import { Coins, Image } from 'lucide-react';

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletAddress: string;
}

interface TokenBalance {
  symbol: string;
  balance: string;
  decimals: number;
  contractAddress?: string;
}

interface NFT {
  tokenId: string;
  name: string;
  image?: string;
  contractAddress: string;
}

export const ProfileDialog: React.FC<ProfileDialogProps> = ({
  open,
  onOpenChange,
  walletAddress,
}) => {
  const [ethBalance, setEthBalance] = useState<string>('0');
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && walletAddress) {
      loadWalletAssets();
    }
  }, [open, walletAddress]);

  const loadWalletAssets = async () => {
    try {
      setLoading(true);
      
      // 获取ETH余额
      const provider = new ethers.BrowserProvider(window.ethereum);
      const balance = await provider.getBalance(walletAddress);
      setEthBalance(ethers.formatEther(balance));
      
      // 这里可以集成第三方API来获取代币和NFT信息
      // 例如使用Alchemy、Moralis或其他服务
      await loadTokensAndNFTs();
      
    } catch (error) {
      console.error('加载钱包资产失败:', error);
      toast.error('加载钱包资产失败');
    } finally {
      setLoading(false);
    }
  };

  const loadTokensAndNFTs = async () => {
    // 这里需要第三方API来获取代币和NFT信息
    // 示例代码 - 实际需要API密钥
    
    // 模拟数据
    setTokens([
      { symbol: 'USDC', balance: '100.50', decimals: 6 },
      { symbol: 'USDT', balance: '250.75', decimals: 6 },
    ]);
    
    setNfts([
      { 
        tokenId: '1', 
        name: 'Sample NFT #1', 
        contractAddress: '0x...',
        image: 'https://via.placeholder.com/150'
      },
    ]);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>钱包资产</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">钱包地址</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-sm break-all">{walletAddress}</p>
            </CardContent>
          </Card>

          <Tabs defaultValue="tokens" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tokens">代币</TabsTrigger>
              <TabsTrigger value="nfts">NFT</TabsTrigger>
            </TabsList>
            
            <TabsContent value="tokens" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="h-4 w-4" />
                    ETH余额
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{ethBalance} ETH</p>
                </CardContent>
              </Card>
              
              {tokens.map((token, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{token.symbol}</span>
                      <span className="text-lg">{token.balance}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {tokens.length === 0 && !loading && (
                <p className="text-center text-muted-foreground py-8">
                  暂无代币资产
                </p>
              )}
            </TabsContent>
            
            <TabsContent value="nfts" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {nfts.map((nft, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        {nft.image && (
                          <img 
                            src={nft.image} 
                            alt={nft.name}
                            className="w-full h-32 object-cover rounded"
                          />
                        )}
                        <div>
                          <p className="font-medium">{nft.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatAddress(nft.contractAddress)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {nfts.length === 0 && !loading && (
                <div className="text-center py-8">
                  <Image className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">暂无NFT资产</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          {loading && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">加载中...</p>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
          <Button onClick={loadWalletAssets} disabled={loading}>
            刷新
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};