import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Car, Calendar, Clock, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Destination {
  id: string;
  name: string;
  address: string;
  description: string | null;
}

interface VehicleFormProps {
  selectedDestination: Destination | null;
  onCancel: () => void;
}

const VehicleForm: React.FC<VehicleFormProps> = ({ selectedDestination, onCancel }) => {
  const [vehicleInfo, setVehicleInfo] = useState('');
  const [vinNumber, setVinNumber] = useState('');
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [timeSlots, setTimeSlots] = useState<{ start: string; end: string }[]>([]);
  const [newTimeSlot, setNewTimeSlot] = useState({ start: '', end: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // 生成未来30天的日期选项
  const generateDateOptions = () => {
    const dates = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const dateOptions = generateDateOptions();

  const handleDateToggle = (date: string) => {
    setSelectedDates(prev => 
      prev.includes(date) 
        ? prev.filter(d => d !== date)
        : [...prev, date]
    );
  };

  const addTimeSlot = () => {
    if (newTimeSlot.start && newTimeSlot.end && newTimeSlot.start < newTimeSlot.end) {
      setTimeSlots(prev => [...prev, { ...newTimeSlot }]);
      setNewTimeSlot({ start: '', end: '' });
    }
  };

  const removeTimeSlot = (index: number) => {
    setTimeSlots(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!vehicleInfo.trim() || !vinNumber.trim() || selectedDates.length === 0 || timeSlots.length === 0) {
      toast({
        title: "请填写完整信息",
        description: "车辆信息、车架号、开放日期和时段都不能为空",
        variant: "destructive",
      });
      return;
    }

    if (!selectedDestination) {
      toast({
        title: "请先选择目的地",
        description: "请先选择车辆附近的目的地",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // 这里模拟提交车辆信息
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "车辆添加成功",
        description: `${vehicleInfo} 已成功添加到 ${selectedDestination.name}`,
      });
      
      // 重置表单
      setVehicleInfo('');
      setVinNumber('');
      setSelectedDates([]);
      setTimeSlots([]);
      onCancel();
    } catch (error) {
      toast({
        title: "添加失败",
        description: "车辆信息添加失败，请重试",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Car className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold">添加可用车辆</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* 车辆信息 */}
          <div>
            <Label htmlFor="vehicleInfo">车辆信息</Label>
            <Input
              id="vehicleInfo"
              value={vehicleInfo}
              onChange={(e) => setVehicleInfo(e.target.value)}
              placeholder="请输入汽车品牌型号，如：丰田凯美瑞2023款"
            />
          </div>

          {/* 车架号 */}
          <div>
            <Label htmlFor="vinNumber">车架号</Label>
            <Input
              id="vinNumber"
              value={vinNumber}
              onChange={(e) => setVinNumber(e.target.value)}
              placeholder="请输入车架号"
            />
          </div>

          {/* 设置开放日期 */}
          <div>
            <Label>设置开放日期</Label>
            <div className="mt-2 max-h-32 overflow-y-auto border rounded-md p-2">
              <div className="grid grid-cols-2 gap-2">
                {dateOptions.map(date => (
                  <div key={date} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={date}
                      checked={selectedDates.includes(date)}
                      onChange={() => handleDateToggle(date)}
                      className="rounded"
                    />
                    <label htmlFor={date} className="text-sm">
                      {new Date(date).toLocaleDateString('zh-CN')}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            {selectedDates.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedDates.map(date => (
                  <Badge key={date} variant="secondary" className="text-xs">
                    {new Date(date).toLocaleDateString('zh-CN')}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* 设置开放时段 */}
          <div>
            <Label>设置开放时段</Label>
            <div className="mt-2 space-y-2">
              <div className="flex gap-2 items-center">
                <Input
                  type="time"
                  value={newTimeSlot.start}
                  onChange={(e) => setNewTimeSlot(prev => ({ ...prev, start: e.target.value }))}
                  className="flex-1"
                />
                <span>至</span>
                <Input
                  type="time"
                  value={newTimeSlot.end}
                  onChange={(e) => setNewTimeSlot(prev => ({ ...prev, end: e.target.value }))}
                  className="flex-1"
                />
                <Button onClick={addTimeSlot} size="sm">
                  添加
                </Button>
              </div>
              
              {timeSlots.length > 0 && (
                <div className="space-y-1">
                  {timeSlots.map((slot, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {slot.start} - {slot.end}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTimeSlot(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 目的地信息 */}
          {selectedDestination && (
            <div>
              <Label>目的地</Label>
              <div className="mt-1 p-2 bg-green-50 rounded border">
                <p className="font-medium text-green-800">{selectedDestination.name}</p>
                <p className="text-sm text-green-600">{selectedDestination.address}</p>
              </div>
            </div>
          )}

          {/* 提交按钮 */}
          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={onCancel}
              className="flex-1"
            >
              取消
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? '提交中...' : '添加车辆'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleForm;