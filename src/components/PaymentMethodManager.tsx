
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PaymentMethod } from '@/types/RideRequest';
import { rideRequestService } from '@/services/rideRequestService';

interface PaymentMethodManagerProps {
  onClose: () => void;
}

const PaymentMethodManager: React.FC<PaymentMethodManagerProps> = ({ onClose }) => {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'exchange_uid' as PaymentMethod['type'],
    identifier: '',
    description: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadMethods();
  }, []);

  const loadMethods = async () => {
    try {
      setLoading(true);
      const data = await rideRequestService.getAllPaymentMethods();
      setMethods(data);
    } catch (error) {
      console.error('加载支付途径失败:', error);
      toast({
        title: "加载失败",
        description: "无法加载支付途径",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMethod) {
        await rideRequestService.updatePaymentMethod(editingMethod.id, formData);
        toast({
          title: "更新成功",
          description: "支付途径已更新",
        });
      } else {
        await rideRequestService.createPaymentMethod(formData);
        toast({
          title: "添加成功",
          description: "新支付途径已添加",
        });
      }
      setFormData({ name: '', type: 'exchange_uid', identifier: '', description: '' });
      setShowAddForm(false);
      setEditingMethod(null);
      loadMethods();
    } catch (error) {
      console.error('操作失败:', error);
      toast({
        title: "操作失败",
        description: "无法保存支付途径",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      type: method.type,
      identifier: method.identifier,
      description: method.description || ''
    });
    setShowAddForm(true);
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await rideRequestService.togglePaymentMethod(id, !isActive);
      toast({
        title: "状态已更新",
        description: `支付途径已${!isActive ? '启用' : '禁用'}`,
      });
      loadMethods();
    } catch (error) {
      console.error('更新状态失败:', error);
      toast({
        title: "更新失败",
        description: "无法更新支付途径状态",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <CreditCard className="h-12 w-12 text-slate-600 mx-auto mb-4 animate-spin" />
          <p className="text-slate-600">加载支付途径中...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            支付途径管理
          </CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setShowAddForm(!showAddForm);
                if (!showAddForm) {
                  setEditingMethod(null);
                  setFormData({ name: '', type: 'exchange_uid', identifier: '', description: '' });
                }
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              {showAddForm ? '取消' : '添加支付途径'}
            </Button>
            <Button variant="outline" onClick={onClose}>
              关闭
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingMethod ? '编辑' : '添加'}支付途径</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">支付途径名称</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="例如: 币安交易所"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">类型</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value as PaymentMethod['type']})}
                      className="w-full p-2 border rounded-md"
                      required
                    >
                      <option value="exchange_uid">交易所UID</option>
                      <option value="wallet_address">钱包地址</option>
                      <option value="other">其他</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">标识符</label>
                  <Input
                    value={formData.identifier}
                    onChange={(e) => setFormData({...formData, identifier: e.target.value})}
                    placeholder="例如: binance_uid"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">描述 (可选)</label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="支付途径的详细描述"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">
                    {editingMethod ? '更新' : '添加'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingMethod(null);
                    }}
                  >
                    取消
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {methods.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>标识符</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {methods.map((method) => (
                <TableRow key={method.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{method.name}</div>
                      {method.description && (
                        <div className="text-sm text-gray-500">{method.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {method.type === 'exchange_uid' ? '交易所UID' : 
                       method.type === 'wallet_address' ? '钱包地址' : '其他'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{method.identifier}</TableCell>
                  <TableCell>
                    <Badge variant={method.is_active ? "default" : "secondary"}>
                      {method.is_active ? '启用' : '禁用'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(method)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleActive(method.id, method.is_active)}
                      >
                        {method.is_active ? '禁用' : '启用'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12">
            <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">还没有配置支付途径</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentMethodManager;
