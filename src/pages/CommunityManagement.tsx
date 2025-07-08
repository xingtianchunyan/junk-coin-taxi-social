import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, Plus, Trash2, Route, Car, LogOut, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAccessCode } from '@/components/AccessCodeProvider';
import { useToast } from '@/hooks/use-toast';
import { rideRequestService } from '@/services/rideRequestService';
import { FixedRoute, WalletAddress, PresetDestination, Vehicle } from '@/types/RideRequest';
import { supabase } from '@/integrations/supabase/client';

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
  const [showAddWalletDialog, setShowAddWalletDialog] = useState(false);

  const [newRoute, setNewRoute] = useState({
    name: '',
    start_location: '',
    our_price: '',
    currency: 'USDT'
  });

  const [newVehicle, setNewVehicle] = useState({
    driver_name: '',
    license_plate: '',
    max_passengers: 4,
    trunk_length_cm: 100,
    trunk_width_cm: 80,
    trunk_height_cm: 50
  });

  const [newWallet, setNewWallet] = useState({
    chain_name: '',
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
      const routeData = {
        ...newRoute,
        end_location: destination.address,
        our_price: parseFloat(newRoute.our_price) || 0
      };

      await rideRequestService.createDestinationRoute(routeData, destination.id);
      
      toast({
        title: "路线已添加",
        description: "新的路线已成功添加到您的目的地",
      });
      
      setNewRoute({ name: '', start_location: '', our_price: '', currency: 'USDT' });
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
        license_plate: '',
        max_passengers: 4,
        trunk_length_cm: 100,
        trunk_width_cm: 80,
        trunk_height_cm: 50
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

  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination) return;

    try {
      await rideRequestService.createDestinationWallet(newWallet, destination.id);
      
      toast({
        title: "钱包地址已添加",
        description: "新的钱包地址已成功添加到您的目的地",
      });
      
      setNewWallet({ chain_name: '', symbol: '', address: '' });
      setShowAddWalletDialog(false);
      loadCommunityData();
    } catch (error) {
      console.error('添加钱包失败:', error);
      toast({
        title: "添加失败",
        description: "无法添加钱包地址，请检查输入信息",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    clearAccessCode();
    navigate('/');
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
          <TabsTrigger value="wallets" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            钱包管理 ({walletAddresses.length})
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
                        <p className="text-sm font-medium text-green-600">
                          ¥{route.our_price || 0} {route.currency}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          // 可以添加删除功能
                        }}
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
                    <div>
                      <Label htmlFor="route_name">路线名称</Label>
                      <Input
                        id="route_name"
                        value={newRoute.name}
                        onChange={(e) => setNewRoute({...newRoute, name: e.target.value})}
                        placeholder="例如: 合肥南站到DN黄山"
                        required
                      />
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
                        <Label htmlFor="our_price">价格</Label>
                        <Input
                          id="our_price"
                          value={newRoute.our_price}
                          onChange={(e) => setNewRoute({...newRoute, our_price: e.target.value})}
                          placeholder="100"
                          type="number"
                          step="0.01"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="currency">币种</Label>
                        <Select value={newRoute.currency} onValueChange={(value) => setNewRoute({...newRoute, currency: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USDT">USDT</SelectItem>
                            <SelectItem value="BTC">BTC</SelectItem>
                            <SelectItem value="ETH">ETH</SelectItem>
                            <SelectItem value="BNB">BNB</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
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
                        <p className="text-sm text-gray-600">
                          载客: {vehicle.max_passengers}人 | 后备箱: {vehicle.trunk_length_cm}×{vehicle.trunk_width_cm}×{vehicle.trunk_height_cm}cm
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          // 可以添加删除功能
                        }}
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
                    <DialogTitle>添加新车辆</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddVehicle} className="space-y-4">
                    <div>
                      <Label htmlFor="driver_name">司机姓名</Label>
                      <Input
                        id="driver_name"
                        value={newVehicle.driver_name}
                        onChange={(e) => setNewVehicle({...newVehicle, driver_name: e.target.value})}
                        placeholder="司机姓名"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="license_plate">车牌号</Label>
                      <Input
                        id="license_plate"
                        value={newVehicle.license_plate}
                        onChange={(e) => setNewVehicle({...newVehicle, license_plate: e.target.value})}
                        placeholder="皖A12345"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="max_passengers">最大载客数</Label>
                      <Input
                        id="max_passengers"
                        type="number"
                        value={newVehicle.max_passengers}
                        onChange={(e) => setNewVehicle({...newVehicle, max_passengers: parseInt(e.target.value) || 4})}
                        min="1"
                        max="8"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label htmlFor="trunk_length">后备箱长(cm)</Label>
                        <Input
                          id="trunk_length"
                          type="number"
                          value={newVehicle.trunk_length_cm}
                          onChange={(e) => setNewVehicle({...newVehicle, trunk_length_cm: parseInt(e.target.value) || 100})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="trunk_width">后备箱宽(cm)</Label>
                        <Input
                          id="trunk_width"
                          type="number"
                          value={newVehicle.trunk_width_cm}
                          onChange={(e) => setNewVehicle({...newVehicle, trunk_width_cm: parseInt(e.target.value) || 80})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="trunk_height">后备箱高(cm)</Label>
                        <Input
                          id="trunk_height"
                          type="number"
                          value={newVehicle.trunk_height_cm}
                          onChange={(e) => setNewVehicle({...newVehicle, trunk_height_cm: parseInt(e.target.value) || 50})}
                        />
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

        <TabsContent value="wallets">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                钱包管理
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  管理 {destination.name} 的收款钱包地址
                </p>
              </div>

              <div className="space-y-3">
                {walletAddresses.map((wallet) => (
                  <div key={wallet.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{wallet.chain_name}</h4>
                        <p className="text-sm text-gray-600">{wallet.symbol}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          // 可以添加删除功能
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 font-mono break-all">
                        {wallet.address}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Dialog open={showAddWalletDialog} onOpenChange={setShowAddWalletDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    添加钱包地址
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>添加钱包地址</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddWallet} className="space-y-4">
                    <div>
                      <Label htmlFor="chain_name">区块链网络</Label>
                      <Select value={newWallet.chain_name} onValueChange={(value) => setNewWallet({...newWallet, chain_name: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="选择网络" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Ethereum">Ethereum</SelectItem>
                          <SelectItem value="Binance Smart Chain">Binance Smart Chain</SelectItem>
                          <SelectItem value="Polygon">Polygon</SelectItem>
                          <SelectItem value="Tron">Tron</SelectItem>
                          <SelectItem value="Bitcoin">Bitcoin</SelectItem>
                          <SelectItem value="Solana">Solana</SelectItem>
                          <SelectItem value="Arbitrum One">Arbitrum One</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="symbol">币种</Label>
                      <Select value={newWallet.symbol} onValueChange={(value) => setNewWallet({...newWallet, symbol: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="选择币种" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USDT">USDT</SelectItem>
                          <SelectItem value="BTC">BTC</SelectItem>
                          <SelectItem value="ETH">ETH</SelectItem>
                          <SelectItem value="BNB">BNB</SelectItem>
                          <SelectItem value="POL">POL</SelectItem>
                          <SelectItem value="TRX">TRX</SelectItem>
                          <SelectItem value="SOL">SOL</SelectItem>
                          <SelectItem value="ARB">ARB</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="address">收款钱包地址</Label>
                      <Input
                        id="address"
                        value={newWallet.address}
                        onChange={(e) => setNewWallet({...newWallet, address: e.target.value})}
                        placeholder="输入钱包地址"
                        className="font-mono"
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit">添加</Button>
                      <Button type="button" variant="outline" onClick={() => setShowAddWalletDialog(false)}>
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