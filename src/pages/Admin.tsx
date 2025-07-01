
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, Wallet, Settings, CheckCircle, X, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RideRequest } from '@/types/RideRequest';
import { rideRequestService } from '@/services/rideRequestService';

const Admin = () => {
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // 检查是否已经认证
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      setIsAuthenticated(true);
      loadData();
    } else {
      setLoading(false);
    }
  }, []);

  const handleAdminLogin = () => {
    // 简单的密码验证（实际项目中应该使用更安全的方式）
    if (adminPassword === 'admin123') {
      localStorage.setItem('adminToken', 'authenticated');
      setIsAuthenticated(true);
      loadData();
      toast({
        title: "登录成功",
        description: "欢迎进入管理后台",
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
      const data = await rideRequestService.getAllRideRequests();
      setRequests(data);
    } catch (error) {
      console.error('加载数据失败:', error);
      toast({
        title: "加载失败",
        description: "无法加载管理数据",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (id: string, status: RideRequest['status']) => {
    try {
      await rideRequestService.updateRideRequestStatus(id, status);
      setRequests(prev => prev.map(req => req.id === id ? { ...req, status } : req));
      toast({
        title: "状态已更新",
        description: `需求状态已更新为${status === 'confirmed' ? '已确认' : '已完成'}`,
      });
    } catch (error) {
      console.error('更新状态失败:', error);
      toast({
        title: "更新失败",
        description: "无法更新状态",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              管理员登录
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
          <Shield className="h-12 w-12 text-slate-600 mx-auto mb-4 animate-spin" />
          <p className="text-slate-600">加载管理数据中...</p>
        </div>
      </div>
    );
  }

  const pendingRequests = requests.filter(req => req.status === 'pending');
  const confirmedRequests = requests.filter(req => req.status === 'confirmed');
  const completedRequests = requests.filter(req => req.status === 'completed');
  const paymentRequests = requests.filter(req => req.payment_required);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-slate-600" />
            <h1 className="text-3xl font-bold text-slate-800">管理后台</h1>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            退出登录
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">待处理</p>
                  <p className="text-2xl font-bold text-orange-600">{pendingRequests.length}</p>
                </div>
                <Eye className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">已确认</p>
                  <p className="text-2xl font-bold text-blue-600">{confirmedRequests.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">已完成</p>
                  <p className="text-2xl font-bold text-green-600">{completedRequests.length}</p>
                </div>
                <Users className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">需付费</p>
                  <p className="text-2xl font-bold text-purple-600">{paymentRequests.length}</p>
                </div>
                <Wallet className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending">待处理需求 ({pendingRequests.length})</TabsTrigger>
            <TabsTrigger value="confirmed">已确认需求 ({confirmedRequests.length})</TabsTrigger>
            <TabsTrigger value="completed">已完成需求 ({completedRequests.length})</TabsTrigger>
            <TabsTrigger value="payments">付费需求 ({paymentRequests.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingRequests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h3 className="font-medium">{request.friend_name}</h3>
                      <p className="text-sm text-gray-600">
                        {request.start_location} → {request.end_location}
                      </p>
                      <p className="text-sm text-gray-600">
                        时间: {new Date(request.requested_time).toLocaleString('zh-CN')}
                      </p>
                      {request.contact_info && (
                        <p className="text-sm text-gray-600">联系方式: {request.contact_info}</p>
                      )}
                      {request.notes && (
                        <p className="text-sm text-gray-600">备注: {request.notes}</p>
                      )}
                      {request.payment_required && (
                        <Badge className="bg-purple-100 text-purple-700">
                          需付费: {request.payment_amount} {request.payment_currency}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => updateRequestStatus(request.id, 'confirmed')}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        确认
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateRequestStatus(request.id, 'cancelled')}
                      >
                        <X className="h-4 w-4 mr-1" />
                        取消
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {pendingRequests.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Eye className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">暂无待处理的需求</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="confirmed" className="space-y-4">
            {confirmedRequests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{request.friend_name}</h3>
                        <Badge className="bg-blue-100 text-blue-700">已确认</Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {request.start_location} → {request.end_location}
                      </p>
                      <p className="text-sm text-gray-600">
                        时间: {new Date(request.requested_time).toLocaleString('zh-CN')}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => updateRequestStatus(request.id, 'completed')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      完成
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {confirmedRequests.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">暂无已确认的需求</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedRequests.slice(0, 10).map((request) => (
              <Card key={request.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{request.friend_name}</h3>
                        <Badge className="bg-green-100 text-green-700">已完成</Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {request.start_location} → {request.end_location}
                      </p>
                      <p className="text-sm text-gray-600">
                        完成时间: {new Date(request.updated_at).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {completedRequests.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">暂无已完成的需求</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            {paymentRequests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{request.friend_name}</h3>
                        <Badge className="bg-purple-100 text-purple-700">
                          {request.payment_amount} {request.payment_currency}
                        </Badge>
                        <Badge className={
                          request.payment_status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          request.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }>
                          {request.payment_status === 'unpaid' ? '未支付' :
                           request.payment_status === 'pending' ? '待确认' :
                           request.payment_status === 'confirmed' ? '已支付' : '支付失败'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {request.start_location} → {request.end_location}
                      </p>
                      <p className="text-sm text-gray-600">
                        时间: {new Date(request.requested_time).toLocaleString('zh-CN')}
                      </p>
                      {request.payment_tx_hash && (
                        <p className="text-xs text-gray-500 font-mono">
                          交易哈希: {request.payment_tx_hash}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {paymentRequests.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">暂无付费需求</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
