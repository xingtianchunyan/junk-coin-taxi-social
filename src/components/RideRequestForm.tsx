import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarIcon, Clock, MapPin, User, Phone, Route, Users, Package, Plus, Minus } from 'lucide-react';
import { RideRequest, FixedRoute, LuggageItem } from '@/types/RideRequest';
import { rideRequestService } from '@/services/rideRequestService';
import { vehicleService } from '@/services/vehicleService';
import { useToast } from '@/hooks/use-toast';
import { validateRideRequestData, globalRateLimiter } from '@/utils/inputValidation';

interface Destination {
  id: string;
  name: string;
  address: string;
  description: string | null;
}

interface RideRequestFormProps {
  onSubmit: (request: Omit<RideRequest, 'id' | 'access_code' | 'created_at' | 'updated_at' | 'status' | 'payment_status'>) => void;
  selectedDestination?: Destination | null;
}

const RideRequestForm: React.FC<RideRequestFormProps> = ({ onSubmit, selectedDestination }) => {
  const [formData, setFormData] = useState({
    friend_name: '',
    start_location: '',
    end_location: '',
    requested_time: '',
    contact_info: '',
    notes: '',
    fixed_route_id: '',
    passenger_count: 1
  });
  const [luggage, setLuggage] = useState<LuggageItem[]>([
    { length: 0, width: 0, height: 0, quantity: 1 }
  ]);
  const [fixedRoutes, setFixedRoutes] = useState<FixedRoute[]>([]);
  const [calculating, setCalculating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();


  useEffect(() => {
    loadFixedRoutes();
  }, [selectedDestination]);

  const loadFixedRoutes = async () => {
    try {
      const routes = await rideRequestService.getFixedRoutes();
      if (selectedDestination) {
        const filteredRoutes = routes.filter(route => 
          route.end_location.includes(selectedDestination.name) || 
          route.start_location.includes(selectedDestination.name)
        );
        setFixedRoutes(filteredRoutes);
      } else {
        setFixedRoutes(routes);
      }
    } catch (error) {
      console.error('加载固定路线失败:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);
    
    if (!globalRateLimiter.isAllowed('form_submission', 3, 60000)) {
      setValidationErrors(['提交过于频繁，请稍后再试']);
      return;
    }
    
    const validation = validateRideRequestData({
      ...formData,
      requested_time: formData.requested_time
    });
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }
    
    if (!formData.fixed_route_id) {
      setValidationErrors(['请选择一个固定路线']);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get the selected route to determine payment info
      const selectedRoute = fixedRoutes.find(route => route.id === formData.fixed_route_id);
      
      const submitData = {
        ...validation.sanitizedData,
        requested_time: new Date(formData.requested_time),
        fixed_route_id: formData.fixed_route_id,
        passenger_count: formData.passenger_count,
        luggage: luggage.filter(item => item.length > 0 || item.width > 0 || item.height > 0),
        payment_required: selectedRoute ? selectedRoute.our_price > 0 : false,
        payment_amount: selectedRoute?.our_price || 0,
        payment_currency: selectedRoute?.currency || 'CNY'
      };
      
      await onSubmit(submitData);

      // Reset form after successful submission
      setFormData({
        friend_name: '',
        start_location: '',
        end_location: '',
        requested_time: '',
        contact_info: '',
        notes: '',
        fixed_route_id: '',
        passenger_count: 1
      });
      setLuggage([{ length: 0, width: 0, height: 0, quantity: 1 }]);
    } catch (error) {
      setValidationErrors(['提交失败，请重试']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      if (field === 'fixed_route_id' && value) {
        const selectedRoute = fixedRoutes.find(route => route.id === value);
        if (selectedRoute) {
          newData.start_location = selectedRoute.start_location;
          newData.end_location = selectedRoute.end_location;
        }
      }
      
      return newData;
    });
  };

  // 行李管理函数
  const addLuggageItem = () => {
    setLuggage(prev => [...prev, { length: 0, width: 0, height: 0, quantity: 1 }]);
  };

  const removeLuggageItem = (index: number) => {
    if (luggage.length > 1) {
      setLuggage(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateLuggageItem = (index: number, field: keyof LuggageItem, value: number) => {
    setLuggage(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };


  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
        <CardTitle className="flex items-center gap-2 text-green-700">
          <MapPin className="h-5 w-5" />
          添加用车需求
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="friend_name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                昵称
              </Label>
              <Input
                id="friend_name"
                value={formData.friend_name}
                onChange={(e) => handleInputChange('friend_name', e.target.value)}
                placeholder="请输入昵称"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_info" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                联系方式
              </Label>
              <Input
                id="contact_info"
                value={formData.contact_info}
                onChange={(e) => handleInputChange('contact_info', e.target.value)}
                placeholder="电话或微信"
              />
            </div>
          </div>

          {/* 人数设置 */}
          <div className="space-y-2">
            <Label htmlFor="passenger_count" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              出行人数
            </Label>
            <Select
              value={formData.passenger_count.toString()}
              onValueChange={(value) => handleInputChange('passenger_count', parseInt(value))}
            >
              <SelectTrigger className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6].map(num => (
                  <SelectItem key={num} value={num.toString()}>
                    {num}人
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 行李管理 */}
          <div className="space-y-4 p-4 border rounded-lg bg-yellow-50">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-base font-medium">
                <Package className="h-4 w-4" />
                携带行李信息
              </Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={addLuggageItem}
                className="flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                添加行李
              </Button>
            </div>
            
            <div className="space-y-3">
              {luggage.map((item, index) => (
                <div key={index} className="grid grid-cols-5 gap-2 items-end p-3 border rounded bg-white">
                  <div className="space-y-1">
                    <Label className="text-xs">长(cm)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={item.length}
                      onChange={(e) => updateLuggageItem(index, 'length', parseInt(e.target.value) || 0)}
                      placeholder="0"
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">宽(cm)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={item.width}
                      onChange={(e) => updateLuggageItem(index, 'width', parseInt(e.target.value) || 0)}
                      placeholder="0"
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">高(cm)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={item.height}
                      onChange={(e) => updateLuggageItem(index, 'height', parseInt(e.target.value) || 0)}
                      placeholder="0"
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">数量</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateLuggageItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      placeholder="1"
                      className="text-sm"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeLuggageItem(index)}
                    disabled={luggage.length === 1}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="text-xs text-gray-600">
              💡 如果没有行李，请将所有尺寸设为0。如有不同尺寸的行李，请分别添加。
            </div>
          </div>

          {/* 固定路线选择 */}
          <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
            <div className="space-y-2">
              <Label htmlFor="fixed_route" className="flex items-center gap-2">
                <Route className="h-4 w-4" />
                选择固定路线
              </Label>
              <Select
                value={formData.fixed_route_id}
                onValueChange={(value) => handleInputChange('fixed_route_id', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择预设路线" />
                </SelectTrigger>
                <SelectContent>
                  {fixedRoutes.map(route => (
                    <SelectItem key={route.id} value={route.id}>
                      {route.name} - ¥{route.our_price} ({route.distance_km}km)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.fixed_route_id && (
                <div className="text-sm text-blue-600 mt-2">
                  ✅ 已选择固定路线，价格和路径将自动设置
                </div>
              )}
            </div>
          </div>


          <div className="space-y-2">
            <Label htmlFor="requested_time" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              预计时段
            </Label>
            <Input
              id="requested_time"
              type="datetime-local"
              value={formData.requested_time}
              onChange={(e) => handleInputChange('requested_time', e.target.value)}
              required
            />
            <div className="text-xs text-gray-500">
              💡 请选择您希望的用车时段
            </div>
          </div>


          <div className="space-y-2">
            <Label htmlFor="notes">备注</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="其他需要说明的信息..."
              rows={3}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? '提交中...' : '添加用车需求'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default RideRequestForm;
