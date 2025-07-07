
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Car, Users, Package, MapPin } from 'lucide-react';
import { RideGroup, Vehicle } from '@/types/Vehicle';
import { RideRequest } from '@/types/RideRequest';

interface GroupConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: RideGroup & { 
    vehicle: Vehicle; 
    members: Array<{ ride_request: RideRequest }>;
    route: { name: string; start_location: string; end_location: string };
  };
  currentRequest: RideRequest;
  onConfirm: () => void;
  onCancel: () => void;
}

const GroupConfirmDialog: React.FC<GroupConfirmDialogProps> = ({
  open,
  onOpenChange,
  group,
  currentRequest,
  onConfirm,
  onCancel
}) => {
  const totalPassengers = group.members.reduce((sum, member) => 
    sum + (member.ride_request.passenger_count || 1), 0
  ) + (currentRequest.passenger_count || 1);

  const totalLuggageVolume = group.total_luggage_volume;
  const vehicleCapacity = group.vehicle.trunk_length_cm * group.vehicle.trunk_width_cm * group.vehicle.trunk_height_cm / 1000;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            确认组队
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* 车辆信息 */}
          <div className="border rounded-lg p-3 bg-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <Car className="h-4 w-4 text-green-600" />
              <span className="font-medium">车辆信息</span>
            </div>
            <div className="text-sm space-y-1">
              <div>司机: {group.vehicle.driver_name}</div>
              <div>车牌: {group.vehicle.license_plate}</div>
              <div>载客量: {group.vehicle.max_passengers}人</div>
              <div>后备箱: {group.vehicle.trunk_length_cm}×{group.vehicle.trunk_width_cm}×{group.vehicle.trunk_height_cm}cm ({vehicleCapacity.toFixed(0)}L)</div>
            </div>
          </div>

          {/* 路线信息 */}
          <div className="border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span className="font-medium">路线信息</span>
            </div>
            <div className="text-sm">
              <div>{group.route.name}</div>
              <div className="text-gray-600">{group.route.start_location} → {group.route.end_location}</div>
            </div>
          </div>

          {/* 同行乘客 */}
          <div className="border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-orange-600" />
              <span className="font-medium">同行乘客</span>
              <Badge variant="secondary">{totalPassengers}/{group.vehicle.max_passengers}人</Badge>
            </div>
            <div className="space-y-2">
              {group.members.map((member, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span>{member.ride_request.friend_name}</span>
                  <span className="text-gray-500">{member.ride_request.passenger_count || 1}人</span>
                </div>
              ))}
              <div className="flex items-center justify-between text-sm font-medium border-t pt-2">
                <span>{currentRequest.friend_name} (您)</span>
                <span className="text-blue-600">{currentRequest.passenger_count || 1}人</span>
              </div>
            </div>
          </div>

          {/* 行李容量 */}
          <div className="border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-purple-600" />
              <span className="font-medium">行李容量</span>
              <Badge 
                variant={totalLuggageVolume <= vehicleCapacity ? "default" : "destructive"}
              >
                {totalLuggageVolume.toFixed(1)}L/{vehicleCapacity.toFixed(0)}L
              </Badge>
            </div>
            <div className="text-sm text-gray-600">
              {totalLuggageVolume <= vehicleCapacity 
                ? "✅ 行李容量充足，可以顺利组队" 
                : "⚠️ 行李容量超出限制，可能无法全部装载"
              }
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={onConfirm}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={totalLuggageVolume > vehicleCapacity}
            >
              确认组队
            </Button>
            <Button 
              variant="outline" 
              onClick={onCancel}
              className="flex-1"
            >
              取消
            </Button>
          </div>
          
          <div className="text-xs text-gray-500 text-center">
            组队成功后，在司机确认前您可以随时取消
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupConfirmDialog;
