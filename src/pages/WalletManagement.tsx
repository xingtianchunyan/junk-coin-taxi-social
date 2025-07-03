import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Wallet, Plus, Edit, Trash2, Copy, QrCode, CreditCard, Coins, MapPin, Route } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { WalletAddress, PresetDestination, FixedRoute } from '@/types/RideRequest';
import { rideRequestService } from '@/services/rideRequestService';
import PaymentMethodManager from '@/components/PaymentMethodManager';
import { supabase } from '@/integrations/supabase/client';

const WalletManagement = () => {
  const [wallets, setWallets] = useState<WalletAddress[]>([]);
  const [destinations, setDestinations] = useState<PresetDestination[]>([]);
  const [fixedRoutes, setFixedRoutes] = useState<FixedRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [showDestinations, setShowDestinations] = useState(false);
  const [showAddDestination, setShowAddDestination] = useState(false);
  const [showFixedRoutes, setShowFixedRoutes] = useState(false);
  const [editingWallet, setEditingWallet] = useState<WalletAddress | null>(null);
  const [editingDestination, setEditingDestination] = useState<PresetDestination | null>(null);
  const [formData, setFormData] = useState({
    chain_name: '',
    symbol: '',
    address: '',
    qr_code_url: ''
  });
  const [destinationFormData, setDestinationFormData] = useState({
    name: '',
    address: '',
    description: ''
  });
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      setIsAuthenticated(true);
      loadData();
    } else {
      setLoading(false);
    }
  }, []);

  const handleAdminLogin = () => {
    if (adminPassword === 'admin123') {
      localStorage.setItem('adminToken', 'authenticated');
      setIsAuthenticated(true);
      loadData();
      toast({
        title: "登录成功",
        description: "欢迎进入钱包管理",
      });
    } else {
      toast({
        title: "登录失败",
        description: "密码错误",
        variant: "destructive",
      });
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [walletsData, destinationsData, routesData] = await Promise.all([
        rideRequestService.getAllWalletAddresses(),
        rideRequestService.getAllPresetDestinations(),
        rideRequestService.getAllFixedRoutes()
      ]);
      setWallets(walletsData);
      setDestinations(destinationsData);
      setFixedRoutes(routesData);
    } catch (error) {
      console.error('加载数据失败:', error);
      toast({
        title: "加载失败",
        description: "无法加载数据",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingWallet) {
        await rideRequestService.updateWalletAddress(editingWallet.id, formData);
        toast({
          title: "更新成功",
          description: "钱包地址已更新",
        });
      } else {
        await rideRequestService.createWalletAddress(formData);
        toast({
          title: "添加成功",
          description: "新钱包地址已添加",
        });
      }
      setFormData({ chain_name: '', symbol: '', address: '', qr_code_url: '' });
      setShowAddForm(false);
      setEditingWallet(null);
      loadData();
    } catch (error) {
      console.error('操作失败:', error);
      toast({
        title: "操作失败",
        description: "无法保存钱包地址",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (wallet: WalletAddress) => {
    setEditingWallet(wallet);
    setFormData({
      chain_name: wallet.chain_name,
      symbol: wallet.symbol,
      address: wallet.address,
      qr_code_url: wallet.qr_code_url || ''
    });
    setShowAddForm(true);
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await rideRequestService.toggleWalletAddress(id, !isActive);
      toast({
        title: "状态已更新",
        description: `钱包地址已${!isActive ? '启用' : '禁用'}`,
      });
      loadData();
    } catch (error) {
      console.error('更新状态失败:', error);
      toast({
        title: "更新失败",
        description: "无法更新钱包状态",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "已复制",
      description: "地址已复制到剪贴板",
    });
  };

  const handleDestinationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDestination) {
        await rideRequestService.updatePresetDestination(editingDestination.id, destinationFormData);
        toast({
          title: "更新成功",
          description: "预设目的地已更新",
        });
      } else {
        const newDestination = await rideRequestService.createPresetDestination(destinationFormData);
        toast({
          title: "添加成功",
          description: "新预设目的地已添加，正在自动生成固定路线...",
        });
        
        // 自动生成固定路线
        await generateFixedRoutes(newDestination.name, newDestination.address);
      }
      setDestinationFormData({ name: '', address: '', description: '' });
      setShowAddDestination(false);
      setEditingDestination(null);
      loadData();
    } catch (error) {
      console.error('操作失败:', error);
      toast({
        title: "操作失败",
        description: "无法保存预设目的地",
        variant: "destructive",
      });
    }
  };

  const generateFixedRoutes = async (destinationName: string, destinationAddress: string) => {
    try {
      const { data: result, error } = await supabase.functions.invoke('auto-generate-routes', {
        body: {
          destination_name: destinationName,
          destination_address: destinationAddress,
          gaode_api_key: true // 指示使用真实的高德地图API
        }
      });

      if (error) {
        throw new Error(error.message);
      }
      
      if (result.success) {
        toast({
          title: "路线生成成功",
          description: result.message,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('自动生成路线失败:', error);
      toast({
        title: "路线生成失败",
        description: "请稍后手动重试",
        variant: "destructive",
      });
    }
  };

  const generateAllRoutes = async () => {
    const { generateRoutesForAllDestinations } = await import('@/utils/generateRoutesForDestinations');
    
    toast({
      title: "开始生成路线",
      description: "正在为所有预设目的地生成真实路线数据...",
    });
    
    try {
      const results = await generateRoutesForAllDestinations();
      const successCount = results.filter(r => r.success).length;
      
      toast({
        title: "路线生成完成",
        description: `成功为 ${successCount}/${results.length} 个目的地生成了路线`,
      });
      
      // 刷新数据
      loadData();
    } catch (error) {
      toast({
        title: "批量生成失败",
        description: "请检查网络连接后重试",
        variant: "destructive",
      });
    }
  };

  const handleEditDestination = (destination: PresetDestination) => {
    setEditingDestination(destination);
    setDestinationFormData({
      name: destination.name,
      address: destination.address,
      description: destination.description || ''
    });
    setShowAddDestination(true);
  };

  const handleToggleDestination = async (id: string, isActive: boolean) => {
    try {
      await rideRequestService.togglePresetDestination(id, !isActive);
      toast({
        title: "状态已更新",
        description: `预设目的地已${!isActive ? '启用' : '禁用'}`,
      });
      loadData();
    } catch (error) {
      console.error('更新状态失败:', error);
      toast({
        title: "更新失败",
        description: "无法更新预设目的地状态",
        variant: "destructive",
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              钱包管理登录
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">管理员密码</label>
              <Input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="请输入管理员密码"
                onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
              />
            </div>
            <Button onClick={handleAdminLogin} className="w-full">
              登录
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Wallet className="h-12 w-12 text-slate-600 mx-auto mb-4 animate-spin" />
          <p className="text-slate-600">加载数据中...</p>
        </div>
      </div>
    );
  }

  if (showPaymentMethods) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto px-4 py-8">
          <PaymentMethodManager onClose={() => setShowPaymentMethods(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Wallet className="h-8 w-8 text-slate-600" />
            <h1 className="text-3xl font-bold text-slate-800">钱包地址管理</h1>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowPaymentMethods(true)}
              variant="outline"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              添加支付途径
            </Button>
            <Button
              onClick={() => setShowDestinations(!showDestinations)}
              variant="outline"
            >
              <MapPin className="h-4 w-4 mr-2" />
              {showDestinations ? '隐藏目的地' : '管理目的地'}
            </Button>
            <Button
              onClick={() => setShowFixedRoutes(!showFixedRoutes)}
              variant="outline"
            >
              <Route className="h-4 w-4 mr-2" />
              {showFixedRoutes ? '隐藏路线' : '查看固定路线'}
            </Button>
            <Button
              onClick={() => {
                setShowAddForm(!showAddForm);
                if (!showAddForm) {
                  setEditingWallet(null);
                  setFormData({ chain_name: '', symbol: '', address: '', qr_code_url: '' });
                }
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              {showAddForm ? '取消' : '添加钱包'}
            </Button>
          </div>
        </div>

        {showDestinations && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  预设目的地管理
                </CardTitle>
                <Button
                  onClick={() => {
                    setShowAddDestination(!showAddDestination);
                    if (!showAddDestination) {
                      setEditingDestination(null);
                      setDestinationFormData({ name: '', address: '', description: '' });
                    }
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {showAddDestination ? '取消' : '添加目的地'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showAddDestination && (
                <Card>
                  <CardHeader>
                    <CardTitle>{editingDestination ? '编辑' : '添加'}预设目的地</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleDestinationSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">名称</label>
                          <Input
                            value={destinationFormData.name}
                            onChange={(e) => setDestinationFormData({...destinationFormData, name: e.target.value})}
                            placeholder="例如: 主校区"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">地址</label>
                          <Input
                            value={destinationFormData.address}
                            onChange={(e) => setDestinationFormData({...destinationFormData, address: e.target.value})}
                            placeholder="详细地址"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">描述 (可选)</label>
                        <Input
                          value={destinationFormData.description}
                          onChange={(e) => setDestinationFormData({...destinationFormData, description: e.target.value})}
                          placeholder="目的地描述"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit">
                          {editingDestination ? '更新' : '添加'}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setShowAddDestination(false);
                            setEditingDestination(null);
                          }}
                        >
                          取消
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {destinations.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>名称</TableHead>
                      <TableHead>地址</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {destinations.map((destination) => (
                      <TableRow key={destination.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{destination.name}</div>
                            {destination.description && (
                              <div className="text-sm text-gray-500">{destination.description}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{destination.address}</TableCell>
                        <TableCell>
                          <Badge variant={destination.is_active ? "default" : "secondary"}>
                            {destination.is_active ? '启用' : '禁用'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditDestination(destination)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleDestination(destination.id, destination.is_active)}
                            >
                              {destination.is_active ? '禁用' : '启用'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">还没有配置预设目的地</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {showFixedRoutes && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Route className="h-5 w-5" />
                  自动生成的固定路线
                </CardTitle>
                <Button onClick={generateAllRoutes} variant="outline" size="sm">
                  <Route className="h-4 w-4 mr-2" />
                  为所有目的地生成真实路线
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {fixedRoutes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>路线名称</TableHead>
                      <TableHead>起点→终点</TableHead>
                      <TableHead>距离</TableHead>
                      <TableHead>时长</TableHead>
                      <TableHead>市场价</TableHead>
                      <TableHead>我们的价格</TableHead>
                      <TableHead>状态</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fixedRoutes.map((route) => (
                      <TableRow key={route.id}>
                        <TableCell className="font-medium">{route.name}</TableCell>
                        <TableCell>{route.start_location} → {route.end_location}</TableCell>
                        <TableCell>{route.distance_km ? `${route.distance_km}km` : '-'}</TableCell>
                        <TableCell>{route.estimated_duration_minutes ? `${route.estimated_duration_minutes}分钟` : '-'}</TableCell>
                        <TableCell>{route.market_price ? `¥${route.market_price}` : '-'}</TableCell>
                        <TableCell className="text-green-600 font-medium">
                          {route.our_price ? `¥${route.our_price}` : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={route.is_active ? "default" : "secondary"}>
                            {route.is_active ? '启用' : '禁用'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Route className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">还没有自动生成的固定路线</p>
                  <p className="text-sm text-gray-400 mt-2">添加预设目的地后会自动生成路线</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {showAddForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{editingWallet ? '编辑' : '添加'}钱包地址</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">链名称</label>
                    <Input
                      value={formData.chain_name}
                      onChange={(e) => setFormData({...formData, chain_name: e.target.value})}
                      placeholder="例如: Bitcoin"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">代币符号</label>
                    <Input
                      value={formData.symbol}
                      onChange={(e) => setFormData({...formData, symbol: e.target.value})}
                      placeholder="例如: BTC"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">钱包地址</label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="输入钱包地址"
                    className="font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">二维码URL (可选)</label>
                  <Input
                    value={formData.qr_code_url}
                    onChange={(e) => setFormData({...formData, qr_code_url: e.target.value})}
                    placeholder="输入二维码图片URL"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">
                    {editingWallet ? '更新' : '添加'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingWallet(null);
                    }}
                  >
                    取消
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>钱包地址列表</CardTitle>
          </CardHeader>
          <CardContent>
            {wallets.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>链/代币</TableHead>
                    <TableHead>地址</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wallets.map((wallet) => (
                    <TableRow key={wallet.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{wallet.chain_name}</div>
                          <div className="text-sm text-gray-500">{wallet.symbol}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm truncate max-w-xs">
                            {wallet.address}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(wallet.address)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={wallet.is_active ? "default" : "secondary"}>
                          {wallet.is_active ? '启用' : '禁用'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(wallet)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleActive(wallet.id, wallet.is_active)}
                          >
                            {wallet.is_active ? '禁用' : '启用'}
                          </Button>
                          {wallet.qr_code_url && (
                            <Button size="sm" variant="outline">
                              <QrCode className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">还没有配置钱包地址</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WalletManagement;
