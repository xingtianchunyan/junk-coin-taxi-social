
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
      .单条();

    if (error) {
      console.error('Error fetching ride request:', error);
      return null;
    }

    if (!data) return null;

    return {
      ...data,
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
      created_at: new Date(data.created_at),
      confirmed_at: data.confirmed_at ? new Date(data.confirmed_at) : undefined
    };
  }
}

export const rideRequestService = new RideRequestService();
