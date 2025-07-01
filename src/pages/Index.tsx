
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Car, Plus, Users, Clock } from 'lucide-react';
import RideRequestForm from '@/components/RideRequestForm';
import RideRequestCard from '@/components/RideRequestCard';
import { RideRequest } from '@/types/RideRequest';

const Index = () => {
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [showForm, setShowForm] = useState(false);

  // 加载本地存储的数据
  useEffect(() => {
    const savedRequests = localStorage.getItem('rideRequests');
    if (savedRequests) {
      const parsed = JSON.parse(savedRequests);
      setRequests(parsed.map((req: any) => ({
        ...req,
        requestedTime: new Date(req.requestedTime),
        createdAt: new Date(req.createdAt)
      })));
    }
  }, []);

  // 保存到本地存储
  useEffect(() => {
    localStorage.setItem('rideRequests', JSON.stringify(requests));
  }, [requests]);

  const addRequest = (requestData: Omit<RideRequest, 'id' | 'createdAt' | 'status'>) => {
    const newRequest: RideRequest = {
      ...requestData,
      id: Date.now().toString(),
      status: 'pending',
      createdAt: new Date()
    };
    setRequests(prev => [newRequest, ...prev]);
    setShowForm(false);
  };

  const completeRequest = (id: string) => {
    setRequests(prev =>
      prev.map(req =>
        req.id === id ? { ...req, status: 'completed' as const } : req
      )
    );
  };

  const pendingRequests = requests.filter(req => req.status === 'pending');
  const completedRequests = requests.filter(req => req.status === 'completed');

  // 按时间排序
  const sortedPendingRequests = [...pendingRequests].sort(
    (a, b) => a.requestedTime.getTime() - b.requestedTime.getTime()
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Car className="h-8 w-8 text-green-600" />
            <h1 className="text-4xl font-bold text-gray-800">村里用车管理</h1>
          </div>
          <p className="text-gray-600 text-lg">轻松管理朋友们的用车需求，合理安排接送时间</p>
        </div>

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
          <Button
            onClick={() => setShowForm(!showForm)}
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
          >
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
                    onComplete={completeRequest}
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
                  .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                  .slice(0, 4) // 只显示最近的4个已完成需求
                  .map(request => (
                    <RideRequestCard
                      key={request.id}
                      request={request}
                      onComplete={completeRequest}
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
