
import { supabase } from '@/integrations/supabase/client';
import { RideRequest, WalletAddress, Payment, PresetDestination, FixedRoute, Vehicle } from '@/types/RideRequest';

export class RideRequestService {
  // 获取所有用车需求（只显示基本信息）
  async getAllRideRequests(): Promise<RideRequest[]> {
    const { data, error } = await supabase
      .from('ride_requests')
      .select('*')
      .order('requested_time', { ascending: true });

    if (error) throw error;
    
    return data?.map(item => ({
      ...item,
      status: (item.status as RideRequest['status']) || 'pending',
      payment_status: (item.payment_status as RideRequest['payment_status']) || 'unpaid',
      requested_time: new Date(item.requested_time),
      created_at: new Date(item.created_at),
      updated_at: new Date(item.updated_at),
      luggage: Array.isArray(item.luggage) ? item.luggage : (typeof item.luggage === 'string' ? JSON.parse(item.luggage) : [])
    })) || [];
  }

  // 创建用车需求
  async createRideRequest(requestData: Omit<RideRequest, 'id' | 'access_code' | 'created_at' | 'updated_at' | 'status' | 'payment_status'>, accessCode: string): Promise<RideRequest> {
    const { data, error } = await supabase
      .from('ride_requests')
      .insert([{
        ...requestData,
        access_code: accessCode,
        requested_time: requestData.requested_time.toISOString(),
        payment_required: requestData.payment_required || false,
        payment_status: 'unpaid',
        luggage: JSON.stringify(requestData.luggage)
      }])
      .select()
      .single();

    if (error) throw error;

    const request: RideRequest = {
      ...data,
      status: (data.status as RideRequest['status']) || 'pending',
      payment_status: (data.payment_status as RideRequest['payment_status']) || 'unpaid',
      requested_time: new Date(data.requested_time),
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      luggage: Array.isArray(data.luggage) ? data.luggage : (typeof data.luggage === 'string' ? JSON.parse(data.luggage) : [])
    };

    return request;
  }

  // 使用访问码获取详细信息
  async getRideRequestByAccessCode(accessCode: string): Promise<RideRequest | null> {
    const { data, error } = await supabase
      .from('ride_requests')
      .select('*')
      .eq('access_code', accessCode)
      .single();

    if (error) {
      console.error('Error fetching ride request:', error);
      return null;
    }

    if (!data) return null;

    return {
      ...data,
      status: (data.status as RideRequest['status']) || 'pending',
      payment_status: (data.payment_status as RideRequest['payment_status']) || 'unpaid',
      requested_time: new Date(data.requested_time),
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      luggage: Array.isArray(data.luggage) ? data.luggage : (typeof data.luggage === 'string' ? JSON.parse(data.luggage) : [])
    };
  }

  // 更新用车需求状态
  async updateRideRequestStatus(id: string, status: RideRequest['status']): Promise<void> {
    const { error } = await supabase
      .from('ride_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  // 删除用车需求
  async deleteRideRequest(id: string): Promise<void> {
    const { error } = await supabase
      .from('ride_requests')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // 更新支付状态
  async updatePaymentStatus(id: string, paymentStatus: RideRequest['payment_status'], txHash?: string): Promise<void> {
    const updateData: any = { 
      payment_status: paymentStatus, 
      updated_at: new Date().toISOString() 
    };
    
    if (txHash) {
      updateData.payment_tx_hash = txHash;
    }

    const { error } = await supabase
      .from('ride_requests')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
  }

  // 获取钱包地址
  async getWalletAddresses(): Promise<WalletAddress[]> {
    const { data, error } = await supabase
      .from('wallet_addresses')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data?.map(item => ({
      ...item,
      created_at: new Date(item.created_at)
    })) || [];
  }

  // 根据固定路线ID获取钱包地址
  async getWalletAddressesByRoute(routeId: string): Promise<WalletAddress[]> {
    const { data, error } = await supabase
      .from('wallet_addresses')
      .select('*')
      .eq('route_id', routeId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data?.map(item => ({
      ...item,
      created_at: new Date(item.created_at)
    })) || [];
  }

  // 获取所有钱包地址（包括禁用的）
  async getAllWalletAddresses(): Promise<WalletAddress[]> {
    const { data, error } = await supabase
      .from('wallet_addresses')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data?.map(item => ({
      ...item,
      created_at: new Date(item.created_at),
      // 暂时设为undefined，等数据库字段添加后再实现关联查询
      route: undefined,
      vehicle: undefined
    })) || [];
  }

  // 创建钱包地址
  async createWalletAddress(walletData: Omit<WalletAddress, 'id' | 'created_at' | 'is_active'>): Promise<WalletAddress> {
    const { data, error } = await supabase
      .from('wallet_addresses')
      .insert([{
        ...walletData,
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      created_at: new Date(data.created_at)
    };
  }

  // 更新钱包地址
  async updateWalletAddress(id: string, walletData: Partial<Omit<WalletAddress, 'id' | 'created_at'>>): Promise<void> {
    const { error } = await supabase
      .from('wallet_addresses')
      .update(walletData)
      .eq('id', id);

    if (error) throw error;
  }

  // 切换钱包地址状态
  async toggleWalletAddress(id: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('wallet_addresses')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) throw error;
  }

  // 删除钱包地址
  async deleteWalletAddress(id: string): Promise<void> {
    const { error } = await supabase
      .from('wallet_addresses')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // 创建支付记录
  async createPayment(paymentData: Omit<Payment, 'id' | 'created_at' | 'confirmed_at'>): Promise<Payment> {
    const { data, error } = await supabase
      .from('payments')
      .insert([paymentData])
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      status: (data.status as Payment['status']) || 'pending',
      created_at: new Date(data.created_at),
      confirmed_at: data.confirmed_at ? new Date(data.confirmed_at) : undefined
    };
  }

  // 获取统计数据
  async getStatistics(): Promise<{
    totalRequests: number;
    pendingRequests: number;
    completedRequests: number;
    totalPayments: number;
    pendingPayments: number;
    confirmedPayments: number;
  }> {
    const [requestsResult, paymentsResult] = await Promise.all([
      supabase.from('ride_requests').select('status, payment_required'),
      supabase.from('ride_requests').select('payment_status').eq('payment_required', true)
    ]);

    if (requestsResult.error) throw requestsResult.error;
    if (paymentsResult.error) throw paymentsResult.error;

    const requests = requestsResult.data || [];
    const payments = paymentsResult.data || [];

    return {
      totalRequests: requests.length,
      pendingRequests: requests.filter(r => r.status === 'pending').length,
      completedRequests: requests.filter(r => r.status === 'completed').length,
      totalPayments: payments.length,
      pendingPayments: payments.filter(p => p.payment_status === 'pending').length,
      confirmedPayments: payments.filter(p => p.payment_status === 'confirmed').length,
    };
  }


  // 预设目的地管理
  async getPresetDestinations(): Promise<PresetDestination[]> {
    const { data, error } = await supabase
      .from('preset_destinations')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;

    return data?.map(item => ({
      ...item,
      is_active: item.is_active ?? true,
      description: item.description ?? undefined,
      created_at: new Date(item.created_at)
    })) || [];
  }

  async getAllPresetDestinations(): Promise<PresetDestination[]> {
    const { data, error } = await supabase
      .from('preset_destinations')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    return data?.map(item => ({
      ...item,
      is_active: item.is_active ?? true,
      description: item.description ?? undefined,
      created_at: new Date(item.created_at)
    })) || [];
  }

  async createPresetDestination(destinationData: Omit<PresetDestination, 'id' | 'created_at' | 'is_active'>): Promise<PresetDestination> {
    const { data, error } = await supabase
      .from('preset_destinations')
      .insert([{
        ...destinationData,
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      is_active: data.is_active ?? true,
      description: data.description ?? undefined,
      created_at: new Date(data.created_at)
    };
  }

  // 自动生成固定路线
  async generateFixedRoutesForDestination(destinationName: string, destinationAddress: string): Promise<void> {
    const response = await fetch(`https://gwfuygmhcfmbzkewiuuv.supabase.co/functions/v1/auto-generate-routes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        destination_name: destinationName,
        destination_address: destinationAddress
      })
    });

    if (!response.ok) {
      throw new Error('自动生成路线失败');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || '自动生成路线失败');
    }
  }

  async updatePresetDestination(id: string, destinationData: Partial<Omit<PresetDestination, 'id' | 'created_at'>>): Promise<void> {
    const { error } = await supabase
      .from('preset_destinations')
      .update(destinationData)
      .eq('id', id);

    if (error) throw error;
  }

  async togglePresetDestination(id: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('preset_destinations')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) throw error;
  }

  // 固定路线管理
  async getFixedRoutes(): Promise<FixedRoute[]> {
    const { data, error } = await supabase
      .from('fixed_routes')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;

    return data?.map(item => ({
      ...item,
      is_active: item.is_active ?? true,
      currency: item.currency ?? 'CNY',
      created_at: new Date(item.created_at),
      updated_at: new Date(item.updated_at)
    })) || [];
  }

  async getAllFixedRoutes(): Promise<FixedRoute[]> {
    const { data, error } = await supabase
      .from('fixed_routes')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    return data?.map(item => ({
      ...item,
      is_active: item.is_active ?? true,
      currency: item.currency ?? 'CNY',
      created_at: new Date(item.created_at),
      updated_at: new Date(item.updated_at)
    })) || [];
  }

  async createFixedRoute(routeData: Omit<FixedRoute, 'id' | 'created_at' | 'updated_at' | 'is_active'>): Promise<FixedRoute> {
    const { data, error } = await supabase
      .from('fixed_routes')
      .insert([{
        ...routeData,
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      is_active: data.is_active ?? true,
      currency: data.currency ?? 'CNY',
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    };
  }

  async updateFixedRoute(id: string, routeData: Partial<Omit<FixedRoute, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const { error } = await supabase
      .from('fixed_routes')
      .update(routeData)
      .eq('id', id);

    if (error) throw error;
  }

  async toggleFixedRoute(id: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('fixed_routes')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) throw error;
  }

  // 删除固定路线
  async deleteFixedRoute(id: string): Promise<void> {
    const { error } = await supabase
      .from('fixed_routes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // 社区管理员专用方法
  async getCommunityDestination(accessCode: string): Promise<PresetDestination | null> {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('access_code', accessCode)
      .single();

    if (userError || !user) return null;

    const { data, error } = await supabase
      .from('preset_destinations')
      .select('*')
      .eq('admin_user_id', user.id)
      .eq('is_active', true)
      .single();

    if (error) return null;

    return {
      ...data,
      is_active: data.is_active ?? true,
      description: data.description ?? undefined,
      created_at: new Date(data.created_at)
    };
  }

  async getDestinationRoutes(destinationId: string): Promise<FixedRoute[]> {
    const { data, error } = await supabase
      .from('fixed_routes')
      .select('*')
      .eq('destination_id', destinationId)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;

    return data?.map(item => ({
      ...item,
      is_active: item.is_active ?? true,
      currency: item.currency ?? 'CNY',
      created_at: new Date(item.created_at),
      updated_at: new Date(item.updated_at)
    })) || [];
  }

  async getDestinationVehicles(destinationId: string): Promise<Vehicle[]> {
    const { data, error } = await supabase
      .from('vehicles')
      .select(`
        *,
        users!vehicles_user_id_fkey(access_code)
      `)
      .eq('destination_id', destinationId)
      .eq('is_active', true)
      .order('driver_name', { ascending: true });

    if (error) throw error;

    return data?.map(item => ({
      ...item,
      access_code: item.users?.access_code,
      is_active: item.is_active ?? true,
      created_at: new Date(item.created_at),
      updated_at: new Date(item.updated_at)
    })) || [];
  }

  async getDestinationWallets(destinationId: string): Promise<WalletAddress[]> {
    const { data, error } = await supabase
      .from('wallet_addresses')
      .select('*')
      .eq('destination_id', destinationId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data?.map(item => ({
      ...item,
      created_at: new Date(item.created_at)
    })) || [];
  }

  async createDestinationRoute(routeData: Omit<FixedRoute, 'id' | 'created_at' | 'updated_at' | 'is_active'>, destinationId: string): Promise<FixedRoute> {
    const { data, error } = await supabase
      .from('fixed_routes')
      .insert([{
        ...routeData,
        destination_id: destinationId,
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      is_active: data.is_active ?? true,
      currency: data.currency ?? 'CNY',
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    };
  }

  async createDestinationVehicle(vehicleData: Omit<Vehicle, 'id' | 'created_at' | 'updated_at' | 'is_active'>, destinationId: string): Promise<Vehicle> {
    const { data, error } = await supabase
      .from('vehicles')
      .insert([{
        ...vehicleData,
        destination_id: destinationId,
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      is_active: data.is_active ?? true,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    };
  }

  async createDestinationWallet(walletData: Omit<WalletAddress, 'id' | 'created_at' | 'is_active'>, destinationId: string): Promise<WalletAddress> {
    const { data, error } = await supabase
      .from('wallet_addresses')
      .insert([{
        ...walletData,
        destination_id: destinationId,
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      created_at: new Date(data.created_at)
    };
  }

  // 检查返程路线是否存在
  async checkReturnRouteExists(destinationId: string, startLocation: string, endLocation: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('fixed_routes')
      .select('id')
      .eq('destination_id', destinationId)
      .eq('start_location', endLocation)
      .eq('end_location', startLocation)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 是没有找到记录的错误码
    
    return !!data;
  }

  // 创建返程路线
  async createReturnRoute(originalRoute: FixedRoute, destinationId: string): Promise<FixedRoute> {
    const returnRouteName = `${originalRoute.end_location}到${originalRoute.start_location}`;
    
    const returnRouteData = {
      name: returnRouteName,
      start_location: originalRoute.end_location,
      end_location: originalRoute.start_location,
      distance_km: originalRoute.distance_km,
      estimated_duration_minutes: originalRoute.estimated_duration_minutes,
      market_price: originalRoute.market_price,
      our_price: originalRoute.our_price,
      currency: originalRoute.currency || 'CNY'
    };

    return await this.createDestinationRoute(returnRouteData, destinationId);
  }

  // 批量创建返程路线
  async createReturnRoutesForDestination(destinationId: string): Promise<{ created: number; skipped: number }> {
    const routes = await this.getDestinationRoutes(destinationId);
    let created = 0;
    let skipped = 0;

    for (const route of routes) {
      const returnExists = await this.checkReturnRouteExists(
        destinationId,
        route.start_location,
        route.end_location
      );

      if (!returnExists) {
        try {
          await this.createReturnRoute(route, destinationId);
          created++;
        } catch (error) {
          console.error(`创建返程路线失败: ${route.name}`, error);
          skipped++;
        }
      } else {
        skipped++;
      }
    }

    return { created, skipped };
  }
}

export const rideRequestService = new RideRequestService();
