import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { checkUsersTableStructure, addWalletAddressColumn } from '@/utils/dbUpdate';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const DbTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [tableStructure, setTableStructure] = useState<any[]>([]);

  const handleCheckStructure = async () => {
    setLoading(true);
    try {
      await checkUsersTableStructure();
      
      // 获取表结构数据
      const { data, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'users')
        .order('ordinal_position');

      if (error) {
        toast.error('检查表结构失败');
        console.error(error);
      } else {
        setTableStructure(data || []);
        toast.success('表结构检查完成');
      }
    } catch (error) {
      toast.error('操作失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddColumn = async () => {
    setLoading(true);
    try {
      const result = await addWalletAddressColumn();
      if (result) {
        toast.success('字段已存在或添加成功');
      } else {
        toast.warning('需要手动在Supabase控制台添加字段');
      }
    } catch (error) {
      toast.error('操作失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualAddColumn = async () => {
    setLoading(true);
    try {
      // 尝试直接执行SQL（可能需要RLS权限）
      const { error } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE public.users ADD COLUMN IF NOT EXISTS wallet_address TEXT;'
      });

      if (error) {
        console.error('SQL执行失败:', error);
        toast.error('需要在Supabase控制台手动执行SQL');
        
        // 显示需要执行的SQL
        const sqlCommands = [
          'ALTER TABLE public.users ADD COLUMN IF NOT EXISTS wallet_address TEXT;',
          "COMMENT ON COLUMN public.users.wallet_address IS '绑定的Web3钱包地址';"
        ];
        
        console.log('请在Supabase控制台的SQL编辑器中执行以下命令:');
        sqlCommands.forEach((sql, index) => {
          console.log(`${index + 1}. ${sql}`);
        });
      } else {
        toast.success('字段添加成功');
      }
    } catch (error) {
      toast.error('操作失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>数据库测试工具</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={handleCheckStructure} 
              disabled={loading}
              variant="outline"
            >
              检查users表结构
            </Button>
            
            <Button 
              onClick={handleAddColumn} 
              disabled={loading}
              variant="outline"
            >
              检查wallet_address字段
            </Button>
            
            <Button 
              onClick={handleManualAddColumn} 
              disabled={loading}
              variant="default"
            >
              尝试添加字段
            </Button>
          </div>
          
          {tableStructure.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">users表结构:</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left">字段名</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">数据类型</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">允许NULL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableStructure.map((column, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 px-4 py-2">{column.column_name}</td>
                        <td className="border border-gray-300 px-4 py-2">{column.data_type}</td>
                        <td className="border border-gray-300 px-4 py-2">{column.is_nullable}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">手动添加字段说明:</h4>
            <p className="text-blue-800 text-sm mb-2">
              如果自动添加失败，请在Supabase控制台的SQL编辑器中执行以下命令:
            </p>
            <div className="bg-gray-800 text-green-400 p-3 rounded font-mono text-sm">
              <div>ALTER TABLE public.users ADD COLUMN IF NOT EXISTS wallet_address TEXT;</div>
              <div>COMMENT ON COLUMN public.users.wallet_address IS '绑定的Web3钱包地址';</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DbTest;