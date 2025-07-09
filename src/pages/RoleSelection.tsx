import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Car } from 'lucide-react';
import { useAccessCode } from '@/components/AccessCodeProvider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AuthDialog from '@/components/AuthDialog';
import RoleSelectionDialog from '@/components/RoleSelectionDialog';

type UserRole = 'passenger' | 'driver' | 'community_admin';

const RoleSelection: React.FC = () => {
  const [showAuthDialog, setShowAuthDialog] = useState(true);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [currentAccessCode, setCurrentAccessCode] = useState('');
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const { setAccessCode } = useAccessCode();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // 检查是否有存储的访问码
    const storedAccessCode = localStorage.getItem('access_code');
    if (storedAccessCode) {
      handleExistingAccessCode(storedAccessCode);
    }
  }, []);

  const handleExistingAccessCode = async (accessCode: string) => {
    try {
      // 检查访问码对应的用户信息
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('access_code', accessCode)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (user) {
        setCurrentAccessCode(accessCode);
        setAccessCode(accessCode);
        
        if (user.role) {
          // 用户已有角色，直接跳转
          setUserRole(user.role as UserRole);
          navigateToRolePage(user.role as UserRole);
          setShowAuthDialog(false);
        } else {
          // 用户没有角色，显示角色选择
          setShowAuthDialog(false);
          setShowRoleDialog(true);
        }
      } else {
        // 访问码无效，清除本地存储
        localStorage.removeItem('access_code');
        setShowAuthDialog(true);
      }
    } catch (error) {
      console.error('检查访问码失败:', error);
      localStorage.removeItem('access_code');
      setShowAuthDialog(true);
    }
  };

  const handleAuthenticated = async (accessCode: string, role?: string) => {
    setCurrentAccessCode(accessCode);
    setAccessCode(accessCode);
    localStorage.setItem('access_code', accessCode);

    if (role) {
      // 用户已有角色，直接跳转
      setUserRole(role as UserRole);
      navigateToRolePage(role as UserRole);
    } else {
      // 新用户需要选择角色
      setShowRoleDialog(true);
    }
  };

  const handleRoleSelected = (role: UserRole) => {
    setUserRole(role);
    navigateToRolePage(role);
  };

  const navigateToRolePage = (role: UserRole) => {
    setTimeout(() => {
      switch (role) {
        case 'passenger':
          navigate('/passenger');
          break;
        case 'driver':
          navigate('/work-schedule');
          break;
        case 'community_admin':
          navigate('/community-management');
          break;
        default:
          navigate('/passenger');
      }
    }, 1000);
  };

  if (!showAuthDialog && !showRoleDialog) {
    // 显示跳转中的界面
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Car className="h-12 w-12 text-green-600 mb-4 animate-spin" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {userRole === 'passenger' && '进入乘客服务'}
              {userRole === 'driver' && '进入工作安排'}
              {userRole === 'community_admin' && '进入社区管理'}
            </h2>
            <p className="text-gray-600 text-center">
              正在为您跳转到对应页面...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Car className="h-8 w-8 text-green-600" />
            <CardTitle className="text-3xl font-bold text-gray-800">垃圾币打车</CardTitle>
          </div>
          <p className="text-gray-600 text-lg">用加密货币支付的便民用车服务</p>
        </CardHeader>

        <CardContent className="text-center py-12">
          <p className="text-gray-600 mb-4">
            欢迎使用我们的服务，请先登录或注册
          </p>
        </CardContent>
      </Card>

      {/* 认证对话框 */}
      <AuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        onAuthenticated={handleAuthenticated}
      />

      {/* 角色选择对话框 */}
      <RoleSelectionDialog
        open={showRoleDialog}
        onOpenChange={setShowRoleDialog}
        accessCode={currentAccessCode}
        onRoleSelected={handleRoleSelected}
      />
    </div>
  );
};

export default RoleSelection;