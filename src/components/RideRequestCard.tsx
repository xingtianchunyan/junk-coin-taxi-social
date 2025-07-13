import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, User, Phone, Trash2, Calendar, CreditCard } from 'lucide-react';
import { RideRequest } from '@/types/RideRequest';
import PaymentDialog from './PaymentDialog';

interface RideRequestCardProps {
  request: RideRequest;
  onDelete: (id: string) => void;
  accessLevel: 'public' | 'private' | 'admin';
}

const RideRequestCard: React.FC<RideRequestCardProps> = ({ request, onDelete, accessLevel }) => {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const isUpcoming = (date: Date) => {
    const now = new Date();
    const timeDiff = date.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);
    return hoursDiff <= 24 && hoursDiff > 0;
  };

  const canShowDetails = accessLevel !== 'public';
  const canManage = accessLevel === 'admin';

  return (
    <>
      <Card className={`transition-all duration-200 hover:shadow-md ${
        request.status === 'completed' 
          ? 'opacity-75 bg-gray-50' 
          : isUpcoming(request.requested_time) 
            ? 'border-orange-200 bg-orange-50' 
            : 'bg-white'
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-lg">
                {canShowDetails ? request.friend_name : '用户'}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {isUpcoming(request.requested_time) && request.status === 'pending' && (
                <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">
                  即将到达
                </Badge>
              )}
              {request.payment_required && accessLevel === 'private' && (
                <Badge variant="outline" className="bg-purple-100 text-purple-700">
                  <CreditCard className="h-3 w-3 mr-1" />
                  需付费
                </Badge>
              )}
              <Badge 
                variant={request.status === 'completed' ? 'secondary' : 'outline'}
                className={request.status === 'completed' ? 'bg-green-100 text-green-700' : ''}
              >
                {request.status === 'completed' ? '已完成' : 
                 request.status === 'confirmed' ? '已确认' : '待处理'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>
              {canShowDetails 
                ? `${request.start_location} → ${request.end_location}`
                : '*** → ***'
              }
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{formatDateTime(request.requested_time)}</span>
          </div>
          
          {canShowDetails && request.contact_info && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-4 w-4" />
              <span>{request.contact_info}</span>
            </div>
          )}
          
          {canShowDetails && request.notes && (
            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
              <strong>备注：</strong>{request.notes}
            </div>
          )}

          {request.payment_required && accessLevel === 'private' && (
            <div className="text-sm p-2 rounded bg-purple-50 border border-purple-200">
              <div className="flex items-center gap-2 text-purple-700">
                <CreditCard className="h-4 w-4" />
                <span className="font-medium">支付信息</span>
              </div>
              <div className="mt-1 text-purple-600">
                金额: {request.payment_amount} {request.payment_currency}
              </div>
              <div className="mt-1 flex items-center justify-between">
                <Badge className={
                  request.payment_status === 'confirmed' ? 'bg-green-100 text-green-700' :
                  request.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }>
                  {request.payment_status === 'unpaid' ? '未支付' :
                   request.payment_status === 'pending' ? '待确认' :
                   request.payment_status === 'confirmed' ? '已支付' : '支付失败'}
                </Badge>
                {request.payment_status === 'unpaid' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowPaymentDialog(true)}
                    className="text-purple-600 border-purple-200 hover:bg-purple-50"
                  >
                    去支付
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Calendar className="h-3 w-3" />
              创建于 {formatDateTime(request.created_at)}
            </div>
            
            {request.status === 'pending' && (canShowDetails || canManage) && (
              <Button
                onClick={() => {
                  if (window.confirm('确定要删除这个用车需求吗？此操作不可撤销。')) {
                    onDelete(request.id);
                  }
                }}
                size="sm"
                variant="destructive"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                删除需求
              </Button>
            )}
          </div>

        </CardContent>
      </Card>

      <PaymentDialog 
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        request={request}
      />
    </>
  );
};

export default RideRequestCard;
