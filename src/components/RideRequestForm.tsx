import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
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

// 预设行李选项
const PRESET_LUGGAGE_OPTIONS = [
  // 行李箱选项
  { 
    category: '行李箱', 
    items: [
      { id: '13inch', name: '13寸拉杆箱', dimensions: { length: 28, width: 40, height: 13 } },
      { id: '16inch', name: '16寸拉杆箱', dimensions: { length: 31, width: 43, height: 13 } },
      { id: '17inch', name: '17寸拉杆箱', dimensions: { length: 32, width: 45, height: 18 } },
      { id: '18inch', name: '18寸拉杆箱', dimensions: { length: 34, width: 44, height: 20 } },
      { id: '20inch', name: '20寸拉杆箱', dimensions: { length: 31, width: 56, height: 28 } },
      { id: '22inch', name: '22寸拉杆箱', dimensions: { length: 40, width: 60, height: 25 } },
      { id: '24inch', name: '24寸拉杆箱', dimensions: { length: 44, width: 64, height: 31 } },
      { id: '26inch', name: '26寸拉杆箱', dimensions: { length: 44, width: 69, height: 32 } },
      { id: '28inch', name: '28寸拉杆箱', dimensions: { length: 42, width: 74, height: 37 } },
      { id: '30inch', name: '30寸拉杆箱', dimensions: { length: 42, width: 78, height: 38 } },
      { id: '32inch', name: '32寸拉杆箱', dimensions: { length: 44, width: 83, height: 30 } },
    ]
  },
  // 旅行背包选项
  {
    category: '旅行背包',
    items: [
      { id: 'backpack-20l', name: '20L以下背包', dimensions: { length: 44, width: 30, height: 12 } },
      { id: 'backpack-30l', name: '30L左右背包', dimensions: { length: 45, width: 30, height: 25 } },
      { id: 'backpack-40l', name: '40L左右背包', dimensions: { length: 55, width: 35, height: 20 } },
      { id: 'backpack-50l', name: '50L左右背包', dimensions: { length: 62, width: 32, height: 24 } },
      { id: 'backpack-60l', name: '60L以上背包', dimensions: { length: 65, width: 40, height: 25 } },
    ]
  }
];

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
  const [enableManualInput, setEnableManualInput] = useState(false);
  const [selectedLuggageType, setSelectedLuggageType] = useState('');
  const [selectedLuggageQuantity, setSelectedLuggageQuantity] = useState(1);
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
      console.log('开始加载固定路线，当前选择的目的地:', selectedDestination);
      
      if (selectedDestination) {
        console.log('使用目的地ID过滤路线，目的地ID:', selectedDestination.id);
        
        // 使用目的地ID来获取相关路线，而不是依赖名称匹配
        const routes = await rideRequestService.getDestinationRoutes(selectedDestination.id);
        console.log('通过目的地ID获取的路线:', routes);
        
        setFixedRoutes(routes);
        
        if (routes.length === 0) {
          console.warn('未找到与目的地ID相关的路线');
          toast({
            title: "未找到相关路线",
            description: `未找到与目的地"${selectedDestination.name}"相关的固定路线，请联系管理员添加路线信息`,
            variant: "destructive"
          });
        } else {
          console.log(`成功加载 ${routes.length} 条路线`);
        }
      } else {
        console.log('未选择目的地，显示所有路线');
        const routes = await rideRequestService.getFixedRoutes();
        setFixedRoutes(routes);
      }
    } catch (error) {
      console.error('加载固定路线失败:', error);
      toast({
        title: "加载失败",
        description: "无法加载固定路线信息，请刷新页面重试",
        variant: "destructive"
      });
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

  // 添加预设行李项目
  const addPresetLuggageItem = (presetId: string, quantity: number = 1) => {
    const preset = PRESET_LUGGAGE_OPTIONS
      .flatMap(category => category.items)
      .find(item => item.id === presetId);
    
    if (preset) {
      const newItem: LuggageItem = {
        ...preset.dimensions,
        quantity: quantity
      };
      setLuggage(prev => [...prev, newItem]);
    }
  };

  // 手动添加行李项目
  const addManualLuggageItem = () => {
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

          {/* 优化后的行李管理 */}
          <div className="space-y-4 p-4 border rounded-lg bg-yellow-50">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-base font-medium">
                <Package className="h-4 w-4" />
                携带行李信息
              </Label>
            </div>

            {/* 预设行李选择 - 下拉菜单形式 */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-700">快速选择常见行李：</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">行李类型</Label>
                  <select
                    value={selectedLuggageType}
                    onChange={(e) => setSelectedLuggageType(e.target.value)}
                    className="w-full p-2 border rounded text-sm bg-white"
                  >
                    <option value="">请选择行李类型</option>
                    {PRESET_LUGGAGE_OPTIONS.map(category => (
                      <optgroup key={category.category} label={category.category}>
                        {category.items.map(item => (
                          <option key={item.id} value={item.id}>
                            {item.name} ({item.dimensions.length}×{item.dimensions.width}×{item.dimensions.height}cm)
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">数量</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={selectedLuggageQuantity}
                    onChange={(e) => setSelectedLuggageQuantity(parseInt(e.target.value) || 1)}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">&nbsp;</Label>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={!selectedLuggageType}
                    onClick={() => {
                      if (selectedLuggageType) {
                        addPresetLuggageItem(selectedLuggageType, selectedLuggageQuantity);
                        setSelectedLuggageType('');
                        setSelectedLuggageQuantity(1);
                      }
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    添加行李
                  </Button>
                </div>
              </div>
            </div>

            {/* 手动输入开关 */}
            <div className="flex items-center space-x-2 pt-2 border-t">
              <Checkbox
                id="enable-manual"
                checked={enableManualInput}
                onCheckedChange={(checked) => setEnableManualInput(checked === true)}
              />
              <Label htmlFor="enable-manual" className="text-sm">
                启用手动输入（适用于特殊尺寸行李）
              </Label>
            </div>

            {/* 手动输入区域 */}
            {enableManualInput && (
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-700">手动输入行李尺寸：</div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={addManualLuggageItem}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    添加行李
                  </Button>
                </div>
                
                {/* 手动输入的行李项目 */}
                <div className="space-y-3">
                  {luggage.filter(item => 
                    // 显示手动添加的空行李项目（用于输入）
                    (item.length === 0 && item.width === 0 && item.height === 0) ||
                    // 或者显示已经手动输入但不在预设列表中的行李
                    (item.length > 0 || item.width > 0 || item.height > 0)
                  ).map((item, originalIndex) => {
                    const actualIndex = luggage.indexOf(item);
                    return (
                      <div key={actualIndex} className="grid grid-cols-5 gap-2 items-end p-3 border rounded bg-white">
                        <div className="space-y-1">
                          <Label className="text-xs">长(cm)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={item.length}
                            onChange={(e) => updateLuggageItem(actualIndex, 'length', parseInt(e.target.value) || 0)}
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
                            onChange={(e) => updateLuggageItem(actualIndex, 'width', parseInt(e.target.value) || 0)}
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
                            onChange={(e) => updateLuggageItem(actualIndex, 'height', parseInt(e.target.value) || 0)}
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
                            onChange={(e) => updateLuggageItem(actualIndex, 'quantity', parseInt(e.target.value) || 1)}
                            placeholder="1"
                            className="text-sm"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeLuggageItem(actualIndex)}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                  
                  {luggage.filter(item => item.length === 0 && item.width === 0 && item.height === 0).length === 0 && (
                    <div className="text-sm text-gray-500 text-center py-2">
                      点击"添加行李"按钮来手动输入特殊尺寸行李
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 已选择的行李汇总 */}
            {luggage.length > 0 && luggage.some(item => item.length > 0 || item.width > 0 || item.height > 0) && (
              <div className="space-y-3 pt-2 border-t">
                <div className="text-sm font-medium text-gray-700">已选择的行李汇总：</div>
                <div className="space-y-2">
                  {luggage.map((item, index) => {
                    // 只显示有尺寸数据的行李
                    if (item.length === 0 && item.width === 0 && item.height === 0) return null;
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                        <span>
                          {item.length}×{item.width}×{item.height}cm × {item.quantity}件
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLuggageItem(index)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="text-xs text-gray-600">
              💡 如果没有行李，无需选择任何选项。优先从常见行李中快速选择，如需添加特殊尺寸行李可启用手动输入功能。
            </div>
          </div>

          {/* 固定路线选择 */}
          <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
            <div className="space-y-2">
              <Label htmlFor="fixed_route" className="flex items-center gap-2">
                <Route className="h-4 w-4" />
                选择固定路线
              </Label>
              
              {/* 显示调试信息 */}
              {selectedDestination && (
                <div className="text-xs text-gray-600 bg-gray-100 p-2 rounded">
                  <div>当前目的地: {selectedDestination.name}</div>
                  <div>目的地ID: {selectedDestination.id}</div>
                  <div>可用路线数量: {fixedRoutes.length}</div>
                  {fixedRoutes.length === 0 && (
                    <div className="text-red-600 mt-1">
                      ⚠️ 未找到相关路线，请检查路线配置
                    </div>
                  )}
                </div>
              )}
              
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
