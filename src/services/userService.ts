import { supabase } from '@/integrations/supabase/client';

export interface User {
  id: string;
  access_code: string;
  wallet_address?: string;
  role?: string;
  created_at: Date;
  updated_at: Date;
}

export class UserService {
  // 根据访问码获取用户信息
  async getUserByAccessCode(accessCode: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('access_code', accessCode)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    if (!data) return null;

    return {
      ...data,
      wallet_address: data.wallet_address || null, // 确保字段存在
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    };
  }

  // 创建或更新用户
  async upsertUser(accessCode: string, walletAddress?: string): Promise<User> {
    // 先检查用户是否存在
    const existingUser = await this.getUserByAccessCode(accessCode);
    
    if (existingUser) {
      // 如果用户存在，只更新必要字段
      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      
      // 只有当wallet_address字段存在时才更新
      if (walletAddress !== undefined) {
        updateData.wallet_address = walletAddress;
      }
      
      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('access_code', accessCode)
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        wallet_address: data.wallet_address || null,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at)
      };
    } else {
      // 如果用户不存在，创建新用户
      const insertData: any = {
        access_code: accessCode,
        updated_at: new Date().toISOString()
      };
      
      if (walletAddress !== undefined) {
        insertData.wallet_address = walletAddress;
      }
      
      const { data, error } = await supabase
        .from('users')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        wallet_address: data.wallet_address || null,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at)
      };
    }
  }

  // 绑定钱包地址到访问码
  async bindWalletToAccessCode(accessCode: string, walletAddress: string): Promise<User> {
    return this.upsertUser(accessCode, walletAddress);
  }

  // 解除钱包地址绑定
  async unbindWalletFromAccessCode(accessCode: string): Promise<User> {
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    // 尝试设置wallet_address为null，如果字段不存在则忽略
    try {
      updateData.wallet_address = null;
      
      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('access_code', accessCode)
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        wallet_address: null,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('解绑钱包失败，可能是wallet_address字段不存在:', error);
      throw new Error('数据库字段不存在，请先添加wallet_address字段');
    }
  }

  // 检查钱包地址是否已被其他访问码绑定
  async isWalletBoundToOtherAccessCode(walletAddress: string, currentAccessCode: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('access_code')
        .eq('wallet_address', walletAddress)
        .neq('access_code', currentAccessCode)
        .limit(1);

      if (error) {
        console.error('Error checking wallet binding:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('检查钱包绑定失败，可能是wallet_address字段不存在:', error);
      return false;
    }
  }
}

export const userService = new UserService();