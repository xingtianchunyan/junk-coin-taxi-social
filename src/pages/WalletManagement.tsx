
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Wallet, Plus, Edit, Trash2, Copy, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { WalletAddress } from '@/types/RideRequest';
import { rideRequestService } from '@/services/rideRequestService';

const WalletManagement = () => {
  const [wallets, setWallets] = useState<WalletAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingWallet, setEditingWallet] = useState<WalletAddress | null>(null);
  const [formData, setFormData] = useState({
    chain_name: '',
    symbol: '',
    address: '',
    qr_code_url: ''
  });
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      setIsAuthenticated(true);
      loadWallets();
    } else {
      setLoading(false);
    }
  }, []);

  const handleAdminLogin = () => {
    if (adminPassword === 'admin123') {
      localStorage.setItem('adminToken', 'authenticated');
      setIsAuthenticated(true);
      loadWallets();
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

  const loadWallets = async () => {
    try {
      setLoading(true);
      const data = await rideRequestService.getAllWalletAddresses();
      setWallets(data);
    } catch (error) {
      console.error('加载钱包地址失败:', error);
      toast({
        title: "加载失败",
        description: "无法加载钱包地址",
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
      loadWallets();
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
      loadWallets();
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
          <p className="text-slate-600">加载钱包数据中...</p>
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
