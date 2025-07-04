import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Car, Plus, Eye, Clock, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAccessCode } from '@/components/AccessCodeProvider';
import { RideRequest } from '@/types/RideRequest';
import { rideRequestService } from '@/services/rideRequestService';

const VehicleSharing: React.FC = () => {
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { hasAccess } = useAccessCode();

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

  // 车主只能看到有限的信息：钱包地址、是否付费、乘车时段
  const getOwnerViewRequests = () => {
    return requests.map(req => ({
      id: req.id,
      status: req.status,
      requested_time: req.requested_time,
      payment_status: req.payment_status,
      sender_wallet_address: req.sender_wallet_address || '未提供',
      payment_required: req.payment_required,
      created_at: req.created_at,
      // 隐藏其他敏感信息
      friend_name: '***',
      start_location: '***',
      end_location: '***',
      contact_info: '***',
      notes: undefined,
    }));
  };

  const ownerViewRequests = getOwnerViewRequests();
  const pendingRequests = ownerViewRequests.filter(req => req.status === 'pending');
  const completedRequests = ownerViewRequests.filter(req => req.status === 'completed');

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
        <h1 className="text-3xl font-bold text-gray-800 mb-2">无偿供车</h1>
        <p className="text-gray-600">查看用车需求，管理车辆信息</p>
        <p className="text-sm text-muted-foreground mt-2">
          车主视图：仅显示钱包地址、付费状态和乘车时段
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">待处理需求</p>
                <p className="text-3xl font-bold">{pendingRequests.length}</p>
              </div>
              <Clock className="h-10 w-10 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">已完成需求</p>
                <p className="text-3xl font-bold">{completedRequests.length}</p>
              </div>
              <Eye className="h-10 w-10 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">总需求数</p>
                <p className="text-3xl font-bold">{requests.length}</p>
              </div>
              <Car className="h-10 w-10 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 添加车辆按钮 */}
      <div className="flex justify-center mb-8">
        <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg">
          <Plus className="h-5 w-5 mr-2" />
          添加可用车辆
        </Button>
      </div>

      {/* 用车需求列表 */}
      <div className="space-y-8">
        {/* 待处理的需求 */}
        {pendingRequests.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">待处理需求</h2>
              <Badge variant="outline" className="bg-orange-100 text-orange-700">
                {pendingRequests.length} 个
              </Badge>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pendingRequests.map(request => (
                <Card key={request.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">用车需求</CardTitle>
                      <Badge variant="outline" className="bg-orange-100 text-orange-700">
                        {request.status === 'pending' ? '待处理' : '已完成'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">乘车时间:</span>
                        <p className="mt-1">{request.requested_time.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">创建时间:</span>
                        <p className="mt-1">{request.created_at.toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div>
                      <span className="font-medium text-gray-600">钱包地址:</span>
                      <p className="mt-1 font-mono text-sm bg-gray-100 p-2 rounded">
                        {request.sender_wallet_address}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-gray-600">付费状态:</span>
                        <Badge 
                          variant={request.payment_required ? "default" : "secondary"}
                          className="ml-2"
                        >
                          {request.payment_required ? '需要付费' : '免费服务'}
                        </Badge>
                      </div>
                      <Wallet className="h-5 w-5 text-gray-500" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 已完成的需求 */}
        {completedRequests.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">已完成需求</h2>
              <Badge variant="outline" className="bg-green-100 text-green-700">
                {completedRequests.length} 个
              </Badge>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {completedRequests
                .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
                .slice(0, 4)
                .map(request => (
                  <Card key={request.id} className="opacity-75">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">用车需求</CardTitle>
                        <Badge variant="outline" className="bg-green-100 text-green-700">
                          已完成
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">乘车时间:</span>
                          <p className="mt-1">{request.requested_time.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">完成时间:</span>
                          <p className="mt-1">{request.created_at.toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      <div>
                        <span className="font-medium text-gray-600">钱包地址:</span>
                        <p className="mt-1 font-mono text-sm bg-gray-100 p-2 rounded">
                          {request.sender_wallet_address}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <Badge 
                          variant={request.payment_required ? "default" : "secondary"}
                        >
                          {request.payment_required ? '已付费' : '免费服务'}
                        </Badge>
                        <Wallet className="h-5 w-5 text-gray-500" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        )}

        {/* 空状态 */}
        {requests.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Car className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">暂无用车需求</h3>
              <p className="text-gray-500">当有新的用车需求时，会在这里显示</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VehicleSharing;