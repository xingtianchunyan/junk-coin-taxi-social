import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, MapPin, Car, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const WorkSchedule: React.FC = () => {
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [fixedRoutes, setFixedRoutes] = useState<any[]>([]);
  const [rideRequests, setRideRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [vehicleInfo, setVehicleInfo] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // 初始化页面数据
  const initializeData = async () => {
    try {
      setLoading(true);
      const accessCode = localStorage.getItem('rideAccessCode');
      const vehicleId = localStorage.getItem('driverVehicleId');
      
      if (!accessCode || !vehicleId) {
        toast({
          title: "访问信息缺失",
          description: "请重新输入访问码",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      // 获取车辆信息和关联的目的地
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select(`
          *,
          destination:preset_destinations(*)
        `)
        .eq('id', vehicleId)
        .eq('is_active', true)
        .single();

      if (vehicleError) throw vehicleError;
      setVehicleInfo(vehicleData);

      // 获取该目的地的所有路线
      if (vehicleData.destination) {
        const { data: routesData, error: routesError } = await supabase
          .from('fixed_routes')
          .select('*')
          .eq('destination_id', vehicleData.destination.id)
          .eq('is_active', true);

        if (routesError) throw routesError;
        setFixedRoutes(routesData || []);
      }
    } catch (error) {
      console.error('初始化数据失败:', error);
      toast({
        title: "加载失败",
        description: "无法加载工作信息",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 加载乘客需求
  const loadRideRequests = async () => {
    if (!selectedRoute) return;
    
    try {
      const { data, error } = await supabase
        .from('ride_requests')
        .select('*')
        .eq('status', 'pending')
        .eq('fixed_route_id', selectedRoute)
        .order('requested_time', { ascending: true });

      if (error) throw error;
      setRideRequests(data || []);
    } catch (error) {
      console.error('加载乘客需求失败:', error);
      toast({
        title: "加载失败", 
        description: "无法加载乘客需求信息",
        variant: "destructive",
      });
    }
  };

  // 页面初始化
  useEffect(() => {
    initializeData();
  }, []);

  // 当选择路线时加载乘客需求
  useEffect(() => {
    if (selectedRoute) {
      loadRideRequests();
    }
  }, [selectedRoute]);

  const handleLogout = () => {
    localStorage.removeItem('rideAccessCode');
    localStorage.removeItem('driverVehicleId');
    navigate('/');
  };


  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">司机工作台</h1>
        <div className="flex items-center justify-center gap-4">
          <p className="text-gray-600">查看您的工作路线和乘客订单</p>
          <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            退出登录
          </Button>
        </div>
        {vehicleInfo && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg inline-block">
            <div className="flex items-center gap-2 text-blue-700">
              <User className="h-4 w-4" />
              <span className="font-medium">{vehicleInfo.driver_name}</span>
              <span className="text-blue-500">•</span>
              <span>{vehicleInfo.license_plate}</span>
              <span className="text-blue-500">•</span>
              <span>服务目的地: {vehicleInfo.destination?.name || '未设置'}</span>
            </div>
          </div>
        )}
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 可用路线 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              可用路线
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">加载中...</div>
              </div>
            ) : fixedRoutes.length === 0 ? (
              <div className="text-center py-8">
                <Car className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">暂无路线</h3>
                <p className="text-gray-500">社区管理员尚未为您设置任何路线</p>
              </div>
            ) : (
              <div className="space-y-3">
                <Select value={selectedRoute} onValueChange={setSelectedRoute}>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择要查看的路线" />
                  </SelectTrigger>
                  <SelectContent>
                    {fixedRoutes.map((route) => (
                      <SelectItem key={route.id} value={route.id}>
                        {route.name} ({route.distance_km}km)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* 路线列表 */}
                <div className="space-y-2">
                  {fixedRoutes.map((route) => (
                    <div key={route.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium">{route.name}</div>
                      <div className="text-sm text-gray-600">
                        {route.distance_km}km · {route.estimated_duration_minutes}分钟 · {route.our_price} {route.currency}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 乘客订单 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              乘客订单
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedRoute ? (
              <div className="text-center py-8">
                <Car className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">请选择路线</h3>
                <p className="text-gray-500">选择左侧路线查看乘客订单</p>
              </div>
            ) : rideRequests.length === 0 ? (
              <div className="text-center py-8">
                <Car className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">暂无订单</h3>
                <p className="text-gray-500">该路线暂时没有乘客订单</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rideRequests.map((request, index) => (
                  <div key={request.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold">{index + 1}</span>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{request.friend_name}</span>
                        <Badge variant="outline">
                          {request.passenger_count || 1}人
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>服务时间: {new Date(request.requested_time).toLocaleString('zh-CN')}</div>
                        <div>联系方式: {request.contact_info || '未提供'}</div>
                        <div>路线: {request.start_location} → {request.end_location}</div>
                        {request.notes && <div>备注: {request.notes}</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
};

export default WorkSchedule;