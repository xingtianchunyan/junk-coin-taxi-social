import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, Plus, Trash2, Route, Car } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAccessCode } from '@/components/AccessCodeProvider';
import { rideRequestService } from '@/services/rideRequestService';
import { FixedRoute, WalletAddress } from '@/types/RideRequest';
import VehicleManagement from '@/components/VehicleManagement';

const CommunityManagement: React.FC = () => {
  const [routes, setRoutes] = useState<FixedRoute[]>([]);
  const [walletAddresses, setWalletAddresses] = useState<WalletAddress[]>([]);
  const [showAddRouteDialog, setShowAddRouteDialog] = useState(false);
  const [showAddWalletDialog, setShowAddWalletDialog] = useState(false);
  const [newRoute, setNewRoute] = useState({
    name: '',
    start_location: '',
    end_location: '',
    our_price: '',
    currency: 'USDT'
  });
  const [newWallet, setNewWallet] = useState({
    chain_name: '',
    symbol: '',
    address: '',
    owner_type: 'system'
  });
  const { toast } = useToast();
  const { clearAccessCode } = useAccessCode();

  useEffect(() => {
    loadRoutes();
    loadWalletAddresses();
  }, []);

  const loadRoutes = async () => {
    try {
      const routeData = await rideRequestService.getFixedRoutes();
      setRoutes(routeData);
    } catch (error) {
      console.error('加载路线失败:', error);
    }
  };

  const loadWalletAddresses = async () => {
    try {
      const addresses = await rideRequestService.getAllWalletAddresses();
      setWalletAddresses(addresses);
    } catch (error) {
      console.error('加载钱包地址失败:', error);
    }
  };

  const handleAddRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      toast({
        title: "路线已添加",
        description: "新的路线已成功添加到系统",
      });
      
      setNewRoute({ name: '', start_location: '', end_location: '', our_price: '', currency: 'USDT' });
      setShowAddRouteDialog(false);
      loadRoutes();
    } catch (error) {
      toast({
        title: "添加失败",
        description: "无法添加路线，请检查输入信息",
        variant: "destructive",
      });
    }
  };

  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await rideRequestService.createWalletAddress({
        chain_name: newWallet.chain_name,
        symbol: newWallet.symbol,
        address: newWallet.address,
        qr_code_url: ''
      });
      
      toast({
        title: "钱包地址已添加",
        description: "新的钱包地址已成功添加到系统",
      });
      
      setNewWallet({ chain_name: '', symbol: '', address: '', owner_type: 'system' });
      setShowAddWalletDialog(false);
      loadWalletAddresses();
    } catch (error) {
      toast({
        title: "添加失败",
        description: "无法添加钱包地址，请检查输入信息",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">社区管理</h1>
        <div className="flex items-center justify-center gap-4">
          <p className="text-gray-600">管理固定路线、车辆信息和收款钱包地址</p>
          <Button variant="outline" size="sm" onClick={clearAccessCode} className="flex items-center gap-2">
            退出登录
          </Button>
        </div>
      </div>

      <Tabs defaultValue="vehicles" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="vehicles" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            车辆管理
          </TabsTrigger>
          <TabsTrigger value="routes" className="flex items-center gap-2">
            <Route className="h-4 w-4" />
            路线管理
          </TabsTrigger>
          <TabsTrigger value="wallets" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            钱包管理
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vehicles">
          <VehicleManagement />
        </TabsContent>

        <TabsContent value="routes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-5 w-5" />
                路线管理
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 路线列表 */}
              <div className="space-y-3">
                {routes.map((route) => (
                  <div key={route.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{route.name}</h4>
                        <p className="text-sm text-gray-600">
                          {route.start_location} → {route.end_location}
                        </p>
                        <p className="text-sm font-medium text-green-600">
                          ¥{route.our_price || 0} {route.currency || 'USDT'}
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

              {/* 添加路线按钮 */}
              <Dialog open={showAddRouteDialog} onOpenChange={setShowAddRouteDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    添加路线
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>添加新路线</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddRoute} className="space-y-4">
                    <div>
                      <Label htmlFor="route_name">路线名称</Label>
                      <Input
                        id="route_name"
                        value={newRoute.name}
                        onChange={(e) => setNewRoute({...newRoute, name: e.target.value})}
                        placeholder="例如: 机场快线"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="start_location">起点</Label>
                      <Input
                        id="start_location"
                        value={newRoute.start_location}
                        onChange={(e) => setNewRoute({...newRoute, start_location: e.target.value})}
                        placeholder="例如: 北京首都机场"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_location">终点</Label>
                      <Input
                        id="end_location"
                        value={newRoute.end_location}
                        onChange={(e) => setNewRoute({...newRoute, end_location: e.target.value})}
                        placeholder="例如: 北京站"
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

        <TabsContent value="wallets">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                钱包管理
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 说明文字 */}
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  管理社区收款钱包地址，支持为不同人员设置专属收款地址
                </p>
              </div>

              {/* 钱包地址列表 */}
              <div className="space-y-3">
                {walletAddresses.map((wallet) => (
                  <div key={wallet.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{wallet.chain_name}</h4>
                        <p className="text-sm text-gray-600">{wallet.symbol}</p>
                        <p className="text-xs text-gray-500">
                          类型: {(wallet as any).owner_type === 'system' ? '系统' : '个人'}
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
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 font-mono break-all">
                        {wallet.address}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* 添加钱包按钮 */}
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
                      <Label htmlFor="owner_type">归属类型</Label>
                      <Select value={newWallet.owner_type} onValueChange={(value) => setNewWallet({...newWallet, owner_type: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="system">系统收款</SelectItem>
                          <SelectItem value="personal">个人收款</SelectItem>
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
