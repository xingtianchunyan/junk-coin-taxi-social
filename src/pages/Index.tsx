import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Car, Plus, Users, Clock, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { useUserProfile } from '@/hooks/useUserProfile';
import RideRequestForm from '@/components/RideRequestForm';
import RideRequestCard from '@/components/RideRequestCard';
import AccessControl from '@/components/AccessControl';
import { RideRequest } from '@/types/RideRequest';
import { rideRequestService } from '@/services/rideRequestService';

const Index = () => {
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [accessLevel, setAccessLevel] = useState<'public' | 'private' | 'admin'>('public');
  const [accessCode, setAccessCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile } = useUserProfile();

  // 加载用车需求数据
  useEffect(() => {
    loadRideRequests();
  }, []);

  const loadRideRequests = async () => {
    try {
      setLoading(true);
      const data = await rideRequestService.getAllRideRequests();
      setRequests(data);
    } catch (error) {
      console.error('加载用车需求失败:', error);
      toast({
        title: "加载失败",
        description: "无法加载用车需求，请刷新页面重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addRequest = async (requestData: Omit<RideRequest, 'id' | 'access_code' | 'created_at' | 'updated_at' | 'status' | 'payment_status'>) => {
    try {
      // 生成临时访问码（这个逻辑可能需要根据实际需求调整）
      const tempAccessCode = crypto.randomUUID();
      
      const request = await rideRequestService.createRideRequest(requestData, tempAccessCode);
      setRequests(prev => [request, ...prev]);
      setShowForm(false);
      
      // 显示访问码给用户
      toast({
        title: "用车需求已创建",
        description: `您的访问码是: ${tempAccessCode}`,
        duration: 10000,
      });
      
      // 可以选择自动切换到私密模式
      setTimeout(() => {
        if (confirm('是否要使用访问码查看完整信息？')) {
          handleAccessChange('private', tempAccessCode);
        }
      }, 2000);
      
    } catch (error) {
      console.error('创建用车需求失败:', error);
      toast({
        title: "创建失败",
        description: "无法创建用车需求，请重试",
        variant: "destructive",
      });
    }
  };

  const completeRequest = async (id: string) => {
    try {
      await rideRequestService.updateRideRequestStatus(id, 'completed');
      setRequests(prev => prev.map(req => req.id === id ? {
        ...req,
        status: 'completed' as const
      } : req));
      
      toast({
        title: "状态已更新",
        description: "用车需求已标记为完成",
      });
    } catch (error) {
      console.error('更新状态失败:', error);
      toast({
        title: "更新失败",
        description: "无法更新状态，请重试",
        variant: "destructive",
      });
    }
  };

  const handleAccessChange = (level: 'public' | 'private' | 'admin', code?: string) => {
    setAccessLevel(level);
    setAccessCode(code || '');
  };

  // 根据访问级别过滤和处理数据
  const getFilteredRequests = () => {
    if (accessLevel === 'admin') {
      return requests; // 管理员可以看到所有信息
    } else if (accessLevel === 'private' && accessCode) {
      return requests; // 有访问码的用户可以看到所有信息
    } else {
      // 公开访问只显示时间和状态信息
      return requests.map(req => ({
        ...req,
        friend_name: '***',
        start_location: '***',
        end_location: '***',
        contact_info: '***',
        notes: undefined
      }));
    }
  };

  const filteredRequests = getFilteredRequests();
  const pendingRequests = filteredRequests.filter(req => req.status === 'pending');
  const completedRequests = filteredRequests.filter(req => req.status === 'completed');
  const sortedPendingRequests = [...pendingRequests].sort((a, b) => a.requested_time.getTime() - b.requested_time.getTime());

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Car className="h-12 w-12 text-green-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Car className="h-8 w-8 text-green-600" />
            <h1 className="text-4xl font-bold text-gray-800">垃圾币打车</h1>
            <Link 
              to="/admin" 
              className="ml-4 p-2 text-gray-500 hover:text-gray-700 transition-colors"
              title="管理后台"
            >
              <Shield className="h-5 w-5" />
            </Link>
          </div>
          <p className="text-gray-600 text-lg">用加密货币支付的便民用车服务</p>
        </div>

        {/* 访问控制 */}
        <AccessControl 
          onAccessChange={handleAccessChange}
          currentLevel={accessLevel}
        />

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">待处理</p>
                  <p className="text-3xl font-bold">{pendingRequests.length}</p>
                </div>
                <Clock className="h-10 w-10 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">已完成</p>
                  <p className="text-3xl font-bold">{completedRequests.length}</p>
                </div>
                <Users className="h-10 w-10 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">总计</p>
                  <p className="text-3xl font-bold">{requests.length}</p>
                </div>
                <Car className="h-10 w-10 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 添加需求按钮 */}
        <div className="flex justify-center mb-8">
          <Button onClick={() => setShowForm(!showForm)} size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg">
            <Plus className="h-5 w-5 mr-2" />
            {showForm ? '取消添加' : '添加用车需求'}
          </Button>
        </div>

        {/* 添加表单 */}
        {showForm && (
          <div className="flex justify-center mb-8">
            <RideRequestForm onSubmit={addRequest} />
          </div>
        )}

        {/* 用车需求列表 */}
        <div className="space-y-8">
          {/* 待处理的需求 */}
          {sortedPendingRequests.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">待处理需求</h2>
                <Badge variant="outline" className="bg-orange-100 text-orange-700">
                  {pendingRequests.length} 个
                </Badge>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {sortedPendingRequests.map(request => (
                  <RideRequestCard 
                    key={request.id} 
                    request={request} 
                    onDelete={completeRequest}
                    accessLevel={accessLevel}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 已完成的需求 */}
          {completedRequests.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">已完成需求</h2>
                <Badge variant="outline" className="bg-green-100 text-green-700">
                  {completedRequests.length} 个
                </Badge>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {completedRequests
                  .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
                  .slice(0, 4)
                  .map(request => (
                    <RideRequestCard 
                      key={request.id} 
                      request={request} 
                      onDelete={completeRequest}
                      accessLevel={accessLevel}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* 空状态 */}
          {requests.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <Car className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">还没有用车需求</h3>
                <p className="text-gray-500 mb-6">点击上方按钮添加第一个用车需求吧！</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
