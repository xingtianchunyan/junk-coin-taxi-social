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
  admin_user_id: string | null;
  name: string;
  address: string;
  contact: string | null;
  is_approved: boolean;
  created_at: string;
  admin_access_code?: string | null;
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
      
      // 查询目的地信息并关联用户访问码
      const { data: destinations, error } = await supabase
        .from('preset_destinations')
        .select(`
          id,
          admin_user_id,
          name,
          address,
          contact,
          is_approved,
          created_at,
          users:admin_user_id (
            access_code
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // 转换数据格式，添加访问码字段
      const requestsWithAccessCode = destinations?.map(dest => ({
        ...dest,
        admin_access_code: dest.users?.access_code || null
      })) || [];

      setAdminRequests(requestsWithAccessCode);
    } catch (error) {
      console.error('加载社区管理员申请失败:', error);
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (destinationId: string, destinationName: string) => {
    try {
      // 更新目的地状态为已批准
      const { error } = await supabase
        .from('preset_destinations')
        .update({ is_approved: true })
        .eq('id', destinationId);

      if (error) {
        throw error;
      }

      toast.success(`已批准目的地"${destinationName}"的申请`);
      
      // 刷新列表
      await loadAdminRequests();
    } catch (error) {
      console.error('审批失败:', error);
      toast.error('审批失败');
    }
  };

  const handleReject = async (destinationId: string, destinationName: string) => {
    try {
      // 删除目的地记录
      const { error } = await supabase
        .from('preset_destinations')
        .delete()
        .eq('id', destinationId);

      if (error) {
        throw error;
      }

      toast.success(`已拒绝目的地"${destinationName}"的申请`);
      
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
              社区目的地管理
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              管理社区目的地申请，审批和查看所有目的地状态
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
                    <TableHead>目的地名称</TableHead>
                    <TableHead>目的地地址</TableHead>
                    <TableHead>社区管理员联系方式</TableHead>
                    <TableHead>管理员访问码</TableHead>
                    <TableHead>申请时间</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-center">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        暂无社区目的地申请
                      </TableCell>
                    </TableRow>
                  ) : (
                    adminRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.name}</TableCell>
                        <TableCell>{request.address}</TableCell>
                        <TableCell>{request.contact || '未设置'}</TableCell>
                        <TableCell>
                          {request.admin_access_code ? (
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                              {request.admin_access_code}
                            </code>
                          ) : (
                            <span className="text-gray-400">未关联</span>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(request.created_at)}</TableCell>
                        <TableCell>
                          <Badge variant={request.is_approved ? "default" : "secondary"}>
                            {request.is_approved ? "已批准" : "待审批"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            {!request.is_approved && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => handleApprove(request.id, request.name)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleReject(request.id, request.name)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {request.is_approved && (
                              <span className="text-sm text-muted-foreground">已批准</span>
                            )}
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