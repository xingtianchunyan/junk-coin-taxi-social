import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Car, Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Vehicle } from '@/types/Vehicle';

const VehicleManagement: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState({
    driver_name: '',
    license_plate: '',
    max_passengers: 4,
    trunk_length_cm: 100,
    trunk_width_cm: 80,
    trunk_height_cm: 50
  });
  const { toast } = useToast();

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      const mappedVehicles = data?.map(item => ({
        ...item,
        created_at: new Date(item.created_at),
        updated_at: new Date(item.updated_at)
      })) || [];
      setVehicles(mappedVehicles);
    } catch (error) {
      console.error('加载车辆失败:', error);
      toast({
        title: "加载失败",
        description: "无法加载车辆信息",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVehicle) {
        const { error } = await supabase
          .from('vehicles')
          .update(formData)
          .eq('id', editingVehicle.id);
        
        if (error) throw error;
        toast({
          title: "更新成功",
          description: "车辆信息已更新"
        });
      } else {
        const { error } = await supabase
          .from('vehicles')
          .insert([formData]);
        
        if (error) throw error;
        toast({
          title: "添加成功",
          description: "新车辆已添加到系统"
        });
      }
      
      resetForm();
      loadVehicles();
    } catch (error) {
      console.error('操作失败:', error);
      toast({
        title: "操作失败",
        description: "请检查输入信息并重试",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      driver_name: vehicle.driver_name,
      license_plate: vehicle.license_plate,
      max_passengers: vehicle.max_passengers,
      trunk_length_cm: vehicle.trunk_length_cm,
      trunk_width_cm: vehicle.trunk_width_cm,
      trunk_height_cm: vehicle.trunk_height_cm
    });
    setShowAddDialog(true);
  };

  const handleDelete = async (vehicleId: string) => {
    if (!confirm('确定要删除这辆车吗？')) return;
    
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ is_active: false })
        .eq('id', vehicleId);
      
      if (error) throw error;
      toast({
        title: "删除成功",
        description: "车辆已从系统中移除"
      });
      loadVehicles();
    } catch (error) {
      console.error('删除失败:', error);
      toast({
        title: "删除失败",
        description: "无法删除车辆",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      driver_name: '',
      license_plate: '',
      max_passengers: 4,
      trunk_length_cm: 100,
      trunk_width_cm: 80,
      trunk_height_cm: 50
    });
    setEditingVehicle(null);
    setShowAddDialog(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          车辆管理
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            管理社区车辆信息，包括载客量和后备箱容量
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingVehicle(null)}>
                <Plus className="h-4 w-4 mr-2" />
                添加车辆
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingVehicle ? '编辑车辆' : '添加车辆'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="driver_name">司机昵称</Label>
                  <Input
                    id="driver_name"
                    value={formData.driver_name}
                    onChange={(e) => setFormData({...formData, driver_name: e.target.value})}
                    placeholder="例如: 张师傅"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="license_plate">车牌号</Label>
                  <Input
                    id="license_plate"
                    value={formData.license_plate}
                    onChange={(e) => setFormData({...formData, license_plate: e.target.value})}
                    placeholder="例如: 京A12345"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="max_passengers">最大载客数</Label>
                  <Input
                    id="max_passengers"
                    type="number"
                    min="1"
                    max="9"
                    value={formData.max_passengers}
                    onChange={(e) => setFormData({...formData, max_passengers: parseInt(e.target.value) || 4})}
                    required
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="trunk_length">长(cm)</Label>
                    <Input
                      id="trunk_length"
                      type="number"
                      min="30"
                      value={formData.trunk_length_cm}
                      onChange={(e) => setFormData({...formData, trunk_length_cm: parseInt(e.target.value) || 100})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="trunk_width">宽(cm)</Label>
                    <Input
                      id="trunk_width"
                      type="number"
                      min="30"
                      value={formData.trunk_width_cm}
                      onChange={(e) => setFormData({...formData, trunk_width_cm: parseInt(e.target.value) || 80})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="trunk_height">高(cm)</Label>
                    <Input
                      id="trunk_height"
                      type="number"
                      min="20"
                      value={formData.trunk_height_cm}
                      onChange={(e) => setFormData({...formData, trunk_height_cm: parseInt(e.target.value) || 50})}
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingVehicle ? '更新' : '添加'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    取消
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>司机</TableHead>
                <TableHead>车牌</TableHead>
                <TableHead>载客量</TableHead>
                <TableHead>后备箱(长×宽×高)</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell className="font-medium">{vehicle.driver_name}</TableCell>
                  <TableCell>{vehicle.license_plate}</TableCell>
                  <TableCell>{vehicle.max_passengers}人</TableCell>
                  <TableCell>
                    {vehicle.trunk_length_cm}×{vehicle.trunk_width_cm}×{vehicle.trunk_height_cm}cm
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(vehicle)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(vehicle.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {vehicles.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              暂无车辆信息，请添加第一辆车
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleManagement;
