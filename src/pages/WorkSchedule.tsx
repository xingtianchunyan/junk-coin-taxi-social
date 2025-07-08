import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, MapPin, Car, CheckCircle, XCircle, Plus } from 'lucide-react';
import DestinationSelector from '@/components/DestinationSelector';
import { useToast } from '@/hooks/use-toast';
import { useAccessCode } from '@/components/AccessCodeProvider';
import { supabase } from '@/integrations/supabase/client';

const WorkSchedule: React.FC = () => {
  const [selectedDestination, setSelectedDestination] = useState<any>(null);
  const [showDestinationSelector, setShowDestinationSelector] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [fixedRoutes, setFixedRoutes] = useState<any[]>([]);
  const [rideRequests, setRideRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newRoute, setNewRoute] = useState({
    hub: '', // 交通枢纽
    destination: '', // 目的地
    distance: '', // 路程长度
    duration: '', // 每趟时间
    fee: '' // 费用
  });
  const { toast } = useToast();
  const { clearAccessCode } = useAccessCode();
  const navigate = useNavigate();

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
        variant: "destructive",
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
      setRideRequests(data || []);
    } catch (error) {
      console.error('加载乘客需求失败:', error);
      toast({
        title: "加载失败", 
        description: "无法加载乘客需求信息",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 当目的地改变时重新加载数据
  useEffect(() => {
    if (selectedDestination) {
      loadFixedRoutes();
      loadRideRequests();
    }
  }, [selectedDestination]);

  const addFixedRoute = async () => {
    if (!selectedDestination) {
      toast({
        title: "请先选择目的地",
        description: "需要先选择服务目的地才能添加路线",
        variant: "destructive",
      });
      return;
    }

    if (!newRoute.hub || !newRoute.distance || !newRoute.duration || !newRoute.fee) {
      toast({
        title: "信息不完整",
        description: "请填写所有路线信息",
        variant: "destructive",
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
      setNewRoute({ hub: '', destination: selectedDestination.name, distance: '', duration: '', fee: '' });
      
      toast({
        title: "路线已添加",
        description: "固定路线设置成功",
      });
    } catch (error) {
      console.error('添加路线失败:', error);
      toast({
        title: "添加失败",
        description: "无法添加固定路线",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">工作安排</h1>
        <div className="flex items-center justify-center gap-4">
          <p className="text-gray-600">管理您的工作时间和订单安排</p>
          <Button
            variant="outline"
            onClick={() => setShowDestinationSelector(true)}
            className="flex items-center gap-2"
          >
            <MapPin className="h-4 w-4" />
            服务目的地
          </Button>
          <Button variant="outline" onClick={() => { clearAccessCode(); navigate('/'); }} className="flex items-center gap-2">
            退出登录
          </Button>
        </div>
        {selectedDestination && (
          <p className="text-sm text-green-600 mt-2">
            当前目的地：{selectedDestination.name}
          </p>
        )}
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 设置固定线路 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              设置固定线路
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="hub">交通枢纽</Label>
                <Input
                  id="hub"
                  value={newRoute.hub}
                  onChange={(e) => setNewRoute({...newRoute, hub: e.target.value})}
                  placeholder="如：机场、火车站"
                />
              </div>
              <div>
                <Label htmlFor="destination">目的地</Label>
                <Input
                  id="destination"
                  value={selectedDestination?.name || ''}
                  disabled
                  placeholder="请先选择服务目的地"
                />
              </div>
              <div>
                <Label htmlFor="distance">路程长度 (km)</Label>
                <Input
                  id="distance"
                  type="number"
                  value={newRoute.distance}
                  onChange={(e) => setNewRoute({...newRoute, distance: e.target.value})}
                  placeholder="如：25"
                />
              </div>
              <div>
                <Label htmlFor="duration">每趟时间 (分钟)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={newRoute.duration}
                  onChange={(e) => setNewRoute({...newRoute, duration: e.target.value})}
                  placeholder="如：45"
                />
              </div>
              <div>
                <Label htmlFor="fee">费用 (USDT)</Label>
                <Input
                  id="fee"
                  type="number"
                  step="0.01"
                  value={newRoute.fee}
                  onChange={(e) => setNewRoute({...newRoute, fee: e.target.value})}
                  placeholder="如：50"
                />
              </div>
              <Button onClick={addFixedRoute} className="w-full" disabled={loading || !selectedDestination}>
                <Plus className="h-4 w-4 mr-2" />
                {loading ? '添加中...' : '添加路线'}
              </Button>
            </div>

            {/* 已设置的路线 */}
            {fixedRoutes.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-2">已设置路线</h4>
                <div className="space-y-2">
                  {fixedRoutes.map((route) => (
                    <div key={route.id} className="p-2 bg-gray-50 rounded text-sm">
                      <div className="font-medium">{route.start_location} → {route.end_location}</div>
                      <div className="text-gray-600">{route.distance_km}km · {route.estimated_duration_minutes}分钟 · {route.our_price} {route.currency}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 已分组乘客信息 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              已分组乘客信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Label htmlFor="routeSelect">选择固定线路</Label>
              <Select value={selectedRoute} onValueChange={setSelectedRoute}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择路线" />
                </SelectTrigger>
                <SelectContent>
                  {fixedRoutes.map((route) => (
                    <SelectItem key={route.id} value={route.id}>
                      {route.name} ({route.distance_km}km)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedRoute && (
              <div className="space-y-4">
                {(() => {
                  const selectedRouteData = fixedRoutes.find(route => route.id === selectedRoute);
                  const routeRequests = rideRequests.filter(request => 
                    request.start_location === selectedRouteData?.start_location &&
                    request.end_location === selectedRouteData?.end_location
                  );
                  
                  if (routeRequests.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <Car className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">暂无乘客</h3>
                        <p className="text-gray-500">该路线暂时没有乘客需求</p>
                      </div>
                    );
                  }

                  return (
                    <div>
                      <h4 className="font-semibold mb-3 text-lg">
                        {selectedRouteData?.name} ({selectedRouteData?.distance_km}km)
                      </h4>
                      <div className="space-y-3">
                        {routeRequests.map((request, index) => (
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
                    </div>
                  );
                })()}
              </div>
            )}

            {!selectedRoute && (
              <div className="text-center py-8">
                <Car className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">请选择路线</h3>
                <p className="text-gray-500">选择固定路线查看乘客信息</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 等待服务乘客列表 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>等待服务乘客列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">加载中...</div>
              </div>
            ) : fixedRoutes.length === 0 ? (
              <div className="text-center py-8">
                <Car className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">暂无路线</h3>
                <p className="text-gray-500">请先添加固定路线</p>
              </div>
            ) : (
              fixedRoutes
                .sort((a, b) => (b.distance_km || 0) - (a.distance_km || 0))
                .map((route) => {
                  const routeRequests = rideRequests.filter(request => 
                    request.start_location === route.start_location &&
                    request.end_location === route.end_location
                  );
                  
                  return (
                    <div key={route.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-lg">{route.name}</h4>
                        <Badge variant="outline">{route.distance_km}km</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {routeRequests.length === 0 ? (
                          <div className="text-sm text-gray-500 italic">暂无乘客需求</div>
                        ) : (
                          routeRequests
                            .sort((a, b) => new Date(a.requested_time).getTime() - new Date(b.requested_time).getTime())
                            .map((request) => (
                              <div key={request.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                                <span className="font-medium">{request.friend_name}</span>
                                <span className="text-gray-600">
                                  {new Date(request.requested_time).toLocaleTimeString('zh-CN', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </CardContent>
      </Card>
      
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