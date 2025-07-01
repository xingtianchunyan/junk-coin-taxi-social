
import { supabase } from '@/integrations/supabase/client';
import { RideRequest, WalletAddress, Payment } from '@/types/RideRequest';

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
  async createRideRequest(requestData: Omit<RideRequest, 'id' | 'access_code' | 'created_at' | 'updated_at' | 'status' | 'payment_status'>): Promise<{ request: RideRequest; accessCode: string }> {
    const { data, error } = await supabase
      .from('ride_requests')
      .insert([{
        ...requestData,
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

    return { request, accessCode: data.access_code };
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
}

export const rideRequestService = new RideRequestService();
