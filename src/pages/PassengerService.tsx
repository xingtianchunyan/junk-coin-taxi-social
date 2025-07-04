import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock, Users, Car, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAccessCode } from '@/components/AccessCodeProvider';
import RideRequestForm from '@/components/RideRequestForm';
import RideRequestCard from '@/components/RideRequestCard';
import DestinationSelector from '@/components/DestinationSelector';
import { RideRequest } from '@/types/RideRequest';
import { rideRequestService } from '@/services/rideRequestService';

interface Destination {
  id: string;
  name: string;
  address: string;
  description: string | null;
}

const PassengerService: React.FC = () => {
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDestinationDialog, setShowDestinationDialog] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const { toast } = useToast();
  const { hasAccess, accessCode } = useAccessCode();

  useEffect(() => {
    loadRideRequests();
  }, []);

  const loadRideRequests = async () => {
    try {
      setLoading(true);
      const data = await rideRequestService.getAllRideRequests();
      setRequests(data);
    } catch (error) {
      console.error('加载用车需求失败:', error);
      toast({
        title: "加载失败",
        description: "无法加载用车需求，请刷新页面重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addRequest = async (requestData: Omit<RideRequest, 'id' | 'access_code' | 'created_at' | 'updated_at' | 'status' | 'payment_status'>) => {
    try {
      const { request, accessCode: newAccessCode } = await rideRequestService.createRideRequest(requestData);
      setRequests(prev => [request, ...prev]);
      setShowForm(false);
      
      toast({
        title: "用车需求已创建",
        description: `您的访问码是: ${newAccessCode}`,
        duration: 10000,
      });
    } catch (error) {
      console.error('创建用车需求失败:', error);
      toast({
        title: "创建失败",
        description: "无法创建用车需求，请重试",
        variant: "destructive",
      });
    }
  };

  const completeRequest = async (id: string) => {
    try {
      await rideRequestService.updateRideRequestStatus(id, 'completed');
      setRequests(prev => prev.map(req => req.id === id ? {
        ...req,
        status: 'completed' as const
      } : req));
      
      toast({
        title: "状态已更新",
        description: "用车需求已标记为完成",
      });
    } catch (error) {
      console.error('更新状态失败:', error);
      toast({
        title: "更新失败",
        description: "无法更新状态，请重试",
        variant: "destructive",
      });
    }
  };

  // 根据访问权限过滤和处理数据
  const getFilteredRequests = () => {
    if (hasAccess) {
      return requests; // 有访问码的用户可以看到所有信息
    } else {
      // 游客只显示时间和状态信息
      return requests.map(req => ({
        ...req,
        friend_name: '***',
        start_location: '***',
        end_location: '***',
        contact_info: '***',
        notes: undefined
      }));
    }
  };

  const filteredRequests = getFilteredRequests();
  
  // 模拟同时段数据 (实际应从数据库获取)
  const currentPeriodPassengers = filteredRequests.filter(req => req.status === 'pending').length;
  const currentPeriodDrivers = 3; // 模拟数据
  const currentPeriodVehicles = 5; // 模拟数据
  
  // 按时段分组请求
  const requestsByPeriod = filteredRequests.reduce((acc, req) => {
    const hour = req.requested_time.getHours();
    const period = `${hour}:00-${hour + 1}:00`;
    if (!acc[period]) acc[period] = [];
    acc[period].push(req);
    return acc;
  }, {} as Record<string, RideRequest[]>);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Car className="h-12 w-12 text-green-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">乘客服务</h1>
        <div className="flex items-center justify-center gap-4">
          <p className="text-gray-600">便捷的用车服务，支持加密货币支付</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDestinationDialog(true)}
            className="flex items-center gap-2"
          >
            <MapPin className="h-4 w-4" />
            本次到访目的地
            {selectedDestination && (
              <Badge variant="secondary" className="ml-1">
                {selectedDestination.name}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">同时段乘客</p>
                <p className="text-3xl font-bold">{currentPeriodPassengers}</p>
              </div>
              <Users className="h-10 w-10 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">同时段司机</p>
                <p className="text-3xl font-bold">{currentPeriodDrivers}</p>
              </div>
              <Clock className="h-10 w-10 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">同时段车辆</p>
                <p className="text-3xl font-bold">{currentPeriodVehicles}</p>
              </div>
              <Car className="h-10 w-10 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 添加需求按钮 */}
      <div className="flex justify-center mb-8">
        <Button onClick={() => setShowForm(!showForm)} size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg">
          <Plus className="h-5 w-5 mr-2" />
          {showForm ? '取消添加' : '添加用车需求'}
        </Button>
      </div>

      {/* 添加表单 */}
      {showForm && (
        <div className="flex justify-center mb-8">
          <RideRequestForm 
            onSubmit={addRequest} 
            selectedDestination={selectedDestination}
          />
        </div>
      )}

      {/* 用车需求列表 */}
      <div className="space-y-8">
        {/* 各个时段需求 */}
        {Object.keys(requestsByPeriod).length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">各个时段需求</h2>
              <Badge variant="outline" className="bg-blue-100 text-blue-700">
                {Object.keys(requestsByPeriod).length} 个时段
              </Badge>
            </div>
            <div className="space-y-6">
              {Object.entries(requestsByPeriod)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([period, periodRequests]) => (
                <div key={period} className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    {period}
                    <Badge variant="outline" className="bg-blue-100 text-blue-700">
                      {periodRequests.length} 个需求
                    </Badge>
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {periodRequests.map(request => (
                      <RideRequestCard 
                        key={request.id} 
                        request={request} 
                        onComplete={completeRequest}
                        accessLevel={hasAccess ? 'private' : 'public'}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 空状态 */}
        {requests.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Car className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">还没有用车需求</h3>
              <p className="text-gray-500 mb-6">点击上方按钮添加第一个用车需求吧！</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 目的地选择弹窗 */}
      <DestinationSelector
        open={showDestinationDialog}
        onOpenChange={setShowDestinationDialog}
        onSelect={setSelectedDestination}
        selectedDestination={selectedDestination}
      />
    </div>
  );
};

export default PassengerService;