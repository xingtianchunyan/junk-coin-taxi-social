import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Car, Users, UserCheck, Settings, Home } from 'lucide-react';
import { useAccessCode } from '@/components/AccessCodeProvider';
import Web3Wallet from '@/components/Web3Wallet';
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* 左侧 - Logo/品牌 */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <Car className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">垃圾币打车</span>
              </Link>
            </div>

            {/* 中间 - 导航菜单 */}
            {/* <div className="hidden md:flex items-center space-x-8">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div> */}

            {/* 右侧 - Web3钱包连接 */}
            <div className="flex items-center space-x-4">
              <Web3Wallet />
            </div>
          </div>
        </div>
      </nav>

      {/* 页面内容 */}
      <main>{children}</main>
    </div>;
};
export default Layout;