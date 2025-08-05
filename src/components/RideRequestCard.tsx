import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, User, Phone, Trash2, Calendar, CreditCard, Copy } from 'lucide-react';
import { RideRequest } from '@/types/RideRequest';
import PaymentDialog from './PaymentDialog';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
interface RideRequestCardProps {
  request: RideRequest;
  onDelete: (id: string) => void;
  accessLevel: 'public' | 'private' | 'community_admin';
  vehicles?: any[];
  fixedRoutes?: any[];
}
const RideRequestCard: React.FC<RideRequestCardProps> = ({
  request,
  onDelete,
  accessLevel,
  vehicles = [],
  fixedRoutes = []
}) => {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date).replace(/\//g, '/').replace(/\s/g, '-');
  };
  const isUpcoming = (date: Date) => {
    const now = new Date();
    const timeDiff = date.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);
    return hoursDiff <= 24 && hoursDiff > 0;
  };
  const canShowDetails = accessLevel !== 'public';
  const canManage = accessLevel === 'community_admin';

  // 复制电话号码到剪贴板
  const copyPhoneNumber = async (phoneNumber: string) => {
    try {
      await navigator.clipboard.writeText(phoneNumber);
      toast({
        title: "复制成功",
        description: "电话号码已复制到剪贴板"
      });
    } catch (error) {
      toast({
        title: "复制失败",
        description: "无法复制电话号码",
        variant: "destructive"
      });
    }
  };

  // 拨打电话
  const dialPhoneNumber = (phoneNumber: string) => {
    window.location.href = `tel:${phoneNumber}`;
  };

  // 计算折扣后的价格和折扣信息
  const getDiscountedPrice = () => {
    if (!request.fixed_route_id || !request.vehicle_id) {
      return {
        amount: request.payment_amount,
        discountPercentage: null,
        originalPrice: null
      };
    }
    const selectedRoute = fixedRoutes.find(route => route.id === request.fixed_route_id);
    const selectedVehicle = vehicles.find(vehicle => vehicle.id === request.vehicle_id);
    if (!selectedRoute || !selectedVehicle) {
      return {
        amount: request.payment_amount,
        discountPercentage: null,
        originalPrice: null
      };
    }
    const originalPrice = selectedRoute.market_price || selectedRoute.our_price;
    if (!originalPrice || !selectedVehicle.discount_percentage) {
      return {
        amount: originalPrice || request.payment_amount,
        discountPercentage: null,
        originalPrice
      };
    }
    const discountedAmount = originalPrice * (selectedVehicle.discount_percentage / 100);
    return {
      amount: discountedAmount,
      discountPercentage: selectedVehicle.discount_percentage,
      originalPrice
    };
  };
  const priceInfo = getDiscountedPrice();
  return <>
      <Card className={`transition-all duration-200 hover:shadow-md ${request.status === 'completed' ? 'opacity-75 bg-gray-50' : isUpcoming(request.requested_time) ? 'border-orange-200 bg-orange-50' : 'bg-white'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-lg">
                {canShowDetails ? request.friend_name : '用户'}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {isUpcoming(request.requested_time) && request.status === 'pending' && <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">
                  即将到达
                </Badge>}
              <Badge variant={request.status === 'completed' ? 'secondary' : request.status === 'processing' ? 'outline' : 'outline'} 
                     className={request.status === 'completed' ? 'bg-green-100 text-green-700' : request.status === 'processing' ? 'bg-green-500 text-white' : ''}>
                {request.status === 'completed' ? '已完成' : request.status === 'confirmed' ? '已确认' : request.status === 'processing' ? '处理中' : '待处理'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>
              {canShowDetails ? `${request.start_location} → ${request.end_location}` : '*** → ***'}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{formatDateTime(request.requested_time)}</span>
          </div>
          
          {canShowDetails && accessLevel !== 'community_admin' && (() => {
            const selectedVehicle = vehicles.find(vehicle => vehicle.id === request.vehicle_id);
            return selectedVehicle?.driver_phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4" />
                <span>司机电话: {selectedVehicle.driver_phone}</span>
                <div className="flex items-center gap-1 ml-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyPhoneNumber(selectedVehicle.driver_phone!)}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  {isMobile && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => dialPhoneNumber(selectedVehicle.driver_phone!)}
                      className="h-6 w-6 p-0"
                    >
                      <Phone className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })()}

          {/* 显示乘客电话（仅在工作安排页面，即accessLevel为community_admin时显示） */}
          {canManage && request.contact_info && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-4 w-4" />
              <span>乘客电话: {request.contact_info}</span>
              <div className="flex items-center gap-1 ml-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyPhoneNumber(request.contact_info)}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                {isMobile && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => dialPhoneNumber(request.contact_info)}
                    className="h-6 w-6 p-0"
                  >
                    <Phone className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          )}
          
          {canShowDetails && request.notes && <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
              <strong>备注：</strong>{request.notes}
            </div>}

          {request.payment_required && (accessLevel === 'private' || accessLevel === 'community_admin') && <div className="text-sm p-2 rounded bg-purple-50 border border-purple-200">
              <div className="flex items-center gap-2 text-purple-700">
                <CreditCard className="h-4 w-4" />
                <span className="font-medium">感谢费</span>
              </div>
              <div className="mt-1 text-purple-600">
                {priceInfo.discountPercentage ? <div>
                    <div className="flex items-center gap-2">
                      <span className="line-through text-gray-500">原价: {priceInfo.originalPrice} {request.payment_currency}</span>
                      <Badge variant="outline" className="bg-green-100 text-green-700 text-xs">
                        {priceInfo.discountPercentage}% 折扣
                      </Badge>
                    </div>
                    <div className="font-semibold">
                      折后价: {priceInfo.amount.toFixed(2)} {request.payment_currency}
                    </div>
                  </div> : <span>金额: {priceInfo.amount} {request.payment_currency}</span>}
              </div>
              <div className="mt-1 flex items-center justify-between">
                <Badge className={request.payment_status === 'confirmed' ? 'bg-green-100 text-green-700' : request.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}>
                  {request.payment_status === 'unpaid' ? '未感谢' : request.payment_status === 'pending' ? '待确认' : request.payment_status === 'confirmed' ? '已支付' : '支付失败'}
                </Badge>
                {request.payment_status === 'unpaid' && <Button size="sm" variant="outline" onClick={() => setShowPaymentDialog(true)} className="text-purple-600 border-purple-200 hover:bg-purple-50">去感谢</Button>}
              </div>
            </div>}

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Calendar className="h-3 w-3" />
              创建于 {formatDateTime(request.created_at)}
            </div>
            
            {request.status === 'pending' && (canShowDetails || canManage) && <Button onClick={() => {
            if (window.confirm('确定要删除这个用车需求吗？此操作不可撤销。')) {
              onDelete(request.id);
            }
          }} size="sm" variant="destructive" className="bg-red-600 hover:bg-red-700 text-white">
                <Trash2 className="h-4 w-4 mr-1" />
                删除需求
              </Button>}
          </div>

        </CardContent>
      </Card>

      <PaymentDialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog} request={request} />
    </>;
};
export default RideRequestCard;