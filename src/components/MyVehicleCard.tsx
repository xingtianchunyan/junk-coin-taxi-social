import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Car, Calendar, Clock, User, IdCard, X } from 'lucide-react';

interface Destination {
  id: string;
  name: string;
  address: string;
  description: string | null;
}

interface MyVehicleCardProps {
  selectedDestination: Destination | null;
  onCancel: () => void;
}

// 车辆数据 - 需要从数据库获取实际数据
const vehicleData = {
  vehicleInfo: "",
  vinNumber: "",
  usageDates: [],
  passengerHistory: []
};

const MyVehicleCard: React.FC<MyVehicleCardProps> = ({ selectedDestination, onCancel }) => {
  const [activeTab, setActiveTab] = useState<'usage' | 'history'>('usage');

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Car className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">我的车辆</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-6">
          {/* 车辆基本信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">车辆信息</label>
              <div className="mt-1 p-2 bg-gray-50 rounded border">
                {vehicleData.vehicleInfo || '暂无车辆信息'}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">车架号</label>
              <div className="mt-1 p-2 bg-gray-50 rounded border font-mono text-sm">
                {vehicleData.vinNumber || '暂无车架号信息'}
              </div>
            </div>
          </div>

          {/* 目的地信息 */}
          {selectedDestination && (
            <div>
              <label className="text-sm font-medium text-gray-600">目的地</label>
              <div className="mt-1 p-2 bg-blue-50 rounded border">
                <p className="font-medium text-blue-800">{selectedDestination.name}</p>
                <p className="text-sm text-blue-600">{selectedDestination.address}</p>
              </div>
            </div>
          )}

          {/* 标签切换 */}
          <div className="flex space-x-1 border-b">
            <Button
              variant={activeTab === 'usage' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('usage')}
              className="rounded-b-none"
            >
              使用记录
            </Button>
            <Button
              variant={activeTab === 'history' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('history')}
              className="rounded-b-none"
            >
              历史乘客信息
            </Button>
          </div>

          {/* 使用记录 */}
          {activeTab === 'usage' && (
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                使用日期列表
              </h4>
              <div className="space-y-3">
                {vehicleData.usageDates.length > 0 ? (
                  vehicleData.usageDates.map((usage, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <span className="text-sm font-medium text-gray-600">当前司机:</span>
                          <div className="flex items-center gap-1 mt-1">
                            <User className="h-3 w-3" />
                            <span>{usage.driver}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">身份证号:</span>
                          <div className="flex items-center gap-1 mt-1">
                            <IdCard className="h-3 w-3" />
                            <span className="font-mono text-sm">{usage.idCard}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">使用时段:</span>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            <span>{usage.date} {usage.timeSlot}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">组别:</span>
                          <Badge variant="outline" className="mt-1">
                            第 {usage.group} 组
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">暂无使用记录</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 历史乘客信息 */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                历史乘客信息列表
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-4 py-2 text-left">昵称</th>
                      <th className="border border-gray-200 px-4 py-2 text-left">乘车日期</th>
                      <th className="border border-gray-200 px-4 py-2 text-left">乘车时段</th>
                      <th className="border border-gray-200 px-4 py-2 text-left">同时段内组别</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicleData.passengerHistory.length > 0 ? (
                      vehicleData.passengerHistory.map((passenger, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-200 px-4 py-2">{passenger.nickname}</td>
                          <td className="border border-gray-200 px-4 py-2">{passenger.date}</td>
                          <td className="border border-gray-200 px-4 py-2">{passenger.timeSlot}</td>
                          <td className="border border-gray-200 px-4 py-2">
                            <Badge variant="outline">第 {passenger.group} 组</Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="border border-gray-200 px-4 py-8 text-center text-gray-500">
                          暂无历史乘客信息
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MyVehicleCard;