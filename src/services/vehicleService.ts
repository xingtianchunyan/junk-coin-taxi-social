
import { supabase } from '@/integrations/supabase/client';
import { Vehicle } from '@/types/Vehicle';

export const vehicleService = {
  // 获取所有车辆
  async getVehicles(): Promise<Vehicle[]> {
    const { data, error } = await supabase
      .from('vehicles')
      .select(`
        *,
        users!vehicles_driver_user_id_fkey(access_code)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data?.map(item => ({
      ...item,
      access_code: item.users?.access_code,
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

  // 删除车辆（真删除，同时删除关联的司机用户）
  async deleteVehicle(id: string): Promise<void> {
    // 首先获取车辆的用户ID
    const { data: vehicleData, error: vehicleError } = await supabase
      .from('vehicles')
      .select('driver_user_id')
      .eq('id', id)
      .single();
    
    if (vehicleError) throw vehicleError;
    
    // 删除车辆
    const { error: deleteVehicleError } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id);
    
    if (deleteVehicleError) throw deleteVehicleError;
    
    // 如果有关联的司机用户，也删除该用户
    if (vehicleData?.driver_user_id) {
      const { error: deleteUserError } = await supabase
        .from('users')
        .delete()
        .eq('id', vehicleData.driver_user_id);
      
      if (deleteUserError) {
        console.error('删除关联司机用户失败:', deleteUserError);
        // 不抛出错误，因为车辆已经删除成功
      }
    }
  },

  // 获取单个车辆
  async getVehicleById(id: string): Promise<Vehicle | null> {
    const { data, error } = await supabase
      .from('vehicles')
      .select(`
        *,
        users!vehicles_driver_user_id_fkey(access_code)
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();
    
    if (error) return null;
    return {
      ...data,
      access_code: data.users?.access_code,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    };
  }
};
