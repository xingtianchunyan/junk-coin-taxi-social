import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock, MapPin, Car, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAccessCode } from '@/components/AccessCodeProvider';
import RideRequestForm from '@/components/RideRequestForm';
import RideRequestCard from '@/components/RideRequestCard';
import DestinationSelector from '@/components/DestinationSelector';
import DestinationSelectionDialog from '@/components/DestinationSelectionDialog';
import DriverWalletDialog from '@/components/DriverWalletDialog';
import { RideRequest, Vehicle } from '@/types/RideRequest';
import { rideRequestService } from '@/services/rideRequestService';
import { vehicleService } from '@/services/vehicleService';

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
  const [showMandatoryDestinationDialog, setShowMandatoryDestinationDialog] = useState(true);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [showDriverWalletDialog, setShowDriverWalletDialog] = useState(false);
  const [driverWalletAddresses, setDriverWalletAddresses] = useState<any[]>([]);
  const [paymentInfo, setPaymentInfo] = useState<{
    network: string;
    currency: string;
  }>({
    network: '',
    currency: ''
  });
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const { toast } = useToast();
  const { hasAccess, accessCode, clearAccessCode } = useAccessCode();
  const navigate = useNavigate();

  useEffect(() => {
    loadRideRequests();
    loadVehicles();
  }, []);

  const loadRideRequests = async () => {
    try {
      setLoading(true);
      const data = await rideRequestService.getAllRideRequests();
      // 过滤掉当前时间之前1小时之外的请求
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const filteredData = data.filter(request => 
        new Date(request.requested_time) > oneHourAgo
      );
      setRequests(filteredData);
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

  const loadVehicles = async () => {
    try {
      const vehicleData = await vehicleService.getVehicles();
      setVehicles(vehicleData);
    } catch (error) {
      console.error('加载车辆失败:', error);
    }
  };

  const addRequest = async (
    requestData: Omit<RideRequest, 'id' | 'access_code' | 'created_at' | 'updated_at' | 'status' | 'payment_status'>
  ) => {
    try {
      if (!hasAccess || !accessCode) {
        toast({
          title: "创建失败",
          description: "请先获取访问码",
          variant: "destructive"
        });
        return;
      }

      const existingRequest = requests.find(req => 
        req.access_code === accessCode && 
        req.requested_time.getHours() === requestData.requested_time.getHours()
      );
      if (existingRequest) {
        toast({
          title: "创建失败",
          description: "您已在该时段创建过用车需求",
          variant: "destructive"
        });
        return;
      }

      const request = await rideRequestService.createRideRequest(requestData, accessCode);

      // 重新加载数据以获取最新的组队信息
      await loadRideRequests();
      setShowForm(false);


      toast({
        title: "用车需求已创建",
        description: "需求已成功提交"
      });
    } catch (error) {
      console.error('创建用车需求失败:', error);
      toast({
        title: "创建失败",
        description: "无法创建用车需求，请重试",
        variant: "destructive"
      });
    }
  };


  const deleteRequest = async (id: string) => {
    try {
      await rideRequestService.deleteRideRequest(id);
      setRequests(prev => prev.filter(req => req.id !== id));
      toast({
        title: "删除成功",
        description: "用车需求已删除"
      });
    } catch (error) {
      console.error('删除需求失败:', error);
      toast({
        title: "删除失败",
        description: "无法删除需求，请重试",
        variant: "destructive"
      });
    }
  };

  const handleDestinationSelected = (destination: Destination) => {
    setSelectedDestination(destination);
    setShowMandatoryDestinationDialog(false);
  };

  const handleLogout = () => {
    clearAccessCode();
    navigate('/');
  };

  const getFilteredRequests = () => {
    if (!selectedDestination) {
      return [];
    }
    return requests.map(req => {
      if (hasAccess && accessCode && req.access_code === accessCode) {
        return req;
      }
      return {
        ...req,
        friend_name: '***',
        start_location: req.fixed_route_id ? req.start_location : '***',
        end_location: req.fixed_route_id ? req.end_location : '***',
        contact_info: '***',
        notes: undefined
      };
    });
  };

  // 检查行李是否能装入车辆后备箱
  const canFitLuggage = (requestLuggage: any[], vehicleTrunk: { length: number; width: number; height: number }) => {
    if (!requestLuggage || !Array.isArray(requestLuggage) || requestLuggage.length === 0) return true;
    
    // 计算所有行李的总体积
    const totalVolume = requestLuggage.reduce((total, item) => {
      return total + (item.length * item.width * item.height * item.quantity);
    }, 0);
    
    const trunkVolume = vehicleTrunk.length * vehicleTrunk.width * vehicleTrunk.height;
    
    // 简化的装箱算法：总体积不超过后备箱80%（考虑空间利用率）
    return totalVolume <= trunkVolume * 0.8;
  };

  const getGroupedRequests = () => {
    const filteredRequests = getFilteredRequests();
    const groups: Record<string, Record<string, RideRequest[][]>> = {};
    
    // 获取目的地车辆信息
    const destinationVehicles = vehicles.filter(vehicle => 
      vehicle.destination_id === selectedDestination?.id && vehicle.is_active
    );
    
    filteredRequests
      .sort((a, b) => a.requested_time.getTime() - b.requested_time.getTime())
      .forEach(req => {
        const hour = req.requested_time.getHours();
        const period = `${hour}:00-${hour + 1}:00`;
        const routeKey = req.fixed_route_id || 'other';
        
        if (!groups[period]) groups[period] = {};
        if (!groups[period][routeKey]) groups[period][routeKey] = [];

        // 查找合适的车辆进行分组
        let addedToGroup = false;
        for (const group of groups[period][routeKey]) {
          // 检查该组的总人数和行李
          const totalPassengers = group.reduce((sum, r) => sum + (r.passenger_count || 1), 0);
          const currentPassengers = req.passenger_count || 1;
          
          // 找到能容纳这些乘客和行李的车辆
          const suitableVehicle = destinationVehicles.find(vehicle => {
            const canFitPeople = totalPassengers + currentPassengers <= vehicle.max_passengers;
            if (!canFitPeople) return false;
            
            // 检查所有行李是否能装下
            const allLuggage = [...group.flatMap(r => r.luggage || []), ...(req.luggage || [])];
            return canFitLuggage(allLuggage, {
              length: vehicle.trunk_length_cm,
              width: vehicle.trunk_width_cm,
              height: vehicle.trunk_height_cm
            });
          });

          if (suitableVehicle) {
            group.push(req);
            addedToGroup = true;
            break;
          }
        }

        // 如果没有合适的现有组，创建新组
        if (!addedToGroup) {
          groups[period][routeKey].push([req]);
        }
      });
    
    return groups;
  };

  const groupedRequests = getGroupedRequests();

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
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowDestinationDialog(true)} className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              本次到访目的地
              {selectedDestination && <Badge variant="secondary" className="ml-1">
                  {selectedDestination.name}
                </Badge>}
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              退出登录
            </Button>
          </div>
        </div>
      </div>

      {/* 添加需求按钮 */}
      <div className="flex justify-center mb-8">
        <Button onClick={() => setShowForm(!showForm)} size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg">
          <Plus className="h-5 w-5 mr-2" />
          {showForm ? '取消添加' : '添加用车需求'}
        </Button>
      </div>

      {/* 添加表单 */}
      {showForm && <div className="flex justify-center mb-8">
          <RideRequestForm onSubmit={addRequest} selectedDestination={selectedDestination} />
        </div>}

      {/* 用车需求列表 */}
      <div className="space-y-8">
        {selectedDestination && Object.keys(groupedRequests).length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">快速组队出发</h2>
              <Badge variant="outline" className="bg-blue-100 text-blue-700">
                {Object.keys(groupedRequests).length} 个时段
              </Badge>
            </div>
            <div className="space-y-6">
              {Object.entries(groupedRequests)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([period, routeGroups]) => (
                  <div key={period} className="border rounded-lg p-4 bg-gray-50">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      {period}
                    </h3>
                    <div className="space-y-4">
                      {Object.entries(routeGroups).map(([routeKey, groups]) => (
                        <div key={routeKey} className="space-y-3">
                          {groups.map((group, groupIndex) => (
                            <div key={groupIndex} className="border rounded-lg p-3 bg-white">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="bg-green-100 text-green-700">
                                  第{groupIndex + 1}组 ({group.length}/4人)
                                </Badge>
                              </div>
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {group.map(request => (
                                <RideRequestCard 
                                  key={request.id} 
                                  request={request} 
                                  onDelete={deleteRequest}
                                  accessLevel={hasAccess && accessCode && request.access_code === accessCode ? 'private' : 'public'}
                                />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* 空状态 */}
        {!selectedDestination && <Card className="text-center py-12">
            <CardContent>
              <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">请选择目的地</h3>
              <p className="text-gray-500 mb-6">请先选择您的目的地以查看相关用车需求</p>
            </CardContent>
          </Card>}

        {selectedDestination && requests.length === 0 && <Card className="text-center py-12">
            <CardContent>
              <Car className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">还没有用车需求</h3>
              <p className="text-gray-500 mb-6">点击上方按钮添加第一个用车需求吧！</p>
            </CardContent>
          </Card>}
      </div>

      {/* 目的地选择弹窗 - 可选择性打开 */}
      <DestinationSelector open={showDestinationDialog} onOpenChange={setShowDestinationDialog} onSelect={setSelectedDestination} selectedDestination={selectedDestination} />

      {/* 强制目的地选择弹窗 - 进入页面时必须选择 */}
      <DestinationSelectionDialog open={showMandatoryDestinationDialog} onOpenChange={setShowMandatoryDestinationDialog} onDestinationSelected={handleDestinationSelected} />

      {/* 司机钱包地址弹窗 */}
      <DriverWalletDialog open={showDriverWalletDialog} onOpenChange={setShowDriverWalletDialog} selectedNetwork={paymentInfo.network} selectedCurrency={paymentInfo.currency} walletAddresses={driverWalletAddresses} />

    </div>
  );
};

export default PassengerService;
