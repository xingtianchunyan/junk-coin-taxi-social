
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

      // 首先检查徽章类型是否存在
      console.log('Checking if badge type exists:', selectedBadgeType);
      const badgeTypeExists = await contract.badgeTypes(selectedBadgeType);
      console.log('Badge type exists:', badgeTypeExists);

      // 如果徽章类型不存在，先添加它
      if (!badgeTypeExists) {
        console.log('Adding badge type to contract:', selectedBadgeType);
        const badgeMetadata = JSON.stringify({
          name: BADGE_TYPES[selectedBadgeType].label,
          description: BADGE_TYPES[selectedBadgeType].description,
          icon: BADGE_TYPES[selectedBadgeType].icon,
        });

        const addBadgeTypeTx = await contract.addBadgeType(selectedBadgeType, badgeMetadata);
        await addBadgeTypeTx.wait();
        console.log('Badge type added successfully');

        toast({
          title: "徽章类型已添加",
          description: `已添加 ${BADGE_TYPES[selectedBadgeType].label} 徽章类型到合约`,
        });
      }

      // 生成元数据URI
      const metadata = JSON.stringify({
        name: BADGE_TYPES[selectedBadgeType].label,
        description: BADGE_TYPES[selectedBadgeType].description,
        image: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(selectedBadgeType)}`,
        attributes: [
          {
            trait_type: "Badge Type",
            value: selectedBadgeType
          },
          {
            trait_type: "Platform",
            value: "Community Contribution"
          }
        ]
      });

      // 使用正确的方式处理UTF-8字符
      const metadataUri = `data:application/json;base64,${btoa(unescape(encodeURIComponent(metadata)))}`;

      console.log('Minting badge with params:', {
        recipient: driverWalletAddress,
        badgeType: selectedBadgeType,
        metadataUri: metadataUri.substring(0, 100) + '...'
      });

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
      
      let errorMessage = "发送徽章时发生错误";
      if (error.message) {
        if (error.message.includes("Invalid badge type")) {
          errorMessage = "无效的徽章类型，请联系管理员";
        } else if (error.message.includes("user rejected")) {
          errorMessage = "用户取消了交易";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "发送失败",
        description: errorMessage,
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
