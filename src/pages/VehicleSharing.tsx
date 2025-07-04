import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Car, Plus, Eye, Clock, Wallet, MapPin, Users, Settings, UserCheck, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAccessCode } from '@/components/AccessCodeProvider';
import { RideRequest } from '@/types/RideRequest';
import { rideRequestService } from '@/services/rideRequestService';
import DestinationSelector from '@/components/DestinationSelector';
import VehicleForm from '@/components/VehicleForm';
import MyVehicleCard from '@/components/MyVehicleCard';
interface Destination {
  id: string;
  name: string;
  address: string;
  description: string | null;
}
const VehicleSharing: React.FC = () => {
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDestinationDialog, setShowDestinationDialog] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [showMyVehicle, setShowMyVehicle] = useState(false);
  const [showAuditDriver, setShowAuditDriver] = useState(false);
  const {
    toast
  } = useToast();
  const {
    hasAccess
  } = useAccessCode();
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
        variant: "destructive"
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
      notes: undefined
    }));
  };
  const ownerViewRequests = getOwnerViewRequests();

  // 根据选定目的地过滤请求（模拟数据）
  const getFilteredRequests = () => {
    if (!selectedDestination) return ownerViewRequests;
    // 这里应该根据实际的目的地字段过滤，现在模拟返回所有数据
    return ownerViewRequests;
  };
  const filteredRequests = getFilteredRequests();

  // 统计数据 - 从实际数据计算
  const historicalPassengers = filteredRequests.filter(req => req.payment_status === 'confirmed').length;
  const currentDrivers = 0; // 需要从数据库获取实际司机数量
  const historicalVehicles = 0; // 需要从数据库获取实际车辆数量

  if (loading) {
    return <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Car className="h-12 w-12 text-green-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>;
  }
  return <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">无偿供车</h1>
        <div className="flex items-center justify-center gap-4">
          <p className="text-gray-600">查看用车需求，管理车辆信息，感谢无偿供车的好心人们</p>
          <Button variant="outline" size="sm" onClick={() => setShowDestinationDialog(true)} className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            车辆附近目的地
            {selectedDestination && <Badge variant="secondary" className="ml-1">
                {selectedDestination.name}
              </Badge>}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-2">对车主要有礼貌：不暴力驾驶，油电多于50%要恢复原量，少于50%要加到</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">历史乘客数</p>
                <p className="text-3xl font-bold">{historicalPassengers}</p>
              </div>
              <Users className="h-10 w-10 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">历史司机数</p>
                <p className="text-3xl font-bold">{currentDrivers}</p>
              </div>
              <Clock className="h-10 w-10 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">历史可用车辆数</p>
                <p className="text-3xl font-bold">{historicalVehicles}</p>
              </div>
              <Car className="h-10 w-10 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 添加车辆按钮 */}
      <div className="flex justify-center gap-4 mb-8">
        <Button onClick={() => setShowVehicleForm(!showVehicleForm)} size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg">
          <Plus className="h-5 w-5 mr-2" />
          {showVehicleForm ? '取消添加' : '添加可用车辆'}
        </Button>
        <Button onClick={() => setShowMyVehicle(!showMyVehicle)} size="lg" variant="outline" className="px-8 py-3 text-lg">
          <Settings className="h-5 w-5 mr-2" />
          {showMyVehicle ? '关闭' : '我的车辆'}
        </Button>
        <Button onClick={() => setShowAuditDriver(!showAuditDriver)} size="lg" variant="outline" className="px-8 py-3 text-lg">
          <UserCheck className="h-5 w-5 mr-2" />
          {showAuditDriver ? '关闭' : '审核司机'}
        </Button>
      </div>

      {/* 添加车辆表单 */}
      {showVehicleForm && <div className="flex justify-center mb-8">
          <VehicleForm selectedDestination={selectedDestination} onCancel={() => setShowVehicleForm(false)} />
        </div>}

      {/* 我的车辆信息 */}
      {showMyVehicle && <div className="flex justify-center mb-8">
          <MyVehicleCard selectedDestination={selectedDestination} onCancel={() => setShowMyVehicle(false)} />
        </div>}

      {/* 审核司机 */}
      {showAuditDriver && <div className="flex justify-center mb-8">
          <Card className="w-full max-w-4xl mx-auto">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">审核司机</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowAuditDriver(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-center py-8">
                <p className="text-gray-600">暂无需要审核的司机申请</p>
              </div>
            </CardContent>
          </Card>
        </div>}

      {/* 用车需求列表 */}
      <div className="space-y-8">
        {/* 可用车辆 */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-2xl font-semibold text-gray-800">可用车辆</h2>
            <Badge variant="outline" className="bg-green-100 text-green-700">
              按开放日期显示
            </Badge>
          </div>
          <div className="text-center py-8">
            <Car className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">暂无可用车辆</h3>
            <p className="text-gray-500">请添加车辆信息或选择不同的目的地</p>
          </div>
        </div>
      </div>

      {/* 目的地选择弹窗 */}
      <DestinationSelector open={showDestinationDialog} onOpenChange={setShowDestinationDialog} onSelect={setSelectedDestination} selectedDestination={selectedDestination} />
    </div>;
};
export default VehicleSharing;