
import { supabase } from '@/integrations/supabase/client';
import { RideRequest, WalletAddress, Payment, PaymentMethod, SupportedCoin, PresetDestination, FixedRoute, Vehicle } from '@/types/RideRequest';

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
      updated_at: new Date(item.updated_at)
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
        payment_status: 'unpaid'
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
      updated_at: new Date(data.updated_at)
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
      updated_at: new Date(data.updated_at)
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

  // 获取所有钱包地址（包括禁用的）
  async getAllWalletAddresses(): Promise<WalletAddress[]> {
    const { data, error } = await supabase
      .from('wallet_addresses')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data?.map(item => ({
      ...item,
      created_at: new Date(item.created_at)
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

  // 支付途径管理
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data?.map(item => ({
      ...item,
      type: item.type as PaymentMethod['type'],
      is_active: item.is_active ?? true,
      description: item.description ?? undefined,
      created_at: new Date(item.created_at)
    })) || [];
  }

  async getAllPaymentMethods(): Promise<PaymentMethod[]> {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data?.map(item => ({
      ...item,
      type: item.type as PaymentMethod['type'],
      is_active: item.is_active ?? true,
      description: item.description ?? undefined,
      created_at: new Date(item.created_at)
    })) || [];
  }

  async createPaymentMethod(methodData: Omit<PaymentMethod, 'id' | 'created_at' | 'is_active'>): Promise<PaymentMethod> {
    const { data, error } = await supabase
      .from('payment_methods')
      .insert([{
        ...methodData,
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      type: data.type as PaymentMethod['type'],
      is_active: data.is_active ?? true,
      description: data.description ?? undefined,
      created_at: new Date(data.created_at)
    };
  }

  async updatePaymentMethod(id: string, methodData: Partial<Omit<PaymentMethod, 'id' | 'created_at'>>): Promise<void> {
    const { error } = await supabase
      .from('payment_methods')
      .update(methodData)
      .eq('id', id);

    if (error) throw error;
  }

  async togglePaymentMethod(id: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('payment_methods')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) throw error;
  }

  // 支持币种管理
  async getSupportedCoins(): Promise<SupportedCoin[]> {
    const { data, error } = await supabase
      .from('supported_coins')
      .select('*')
      .eq('is_active', true)
      .order('symbol', { ascending: true });

    if (error) throw error;

    return data?.map(item => ({
      ...item,
      exchange: item.exchange as SupportedCoin['exchange'],
      is_active: item.is_active ?? true,
      created_at: new Date(item.created_at)
    })) || [];
  }

  async getAllSupportedCoins(): Promise<SupportedCoin[]> {
    const { data, error } = await supabase
      .from('supported_coins')
      .select('*')
      .order('symbol', { ascending: true });

    if (error) throw error;

    return data?.map(item => ({
      ...item,
      exchange: item.exchange as SupportedCoin['exchange'],
      is_active: item.is_active ?? true,
      created_at: new Date(item.created_at)
    })) || [];
  }

  async createSupportedCoin(coinData: Omit<SupportedCoin, 'id' | 'created_at' | 'is_active'>): Promise<SupportedCoin> {
    const { data, error } = await supabase
      .from('supported_coins')
      .insert([{
        ...coinData,
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      exchange: data.exchange as SupportedCoin['exchange'],
      is_active: data.is_active ?? true,
      created_at: new Date(data.created_at)
    };
  }

  async toggleSupportedCoin(id: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('supported_coins')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) throw error;
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
      .select('*')
      .eq('destination_id', destinationId)
      .eq('is_active', true)
      .order('driver_name', { ascending: true });

    if (error) throw error;

    return data?.map(item => ({
      ...item,
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
}

export const rideRequestService = new RideRequestService();
