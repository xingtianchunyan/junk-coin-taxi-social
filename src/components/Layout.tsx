import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Car, Users, UserCheck, Settings, Home } from 'lucide-react';
import { useAccessCode } from '@/components/AccessCodeProvider';
const Layout: React.FC<{
  children: React.ReactNode;
}> = ({
  children
}) => {
  const location = useLocation();
  const {
    hasAccess,
    clearAccessCode
  } = useAccessCode();
  const navigationItems = [{
    path: '/',
    label: '首页',
    icon: Home
  }, {
    path: '/passenger',
    label: '乘客服务',
    icon: Users
  }, {
    path: '/vehicle-sharing',
    label: '无偿供车',
    icon: Car
  }, {
    path: '/vehicle-application',
    label: '车辆申请',
    icon: UserCheck
  }, {
    path: '/work-schedule',
    label: '工作安排',
    icon: Settings
  }, {
    path: '/payment-management',
    label: '支付管理',
    icon: Settings
  }];
  return <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-white">
      {/* 顶部导航栏 */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        
      </nav>

      {/* 页面内容 */}
      <main>{children}</main>
    </div>;
};
export default Layout;