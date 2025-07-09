import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, MapPin, Car, CheckCircle, XCircle, Plus, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAccessCode } from '@/components/AccessCodeProvider';
import DestinationSelector from '@/components/DestinationSelector';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { vehicleService } from '@/services/vehicleService';
import { Vehicle } from '@/types/Vehicle';
import { LuggageItem } from '@/types/RideRequest';

const WorkSchedule: React.FC = () => {
  const [selectedDestination, setSelectedDestination] = useState<any>(null);
  const [showDestinationSelector, setShowDestinationSelector] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [fixedRoutes, setFixedRoutes] = useState<any[]>([]);
  const [rideRequests, setRideRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [driverVehicle, setDriverVehicle] = useState<Vehicle | null>(null);
  const [newRoute, setNewRoute] = useState({
    hub: '',
    destination: '',
    distance: '',
    duration: '',
    fee: ''
  });
  const { toast } = useToast();
  const { clearAccessCode, accessCode } = useAccessCode();
  const navigate = useNavigate();

  // 安全解析行李数据的辅助函数
  const parseLuggageData = (luggage: any): LuggageItem[] => {
    if (!luggage) return [];
    if (Array.isArray(luggage)) return luggage;
    if (typeof luggage === 'string') {
      try {
        const parsed = JSON.parse(luggage);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  // 加载司机车辆信息
  const loadDriverVehicle = async () => {
    if (!accessCode) return;
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('access_code', accessCode)
        .single();
      
      if (userError || !userData) return;

      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', userData.id)
        .eq('is_active', true)
        .single();
      
      if (vehicleError || !vehicleData) return;

      setDriverVehicle({
        ...vehicleData,
        created_at: new Date(vehicleData.created_at),
        updated_at: new Date(vehicleData.updated_at)
      });
    } catch (error) {
      console.error('加载司机车辆信息失败:', error);
    }
  };

  // 加载固定路线
  const loadFixedRoutes = async () => {
    if (!selectedDestination) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fixed_routes')
        .select('*')
        .eq('is_active', true)
        .ilike('end_location', `%${selectedDestination.name}%`);
      
      if (error) throw error;
      setFixedRoutes(data || []);
    } catch (error) {
      console.error('加载固定路线失败:', error);
      toast({
        title: "加载失败",
        description: "无法加载固定路线信息",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // 加载乘客需求
  const loadRideRequests = async () => {
    if (!selectedDestination) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ride_requests')
        .select('*')
        .eq('status', 'pending')
        .ilike('end_location', `%${selectedDestination.name}%`)
        .order('requested_time', { ascending: true });
      
      if (error) throw error;
      
      // 过滤掉当前时间之前1小时之外的请求
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const filteredData = (data || []).filter(request => 
        new Date(request.requested_time) > oneHourAgo
      );
      
      setRideRequests(filteredData);
    } catch (error) {
      console.error('加载乘客需求失败:', error);
      toast({
        title: "加载失败",
        description: "无法加载乘客需求信息",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // 页面加载时获取司机车辆信息
  useEffect(() => {
    loadDriverVehicle();
  }, [accessCode]);

  // 当目的地改变时重新加载数据
  useEffect(() => {
    if (selectedDestination) {
      loadFixedRoutes();
      loadRideRequests();
    }
  }, [selectedDestination]);

  // 检查行李是否能装入车辆后备箱
  const canFitLuggage = (requestLuggage: any, vehicleTrunk: { length: number; width: number; height: number }) => {
    const luggageItems = parseLuggageData(requestLuggage);
    if (luggageItems.length === 0) return true;
    
    const totalVolume = luggageItems.reduce((total, item) => {
      return total + (item.length * item.width * item.height * item.quantity);
    }, 0);
    
    const trunkVolume = vehicleTrunk.length * vehicleTrunk.width * vehicleTrunk.height;
    return totalVolume <= trunkVolume * 0.8;
  };

  // 智能分组函数 - 根据司机车辆容量进行分组
  const getDriverGroupedRequests = () => {
    if (!driverVehicle) return {};
    
    const groups: Record<string, Record<string, any[][]>> = {};
    
    rideRequests
      .sort((a, b) => new Date(a.requested_time).getTime() - new Date(b.requested_time).getTime())
      .forEach(req => {
        const hour = new Date(req.requested_time).getHours();
        const period = `${hour}:00-${hour + 1}:00`;
        const routeKey = req.fixed_route_id || 'other';
        
        if (!groups[period]) groups[period] = {};
        if (!groups[period][routeKey]) groups[period][routeKey] = [];

        // 查找合适的分组
        let addedToGroup = false;
        for (const group of groups[period][routeKey]) {
          // 检查该组的总人数和行李
          const totalPassengers = group.reduce((sum, r) => sum + (r.passenger_count || 1), 0);
          const currentPassengers = req.passenger_count || 1;
          
          // 检查能否容纳这些乘客和行李
          const canFitPeople = totalPassengers + currentPassengers <= driverVehicle.max_passengers;
          if (!canFitPeople) continue;
          
          // 检查所有行李是否能装下
          const allLuggage = [
            ...group.flatMap(r => parseLuggageData(r.luggage)), 
            ...parseLuggageData(req.luggage)
          ];
          const canFitAllLuggage = canFitLuggage(allLuggage, {
            length: driverVehicle.trunk_length_cm,
            width: driverVehicle.trunk_width_cm,
            height: driverVehicle.trunk_height_cm
          });

          if (canFitAllLuggage) {
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

  const addFixedRoute = async () => {
    if (!selectedDestination) {
      toast({
        title: "请先选择目的地",
        description: "需要先选择服务目的地才能添加路线",
        variant: "destructive"
      });
      return;
    }
    if (!newRoute.hub || !newRoute.distance || !newRoute.duration || !newRoute.fee) {
      toast({
        title: "信息不完整",
        description: "请填写所有路线信息",
        variant: "destructive"
      });
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fixed_routes')
        .insert({
          name: `${newRoute.hub}-${selectedDestination.name}`,
          start_location: newRoute.hub,
          end_location: selectedDestination.name,
          distance_km: parseFloat(newRoute.distance),
          estimated_duration_minutes: parseInt(newRoute.duration),
          our_price: parseFloat(newRoute.fee),
          currency: 'USDT',
          is_active: true
        })
        .select()
        .single();
      
      if (error) throw error;
      setFixedRoutes([...fixedRoutes, data]);
      setNewRoute({
        hub: '',
        destination: selectedDestination.name,
        distance: '',
        duration: '',
        fee: ''
      });
      toast({
        title: "路线已添加",
        description: "固定路线设置成功"
      });
    } catch (error) {
      console.error('添加路线失败:', error);
      toast({
        title: "添加失败",
        description: "无法添加固定路线",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAccessCode();
    navigate('/');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">工作安排</h1>
        <div className="flex items-center justify-center gap-4">
          <p className="text-gray-600">管理您的工作时间和订单安排</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowDestinationSelector(true)} className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              服务目的地
            </Button>
            <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              退出登录
            </Button>
          </div>
        </div>
        {selectedDestination && (
          <p className="text-sm text-green-600 mt-2">
            当前目的地：{selectedDestination.name}
          </p>
        )}
        {driverVehicle && (
          <p className="text-sm text-blue-600 mt-1">
            当前车辆：{driverVehicle.license_plate} (载客{driverVehicle.max_passengers}人, 后备箱{driverVehicle.trunk_length_cm}×{driverVehicle.trunk_width_cm}×{driverVehicle.trunk_height_cm}cm)
          </p>
        )}
      </div>

      {/* 智能分组乘客列表 */}
      <div className="space-y-8">
        {selectedDestination && driverVehicle && Object.keys(getDriverGroupedRequests()).length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">智能分组安排</h2>
              <Badge variant="outline" className="bg-blue-100 text-blue-700">
                {Object.keys(getDriverGroupedRequests()).length} 个时段
              </Badge>
            </div>
            <div className="space-y-6">
              {Object.entries(getDriverGroupedRequests())
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
                          {groups.map((group, groupIndex) => {
                            const totalPassengers = group.reduce((sum, r) => sum + (r.passenger_count || 1), 0);
                            const allLuggage = group.flatMap(r => parseLuggageData(r.luggage));
                            return (
                              <div key={groupIndex} className="border rounded-lg p-3 bg-white">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="bg-green-100 text-green-700">
                                    第{groupIndex + 1}组 ({totalPassengers}/{driverVehicle.max_passengers}人)
                                  </Badge>
                                  {allLuggage.length > 0 && (
                                    <Badge variant="outline" className="bg-orange-100 text-orange-700">
                                      行李{allLuggage.reduce((sum, item) => sum + (item?.quantity || 0), 0)}件
                                    </Badge>
                                  )}
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                  {group.map(request => {
                                    const luggageItems = parseLuggageData(request.luggage);
                                    return (
                                      <div key={request.id} className="p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="font-medium">{request.friend_name}</span>
                                          <span className="text-sm text-gray-600">
                                            {new Date(request.requested_time).toLocaleTimeString('zh-CN', {
                                              hour: '2-digit',
                                              minute: '2-digit'
                                            })}
                                          </span>
                                        </div>
                                        <div className="text-sm text-gray-600 space-y-1">
                                          <div>📍 {request.start_location} → {request.end_location}</div>
                                          <div>👥 {request.passenger_count || 1}人</div>
                                          <div>📞 {request.contact_info}</div>
                                          {luggageItems.length > 0 && (
                                            <div className="bg-blue-50 p-2 rounded mt-2">
                                              <div className="font-medium text-blue-800 mb-1">🧳 行李信息:</div>
                                              {luggageItems.map((item: LuggageItem, index: number) => (
                                                <div key={index} className="text-blue-700 text-xs">
                                                  • {item.length}×{item.width}×{item.height}cm × {item.quantity}件
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                          {request.notes && <div>📝 {request.notes}</div>}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* 空状态 */}
        {!selectedDestination && (
          <Card className="text-center py-12">
            <CardContent>
              <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">请选择目的地</h3>
              <p className="text-gray-500 mb-6">请先选择您的服务目的地以查看乘客需求</p>
            </CardContent>
          </Card>
        )}

        {!driverVehicle && selectedDestination && (
          <Card className="text-center py-12">
            <CardContent>
              <Car className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">未找到车辆信息</h3>
              <p className="text-gray-500 mb-6">请确保您的访问码已关联车辆</p>
            </CardContent>
          </Card>
        )}

        {selectedDestination && driverVehicle && rideRequests.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Car className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">暂无乘客需求</h3>
              <p className="text-gray-500 mb-6">当前时段没有待服务的乘客</p>
            </CardContent>
          </Card>
        )}
      </div>
      
      <DestinationSelector 
        open={showDestinationSelector} 
        onOpenChange={setShowDestinationSelector} 
        onSelect={setSelectedDestination} 
        selectedDestination={selectedDestination} 
      />
    </div>
  );
};

export default WorkSchedule;
