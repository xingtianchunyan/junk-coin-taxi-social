import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Info } from 'lucide-react';
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
      onOpenChange(false);
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
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            选择目的地
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* 使用说明 */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-blue-700">
                <Info className="h-4 w-4" />
                使用说明
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <p className="text-xs text-blue-600">
                • 选择您本次要前往的目的地
              </p>
              <p className="text-xs text-blue-600">
                • 系统将根据目的地匹配相关的用车需求
              </p>
              <p className="text-xs text-blue-600">
                • 同一目的地的乘客可以拼车出行
              </p>
            </CardContent>
          </Card>

          {/* 目的地选择 */}
          <div className="space-y-3">
            <label className="text-sm font-medium">
              本次到访目的地 *
            </label>
            
            {loading ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">加载中...</p>
              </div>
            ) : (
              <Select value={selectedDestination} onValueChange={setSelectedDestination}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择目的地" />
                </SelectTrigger>
                <SelectContent>
                  {destinations.map((destination) => (
                    <SelectItem key={destination.id} value={destination.id}>
                      <div>
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
                <p className="text-sm text-green-700">
                  已选择: {destinations.find(d => d.id === selectedDestination)?.name}
                </p>
                {destinations.find(d => d.id === selectedDestination)?.description && (
                  <p className="text-xs text-green-600 mt-1">
                    {destinations.find(d => d.id === selectedDestination)?.description}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 确认按钮 */}
          <Button 
            onClick={handleConfirm}
            className="w-full"
            disabled={!selectedDestination || loading}
          >
            确认选择
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DestinationSelectionDialog;