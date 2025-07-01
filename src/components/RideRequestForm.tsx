
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, Clock, MapPin, User, Phone } from 'lucide-react';
import { RideRequest } from '@/types/RideRequest';

interface RideRequestFormProps {
  onSubmit: (request: Omit<RideRequest, 'id' | 'createdAt' | 'status'>) => void;
}

const RideRequestForm: React.FC<RideRequestFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    friendName: '',
    startLocation: '',
    endLocation: '',
    requestedTime: '',
    contactInfo: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.friendName || !formData.startLocation || !formData.endLocation || !formData.requestedTime) {
      return;
    }

    onSubmit({
      ...formData,
      requestedTime: new Date(formData.requestedTime)
    });

    setFormData({
      friendName: '',
      startLocation: '',
      endLocation: '',
      requestedTime: '',
      contactInfo: '',
      notes: ''
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="friendName" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                朋友姓名
              </Label>
              <Input
                id="friendName"
                value={formData.friendName}
                onChange={(e) => handleInputChange('friendName', e.target.value)}
                placeholder="请输入朋友姓名"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactInfo" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                联系方式
              </Label>
              <Input
                id="contactInfo"
                value={formData.contactInfo}
                onChange={(e) => handleInputChange('contactInfo', e.target.value)}
                placeholder="电话或微信"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startLocation">出发地点</Label>
              <Input
                id="startLocation"
                value={formData.startLocation}
                onChange={(e) => handleInputChange('startLocation', e.target.value)}
                placeholder="如：火车站、汽车站"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endLocation">目的地</Label>
              <Input
                id="endLocation"
                value={formData.endLocation}
                onChange={(e) => handleInputChange('endLocation', e.target.value)}
                placeholder="如：村里、家里"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="requestedTime" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              预计时间
            </Label>
            <Input
              id="requestedTime"
              type="datetime-local"
              value={formData.requestedTime}
              onChange={(e) => handleInputChange('requestedTime', e.target.value)}
              required
            />
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
          >
            添加用车需求
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default RideRequestForm;
