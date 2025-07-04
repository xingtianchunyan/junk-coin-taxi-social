import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, MapPin, Car, CheckCircle, XCircle, Plus } from 'lucide-react';
import DestinationSelector from '@/components/DestinationSelector';
import { useToast } from '@/hooks/use-toast';

const WorkSchedule: React.FC = () => {
  const [selectedDestination, setSelectedDestination] = useState<any>(null);
  const [showDestinationSelector, setShowDestinationSelector] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [fixedRoutes, setFixedRoutes] = useState<any[]>([]);
  const [newRoute, setNewRoute] = useState({
    hub: '', // 交通枢纽
    destination: '', // 目的地
    distance: '', // 路程长度
    duration: '', // 每趟时间
    fee: '' // 费用
  });
  const { toast } = useToast();

  // 模拟乘客数据
  const passengerGroups = [
    {
      route: '机场-市中心',
      distance: '25km',
      passengers: [
        { name: '张三', time: '09:30', phone: '138****1234', group: 'A组' },
        { name: '李四', time: '09:45', phone: '139****5678', group: 'A组' },
        { name: '王五', time: '10:00', phone: '137****9012', group: 'B组' }
      ]
    },
    {
      route: '火车站-商业区', 
      distance: '15km',
      passengers: [
        { name: '赵六', time: '14:20', phone: '136****3456', group: 'C组' }
      ]
    }
  ];

  const addFixedRoute = () => {
    if (!newRoute.hub || !newRoute.destination || !newRoute.distance || !newRoute.duration || !newRoute.fee) {
      toast({
        title: "信息不完整",
        description: "请填写所有路线信息",
        variant: "destructive",
      });
      return;
    }

    const route = {
      id: Date.now(),
      hub: newRoute.hub,
      destination: newRoute.destination,
      distance: newRoute.distance,
      duration: newRoute.duration,
      fee: newRoute.fee
    };

    setFixedRoutes([...fixedRoutes, route]);
    setNewRoute({ hub: '', destination: '', distance: '', duration: '', fee: '' });
    
    toast({
      title: "路线已添加",
      description: "固定路线设置成功",
    });
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
                  value={newRoute.destination}
                  onChange={(e) => setNewRoute({...newRoute, destination: e.target.value})}
                  placeholder="如：市中心、商业区"
                />
              </div>
              <div>
                <Label htmlFor="distance">路程长度</Label>
                <Input
                  id="distance"
                  value={newRoute.distance}
                  onChange={(e) => setNewRoute({...newRoute, distance: e.target.value})}
                  placeholder="如：25km"
                />
              </div>
              <div>
                <Label htmlFor="duration">每趟时间</Label>
                <Input
                  id="duration"
                  value={newRoute.duration}
                  onChange={(e) => setNewRoute({...newRoute, duration: e.target.value})}
                  placeholder="如：45分钟"
                />
              </div>
              <div>
                <Label htmlFor="fee">费用</Label>
                <Input
                  id="fee"
                  value={newRoute.fee}
                  onChange={(e) => setNewRoute({...newRoute, fee: e.target.value})}
                  placeholder="如：50 USDT"
                />
              </div>
              <Button onClick={addFixedRoute} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                添加路线
              </Button>
            </div>

            {/* 已设置的路线 */}
            {fixedRoutes.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-2">已设置路线</h4>
                <div className="space-y-2">
                  {fixedRoutes.map((route) => (
                    <div key={route.id} className="p-2 bg-gray-50 rounded text-sm">
                      <div className="font-medium">{route.hub} → {route.destination}</div>
                      <div className="text-gray-600">{route.distance} · {route.duration} · {route.fee}</div>
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
                  {passengerGroups.map((group, index) => (
                    <SelectItem key={index} value={group.route}>
                      {group.route}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedRoute && (
              <div className="space-y-4">
                {passengerGroups
                  .filter(group => group.route === selectedRoute)
                  .map((group, groupIndex) => (
                    <div key={groupIndex}>
                      <h4 className="font-semibold mb-3 text-lg">{group.route} ({group.distance})</h4>
                      <div className="space-y-3">
                        {group.passengers.map((passenger, passengerIndex) => (
                          <div key={passengerIndex} className="flex items-center gap-4 p-4 border rounded-lg">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                                <span className="text-sm font-semibold">{passenger.group}</span>
                              </div>
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold">{passenger.name}</span>
                                <Badge variant="outline">{passenger.group}</Badge>
                              </div>
                              <div className="text-sm text-gray-600">
                                <div>服务时间: {passenger.time}</div>
                                <div>联系方式: {passenger.phone}</div>
                                <div>路线: {group.route}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
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
            {passengerGroups
              .sort((a, b) => parseFloat(b.distance) - parseFloat(a.distance))
              .map((group, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-lg">{group.route}</h4>
                    <Badge variant="outline">{group.distance}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.passengers
                      .sort((a, b) => a.time.localeCompare(b.time))
                      .map((passenger, passengerIndex) => (
                        <div key={passengerIndex} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                          <span className="font-medium">{passenger.name}</span>
                          <span className="text-gray-600">{passenger.time}</span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
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