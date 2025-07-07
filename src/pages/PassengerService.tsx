import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock, MapPin, Car } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAccessCode } from '@/components/AccessCodeProvider';
import RideRequestForm from '@/components/RideRequestForm';
import RideRequestCard from '@/components/RideRequestCard';
import DestinationSelector from '@/components/DestinationSelector';
import DestinationSelectionDialog from '@/components/DestinationSelectionDialog';
import DriverWalletDialog from '@/components/DriverWalletDialog';
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
  const {
    toast
  } = useToast();
  const {
    hasAccess,
    accessCode
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
  const addRequest = async (requestData: Omit<RideRequest, 'id' | 'access_code' | 'created_at' | 'updated_at' | 'status' | 'payment_status'>) => {
    try {
      // 必须有访问码才能创建需求
      if (!hasAccess || !accessCode) {
        toast({
          title: "创建失败",
          description: "请先获取访问码",
          variant: "destructive"
        });
        return;
      }

      // 检查访问码是否已在相同时段创建需求
      const existingRequest = requests.find(req => req.access_code === accessCode && req.requested_time.getHours() === requestData.requested_time.getHours());
      if (existingRequest) {
        toast({
          title: "创建失败",
          description: "您已在该时段创建过用车需求",
          variant: "destructive"
        });
        return;
      }
      const request = await rideRequestService.createRideRequest(requestData, accessCode);
      setRequests(prev => [request, ...prev]);
      setShowForm(false);

      // 获取司机钱包地址并显示弹窗
      try {
        const walletAddresses = await rideRequestService.getWalletAddresses();
        setDriverWalletAddresses(walletAddresses);
        setPaymentInfo({
          network: requestData.payment_blockchain || 'Ethereum',
          currency: requestData.payment_currency || 'USDT'
        });
        setShowDriverWalletDialog(true);
      } catch (error) {
        console.error('获取司机钱包地址失败:', error);
      }
      toast({
        title: "用车需求已创建",
        description: "需求已成功提交，请查看司机钱包地址进行支付"
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
  const completeRequest = async (id: string) => {
    try {
      await rideRequestService.updateRideRequestStatus(id, 'completed');
      setRequests(prev => prev.map(req => req.id === id ? {
        ...req,
        status: 'completed' as const
      } : req));
      toast({
        title: "状态已更新",
        description: "用车需求已标记为完成"
      });
    } catch (error) {
      console.error('更新状态失败:', error);
      toast({
        title: "更新失败",
        description: "无法更新状态，请重试",
        variant: "destructive"
      });
    }
  };
  const handleDestinationSelected = (destination: Destination) => {
    setSelectedDestination(destination);
    setShowMandatoryDestinationDialog(false);
  };

  // 根据访问权限过滤和处理数据
  const getFilteredRequests = () => {
    if (!selectedDestination) {
      return []; // 未选择目的地时不显示任何需求
    }
    return requests.map(req => {
      // 有访问码且是自己的请求时，显示全部信息
      if (hasAccess && accessCode && req.access_code === accessCode) {
        return req;
      }
      // 其他情况只显示固定路线信息（保留路线信息）
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
  const filteredRequests = getFilteredRequests();

  // 按路线和时段分组请求，每组最多4人
  const getGroupedRequests = () => {
    const groups: Record<string, Record<string, RideRequest[][]>> = {};
    filteredRequests.sort((a, b) => a.requested_time.getTime() - b.requested_time.getTime()) // 按时间排序
    .forEach(req => {
      const hour = req.requested_time.getHours();
      const period = `${hour}:00-${hour + 1}:00`;
      const routeKey = req.fixed_route_id || 'other';
      if (!groups[period]) groups[period] = {};
      if (!groups[period][routeKey]) groups[period][routeKey] = [];

      // 找到当前路线的最后一个组
      let lastGroup = groups[period][routeKey][groups[period][routeKey].length - 1];

      // 如果没有组或最后一个组已满4人，创建新组
      if (!lastGroup || lastGroup.length >= 4) {
        lastGroup = [];
        groups[period][routeKey].push(lastGroup);
      }
      lastGroup.push(req);
    });
    return groups;
  };
  const groupedRequests = getGroupedRequests();
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
        <h1 className="text-3xl font-bold text-gray-800 mb-2">乘客服务</h1>
        <div className="flex items-center justify-center gap-4">
          <p className="text-gray-600">便捷的用车服务，支持加密货币支付</p>
          <Button variant="outline" size="sm" onClick={() => setShowDestinationDialog(true)} className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            本次到访目的地
            {selectedDestination && <Badge variant="secondary" className="ml-1">
                {selectedDestination.name}
              </Badge>}
          </Button>
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
        {/* 各个时段需求 */}
        {selectedDestination && Object.keys(groupedRequests).length > 0 && <div>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">快速组队出发</h2>
              <Badge variant="outline" className="bg-blue-100 text-blue-700">
                {Object.keys(groupedRequests).length} 个时段
              </Badge>
            </div>
            <div className="space-y-6">
              {Object.entries(groupedRequests).sort(([a], [b]) => a.localeCompare(b)).map(([period, routeGroups]) => <div key={period} className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    {period}
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(routeGroups).map(([routeKey, groups]) => <div key={routeKey} className="space-y-3">
                        {groups.map((group, groupIndex) => <div key={groupIndex} className="border rounded-lg p-3 bg-white">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="bg-green-100 text-green-700">
                                第{groupIndex + 1}组 ({group.length}/4人)
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              {group.map(request => <RideRequestCard key={request.id} request={request} onComplete={completeRequest} accessLevel={hasAccess && accessCode && request.access_code === accessCode ? 'private' : 'public'} />)}
                            </div>
                          </div>)}
                      </div>)}
                  </div>
                </div>)}
            </div>
          </div>}

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
    </div>;
};
export default PassengerService;