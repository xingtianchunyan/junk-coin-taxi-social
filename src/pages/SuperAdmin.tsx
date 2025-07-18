import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Shield, Check, X, Wallet, LogOut } from 'lucide-react';
import { SuperAdminWalletAuth } from '@/components/SuperAdminWalletAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface CommunityAdminRequest {
  id: string;
  access_code: string;
  destination_id: string | null;
  created_at: string;
  contact: string | null;
  destination_name?: string;
}

const SuperAdmin: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [adminRequests, setAdminRequests] = useState<CommunityAdminRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminRequests();
    }
  }, [isAuthenticated]);

  const handleAuthenticated = (address: string, signature: string) => {
    setIsAuthenticated(true);
    setWalletAddress(address);
    // 存储认证信息到本地
    localStorage.setItem('super_admin_wallet', address);
    localStorage.setItem('super_admin_signature', signature);
  };

  const loadAdminRequests = async () => {
    try {
      setLoading(true);
      
      // 查询待审批的社区管理员申请
      const { data: users, error } = await supabase
        .from('users')
        .select(`
          id,
          access_code,
          destination_id,
          created_at,
          contact,
          preset_destinations (
            name
          )
        `)
        .eq('role', 'community_admin')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const formattedRequests = users?.map(user => ({
        id: user.id,
        access_code: user.access_code,
        destination_id: user.destination_id,
        created_at: user.created_at,
        contact: user.contact,
        destination_name: user.preset_destinations?.name || '未设置'
      })) || [];

      setAdminRequests(formattedRequests);
    } catch (error) {
      console.error('加载社区管理员申请失败:', error);
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string, accessCode: string) => {
    try {
      // 这里可以添加审批逻辑，比如更新用户状态
      // 目前暂时只显示成功消息
      toast.success(`已批准访问码 ${accessCode.slice(0, 8)}... 的社区管理员申请`);
      
      // 刷新列表
      await loadAdminRequests();
    } catch (error) {
      console.error('审批失败:', error);
      toast.error('审批失败');
    }
  };

  const handleReject = async (userId: string, accessCode: string) => {
    try {
      // 删除用户记录
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        throw error;
      }

      toast.success(`已拒绝访问码 ${accessCode.slice(0, 8)}... 的社区管理员申请`);
      
      // 刷新列表
      await loadAdminRequests();
    } catch (error) {
      console.error('拒绝申请失败:', error);
      toast.error('操作失败');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('super_admin_wallet');
    localStorage.removeItem('super_admin_signature');
    setIsAuthenticated(false);
    setWalletAddress(null);
    navigate('/');
  };

  const formatAccessCode = (code: string) => {
    return `${code.slice(0, 8)}...${code.slice(-4)}`;
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  if (!isAuthenticated) {
    return <SuperAdminWalletAuth onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-white">
      {/* 导航栏 */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-800">超级管理员控制台</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Wallet className="h-4 w-4" />
              {walletAddress && formatAddress(walletAddress)}
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              退出
            </Button>
          </div>
        </div>
      </nav>

      {/* 主体内容 */}
      <div className="container mx-auto px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              社区管理员访问码审批
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              审批社区管理员的访问码申请，管理社区管理员权限
            </p>
          </CardHeader>
          
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">加载中...</div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>访问码</TableHead>
                    <TableHead>创建目的地</TableHead>
                    <TableHead>社区管理员联系方式</TableHead>
                    <TableHead>访问码创建时间</TableHead>
                    <TableHead className="text-center">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        暂无待审批的社区管理员申请
                      </TableCell>
                    </TableRow>
                  ) : (
                    adminRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {formatAccessCode(request.access_code)}
                          </Badge>
                        </TableCell>
                        <TableCell>{request.destination_name}</TableCell>
                        <TableCell>{request.contact || '未设置'}</TableCell>
                        <TableCell>{formatDate(request.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleApprove(request.id, request.access_code)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleReject(request.id, request.access_code)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
            
            <div className="mt-6 flex justify-end">
              <Button onClick={loadAdminRequests} variant="outline">
                刷新列表
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdmin;