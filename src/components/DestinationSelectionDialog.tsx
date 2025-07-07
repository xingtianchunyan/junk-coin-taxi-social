
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Info, CheckCircle, Users, Car } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { rideRequestService } from '@/services/rideRequestService';

interface Destination {
  id: string;
  name: string;
  address: string;
  description: string | null;
}

interface DestinationSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDestinationSelected: (destination: Destination) => void;
}

const DestinationSelectionDialog: React.FC<DestinationSelectionDialogProps> = ({
  open,
  onOpenChange,
  onDestinationSelected
}) => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadDestinations();
    }
  }, [open]);

  const loadDestinations = async () => {
    try {
      setLoading(true);
      const data = await rideRequestService.getPresetDestinations();
      setDestinations(data.map(d => ({
        ...d,
        description: d.description || null
      })));
    } catch (error) {
      console.error('加载目的地失败:', error);
      toast({
        title: "加载失败",
        description: "无法加载目的地列表",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedDestination) {
      toast({
        title: "请选择目的地",
        description: "必须选择一个目的地才能继续",
        variant: "destructive",
      });
      return;
    }

    const destination = destinations.find(d => d.id === selectedDestination);
    if (destination) {
      onDestinationSelected(destination);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      // 不允许用户关闭对话框，除非选择了目的地
      if (!newOpen && !selectedDestination) {
        toast({
          title: "请选择目的地",
          description: "必须选择目的地后才能继续使用服务",
          variant: "destructive",
        });
        return;
      }
      onOpenChange(newOpen);
    }}>
      <DialogContent className="sm:max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-blue-600" />
            选择目的地
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* 乘客服务使用步骤说明 */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-blue-700">
                <Info className="h-4 w-4" />
                乘客服务使用步骤
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="flex items-start gap-2">
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold mt-0.5">1</div>
                <div className="text-xs text-blue-600">
                  <strong>选择目的地：</strong>选择您本次要前往的目的地
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold mt-0.5">2</div>
                <div className="text-xs text-blue-600">
                  <strong>查看拼车：</strong>系统将显示同一目的地的其他乘客需求
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold mt-0.5">3</div>
                <div className="text-xs text-blue-600">
                  <strong>添加需求：</strong>发布您的用车需求，等待其他乘客拼车
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold mt-0.5">4</div>
                <div className="text-xs text-blue-600">
                  <strong>完成支付：</strong>通过加密货币完成车费支付
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 目的地选择 */}
          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              选择本次到访目的地 *
            </label>
            
            {loading ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">加载目的地中...</p>
              </div>
            ) : (
              <Select value={selectedDestination} onValueChange={setSelectedDestination}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="请选择您要前往的目的地" />
                </SelectTrigger>
                <SelectContent>
                  {destinations.map((destination) => (
                    <SelectItem key={destination.id} value={destination.id}>
                      <div className="py-1">
                        <div className="font-medium">{destination.name}</div>
                        <div className="text-xs text-gray-500">{destination.address}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {selectedDestination && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-sm font-medium text-green-700">
                    已选择: {destinations.find(d => d.id === selectedDestination)?.name}
                  </p>
                </div>
                {destinations.find(d => d.id === selectedDestination)?.description && (
                  <p className="text-xs text-green-600 ml-6">
                    {destinations.find(d => d.id === selectedDestination)?.description}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 功能说明 */}
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Users className="h-6 w-6 text-green-600" />
                  <div className="text-xs text-gray-600">
                    <div className="font-medium">智能拼车</div>
                    <div>自动匹配同路乘客</div>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Car className="h-6 w-6 text-blue-600" />
                  <div className="text-xs text-gray-600">
                    <div className="font-medium">加密支付</div>
                    <div>支持多种数字货币</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 确认按钮 */}
          <Button 
            onClick={handleConfirm}
            className="w-full h-12 text-base"
            disabled={!selectedDestination || loading}
          >
            {selectedDestination ? '确认选择并开始使用' : '请先选择目的地'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DestinationSelectionDialog;
