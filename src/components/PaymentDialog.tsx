
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Copy, QrCode, CheckCircle, Clock, CreditCard, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RideRequest, WalletAddress } from '@/types/RideRequest';
import { rideRequestService } from '@/services/rideRequestService';
import { useAccessCode } from '@/components/AccessCodeProvider';
import { ethers } from 'ethers';
import contractConfig from '@/config/contract.json';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: RideRequest | null;
}

// 支付方式映射
const PAY_WAY_MAP = {
  1: '区块链支付',
  2: '交易所转账',
  3: '支付宝/微信',
  4: '现金',
  5: '免费'
};

// 区块链网络映射
const CHAIN_NAME_MAP = {
  1: 'Bitcoin',
  2: 'Ethereum',
  3: 'Solana',
  4: 'Tron',
  5: 'TON',
  6: 'Sui'
};

// 交易所映射
const EXCHANGE_NAME_MAP = {
  1: 'Binance',
  2: 'OKX',
  3: 'Coinbase',
  4: 'Bitget',
  5: 'Gate',
  6: 'Bybit',
  7: 'KuCoin',
  8: '火币'
};

const PaymentDialog: React.FC<PaymentDialogProps> = ({ open, onOpenChange, request }) => {
  const [walletAddresses, setWalletAddresses] = useState<WalletAddress[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<WalletAddress | null>(null);
  const [loading, setLoading] = useState(false);
  const [blockchainPaymentLoading, setBlockchainPaymentLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAccessCode();

  useEffect(() => {
    if (open && request?.payment_required) {
      loadWalletAddresses();
    }
  }, [open, request]);

  const loadWalletAddresses = async () => {
    try {
      let addresses: WalletAddress[] = [];
      
      // 如果有固定路线ID，优先获取该路线的支付方式
      if (request?.fixed_route_id) {
        addresses = await rideRequestService.getWalletAddressesByRoute(request.fixed_route_id);
      }
      
      // 如果没有固定路线或该路线没有配置支付方式，则获取所有支付方式
      if (addresses.length === 0) {
        addresses = await rideRequestService.getWalletAddresses();
      }
      
      setWalletAddresses(addresses);
      if (addresses.length > 0) {
        setSelectedWallet(addresses[0]);
      }
    } catch (error) {
      console.error('加载钱包地址失败:', error);
      toast({
        title: "加载失败",
        description: "无法加载支付地址",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "已复制",
      description: "地址已复制到剪贴板",
    });
  };

  const handlePaymentSubmit = async () => {
    if (!request || !selectedWallet) return;

    setLoading(true);
    try {
      await rideRequestService.createPayment({
        ride_request_id: request.id,
        amount: request.payment_amount || 0,
        currency: request.payment_currency || selectedWallet.symbol,
        wallet_address: selectedWallet.address,
        payment_method: getPaymentMethodDescription(selectedWallet),
        status: 'pending'
      });

      toast({
        title: "支付记录已创建",
        description: "请完成转账并等待确认",
      });

      onOpenChange(false);
    } catch (error) {
      console.error('创建支付记录失败:', error);
      toast({
        title: "创建失败",
        description: "无法创建支付记录",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 获取支付方式描述
  const getPaymentMethodDescription = (wallet: WalletAddress) => {
    const payWay = PAY_WAY_MAP[wallet.pay_way as keyof typeof PAY_WAY_MAP] || '未知支付方式';
    
    if (wallet.pay_way === 1) { // 区块链支付
      const chainName = CHAIN_NAME_MAP[wallet.chain_name as keyof typeof CHAIN_NAME_MAP] || '未知网络';
      return `${payWay} - ${chainName} (${wallet.symbol})`;
    } else if (wallet.pay_way === 2 && wallet.exchange_name) { // 交易所转账
      const exchangeName = EXCHANGE_NAME_MAP[wallet.exchange_name as keyof typeof EXCHANGE_NAME_MAP] || '未知交易所';
      return `${payWay} - ${exchangeName} (${wallet.symbol})`;
    }
    
    return `${payWay} - ${wallet.symbol}`;
  };

  // 区块链支付处理
  const handleBlockchainPayment = async () => {
    if (!selectedWallet || !request || !user?.wallet_address) {
      toast({
        title: "错误",
        description: "请先连接钱包或选择支付方式",
        variant: "destructive",
      });
      return;
    }

    setBlockchainPaymentLoading(true);
    try {
      // 检查是否有MetaMask
      if (!window.ethereum) {
        throw new Error('请安装MetaMask钱包');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // 验证网络是否为Sepolia
      const network = await provider.getNetwork();
      if (network.chainId !== 11155111n) { // Sepolia chainId
        toast({
          title: "网络错误",
          description: "请切换到Sepolia测试网络",
          variant: "destructive",
        });
        return;
      }

      // 准备支付交易
      const amountInWei = ethers.parseEther((request.payment_amount || 0).toString());
      
      // 发送ETH到司机地址
      const tx = await signer.sendTransaction({
        to: selectedWallet.address,
        value: amountInWei,
      });

      toast({
        title: "交易已发送",
        description: `交易哈希: ${tx.hash}`,
      });

      // 等待交易确认
      const receipt = await tx.wait();
      
      if (receipt && receipt.status === 1) {
        // 创建支付记录
        await rideRequestService.createPayment({
          ride_request_id: request.id,
          amount: request.payment_amount || 0,
          currency: request.payment_currency || 'ETH',
          wallet_address: selectedWallet.address,
          payment_method: 'blockchain',
          status: 'confirmed',
          transaction_hash: tx.hash
        });

        // 调用智能合约铸造SBT徽章
        try {
          const contract = new ethers.Contract(
            contractConfig.address,
            contractConfig.abi,
            signer
          );

          const mintTx = await contract.mintBadgesForPayment(
            selectedWallet.address, // 司机地址
            user.wallet_address,    // 乘客地址
            tx.hash,                // 支付交易哈希
            amountInWei            // 支付金额
          );

          await mintTx.wait();
          
          toast({
            title: "支付成功 🎉",
            description: "您和司机都已获得社区徽章！",
          });
        } catch (badgeError) {
          console.error('徽章铸造失败:', badgeError);
          // 即使徽章铸造失败，支付也是成功的
          toast({
            title: "支付成功",
            description: "支付完成，但徽章铸造失败，请联系管理员",
          });
        }

        onOpenChange(false);
      } else {
        throw new Error('交易失败');
      }
    } catch (error: any) {
      console.error('区块链支付失败:', error);
      toast({
        title: "支付失败",
        description: error.message || "区块链支付过程中出现错误",
        variant: "destructive",
      });
    } finally {
      setBlockchainPaymentLoading(false);
    }
  };

  // 获取支付通道显示名称
  const getPaymentChannelName = (wallet: WalletAddress) => {
    if (wallet.pay_way === 1) { // 区块链支付
      return CHAIN_NAME_MAP[wallet.chain_name as keyof typeof CHAIN_NAME_MAP] || '未知网络';
    } else if (wallet.pay_way === 2 && wallet.exchange_name) { // 交易所转账
      return EXCHANGE_NAME_MAP[wallet.exchange_name as keyof typeof EXCHANGE_NAME_MAP] || '未知交易所';
    }
    return PAY_WAY_MAP[wallet.pay_way as keyof typeof PAY_WAY_MAP] || '未知支付方式';
  };

  if (!request || !request.payment_required) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            支付用车费用
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">需支付金额</span>
                <Badge className="bg-purple-100 text-purple-700">
                  {request.payment_amount} {request.payment_currency}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">支付状态</span>
                <Badge className={
                  request.payment_status === 'confirmed' ? 'bg-green-100 text-green-700' :
                  request.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }>
                  <Clock className="h-3 w-3 mr-1" />
                  {request.payment_status === 'unpaid' ? '未支付' :
                   request.payment_status === 'pending' ? '待确认' :
                   request.payment_status === 'confirmed' ? '已确认' : '支付失败'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {walletAddresses.length > 0 && (
            <div className="space-y-3">
              <label className="text-sm font-medium">选择支付方式</label>
              <div className="grid grid-cols-1 gap-2">
                {walletAddresses.map((wallet) => (
                  <Button
                    key={wallet.id}
                    variant={selectedWallet?.id === wallet.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedWallet(wallet)}
                    className="justify-start h-auto p-3"
                  >
                    <div className="flex flex-col items-start">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{wallet.symbol}</span>
                        <Badge variant="secondary" className="text-xs">
                          {getPaymentChannelName(wallet)}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500 mt-1">
                        {PAY_WAY_MAP[wallet.pay_way as keyof typeof PAY_WAY_MAP]}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {selectedWallet && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      {getPaymentChannelName(selectedWallet)}
                      <Badge variant="outline" className="text-xs">
                        {selectedWallet.symbol}
                      </Badge>
                    </p>
                    <p className="text-sm text-gray-600">
                      {PAY_WAY_MAP[selectedWallet.pay_way as keyof typeof PAY_WAY_MAP]}
                    </p>
                  </div>
                  {selectedWallet.qr_code_url && (
                    <Button variant="outline" size="sm">
                      <QrCode className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs text-gray-600">
                    {selectedWallet.pay_way === 2 ? '交易所UID' : '收款地址'}
                  </label>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm font-mono">
                    <span className="flex-1 truncate">{selectedWallet.address}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(selectedWallet.address)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                  💡 请将 {request.payment_amount} {request.payment_currency} 通过 
                  <strong className="mx-1">{getPaymentChannelName(selectedWallet)}</strong>
                  {selectedWallet.pay_way === 2 ? '转账到上述UID' : '转账到上述地址'}，完成后点击"我已转账"按钮
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              取消
            </Button>
            {selectedWallet?.pay_way === 1 && user?.wallet_address ? (
              // 区块链支付按钮（仅在选择区块链支付方式且用户已连接钱包时显示）
              <Button 
                onClick={handleBlockchainPayment}
                disabled={blockchainPaymentLoading || !selectedWallet}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {blockchainPaymentLoading ? (
                  "支付中..."
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    区块链支付
                  </>
                )}
              </Button>
            ) : (
              // 传统转账确认按钮
              <Button 
                onClick={handlePaymentSubmit}
                disabled={loading || !selectedWallet}
                className="flex-1"
              >
                {loading ? '处理中...' : '我已转账'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;
