
import { supabase } from '@/integrations/supabase/client';
import { Vehicle, LuggageItem, RideGroup } from '@/types/Vehicle';

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
  async deleteVehicle(id: string): Promise<void> {
    const { error } = await supabase
      .from('vehicles')
      .update({ is_active: false })
      .eq('id', id);
    
    if (error) throw error;
  },

  // 创建行李项目
  async createLuggageItems(rideRequestId: string, luggage: Omit<LuggageItem, 'id' | 'created_at' | 'ride_request_id'>[]): Promise<LuggageItem[]> {
    const luggageItems = luggage.map(item => ({
      ...item,
      ride_request_id: rideRequestId
    }));

    const { data, error } = await supabase
      .from('luggage_items')
      .insert(luggageItems)
      .select();
    
    if (error) throw error;
    return data?.map(item => ({
      ...item,
      created_at: new Date(item.created_at),
      size_category: item.size_category as LuggageItem['size_category']
    })) || [];
  },

  // 获取行李项目
  async getLuggageItems(rideRequestId: string): Promise<LuggageItem[]> {
    const { data, error } = await supabase
      .from('luggage_items')
      .select('*')
      .eq('ride_request_id', rideRequestId);
    
    if (error) throw error;
    return data?.map(item => ({
      ...item,
      created_at: new Date(item.created_at),
      size_category: item.size_category as LuggageItem['size_category']
    })) || [];
  },

  // 计算行李总体积
  calculateLuggageVolume(luggage: LuggageItem[]): number {
    return luggage.reduce((total, item) => {
      const volume = (item.length_cm * item.width_cm * item.height_cm * item.quantity) / 1000; // 转换为升
      return total + volume;
    }, 0);
  },

  // 检查是否可以组队
  async canFormGroup(requests: any[], vehicleId: string): Promise<{ canForm: boolean; reason?: string }> {
    const vehicle = await this.getVehicleById(vehicleId);
    if (!vehicle) {
      return { canForm: false, reason: '车辆不存在' };
    }

    // 计算总人数
    const totalPassengers = requests.reduce((sum, req) => sum + (req.passenger_count || 1), 0);
    if (totalPassengers > vehicle.max_passengers) {
      return { canForm: false, reason: '人数超出车辆载客量' };
    }

    // 计算总行李体积
    let totalLuggageVolume = 0;
    for (const request of requests) {
      const luggage = await this.getLuggageItems(request.id);
      totalLuggageVolume += this.calculateLuggageVolume(luggage);
    }

    const vehicleCapacity = (vehicle.trunk_length_cm * vehicle.trunk_width_cm * vehicle.trunk_height_cm) / 1000;
    if (totalLuggageVolume > vehicleCapacity) {
      return { canForm: false, reason: '行李体积超出车辆容量' };
    }

    return { canForm: true };
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

  // 创建组队
  async createRideGroup(groupData: Omit<RideGroup, 'id' | 'created_at' | 'updated_at'>): Promise<RideGroup> {
    const insertData = {
      ...groupData,
      requested_time: groupData.requested_time.toISOString()
    };

    const { data, error } = await supabase
      .from('ride_groups')
      .insert([insertData])
      .select()
      .single();
    
    if (error) throw error;
    return {
      ...data,
      requested_time: new Date(data.requested_time),
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    };
  },

  // 加入组队
  async joinRideGroup(groupId: string, rideRequestId: string): Promise<void> {
    const { error } = await supabase
      .from('ride_group_members')
      .insert([{
        group_id: groupId,
        ride_request_id: rideRequestId
      }]);
    
    if (error) throw error;
  },

  // 获取组队信息
  async getRideGroups(routeId: string, requestedTime: Date): Promise<RideGroup[]> {
    const startTime = new Date(requestedTime.getTime() - 30 * 60 * 1000); // 前30分钟
    const endTime = new Date(requestedTime.getTime() + 30 * 60 * 1000); // 后30分钟

    const { data, error } = await supabase
      .from('ride_groups')
      .select(`
        *,
        vehicle:vehicles(*),
        members:ride_group_members(
          *,
          ride_request:ride_requests(*)
        )
      `)
      .eq('route_id', routeId)
      .gte('requested_time', startTime.toISOString())
      .lte('requested_time', endTime.toISOString())
      .eq('status', 'pending');
    
    if (error) throw error;
    return data?.map(item => ({
      ...item,
      requested_time: new Date(item.requested_time),
      created_at: new Date(item.created_at),
      updated_at: new Date(item.updated_at)
    })) || [];
  }
};
