
import { supabase } from '@/integrations/supabase/client';
import { Vehicle } from '@/types/Vehicle';

export const vehicleService = {
  // 获取所有车辆
  async getVehicles(): Promise<Vehicle[]> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data?.map(item => ({
      ...item,
      created_at: new Date(item.created_at),
      updated_at: new Date(item.updated_at)
    })) || [];
  },

  // 创建车辆
  async createVehicle(vehicleData: Omit<Vehicle, 'id' | 'created_at' | 'updated_at' | 'is_active'>): Promise<Vehicle> {
    const { data, error } = await supabase
      .from('vehicles')
      .insert([vehicleData])
      .select()
      .single();
    
    if (error) throw error;
    return {
      ...data,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    };
  },

  // 更新车辆
  async updateVehicle(id: string, vehicleData: Partial<Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>>): Promise<Vehicle> {
    const { data, error } = await supabase
      .from('vehicles')
      .update(vehicleData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return {
      ...data,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    };
  },

  // 删除车辆（软删除）
  async deactivateVehicle(id: string): Promise<void> {
    const { error } = await supabase
      .from('vehicles')
      .update({ is_active: false })
      .eq('id', id);
    
    if (error) throw error;
  },

  // 删除车辆（真删除）
  async deleteVehicle(id: string): Promise<void> {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },


  // 获取单个车辆
  async getVehicleById(id: string): Promise<Vehicle | null> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();
    
    if (error) return null;
    return {
      ...data,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    };
  },

};
