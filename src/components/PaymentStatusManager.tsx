
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CheckCircle, Clock, AlertCircle, CreditCard, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RideRequest } from '@/types/RideRequest';
import { rideRequestService } from '@/services/rideRequestService';
import { supabase } from '@/integrations/supabase/client';

interface PaymentStatusManagerProps {
  request: RideRequest;
  onStatusUpdate: (id: string, status: RideRequest['payment_status']) => void;
}

const PaymentStatusManager: React.FC<PaymentStatusManagerProps> = ({ 
  request, 
  onStatusUpdate 
}) => {
  const [txHash, setTxHash] = useState(request.payment_tx_hash || '');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleStatusUpdate = async (newStatus: RideRequest['payment_status']) => {
    if (!request.payment_required) return;

    setLoading(true);
    try {
      await rideRequestService.updatePaymentStatus(request.id, newStatus, txHash);
      onStatusUpdate(request.id, newStatus);
      
      toast({
        title: "支付状态已更新",
        description: `支付状态已更新为${getStatusText(newStatus)}`,
      });
    } catch (error) {
      console.error('更新支付状态失败:', error);
      toast({
        title: "更新失败",
        description: "无法更新支付状态",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAutoDetectPayment = async () => {
    if (!request.payment_required || !request.sender_wallet_address) {
      toast({
        title: "无法自动检测",
        description: "需要钱包地址才能自动检测支付",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('auto-detect-payment', {
        body: { rideRequestId: request.id }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        onStatusUpdate(request.id, 'confirmed');
        toast({
          title: "检测成功",
          description: `已找到匹配的支付交易: ${data.transaction.hash.substring(0, 10)}...`,
        });
      } else {
        toast({
          title: "未找到支付",
          description: data.message || "未找到匹配的支付交易，请稍后重试或手动确认",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('自动检测支付失败:', error);
      toast({
        title: "检测失败",
        description: "自动检测支付时出现错误，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: RideRequest['payment_status']) => {
    switch (status) {
      case 'unpaid': return '未支付';
      case 'pending': return '待确认';
      case 'confirmed': return '已确认';
      case 'failed': return '支付失败';
      default: return '未知状态';
    }
  };

  const getStatusIcon = (status: RideRequest['payment_status']) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <CreditCard className="h-4 w-4 text-gray-600" />;
    }
  };

  if (!request.payment_required) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          支付管理
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(request.payment_status)}
            <span className="font-medium">当前状态:</span>
            <Badge className={
              request.payment_status === 'confirmed' ? 'bg-green-100 text-green-700' :
              request.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
              request.payment_status === 'failed' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            }>
              {getStatusText(request.payment_status)}
            </Badge>
          </div>
          <div className="text-sm text-gray-600">
            {request.payment_amount} {request.payment_currency}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">交易哈希 (可选)</label>
          <Input
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            placeholder="输入交易哈希以便核实"
            className="font-mono text-xs"
          />
        </div>

        {/* 自动检测支付按钮 */}
        {request.sender_wallet_address && (request.payment_status === 'unpaid' || request.payment_status === 'pending') && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <div className="font-medium text-blue-800">🔍 智能检测支付</div>
                <div className="text-blue-600">系统可自动检测区块链交易记录</div>
              </div>
              <Button
                size="sm"
                onClick={handleAutoDetectPayment}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Search className="h-4 w-4 mr-1" />
                {loading ? '检测中...' : '自动检测'}
              </Button>
            </div>
            <div className="text-xs text-blue-500 mt-2">
              钱包地址: {request.sender_wallet_address.substring(0, 10)}...{request.sender_wallet_address.substring(request.sender_wallet_address.length - 8)}
            </div>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {request.payment_status === 'unpaid' && (
            <Button
              size="sm"
              onClick={() => handleStatusUpdate('pending')}
              disabled={loading}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              标记为待确认
            </Button>
          )}
          
          {request.payment_status === 'pending' && (
            <>
              <Button
                size="sm"
                onClick={() => handleStatusUpdate('confirmed')}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                确认支付
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusUpdate('failed')}
                disabled={loading}
              >
                <AlertCircle className="h-4 w-4 mr-1" />
                支付失败
              </Button>
            </>
          )}

          {(request.payment_status === 'confirmed' || request.payment_status === 'failed') && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusUpdate('pending')}
              disabled={loading}
            >
              重新审核
            </Button>
          )}
        </div>

        {request.payment_tx_hash && (
          <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded font-mono">
            交易哈希: {request.payment_tx_hash}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentStatusManager;
