import { supabase } from '@/integrations/supabase/client';

// 临时脚本：手动添加wallet_address字段到users表
export const addWalletAddressColumn = async () => {
  try {
    // 检查字段是否已存在
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'users')
      .eq('column_name', 'wallet_address');

    if (columnError) {
      console.error('检查字段失败:', columnError);
      return false;
    }

    if (columns && columns.length > 0) {
      console.log('wallet_address字段已存在');
      return true;
    }

    // 如果字段不存在，尝试添加（需要数据库管理员权限）
    console.log('wallet_address字段不存在，需要在Supabase控制台手动添加');
    console.log('请在Supabase控制台执行以下SQL:');
    console.log('ALTER TABLE public.users ADD COLUMN wallet_address TEXT;');
    console.log('COMMENT ON COLUMN public.users.wallet_address IS \'绑定的Web3钱包地址\';');
    
    return false;
  } catch (error) {
    console.error('数据库操作失败:', error);
    return false;
  }
};

// 检查users表结构
export const checkUsersTableStructure = async () => {
  try {
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'users')
      .order('ordinal_position');

    if (error) {
      console.error('检查表结构失败:', error);
      return;
    }

    console.log('users表结构:');
    console.table(data);
  } catch (error) {
    console.error('检查表结构失败:', error);
  }
};