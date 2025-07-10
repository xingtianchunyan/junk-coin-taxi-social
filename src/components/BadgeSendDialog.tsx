import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Award, ExternalLink, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CONTRACT_CONFIG, CONTRACT_ABI, BADGE_TYPES, type BadgeType } from '@/config/badge-contract';
import { ethers } from 'ethers';

interface BadgeSendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driverWalletAddress: string;
}

const BadgeSendDialog: React.FC<BadgeSendDialogProps> = ({ 
  open, 
  onOpenChange, 
  driverWalletAddress 
}) => {
  const [selectedBadgeType, setSelectedBadgeType] = useState<BadgeType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSendBadge = async () => {
    if (!selectedBadgeType) return;

    try {
      setIsLoading(true);

      // 检查是否有MetaMask
      if (!window.ethereum) {
        throw new Error('请安装MetaMask钱包');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // 检查并切换到Flow EVM Testnet
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${CONTRACT_CONFIG.FLOW_TESTNET.chainId.toString(16)}` }],
        });
      } catch (switchError: any) {
        // 如果网络不存在，添加网络
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${CONTRACT_CONFIG.FLOW_TESTNET.chainId.toString(16)}`,
              chainName: CONTRACT_CONFIG.FLOW_TESTNET.chainName,
              rpcUrls: [CONTRACT_CONFIG.FLOW_TESTNET.rpcUrl],
              blockExplorerUrls: [CONTRACT_CONFIG.FLOW_TESTNET.blockExplorer],
              nativeCurrency: CONTRACT_CONFIG.FLOW_TESTNET.nativeCurrency,
            }],
          });
        } else {
          throw switchError;
        }
      }

      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_CONFIG.CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      // 生成元数据URI
      const metadata = JSON.stringify({
        name: BADGE_TYPES[selectedBadgeType].label,
        description: BADGE_TYPES[selectedBadgeType].description,
        image: `data:image/svg+xml;base64,${btoa(`
          <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
            <rect width="200" height="200" fill="#f0f9ff"/>
            <circle cx="100" cy="80" r="40" fill="#3b82f6"/>
            <text x="100" y="90" text-anchor="middle" font-size="24" fill="white">
              ${BADGE_TYPES[selectedBadgeType].icon}
            </text>
            <text x="100" y="140" text-anchor="middle" font-size="16" fill="#1e40af">
              ${BADGE_TYPES[selectedBadgeType].label}
            </text>
            <text x="100" y="165" text-anchor="middle" font-size="12" fill="#64748b">
              ${BADGE_TYPES[selectedBadgeType].description}
            </text>
          </svg>
        `)}`,
        attributes: [
          {
            trait_type: "Badge Type",
            value: selectedBadgeType
          },
          {
            trait_type: "Category",
            value: "Community Contribution"
          }
        ]
      });

      const metadataUri = `data:application/json;base64,${btoa(metadata)}`;

      // 调用合约铸造徽章
      const tx = await contract.mintBadge(
        driverWalletAddress,
        selectedBadgeType,
        metadataUri
      );

      setTransactionHash(tx.hash);

      toast({
        title: "徽章发送成功",
        description: `已向 ${driverWalletAddress} 发送 ${BADGE_TYPES[selectedBadgeType].label} 徽章`,
      });

      // 等待交易确认
      await tx.wait();

      toast({
        title: "交易已确认",
        description: "徽章已成功铸造到目标地址",
      });

    } catch (error: any) {
      console.error('发送徽章失败:', error);
      toast({
        title: "发送失败",
        description: error.message || "发送徽章时发生错误",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedBadgeType(null);
    setTransactionHash(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            发送社区徽章
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>目标地址:</strong> 
            </p>
            <p className="text-xs font-mono text-blue-800 break-all mt-1">
              {driverWalletAddress}
            </p>
          </div>

          {!transactionHash ? (
            <>
              <div className="space-y-3">
                <label className="text-sm font-medium">选择徽章类型</label>
                <div className="grid grid-cols-1 gap-2">
                  {(Object.keys(BADGE_TYPES) as BadgeType[]).map((badgeType) => (
                    <Button
                      key={badgeType}
                      variant={selectedBadgeType === badgeType ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedBadgeType(badgeType)}
                      className="justify-start h-auto p-3"
                    >
                      <div className="flex flex-col items-start">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{BADGE_TYPES[badgeType].icon}</span>
                          <span className="font-medium">{BADGE_TYPES[badgeType].label}</span>
                        </div>
                        <span className="text-xs text-gray-500 mt-1">
                          {BADGE_TYPES[badgeType].description}
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  取消
                </Button>
                <Button 
                  onClick={handleSendBadge}
                  disabled={isLoading || !selectedBadgeType}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      发送中...
                    </>
                  ) : (
                    '发送徽章'
                  )}
                </Button>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="p-4 text-center space-y-3">
                <div className="text-green-600 text-4xl">✅</div>
                <div>
                  <p className="font-medium text-green-700">徽章发送成功！</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {BADGE_TYPES[selectedBadgeType!].label} 徽章已发送
                  </p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs text-gray-600">交易哈希:</p>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <span className="text-xs font-mono flex-1 truncate">
                      {transactionHash}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(
                        `${CONTRACT_CONFIG.FLOW_TESTNET.blockExplorer}/tx/${transactionHash}`,
                        '_blank'
                      )}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <Button onClick={handleClose} className="w-full">
                  完成
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BadgeSendDialog;