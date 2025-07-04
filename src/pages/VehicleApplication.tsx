import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Car, FileText, Clock, CheckCircle } from 'lucide-react';

const VehicleApplication: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">车辆申请</h1>
        <p className="text-gray-600">申请使用车辆，开始您的司机之旅</p>
      </div>

      {/* 申请流程说明 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            申请流程
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">1. 提交申请</h3>
              <p className="text-sm text-gray-600">填写个人信息和驾驶证件</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">2. 审核等待</h3>
              <p className="text-sm text-gray-600">平台审核您的申请材料</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">3. 开始服务</h3>
              <p className="text-sm text-gray-600">审核通过后即可接单服务</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 申请表单 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>新司机申请</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 mb-6">
              成为司机，开始赚取收入。我们为合格的司机提供车辆使用权。
            </p>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">申请要求</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 持有有效驾驶证</li>
                  <li>• 驾龄满3年</li>
                  <li>• 无重大交通违法记录</li>
                  <li>• 通过背景调查</li>
                </ul>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">福利待遇</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• 免费使用平台车辆</li>
                  <li>• 灵活的工作时间</li>
                  <li>• 竞争性的收入分成</li>
                  <li>• 平台保险保障</li>
                </ul>
              </div>
            </div>

            <Button className="w-full" size="lg">
              <Car className="h-5 w-5 mr-2" />
              开始申请
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>申请状态查询</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 mb-6">
              已提交申请？在这里查看您的申请状态和进度。
            </p>
            
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">申请编号: #DR2024001</span>
                  <span className="text-sm bg-orange-100 text-orange-700 px-2 py-1 rounded">
                    审核中
                  </span>
                </div>
                <p className="text-sm text-gray-600">提交时间: 2024-01-15</p>
                <p className="text-sm text-gray-600">预计完成: 3-5个工作日</p>
              </div>
              
              <div className="p-4 border rounded-lg opacity-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">申请编号: #DR2024002</span>
                  <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded">
                    已通过
                  </span>
                </div>
                <p className="text-sm text-gray-600">完成时间: 2024-01-10</p>
                <p className="text-sm text-gray-600">可开始接单服务</p>
              </div>
            </div>

            <Button variant="outline" className="w-full">
              <FileText className="h-5 w-5 mr-2" />
              查看详细状态
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 常见问题 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>常见问题</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">申请需要多长时间？</h4>
              <p className="text-sm text-gray-600 mb-4">
                通常需要3-5个工作日完成审核，复杂情况可能需要更长时间。
              </p>
              
              <h4 className="font-semibold mb-2">需要准备什么材料？</h4>
              <p className="text-sm text-gray-600">
                身份证、驾驶证、近期体检报告、无犯罪记录证明等。
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">收入如何计算？</h4>
              <p className="text-sm text-gray-600 mb-4">
                按照订单金额的一定比例分成，具体比例根据服务质量调整。
              </p>
              
              <h4 className="font-semibold mb-2">可以使用自己的车吗？</h4>
              <p className="text-sm text-gray-600">
                可以，但需要通过平台的车辆安全检查和保险审核。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VehicleApplication;