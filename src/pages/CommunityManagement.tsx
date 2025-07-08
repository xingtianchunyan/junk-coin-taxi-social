import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Wallet, Plus, Trash2, Route, Car, LogOut, Building2, Phone, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAccessCode } from '@/components/AccessCodeProvider';
import { useToast } from '@/hooks/use-toast';
import { rideRequestService } from '@/services/rideRequestService';
import { FixedRoute, WalletAddress, PresetDestination, Vehicle } from '@/types/RideRequest';
import { supabase } from '@/integrations/supabase/client';

// 支付方式选项
const PAY_WAY_OPTIONS = [
  { value: 1, label: '区块链支付' },
  { value: 2, label: '交易所转账' },
  { value: 3, label: '支付宝或微信' },
  { value: 4, label: '现金支付' },
  { value: 5, label: '免费' }
];

// 区块链网络选项
const CHAIN_OPTIONS = [
  { value: 1, label: 'BITCOIN' },
  { value: 2, label: 'EVM-Compatible' },
  { value: 3, label: 'SOLANA' },
  { value: 4, label: 'TRON' },
  { value: 5, label: 'TON' },
  { value: 6, label: 'SUI' }
];

// 交易所选项
const EXCHANGE_OPTIONS = [
  { value: 1, label: 'BINANCE' },
  { value: 2, label: 'OKX' },
  { value: 3, label: 'coinbase' },
  { value: 4, label: 'Bitget' },
  { value: 5, label: 'Gate' },
  { value: 6, label: 'Bybit' },
  { value: 7, label: 'KuCoin' },
  { value: 8, label: '火币' }
];

// 根据区块链网络显示可用币种
const getAvailableCryptocurrencies = (chainId: number): string[] => {
  switch (chainId) {
    case 1: // BITCOIN
      return ['BTC'];
    case 2: // EVM-Compatible
      return ['ETH', 'USDT', 'USDC', 'BNB', 'MATIC'];
    case 3: // SOLANA
      return ['SOL', 'USDT', 'USDC'];
    case 4: // TRON
      return ['TRX', 'USDT'];
    case 5: // TON
      return ['TON'];
    case 6: // SUI
      return ['SUI'];
    default:
      return [];
  }
};

const CommunityManagement: React.FC = () => {
  const [destination, setDestination] = useState<PresetDestination | null>(null);
  const [routes, setRoutes] = useState<FixedRoute[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [walletAddresses, setWalletAddresses] = useState<WalletAddress[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 创建目的地相关状态
  const [showCreateDestinationDialog, setShowCreateDestinationDialog] = useState(false);
  const [newDestination, setNewDestination] = useState({
    name: '',
    address: '',
    description: ''
  });

  // 添加资源相关状态
  const [showAddRouteDialog, setShowAddRouteDialog] = useState(false);
  const [showAddVehicleDialog, setShowAddVehicleDialog] = useState(false);
  const [showAddPaymentDialog, setShowAddPaymentDialog] = useState(false);

  const [newRoute, setNewRoute] = useState({
    start_location: '',
    distance_km: '',
    estimated_duration_minutes: '',
    market_price: ''
  });

  const [newVehicle, setNewVehicle] = useState({
    driver_name: '',
    driver_phone: '',
    license_plate: '',
    max_passengers: 4,
    trunk_length_cm: 100,
    trunk_width_cm: 80,
    trunk_height_cm: 50,
    discount_percentage: [50] // 愿意的折扣，默认50%
  });

  // 支付管理新增状态
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');

  const [newPayment, setNewPayment] = useState({
    pay_way: 1,
    chain_name: 2,
    exchange_name: 1,
    symbol: '',
    address: ''
  });

  const { toast } = useToast();
  const { accessCode, clearAccessCode } = useAccessCode();
  const navigate = useNavigate();

  useEffect(() => {
    if (accessCode) {
      loadCommunityData();
    }
  }, [accessCode]);

  const loadCommunityData = async () => {
    if (!accessCode) return;
    
    setLoading(true);
    try {
      // 获取社区管理员管理的目的地
      const communityDestination = await rideRequestService.getCommunityDestination(accessCode);
      setDestination(communityDestination);

      if (communityDestination) {
        // 加载该目的地下的所有资源
        const [routeData, vehicleData, walletData] = await Promise.all([
          rideRequestService.getDestinationRoutes(communityDestination.id),
          rideRequestService.getDestinationVehicles(communityDestination.id),
          rideRequestService.getDestinationWallets(communityDestination.id)
        ]);

        setRoutes(routeData);
        setVehicles(vehicleData);
        setWalletAddresses(walletData);
      }
    } catch (error) {
      console.error('加载社区数据失败:', error);
      toast({
        title: "加载失败",
        description: "无法加载社区数据",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDestination = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode) return;

    try {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('access_code', accessCode)
        .single();

      if (!user) throw new Error('用户不存在');

      const destinationData = {
        ...newDestination,
        admin_user_id: user.id
      };

      const newDest = await rideRequestService.createPresetDestination(destinationData);
      setDestination(newDest);
      setShowCreateDestinationDialog(false);
      setNewDestination({ name: '', address: '', description: '' });
      
      toast({
        title: "目的地已创建",
        description: "您的社区目的地已成功创建",
      });
    } catch (error) {
      console.error('创建目的地失败:', error);
      toast({
        title: "创建失败",
        description: "无法创建目的地，请检查输入信息",
        variant: "destructive",
      });
    }
  };

  const handleAddRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination) return;

    try {
      // 自动生成路线名称
      const routeName = `${newRoute.start_location}到${destination.name}`;
      
      const routeData = {
        name: routeName,
        start_location: newRoute.start_location,
        end_location: destination.address,
        distance_km: parseFloat(newRoute.distance_km) || undefined,
        estimated_duration_minutes: parseInt(newRoute.estimated_duration_minutes) || undefined,
        market_price: parseFloat(newRoute.market_price) || undefined,
        our_price: 0, // 不再设置价格，由车辆管理设置
        currency: 'CNY'
      };

      await rideRequestService.createDestinationRoute(routeData, destination.id);
      
      toast({
        title: "路线已添加",
        description: "新的路线已成功添加到您的目的地",
      });
      
      setNewRoute({ 
        start_location: '', 
        distance_km: '',
        estimated_duration_minutes: '',
        market_price: ''
      });
      setShowAddRouteDialog(false);
      loadCommunityData();
    } catch (error) {
      console.error('添加路线失败:', error);
      toast({
        title: "添加失败",
        description: "无法添加路线，请检查输入信息",
        variant: "destructive",
      });
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination) return;

    try {
      await rideRequestService.createDestinationVehicle(newVehicle, destination.id);
      
      toast({
        title: "车辆已添加",
        description: "新的车辆已成功添加到您的目的地",
      });
      
      setNewVehicle({
        driver_name: '',
        driver_phone: '',
        license_plate: '',
        max_passengers: 4,
        trunk_length_cm: 100,
        trunk_width_cm: 80,
        trunk_height_cm: 50,
        discount_percentage: [50]
      });
      setShowAddVehicleDialog(false);
      loadCommunityData();
    } catch (error) {
      console.error('添加车辆失败:', error);
      toast({
        title: "添加失败",
        description: "无法添加车辆，请检查输入信息",
        variant: "destructive",
      });
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination || !selectedRouteId || !selectedVehicleId) {
      toast({
        title: "请选择路线和车辆",
        description: "添加支付方式前需要先选择路线和车辆",
        variant: "destructive",
      });
      return;
    }

    try {
      // 对于非区块链、非交易所的支付方式，设置默认值
      const paymentData = {
        ...newPayment,
        symbol: newPayment.pay_way >= 3 ? 'CNY' : newPayment.symbol,
        address: newPayment.pay_way >= 3 ? 'N/A' : newPayment.address
      };

      await rideRequestService.createDestinationWallet(paymentData, destination.id);
      
      toast({
        title: "支付方式已添加",
        description: "新的支付方式已成功添加到您的目的地",
      });
      
      setNewPayment({ 
        pay_way: 1,
        chain_name: 2,
        exchange_name: 1,
        symbol: '', 
        address: '' 
      });
      setSelectedRouteId('');
      setSelectedVehicleId('');
      setShowAddPaymentDialog(false);
      loadCommunityData();
    } catch (error) {
      console.error('添加支付方式失败:', error);
      toast({
        title: "添加失败",
        description: "无法添加支付方式，请检查输入信息",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRoute = async (routeId: string) => {
    try {
      await rideRequestService.toggleFixedRoute(routeId, false);
      toast({
        title: "路线已删除",
        description: "路线已成功删除",
      });
      loadCommunityData();
    } catch (error) {
      console.error('删除路线失败:', error);
      toast({
        title: "删除失败",
        description: "无法删除路线",
        variant: "destructive",
      });
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    try {
      await supabase
        .from('vehicles')
        .update({ is_active: false })
        .eq('id', vehicleId);

      toast({
        title: "车辆已删除",
        description: "车辆已成功删除",
      });
      loadCommunityData();
    } catch (error) {
      console.error('删除车辆失败:', error);
      toast({
        title: "删除失败",
        description: "无法删除车辆",
        variant: "destructive",
      });
    }
  };

  const handleDeletePayment = async (walletId: string) => {
    try {
      await rideRequestService.toggleWalletAddress(walletId, false);
      toast({
        title: "支付方式已删除",
        description: "支付方式已成功删除",
      });
      loadCommunityData();
    } catch (error) {
      console.error('删除支付方式失败:', error);
      toast({
        title: "删除失败",
        description: "无法删除支付方式",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    clearAccessCode();
    navigate('/');
  };

  const getPayWayLabel = (payWay: number) => {
    return PAY_WAY_OPTIONS.find(option => option.value === payWay)?.label || '未知';
  };

  const getChainLabel = (chainId: number) => {
    return CHAIN_OPTIONS.find(option => option.value === chainId)?.label || '未知';
  };

  const getExchangeLabel = (exchangeId: number) => {
    return EXCHANGE_OPTIONS.find(option => option.value === exchangeId)?.label || '未知';
  };

  const getSelectedRoute = () => {
    return routes.find(route => route.id === selectedRouteId);
  };

  const getSelectedVehicle = () => {
    return vehicles.find(vehicle => vehicle.id === selectedVehicleId);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  // 如果没有关联的目的地，显示创建界面
  if (!destination) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">社区管理</h1>
          <div className="flex items-center justify-center gap-4">
            <p className="text-gray-600">欢迎使用社区管理系统</p>
            <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              退出登录
            </Button>
          </div>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              创建您的社区目的地
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-blue-50 rounded-lg mb-6">
              <p className="text-sm text-blue-700">
                您还没有关联的社区目的地。请先创建一个目的地，然后您就可以管理该目的地下的路线、车辆和收款信息。
              </p>
            </div>

            <form onSubmit={handleCreateDestination} className="space-y-4">
              <div>
                <Label htmlFor="dest_name">目的地名称</Label>
                <Input
                  id="dest_name"
                  value={newDestination.name}
                  onChange={(e) => setNewDestination({...newDestination, name: e.target.value})}
                  placeholder="例如: DN黄山"
                  required
                />
              </div>
              <div>
                <Label htmlFor="dest_address">目的地地址</Label>
                <Input
                  id="dest_address"
                  value={newDestination.address}
                  onChange={(e) => setNewDestination({...newDestination, address: e.target.value})}
                  placeholder="例如: 安徽省黄山市黄山风景区"
                  required
                />
              </div>
              <div>
                <Label htmlFor="dest_description">描述（可选）</Label>
                <Input
                  id="dest_description"
                  value={newDestination.description}
                  onChange={(e) => setNewDestination({...newDestination, description: e.target.value})}
                  placeholder="目的地的详细描述"
                />
              </div>
              <Button type="submit" className="w-full">
                <Building2 className="h-4 w-4 mr-2" />
                创建目的地
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 显示目的地管理界面
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">社区管理 - {destination.name}</h1>
        <div className="flex items-center justify-center gap-4">
          <p className="text-gray-600">{destination.address}</p>
          <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            退出登录
          </Button>
        </div>
      </div>

      <Tabs defaultValue="routes" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="routes" className="flex items-center gap-2">
            <Route className="h-4 w-4" />
            路线管理 ({routes.length})
          </TabsTrigger>
          <TabsTrigger value="vehicles" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            车辆管理 ({vehicles.length})
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            支付管理 ({walletAddresses.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="routes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-5 w-5" />
                路线管理
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {routes.map((route) => (
                  <div key={route.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{route.name}</h4>
                        <p className="text-sm text-gray-600">
                          {route.start_location} → {destination.name}
                        </p>
                        <div className="flex gap-4 text-sm text-gray-600 mt-1">
                          {route.distance_km && <span>距离: {route.distance_km}km</span>}
                          {route.estimated_duration_minutes && <span>预计时长: {route.estimated_duration_minutes}分钟</span>}
                          {route.market_price && <span>市场价: ¥{route.market_price}</span>}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteRoute(route.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Dialog open={showAddRouteDialog} onOpenChange={setShowAddRouteDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    添加路线
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>添加新路线到 {destination.name}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddRoute} className="space-y-4">
                    <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                      路线名称将自动生成为：{newRoute.start_location ? `${newRoute.start_location}到${destination.name}` : `起点到${destination.name}`}
                    </div>
                    <div>
                      <Label htmlFor="start_location">起点</Label>
                      <Input
                        id="start_location"
                        value={newRoute.start_location}
                        onChange={(e) => setNewRoute({...newRoute, start_location: e.target.value})}
                        placeholder="例如: 合肥南站"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="distance_km">距离 (km)</Label>
                        <Input
                          id="distance_km"
                          value={newRoute.distance_km}
                          onChange={(e) => setNewRoute({...newRoute, distance_km: e.target.value})}
                          placeholder="150"
                          type="number"
                          step="0.1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="duration">预计时长 (分钟)</Label>
                        <Input
                          id="duration"
                          value={newRoute.estimated_duration_minutes}
                          onChange={(e) => setNewRoute({...newRoute, estimated_duration_minutes: e.target.value})}
                          placeholder="120"
                          type="number"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="market_price">市场价</Label>
                      <Input
                        id="market_price"
                        value={newRoute.market_price}
                        onChange={(e) => setNewRoute({...newRoute, market_price: e.target.value})}
                        placeholder="150"
                        type="number"
                        step="0.01"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit">添加</Button>
                      <Button type="button" variant="outline" onClick={() => setShowAddRouteDialog(false)}>
                        取消
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vehicles">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                车辆管理
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {vehicles.map((vehicle) => (
                  <div key={vehicle.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{vehicle.license_plate}</h4>
                        <p className="text-sm text-gray-600">司机: {vehicle.driver_name}</p>
                        {vehicle.driver_phone && (
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {vehicle.driver_phone}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">
                          载客: {vehicle.max_passengers}人 | 后备箱: {vehicle.trunk_length_cm}×{vehicle.trunk_width_cm}×{vehicle.trunk_height_cm}cm
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteVehicle(vehicle.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Dialog open={showAddVehicleDialog} onOpenChange={setShowAddVehicleDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    添加车辆
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>添加新车辆到 {destination.name}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddVehicle} className="space-y-4">
                    <div>
                      <Label htmlFor="driver_name">司机姓名</Label>
                      <Input
                        id="driver_name"
                        value={newVehicle.driver_name}
                        onChange={(e) => setNewVehicle({...newVehicle, driver_name: e.target.value})}
                        placeholder="例如: 张师傅"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="driver_phone">司机电话</Label>
                      <Input
                        id="driver_phone"
                        value={newVehicle.driver_phone}
                        onChange={(e) => setNewVehicle({...newVehicle, driver_phone: e.target.value})}
                        placeholder="例如: 13800138000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="license_plate">车牌号</Label>
                      <Input
                        id="license_plate"
                        value={newVehicle.license_plate}
                        onChange={(e) => setNewVehicle({...newVehicle, license_plate: e.target.value})}
                        placeholder="例如: 皖A12345"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="max_passengers">最大载客数</Label>
                      <Input
                        id="max_passengers"
                        value={newVehicle.max_passengers}
                        onChange={(e) => setNewVehicle({...newVehicle, max_passengers: parseInt(e.target.value) || 4})}
                        type="number"
                        min="1"
                        max="8"
                        required
                      />
                    </div>
                    <div>
                      <Label>后备箱尺寸 (cm)</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          placeholder="长"
                          value={newVehicle.trunk_length_cm}
                          onChange={(e) => setNewVehicle({...newVehicle, trunk_length_cm: parseInt(e.target.value) || 100})}
                          type="number"
                        />
                        <Input
                          placeholder="宽"
                          value={newVehicle.trunk_width_cm}
                          onChange={(e) => setNewVehicle({...newVehicle, trunk_width_cm: parseInt(e.target.value) || 80})}
                          type="number"
                        />
                        <Input
                          placeholder="高"
                          value={newVehicle.trunk_height_cm}
                          onChange={(e) => setNewVehicle({...newVehicle, trunk_height_cm: parseInt(e.target.value) || 50})}
                          type="number"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>愿意的折扣: {newVehicle.discount_percentage[0]}%</Label>
                      <div className="mt-2">
                        <Slider
                          value={newVehicle.discount_percentage}
                          onValueChange={(value) => setNewVehicle({...newVehicle, discount_percentage: value})}
                          max={80}
                          min={0}
                          step={5}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0%</span>
                          <span>40%</span>
                          <span>80%</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit">添加</Button>
                      <Button type="button" variant="outline" onClick={() => setShowAddVehicleDialog(false)}>
                        取消
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                支付管理
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {walletAddresses.map((wallet) => (
                  <div key={wallet.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{getPayWayLabel(wallet.pay_way)}</h4>
                        {wallet.pay_way === 1 && (
                          <p className="text-sm text-gray-600">
                            网络: {getChainLabel(wallet.chain_name)} | 币种: {wallet.symbol}
                          </p>
                        )}
                        {wallet.pay_way === 2 && wallet.exchange_name && (
                          <p className="text-sm text-gray-600">
                            交易所: {getExchangeLabel(wallet.exchange_name)} | 币种: {wallet.symbol}
                          </p>
                        )}
                        {wallet.address !== 'N/A' && (
                          <p className="text-sm font-mono bg-gray-100 p-1 rounded mt-1 break-all">
                            {wallet.address}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeletePayment(wallet.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Dialog open={showAddPaymentDialog} onOpenChange={setShowAddPaymentDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    添加支付方式
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>添加支付方式到 {destination.name}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddPayment} className="space-y-4">
                    {/* 选择路线和车辆 */}
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700 mb-3">
                        请先选择要为哪个路线和车辆添加支付方式：
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="route_select">选择路线</Label>
                          <Select value={selectedRouteId} onValueChange={setSelectedRouteId}>
                            <SelectTrigger>
                              <SelectValue placeholder="选择路线" />
                            </SelectTrigger>
                            <SelectContent>
                              {routes.map((route) => (
                                <SelectItem key={route.id} value={route.id}>
                                  {route.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="vehicle_select">选择车辆</Label>
                          <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                            <SelectTrigger>
                              <SelectValue placeholder="选择车辆" />
                            </SelectTrigger>
                            <SelectContent>
                              {vehicles.map((vehicle) => (
                                <SelectItem key={vehicle.id} value={vehicle.id}>
                                  {vehicle.license_plate} - {vehicle.driver_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {selectedRouteId && selectedVehicleId && (
                        <div className="mt-3 p-2 bg-white rounded border">
                          <p className="text-sm">
                            <strong>路线:</strong> {getSelectedRoute()?.name}<br/>
                            <strong>车辆:</strong> {getSelectedVehicle()?.license_plate} - {getSelectedVehicle()?.driver_name}
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="pay_way">支付方式</Label>
                      <Select 
                        value={newPayment.pay_way.toString()} 
                        onValueChange={(value) => setNewPayment({...newPayment, pay_way: parseInt(value)})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PAY_WAY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value.toString()}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 区块链支付 */}
                    {newPayment.pay_way === 1 && (
                      <>
                        <div>
                          <Label htmlFor="chain_name">设置网络</Label>
                          <Select 
                            value={newPayment.chain_name.toString()} 
                            onValueChange={(value) => setNewPayment({...newPayment, chain_name: parseInt(value), symbol: ''})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CHAIN_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value.toString()}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="symbol">币种符号</Label>
                          <Input
                            id="symbol"
                            value={newPayment.symbol}
                            onChange={(e) => setNewPayment({...newPayment, symbol: e.target.value})}
                            placeholder="例如: BTC, ETH, USDT"
                            required
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            常用币种：{getAvailableCryptocurrencies(newPayment.chain_name).join(', ')}
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="address">输入地址</Label>
                          <Input
                            id="address"
                            value={newPayment.address}
                            onChange={(e) => setNewPayment({...newPayment, address: e.target.value})}
                            placeholder="钱包地址"
                            required
                          />
                        </div>
                      </>
                    )}

                    {/* 交易所转账 */}
                    {newPayment.pay_way === 2 && (
                      <>
                        <div>
                          <Label htmlFor="exchange_name">选择交易所</Label>
                          <Select 
                            value={newPayment.exchange_name?.toString() || ''} 
                            onValueChange={(value) => setNewPayment({...newPayment, exchange_name: parseInt(value)})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="选择交易所" />
                            </SelectTrigger>
                            <SelectContent>
                              {EXCHANGE_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value.toString()}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="symbol">币种符号</Label>
                          <Input
                            id="symbol"
                            value={newPayment.symbol}
                            onChange={(e) => setNewPayment({...newPayment, symbol: e.target.value})}
                            placeholder="例如: USDT"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="address">输入交易所UID</Label>
                          <Input
                            id="address"
                            value={newPayment.address}
                            onChange={(e) => setNewPayment({...newPayment, address: e.target.value})}
                            placeholder="交易所UID"
                            required
                          />
                        </div>
                      </>
                    )}

                    {/* 其他支付方式不需要额外字段 */}
                    {newPayment.pay_way >= 3 && (
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-700">
                          该支付方式无需额外配置，点击添加即可。
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button type="submit" disabled={!selectedRouteId || !selectedVehicleId}>添加</Button>
                      <Button type="button" variant="outline" onClick={() => setShowAddPaymentDialog(false)}>
                        取消
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommunityManagement;