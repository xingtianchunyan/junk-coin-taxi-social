import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Car, CheckCircle, XCircle } from 'lucide-react';

const WorkSchedule: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // 模拟数据
  const scheduleData = {
    today: {
      available: true,
      workHours: "09:00 - 18:00",
      orders: [
        {
          id: 1,
          time: "10:30",
          from: "市中心",
          to: "机场",
          status: "pending",
          distance: "15km",
          fare: "45 USDT"
        },
        {
          id: 2,
          time: "14:00",
          from: "商业区",
          to: "住宅区",
          status: "completed",
          distance: "8km",
          fare: "25 USDT"
        },
        {
          id: 3,
          time: "16:45",
          from: "学校",
          to: "医院",
          status: "pending",
          distance: "12km",
          fare: "35 USDT"
        }
      ]
    },
    stats: {
      totalOrders: 12,
      completedOrders: 8,
      totalEarnings: "320 USDT",
      totalDistance: "186km"
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">工作安排</h1>
        <p className="text-gray-600">管理您的工作时间和订单安排</p>
      </div>

      {/* 今日概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">今日订单</p>
                <p className="text-3xl font-bold">{scheduleData.today.orders.length}</p>
              </div>
              <Car className="h-10 w-10 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">已完成</p>
                <p className="text-3xl font-bold">{scheduleData.stats.completedOrders}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">今日收入</p>
                <p className="text-2xl font-bold">105 USDT</p>
              </div>
              <Clock className="h-10 w-10 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100">行驶里程</p>
                <p className="text-2xl font-bold">35km</p>
              </div>
              <MapPin className="h-10 w-10 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 工作状态 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              今日工作状态
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <h3 className="font-semibold text-green-800">在线服务中</h3>
                <p className="text-sm text-green-600">工作时间: {scheduleData.today.workHours}</p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            
            <div className="space-y-3">
              <Button className="w-full" variant="outline">
                <Clock className="h-4 w-4 mr-2" />
                设置工作时间
              </Button>
              <Button className="w-full" variant="destructive">
                <XCircle className="h-4 w-4 mr-2" />
                结束今日工作
              </Button>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-2">本周统计</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">总订单:</span>
                  <span className="font-medium">{scheduleData.stats.totalOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">总收入:</span>
                  <span className="font-medium">{scheduleData.stats.totalEarnings}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">总里程:</span>
                  <span className="font-medium">{scheduleData.stats.totalDistance}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 今日订单 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              今日订单安排
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scheduleData.today.orders.map((order) => (
                <div key={order.id} className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                      <Clock className="h-5 w-5" />
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{order.time}</span>
                      <Badge 
                        variant={order.status === 'completed' ? 'default' : 'outline'}
                        className={order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}
                      >
                        {order.status === 'completed' ? '已完成' : '待服务'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <MapPin className="h-4 w-4" />
                      <span>{order.from}</span>
                      <span>→</span>
                      <span>{order.to}</span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">距离: {order.distance}</span>
                      <span className="font-semibold text-green-600">收入: {order.fare}</span>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0">
                    {order.status === 'pending' ? (
                      <Button size="sm">
                        开始服务
                      </Button>
                    ) : (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {scheduleData.today.orders.length === 0 && (
              <div className="text-center py-8">
                <Car className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">暂无订单</h3>
                <p className="text-gray-500">保持在线状态，等待新订单</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 历史记录 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>工作历史</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {Array.from({ length: 7 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - i);
              const isToday = i === 0;
              
              return (
                <div key={i} className={`p-4 border rounded-lg text-center ${isToday ? 'bg-blue-50 border-blue-200' : ''}`}>
                  <div className="text-sm text-gray-600 mb-1">
                    {date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="font-semibold mb-2">
                    {isToday ? '今天' : date.toLocaleDateString('zh-CN', { weekday: 'short' })}
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="text-green-600 font-medium">
                      {isToday ? '3' : Math.floor(Math.random() * 5)} 单
                    </div>
                    <div className="text-gray-500">
                      {isToday ? '105' : Math.floor(Math.random() * 200)} USDT
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkSchedule;