import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, CheckCircle, Clock, CreditCard, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RideRequest, WalletAddress } from '@/types/RideRequest';
import { rideRequestService } from '@/services/rideRequestService';
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
const PaymentDialog: React.FC<PaymentDialogProps> = ({
  open,
  onOpenChange,
  request
}) => {
  const [walletAddresses, setWalletAddresses] = useState<WalletAddress[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<WalletAddress | null>(null);
  const [loading, setLoading] = useState(false);
  const {
    toast
  } = useToast();

  // 过滤出区块链和交易所支付方式
  const onlinePaymentMethods = walletAddresses.filter(wallet => wallet.pay_way === 1 || wallet.pay_way === 2);
  // 检查是否有链下支付方式（支付宝/微信、现金）
  const hasOfflinePayment = walletAddresses.some(wallet => wallet.pay_way === 3 || wallet.pay_way === 4);
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
        variant: "destructive"
      });
    }
  };
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "已复制",
      description: "地址已复制到剪贴板"
    });
  };

  // 处理支付选项点击，直接复制关键信息
  const handlePaymentOptionClick = (wallet: WalletAddress) => {
    setSelectedWallet(wallet);
    copyToClipboard(wallet.address);
    const infoType = wallet.pay_way === 2 ? '交易所UID' : '区块链地址';
    toast({
      title: "已复制",
      description: `${infoType}已复制到剪贴板`
    });
  };
  const handlePaymentSubmit = async () => {
    setLoading(true);
    try {
      toast({
        title: "请当面感谢",
        description: "网站只提供信息，具体情况请与司机当面确认"
      });
      onOpenChange(false);
    } catch (error) {
      console.error('支付确认失败:', error);
      toast({
        title: "确认失败",
        description: "请与司机联系确认支付",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // 获取支付方式描述
  const getPaymentMethodDescription = (wallet: WalletAddress) => {
    const payWay = PAY_WAY_MAP[wallet.pay_way as keyof typeof PAY_WAY_MAP] || '未知支付方式';
    if (wallet.pay_way === 1) {
      // 区块链支付
      const chainName = CHAIN_NAME_MAP[wallet.chain_name as keyof typeof CHAIN_NAME_MAP] || '未知网络';
      return `${payWay} - ${chainName} (${wallet.symbol})`;
    } else if (wallet.pay_way === 2 && wallet.exchange_name) {
      // 交易所转账
      const exchangeName = EXCHANGE_NAME_MAP[wallet.exchange_name as keyof typeof EXCHANGE_NAME_MAP] || '未知交易所';
      return `${payWay} - ${exchangeName} (${wallet.symbol})`;
    }
    return `${payWay} - ${wallet.symbol}`;
  };

  // 获取支付通道显示名称
  const getPaymentChannelName = (wallet: WalletAddress) => {
    if (wallet.pay_way === 1) {
      // 区块链支付
      return CHAIN_NAME_MAP[wallet.chain_name as keyof typeof CHAIN_NAME_MAP] || '未知网络';
    } else if (wallet.pay_way === 2 && wallet.exchange_name) {
      // 交易所转账
      return EXCHANGE_NAME_MAP[wallet.exchange_name as keyof typeof EXCHANGE_NAME_MAP] || '未知交易所';
    }
    return PAY_WAY_MAP[wallet.pay_way as keyof typeof PAY_WAY_MAP] || '未知支付方式';
  };
  if (!request || !request.payment_required) return null;
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            支付感谢费用
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="space-y-4 h-full">
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">需支付金额</span>
                  <Badge className="bg-purple-100 text-purple-700">
                    {request.payment_amount} {request.payment_currency}
                  </Badge>
                </div>
                {/* 显示折扣信息 */}
                {request.vehicle_id && <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">司机折扣</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      已享受司机优惠
                    </Badge>
                  </div>}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">感谢状态</span>
                  <Badge className={request.payment_status === 'confirmed' ? 'bg-green-100 text-green-700' : request.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}>
                    <Clock className="h-3 w-3 mr-1" />
                    {request.payment_status === 'unpaid' ? '未支付' : request.payment_status === 'pending' ? '待确认' : request.payment_status === 'confirmed' ? '已确认' : '支付失败'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {onlinePaymentMethods.length > 0 && <div className="space-y-3">
                <label className="text-sm font-medium">选择感谢方式</label>
                <ScrollArea className="max-h-[250px] overflow-y-auto">
                  <div className="grid grid-cols-1 gap-3 pr-2">
                    {onlinePaymentMethods.map(wallet => <Button key={wallet.id} variant={selectedWallet?.id === wallet.id ? "default" : "outline"} onClick={() => handlePaymentOptionClick(wallet)} className="justify-start h-auto p-4 text-left">
                        <div className="flex flex-col items-start w-full">
                          <div className="flex items-center justify-between w-full mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{wallet.symbol}</span>
                              <Badge variant="secondary" className="text-xs">
                                {getPaymentChannelName(wallet)}
                              </Badge>
                            </div>
                            <Copy className="h-4 w-4 text-gray-400" />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-gray-600 mb-1">
                              {wallet.pay_way === 2 ? '交易所UID:' : '区块链地址:'}
                            </div>
                            <div className="text-black text-sm font-mono bg-gray-100 px-2 py-1 rounded w-full truncate">
                              {wallet.address}
                            </div>
                          </div>

                        </div>
                      </Button>)}
                  </div>
                </ScrollArea>
              </div>}

            {hasOfflinePayment && <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-orange-700">
                    <Info className="h-5 w-5" />
                    <span className="font-medium">支持红包感谢</span>
                  </div>
                  <p className="text-sm text-orange-600 mt-2">具体情况与司机沟通（支持支付宝红包、微信红包或现金感谢）</p>
                </CardContent>
              </Card>}
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            取消
          </Button>
          <Button onClick={handlePaymentSubmit} disabled={loading || !selectedWallet} className="flex-1">
            {loading ? '处理中...' : '我已转账'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>;
};
export default PaymentDialog;