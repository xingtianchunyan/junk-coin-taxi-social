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
import RideRequestCard from '@/components/RideRequestCard';
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
  const [workHours, setWorkHours] = useState({
    start_time: '08:00',
    end_time: '18:00',
    start_date: '',
    end_date: ''
  });
  const {
    toast
  } = useToast();
  const {
    clearAccessCode,
    accessCode
  } = useAccessCode();
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

  // 加载司机车辆信息和目的地
  const loadDriverVehicle = async () => {
    if (!accessCode) return;
    try {
      // Session management removed - no longer needed without RLS

      const {
        data: userData,
        error: userError
      } = await supabase.from('users').select('id, destination_id').eq('access_code', accessCode).single();
      if (userError || !userData) return;
      const {
        data: vehicleData,
        error: vehicleError
      } = await supabase.from('vehicles').select('*').eq('user_id', userData.id).eq('is_active', true).single();
      if (vehicleError || !vehicleData) return;
      setDriverVehicle({
        ...vehicleData,
        created_at: new Date(vehicleData.created_at),
        updated_at: new Date(vehicleData.updated_at)
      });

      // 获取目的地ID - 优先使用用户的destination_id，否则使用车辆的destination_id
      const destinationId = userData.destination_id || vehicleData.destination_id;
      if (destinationId) {
        const {
          data: destinationData,
          error: destError
        } = await supabase.from('preset_destinations').select('*').eq('id', destinationId).single();
        if (!destError && destinationData) {
          setSelectedDestination(destinationData);
        }
      }

      // 同时加载工作时间
      setWorkHours({
        start_time: vehicleData.work_start_time || '08:00',
        end_time: vehicleData.work_end_time || '18:00',
        start_date: vehicleData.work_start_date || '',
        end_date: vehicleData.work_end_date || ''
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
      const {
        data,
        error
      } = await supabase.from('fixed_routes').select('*').eq('is_active', true).eq('destination_id', selectedDestination.id);
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
    if (!selectedDestination || !driverVehicle) return;
    try {
      setLoading(true);

      // 获取当前司机的用户ID
      const {
        data: userData,
        error: userError
      } = await supabase.from('users').select('id').eq('access_code', accessCode).single();
      if (userError || !userData) return;

      // 首先获取与目的地相关的路线ID
      const {
        data: routeData,
        error: routeError
      } = await supabase.from('fixed_routes').select('id').eq('destination_id', selectedDestination.id).eq('is_active', true);
      if (routeError) throw routeError;
      const routeIds = routeData?.map(route => route.id) || [];

      // 查询与这些路线相关的订单（包含pending和processing状态）
      const {
        data,
        error
      } = await supabase.from('ride_requests').select('*').in('status', ['pending', 'processing']).in('fixed_route_id', routeIds).order('requested_time', {
        ascending: true
      });
      if (error) throw error;

      // 过滤掉当前时间之前1小时之外的请求
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      let filteredData = (data || []).filter(request => new Date(request.requested_time) > oneHourAgo);

      // 根据需求类型和司机关系进行过滤
      filteredData = filteredData.filter(request => {
        if (request.request_type === 'community_carpool') {
          // 社区顺风车：只显示选择了当前司机的需求
          return request.vehicle_id === driverVehicle.id;
        } else if (request.request_type === 'quick_carpool_info') {
          // 快速拼车：显示所有该目的地下的需求
          return true;
        }
        return false;
      });
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

  // 当目的地或司机车辆改变时重新加载数据
  useEffect(() => {
    if (selectedDestination && driverVehicle) {
      loadFixedRoutes();
      loadRideRequests();
    }
  }, [selectedDestination, driverVehicle]);

  // 检查行李是否能装入车辆后备箱
  const canFitLuggage = (requestLuggage: any, vehicleTrunk: {
    length: number;
    width: number;
    height: number;
  }) => {
    const luggageItems = parseLuggageData(requestLuggage);
    if (luggageItems.length === 0) return true;
    const totalVolume = luggageItems.reduce((total, item) => {
      return total + item.length * item.width * item.height * item.quantity;
    }, 0);
    const trunkVolume = vehicleTrunk.length * vehicleTrunk.width * vehicleTrunk.height;
    return totalVolume <= trunkVolume * 0.8;
  };

  // 智能分组函数 - 根据司机车辆容量进行分组
  const getDriverGroupedRequests = () => {
    if (!driverVehicle) return {};
    const groups: Record<string, Record<string, any[][]>> = {};
    rideRequests.sort((a, b) => new Date(a.requested_time).getTime() - new Date(b.requested_time).getTime()).forEach(req => {
      const hour = new Date(req.requested_time).getHours();
      const period = `${hour}:00-${hour + 1}:00`;
      const routeKey = req.fixed_route_id || 'other';
      if (!groups[period]) groups[period] = {};
      if (!groups[period][routeKey]) groups[period][routeKey] = [];

      // 快速拼车信息类型的需求单独分组
      if (req.request_type === 'quick_carpool_info') {
        groups[period][routeKey].push([req]);
        return;
      }

      // 查找合适的分组（仅对社区顺风车）
      let addedToGroup = false;
      for (const group of groups[period][routeKey]) {
        // 检查该组的总人数和行李
        const totalPassengers = group.reduce((sum, r) => sum + (r.passenger_count || 1), 0);
        const currentPassengers = req.passenger_count || 1;

        // 检查能否容纳这些乘客和行李
        const canFitPeople = totalPassengers + currentPassengers <= driverVehicle.max_passengers;
        if (!canFitPeople) continue;

        // 检查所有行李是否能装下
        const allLuggage = [...group.flatMap(r => parseLuggageData(r.luggage)), ...parseLuggageData(req.luggage)];
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
      const {
        data,
        error
      } = await supabase.from('fixed_routes').insert({
        name: `${newRoute.hub}-${selectedDestination.name}`,
        start_location: newRoute.hub,
        end_location: selectedDestination.name,
        distance_km: parseFloat(newRoute.distance),
        estimated_duration_minutes: parseInt(newRoute.duration),
        our_price: parseFloat(newRoute.fee),
        currency: 'USDT',
        is_active: true
      }).select().single();
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

  // 更新司机服务时间
  const updateWorkHours = async () => {
    if (!driverVehicle) return;
    try {
      // Session management removed - no longer needed without RLS

      const {
        error
      } = await supabase.from('vehicles').update({
        work_start_time: workHours.start_time,
        work_end_time: workHours.end_time,
        work_start_date: workHours.start_date,
        work_end_date: workHours.end_date
      }).eq('id', driverVehicle.id);
      if (error) throw error;
      toast({
        title: "工作时间已更新",
        description: "您的服务时间设置已保存"
      });

      // 重新加载车辆信息
      await loadDriverVehicle();
    } catch (error) {
      console.error('更新工作时间失败:', error);
      toast({
        title: "更新失败",
        description: "无法更新工作时间",
        variant: "destructive"
      });
    }
  };

  // 计算司机工作时间冲突
  const calculateDriverWorkTime = (requests: any[], route: any) => {
    if (!requests.length || !route) return null;

    // 获取时间最早和最晚的请求
    const sortedRequests = requests.sort((a, b) => 
      new Date(a.requested_time).getTime() - new Date(b.requested_time).getTime()
    );
    const earliestRequest = sortedRequests[0];
    const latestRequest = sortedRequests[sortedRequests.length - 1];

    const earliestTime = new Date(earliestRequest.requested_time);
    const latestTime = new Date(latestRequest.requested_time);
    const routeDuration = route.estimated_duration_minutes || 60; // 默认60分钟

    // 判断固定路线的起点是否是目的地
    const isStartFromDestination = selectedDestination && 
      route.start_location.includes(selectedDestination.name) ||
      route.start_location.includes(selectedDestination.address);

    let workStartTime: Date;
    let workEndTime: Date;

    if (isStartFromDestination) {
      // 起点是目的地，司机平时在目的地，从最早时间开始工作
      workStartTime = earliestTime;
      workEndTime = new Date(latestTime.getTime() + routeDuration * 60 * 1000);
    } else {
      // 起点不是目的地，需要提前出发
      workStartTime = new Date(earliestTime.getTime() - routeDuration * 60 * 1000);
      workEndTime = new Date(latestTime.getTime() + routeDuration * 60 * 1000);
    }

    return {
      workStartTime,
      workEndTime,
      duration: (workEndTime.getTime() - workStartTime.getTime()) / (1000 * 60), // 分钟
      isStartFromDestination
    };
  };

  // 检查司机是否有时间冲突
  const checkDriverTimeConflict = (newRequests: any[], newRoute: any) => {
    // 获取司机当前所有处理中的请求
    const currentProcessingRequests = rideRequests.filter(req => 
      req.processing_driver_id && req.status === 'processing'
    );

    if (currentProcessingRequests.length === 0) return false;

    // 按路线分组
    const existingGroups: Record<string, any[]> = {};
    currentProcessingRequests.forEach(req => {
      const routeId = req.fixed_route_id;
      if (!existingGroups[routeId]) existingGroups[routeId] = [];
      existingGroups[routeId].push(req);
    });

    // 计算新请求组的工作时间
    const newWorkTime = calculateDriverWorkTime(newRequests, newRoute);
    if (!newWorkTime) return false;

    // 检查与现有组是否有时间冲突
    for (const [routeId, requests] of Object.entries(existingGroups)) {
      const route = fixedRoutes.find(r => r.id === routeId);
      if (!route) continue;

      const existingWorkTime = calculateDriverWorkTime(requests, route);
      if (!existingWorkTime) continue;

      // 检查时间重叠
      const isOverlapping = 
        (newWorkTime.workStartTime <= existingWorkTime.workEndTime) &&
        (newWorkTime.workEndTime >= existingWorkTime.workStartTime);

      if (isOverlapping) {
        return true;
      }
    }

    return false;
  };

  // 确认帮忙功能
  const handleConfirmAssist = async (requestId: string) => {
    if (!driverVehicle) return;
    try {
      // 获取当前用户信息
      const {
        data: userData,
        error: userError
      } = await supabase.from('users').select('id').eq('access_code', accessCode).single();
      if (userError || !userData) {
        throw new Error('获取用户信息失败');
      }

      // 获取要确认的请求
      const targetRequest = rideRequests.find(req => req.id === requestId);
      if (!targetRequest) return;

      // 获取对应的路线信息
      const route = fixedRoutes.find(r => r.id === targetRequest.fixed_route_id);
      if (!route) return;

      // 获取同一组的所有请求（同一时段、同一路线）
      const groupedRequests = getDriverGroupedRequests();
      let targetGroup: any[] = [];
      
      Object.values(groupedRequests).forEach(periodGroups => {
        Object.values(periodGroups).forEach(routeGroups => {
          routeGroups.forEach(group => {
            if (group.some((req: any) => req.id === requestId)) {
              targetGroup = group;
            }
          });
        });
      });

      // 检查时间冲突
      if (checkDriverTimeConflict(targetGroup, route)) {
        toast({
          title: "时间冲突",
          description: "该时段与您已确认的其他行程存在时间冲突，请合理安排时间",
          variant: "destructive"
        });
        return;
      }

      // 更新整组的状态为处理中，并绑定司机
      const updatePromises = targetGroup.map(req => 
        supabase.from('ride_requests').update({
          status: 'processing',
          processing_driver_id: userData.id
        }).eq('id', req.id)
      );

      await Promise.all(updatePromises);

      toast({
        title: "确认成功",
        description: "您已确认帮忙，订单状态已更新为处理中"
      });

      // 重新加载数据
      await loadRideRequests();
    } catch (error) {
      console.error('确认帮忙失败:', error);
      toast({
        title: "确认失败",
        description: "无法确认帮忙，请重试",
        variant: "destructive"
      });
    }
  };

  // 更新支付状态
  const handleUpdatePaymentStatus = async (requestId: string, status: string) => {
    try {
      const {
        error
      } = await supabase.from('ride_requests').update({
        payment_status: status
      }).eq('id', requestId);
      if (error) throw error;
      toast({
        title: "状态已更新",
        description: "支付状态已成功更新"
      });

      // 重新加载数据
      await loadRideRequests();
    } catch (error) {
      console.error('更新支付状态失败:', error);
      toast({
        title: "更新失败",
        description: "无法更新支付状态，请重试",
        variant: "destructive"
      });
    }
  };
  const handleLogout = () => {
    clearAccessCode();
    navigate('/');
  };
  return <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">工作安排</h1>
        <div className="flex items-center justify-center gap-4">
          <p className="text-gray-600">设置您空闲的时间和查看需求</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              退出登录
            </Button>
          </div>
        </div>
        {selectedDestination && <p className="text-sm text-green-600 mt-2">
            当前目的地：{selectedDestination.name}
          </p>}
        {driverVehicle && <p className="text-sm text-blue-600 mt-1">
            当前车辆：{driverVehicle.license_plate} (载客{driverVehicle.max_passengers}人, 后备箱{driverVehicle.trunk_length_cm}×{driverVehicle.trunk_width_cm}×{driverVehicle.trunk_height_cm}cm)
          </p>}
      </div>

      {/* 司机服务时间设置 */}
      {driverVehicle && <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">设置服务时间</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="work_start_date">开始日期</Label>
                <Input id="work_start_date" type="date" value={workHours.start_date} onChange={e => setWorkHours({
              ...workHours,
              start_date: e.target.value
            })} />
              </div>
              <div>
                <Label htmlFor="work_end_date">结束日期</Label>
                <Input id="work_end_date" type="date" value={workHours.end_date} onChange={e => setWorkHours({
              ...workHours,
              end_date: e.target.value
            })} />
              </div>
              <div>
                <Label htmlFor="work_start">开始时间</Label>
                <Input id="work_start" type="time" value={workHours.start_time} onChange={e => setWorkHours({
              ...workHours,
              start_time: e.target.value
            })} />
              </div>
              <div>
                <Label htmlFor="work_end">结束时间</Label>
                <Input id="work_end" type="time" value={workHours.end_time} onChange={e => setWorkHours({
              ...workHours,
              end_time: e.target.value
            })} />
              </div>
            </div>
            <Button onClick={updateWorkHours} className="mt-4" disabled={!workHours.start_time || !workHours.end_time || !workHours.start_date || !workHours.end_date}>
              更新服务时间
            </Button>
          </CardContent>
        </Card>}

      {/* 智能分组乘客列表 */}
      <div className="space-y-8">
        {selectedDestination && driverVehicle && Object.keys(getDriverGroupedRequests()).length > 0 && <div>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">智能分组安排</h2>
              <Badge variant="outline" className="bg-blue-100 text-blue-700">
                {Object.keys(getDriverGroupedRequests()).length} 个时段
              </Badge>
            </div>
            <div className="space-y-6">
              {Object.entries(getDriverGroupedRequests()).sort(([a], [b]) => a.localeCompare(b)).map(([period, routeGroups]) => <div key={period} className="border rounded-lg p-4 bg-gray-50">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      {period}
                    </h3>
                    <div className="space-y-4">
                      {Object.entries(routeGroups).map(([routeKey, groups]) => <div key={routeKey} className="space-y-3">
                          {groups.map((group, groupIndex) => {
                  const totalPassengers = group.reduce((sum, r) => sum + (r.passenger_count || 1), 0);
                  const allLuggage = group.flatMap(r => parseLuggageData(r.luggage));
                  return <div key={groupIndex} className="border rounded-lg p-3 bg-white">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="bg-green-100 text-green-700">
                                    第{groupIndex + 1}组 ({totalPassengers}/{driverVehicle.max_passengers}人)
                                  </Badge>
                                  {allLuggage.length > 0 && <Badge variant="outline" className="bg-orange-100 text-orange-700">
                                      行李{allLuggage.reduce((sum, item) => sum + (item?.quantity || 0), 0)}件
                                    </Badge>}
                                </div>
                                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                   {group.map(request => <RideRequestCard key={request.id} request={{
                        ...request,
                        requested_time: new Date(request.requested_time),
                        created_at: new Date(request.created_at),
                        updated_at: new Date(request.updated_at)
                      }} onDelete={id => {
                        // Handle delete - reload requests after deletion
                        loadRideRequests();
                      }} onUpdatePaymentStatus={handleUpdatePaymentStatus} accessLevel="community_admin" vehicles={[driverVehicle]} fixedRoutes={fixedRoutes} />)}
                                </div>
                                
                                {/* 确认帮忙按钮 */}
                                {group.some(request => request.status === 'pending') && <div className="mt-3 pt-2 border-t">
                                    <Button size="sm" onClick={() => {
                        const pendingRequest = group.find(request => request.status === 'pending');
                        if (pendingRequest) {
                          handleConfirmAssist(pendingRequest.id);
                        }
                      }} className="w-full bg-green-600 hover:bg-green-700 text-white">
                                      确认帮忙整组
                                    </Button>
                                  </div>}
                              </div>;
                })}
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
              <p className="text-gray-500 mb-6">请先选择您的服务目的地以查看乘客需求</p>
            </CardContent>
          </Card>}

        {!driverVehicle && selectedDestination && <Card className="text-center py-12">
            <CardContent>
              <Car className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">未找到车辆信息</h3>
              <p className="text-gray-500 mb-6">请确保您的访问码已关联车辆</p>
            </CardContent>
          </Card>}

        {selectedDestination && driverVehicle && rideRequests.length === 0 && <Card className="text-center py-12">
            <CardContent>
              <Car className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">暂无乘客需求</h3>
              <p className="text-gray-500 mb-6">当前时段没有待服务的乘客</p>
            </CardContent>
          </Card>}
      </div>
      
      <DestinationSelector open={showDestinationSelector} onOpenChange={setShowDestinationSelector} onSelect={setSelectedDestination} selectedDestination={selectedDestination} />
    </div>;
};
export default WorkSchedule;