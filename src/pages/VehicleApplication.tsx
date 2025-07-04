import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Car, FileText, Clock, CheckCircle, MapPin } from 'lucide-react';
import DestinationSelector from '@/components/DestinationSelector';
import { useToast } from '@/hooks/use-toast';

const VehicleApplication: React.FC = () => {
  const [selectedDestination, setSelectedDestination] = useState<any>(null);
  const [showDestinationSelector, setShowDestinationSelector] = useState(false);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [applicationData, setApplicationData] = useState({
    name: '',
    idNumber: '',
    vehicleVin: ''
  });
  const { toast } = useToast();

  const handleSubmitApplication = () => {
    if (!applicationData.name || !applicationData.idNumber || !applicationData.vehicleVin) {
      toast({
        title: "信息不完整",
        description: "请填写所有必填信息",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "申请已提交",
      description: "您的申请已成功提交，等待车主审核",
    });
    
    setShowApplicationDialog(false);
    setApplicationData({ name: '', idNumber: '', vehicleVin: '' });
  };

  const handleAccessCodeQuery = () => {
    if (!accessCode.trim()) {
      toast({
        title: "请输入访问码",
        description: "请输入有效的访问码",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "查询成功",
      description: "申请状态：审核中",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">车辆申请</h1>
        <div className="flex items-center justify-center gap-4">
          <p className="text-gray-600">申请使用车辆，帮助社区成员，开启新型社交</p>
          <Button
            variant="outline"
            onClick={() => setShowDestinationSelector(true)}
            className="flex items-center gap-2"
          >
            <MapPin className="h-4 w-4" />
            服务目的地
          </Button>
        </div>
        {selectedDestination && (
          <p className="text-sm text-green-600 mt-2">
            当前目的地：{selectedDestination.name}
          </p>
        )}
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
              <p className="text-sm text-gray-600">提供身份信息和驾驶证件</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">2. 审核等待</h3>
              <p className="text-sm text-gray-600">车主审核您的申请材料</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">3. 开始服务</h3>
              <p className="text-sm text-gray-600">审核通过后即可开始帮助社区</p>
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
              与数字游民社区取得联系，到现场接受车主或负责人的考核和检查后才能开始申请
            </p>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">考核内容</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 持有有效驾驶证</li>
                  <li>• 实际驾车完成固定路线无事故</li>
                  <li>• 无重大交通违法记录</li>
                  <li>• 通过背景调查</li>
                </ul>
              </div>
            </div>

            <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
              <DialogTrigger asChild>
                <Button className="w-full" size="lg">
                  <Car className="h-5 w-5 mr-2" />
                  开始申请
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>车辆申请</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">姓名</Label>
                    <Input
                      id="name"
                      value={applicationData.name}
                      onChange={(e) => setApplicationData({
                        ...applicationData,
                        name: e.target.value
                      })}
                      placeholder="请输入姓名"
                    />
                  </div>
                  <div>
                    <Label htmlFor="idNumber">身份证号</Label>
                    <Input
                      id="idNumber"
                      value={applicationData.idNumber}
                      onChange={(e) => setApplicationData({
                        ...applicationData,
                        idNumber: e.target.value
                      })}
                      placeholder="请输入身份证号"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vehicleVin">申请车辆车架号</Label>
                    <Input
                      id="vehicleVin"
                      value={applicationData.vehicleVin}
                      onChange={(e) => setApplicationData({
                        ...applicationData,
                        vehicleVin: e.target.value
                      })}
                      placeholder="请输入车辆车架号"
                    />
                  </div>
                  <Button onClick={handleSubmitApplication} className="w-full">
                    提交申请
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>输入访问码查看细节</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 mb-6">
              输入您的访问码查看申请进度和详细信息。
            </p>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="accessCode">访问码</Label>
                <Input
                  id="accessCode"
                  type="text"
                  placeholder="请输入访问码"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                />
              </div>
              
              <Button onClick={handleAccessCodeQuery} className="w-full">
                <FileText className="h-5 w-5 mr-2" />
                查询申请状态
              </Button>
            </div>
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
              <h4 className="font-semibold mb-2">申请实现的逻辑是什么？</h4>
              <p className="text-sm text-gray-600 mb-4">
                司机要在地接受检查和考核后才能获知车辆车架号，社区负责人只需在司机考核通过后告知车主，车主就能快速核对完成审核。
              </p>
              
              <h4 className="font-semibold mb-2">需要准备什么材料？</h4>
              <p className="text-sm text-gray-600">
                身份证、驾驶证、近期体检报告、无犯罪记录证明等。
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">收费标准如何确定？</h4>
              <p className="text-sm text-gray-600 mb-4">
                统一根据市场价计算，单程收取50%，往返收取80%。
              </p>
              
              <h4 className="font-semibold mb-2">可以使用自己的车吗？</h4>
              <p className="text-sm text-gray-600">
                可以，但需要通过平台的车辆安全检查和保险审核。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <DestinationSelector
        open={showDestinationSelector}
        onOpenChange={setShowDestinationSelector}
        onSelect={setSelectedDestination}
        selectedDestination={selectedDestination}
      />
    </div>
  );
};

export default VehicleApplication;