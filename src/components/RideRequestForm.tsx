
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Clock, MapPin, User, Phone, CreditCard } from 'lucide-react';
import { RideRequest } from '@/types/RideRequest';

interface RideRequestFormProps {
  onSubmit: (request: Omit<RideRequest, 'id' | 'access_code' | 'created_at' | 'updated_at' | 'status' | 'payment_status'>) => void;
}

const RideRequestForm: React.FC<RideRequestFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    friend_name: '',
    start_location: '',
    end_location: '',
    requested_time: '',
    contact_info: '',
    notes: '',
    payment_required: false,
    payment_amount: 0,
    payment_currency: 'USDT',
    sender_wallet_address: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.friend_name || !formData.start_location || !formData.end_location || !formData.requested_time) {
      return;
    }

    onSubmit({
      ...formData,
      requested_time: new Date(formData.requested_time),
      payment_amount: formData.payment_required ? formData.payment_amount : undefined,
      payment_currency: formData.payment_required ? formData.payment_currency : undefined,
      sender_wallet_address: formData.payment_required ? formData.sender_wallet_address : undefined
    });

    setFormData({
      friend_name: '',
      start_location: '',
      end_location: '',
      requested_time: '',
      contact_info: '',
      notes: '',
      payment_required: false,
      payment_amount: 0,
      payment_currency: 'USDT',
      sender_wallet_address: ''
    });
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
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
              <Label htmlFor="friend_name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                朋友姓名
              </Label>
              <Input
                id="friend_name"
                value={formData.friend_name}
                onChange={(e) => handleInputChange('friend_name', e.target.value)}
                placeholder="请输入朋友姓名"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_location">出发地点</Label>
              <Input
                id="start_location"
                value={formData.start_location}
                onChange={(e) => handleInputChange('start_location', e.target.value)}
                placeholder="如：火车站、汽车站"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_location">目的地</Label>
              <Input
                id="end_location"
                value={formData.end_location}
                onChange={(e) => handleInputChange('end_location', e.target.value)}
                placeholder="如：村里、家里"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="requested_time" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              预计时间
            </Label>
            <Input
              id="requested_time"
              type="datetime-local"
              value={formData.requested_time}
              onChange={(e) => handleInputChange('requested_time', e.target.value)}
              required
            />
          </div>

          {/* 支付选项 */}
          <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="payment_required"
                checked={formData.payment_required}
                onCheckedChange={(checked) => handleInputChange('payment_required', checked)}
              />
              <Label htmlFor="payment_required" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                需要支付车费
              </Label>
            </div>
            
            {formData.payment_required && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="payment_amount">支付金额</Label>
                    <Input
                      id="payment_amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.payment_amount}
                      onChange={(e) => handleInputChange('payment_amount', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_currency">支付币种</Label>
                    <Select
                      value={formData.payment_currency}
                      onValueChange={(value) => handleInputChange('payment_currency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择币种" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USDT">USDT</SelectItem>
                        <SelectItem value="BNB">BNB</SelectItem>
                        <SelectItem value="ETH">ETH</SelectItem>
                        <SelectItem value="MATIC">MATIC</SelectItem>
                        <SelectItem value="TRX">TRX</SelectItem>
                        <SelectItem value="BTC">BTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sender_wallet_address">您的钱包地址 (用于自动检测支付)</Label>
                  <Input
                    id="sender_wallet_address"
                    value={formData.sender_wallet_address}
                    onChange={(e) => handleInputChange('sender_wallet_address', e.target.value)}
                    placeholder="输入您用于支付的钱包地址"
                    className="font-mono text-xs"
                  />
                  <div className="text-xs text-gray-500">
                    💡 提供钱包地址后，系统可自动检测您的付款交易
                  </div>
                </div>
              </div>
            )}
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
