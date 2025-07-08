import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreditCard, Route, Car } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { WalletAddress } from '@/types/RideRequest';
import { rideRequestService } from '@/services/rideRequestService';

interface PaymentMethodManagerProps {
  onClose: () => void;
}

const PaymentMethodManager: React.FC<PaymentMethodManagerProps> = ({ onClose }) => {
  const [walletAddresses, setWalletAddresses] = useState<WalletAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadWalletAddresses();
  }, []);

  const loadWalletAddresses = async () => {
    try {
      setLoading(true);
      const data = await rideRequestService.getAllWalletAddresses();
      setWalletAddresses(data);
    } catch (error) {
      console.error('加载支付途径失败:', error);
      toast({
        title: "加载失败",
        description: "无法加载支付途径",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await rideRequestService.toggleWalletAddress(id, !isActive);
      toast({
        title: "状态已更新",
        description: `支付途径已${!isActive ? '启用' : '禁用'}`,
      });
      loadWalletAddresses();
    } catch (error) {
      console.error('更新状态失败:', error);
      toast({
        title: "更新失败",
        description: "无法更新支付途径状态",
        variant: "destructive",
      });
    }
  };

  const getPayWayText = (payWay: number) => {
    switch (payWay) {
      case 1: return '区块链支付';
      case 2: return '交易所转账';
      case 3: return '支付宝/微信';
      case 4: return '现金支付';
      case 5: return '免费';
      default: return '未知类型';
    }
  };

  const getChainNameText = (chainName: number) => {
    switch (chainName) {
      case 1: return 'BITCOIN';
      case 2: return 'EVM-Compatible';
      case 3: return 'SOLANA';
      case 4: return 'TRON';
      case 5: return 'TON';
      case 6: return 'SUI';
      default: return '未知链';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <CreditCard className="h-12 w-12 text-slate-600 mx-auto mb-4 animate-spin" />
          <p className="text-slate-600">加载支付途径中...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            支付途径管理
          </CardTitle>
          <Button variant="outline" onClick={onClose}>
            关闭
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {walletAddresses.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>支付信息</TableHead>
                <TableHead>路线信息</TableHead>
                <TableHead>司机信息</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {walletAddresses.map((wallet) => (
                <TableRow key={wallet.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {getPayWayText(wallet.pay_way)}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {wallet.symbol}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        {getChainNameText(wallet.chain_name)}
                      </div>
                      <div className="font-mono text-xs text-gray-500 max-w-[200px] truncate">
                        {wallet.address}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {wallet.route ? (
                        <>
                          <div className="flex items-center gap-1">
                            <Route className="h-3 w-3 text-blue-500" />
                            <span className="font-medium text-sm">{wallet.route.name}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {wallet.route.start_location} → {wallet.route.end_location}
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">未关联路线</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {wallet.vehicle ? (
                        <>
                          <div className="flex items-center gap-1">
                            <Car className="h-3 w-3 text-green-500" />
                            <span className="font-medium text-sm">{wallet.vehicle.driver_name}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {wallet.vehicle.license_plate}
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">未关联司机</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={wallet.is_active ? "default" : "secondary"}>
                      {wallet.is_active ? '启用' : '禁用'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleActive(wallet.id, wallet.is_active)}
                    >
                      {wallet.is_active ? '禁用' : '启用'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12">
            <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">还没有配置支付途径</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentMethodManager;