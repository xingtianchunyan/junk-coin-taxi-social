
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Minus, Package } from 'lucide-react';
import { LuggageItem } from '@/types/Vehicle';

interface LuggageSettingsProps {
  luggage: Omit<LuggageItem, 'id' | 'created_at' | 'ride_request_id'>[];
  onChange: (luggage: Omit<LuggageItem, 'id' | 'created_at' | 'ride_request_id'>[]) => void;
}

const LuggageSettings: React.FC<LuggageSettingsProps> = ({ luggage, onChange }) => {
  const addLuggageItem = () => {
    const newItem = {
      size_category: 'medium' as const,
      length_cm: 50,
      width_cm: 30,
      height_cm: 20,
      quantity: 1
    };
    onChange([...luggage, newItem]);
  };

  const removeLuggageItem = (index: number) => {
    const newLuggage = luggage.filter((_, i) => i !== index);
    onChange(newLuggage);
  };

  const updateLuggageItem = (index: number, field: string, value: any) => {
    const newLuggage = [...luggage];
    newLuggage[index] = { ...newLuggage[index], [field]: value };
    onChange(newLuggage);
  };

  const sizeCategories = [
    { value: 'small', label: '小件 (例如：背包)', dimensions: '40×25×15cm' },
    { value: 'medium', label: '中件 (例如：登机箱)', dimensions: '55×35×25cm' },
    { value: 'large', label: '大件 (例如：大行李箱)', dimensions: '75×50×35cm' },
    { value: 'extra_large', label: '特大件 (例如：超大箱)', dimensions: '90×60×40cm' }
  ];

  const getSizeDimensions = (category: string) => {
    const categoryData = sizeCategories.find(s => s.value === category);
    return categoryData?.dimensions || '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Package className="h-4 w-4" />
          行李设置
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {luggage.length === 0 && (
          <div className="text-center py-4 text-gray-500 text-sm">
            暂无行李，点击下方按钮添加
          </div>
        )}
        
        {luggage.map((item, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">行李 #{index + 1}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeLuggageItem(index)}
              >
                <Minus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>行李类型</Label>
                <Select
                  value={item.size_category}
                  onValueChange={(value) => {
                    updateLuggageItem(index, 'size_category', value);
                    // 根据类型自动设置尺寸
                    const sizeData = sizeCategories.find(s => s.value === value);
                    if (sizeData) {
                      const [l, w, h] = sizeData.dimensions.match(/\d+/g)?.map(Number) || [50, 30, 20];
                      updateLuggageItem(index, 'length_cm', l);
                      updateLuggageItem(index, 'width_cm', w);
                      updateLuggageItem(index, 'height_cm', h);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sizeCategories.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-xs text-gray-500">
                  参考尺寸: {getSizeDimensions(item.size_category)}
                </div>
              </div>

              <div className="space-y-2">
                <Label>数量</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={item.quantity}
                  onChange={(e) => updateLuggageItem(index, 'quantity', parseInt(e.target.value) || 1)}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-2">
                <Label>长(cm)</Label>
                <Input
                  type="number"
                  min="10"
                  value={item.length_cm}
                  onChange={(e) => updateLuggageItem(index, 'length_cm', parseInt(e.target.value) || 50)}
                />
              </div>
              <div className="space-y-2">
                <Label>宽(cm)</Label>
                <Input
                  type="number"
                  min="10"
                  value={item.width_cm}
                  onChange={(e) => updateLuggageItem(index, 'width_cm', parseInt(e.target.value) || 30)}
                />
              </div>
              <div className="space-y-2">
                <Label>高(cm)</Label>
                <Input
                  type="number"
                  min="5"
                  value={item.height_cm}
                  onChange={(e) => updateLuggageItem(index, 'height_cm', parseInt(e.target.value) || 20)}
                />
              </div>
            </div>
            
            <div className="text-xs text-gray-600">
              单件体积: {(item.length_cm * item.width_cm * item.height_cm / 1000).toFixed(1)}L × {item.quantity}件 = {((item.length_cm * item.width_cm * item.height_cm * item.quantity) / 1000).toFixed(1)}L
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addLuggageItem}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          添加行李
        </Button>
      </CardContent>
    </Card>
  );
};

export default LuggageSettings;
