import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Car, Users, UserCheck, Settings, Home } from 'lucide-react';
import { useAccessCode } from '@/components/AccessCodeProvider';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { hasAccess, clearAccessCode } = useAccessCode();

  const navigationItems = [
    { path: '/', label: '首页', icon: Home },
    { path: '/passenger', label: '乘客服务', icon: Users },
    { path: '/vehicle-sharing', label: '无偿供车', icon: Car },
    { path: '/vehicle-application', label: '车辆申请', icon: UserCheck },
    { path: '/work-schedule', label: '工作安排', icon: Settings },
    { path: '/payment-management', label: '支付管理', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-white">
      {/* 顶部导航栏 */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <Car className="h-6 w-6 text-green-600" />
              <span className="font-bold text-lg text-gray-800">垃圾币打车</span>
            </Link>

            {/* 导航菜单 */}
            <div className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-green-100 text-green-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* 访问码状态 */}
            <div className="flex items-center gap-2">
              {hasAccess ? (
                <Button variant="outline" size="sm" onClick={clearAccessCode}>
                  清除访问码
                </Button>
              ) : (
                <span className="text-sm text-gray-500">游客模式</span>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 页面内容 */}
      <main>{children}</main>
    </div>
  );
};

export default Layout;