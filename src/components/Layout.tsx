import React from 'react';
import { useAccessCode } from '@/components/AccessCodeProvider';
import { Web3WalletButton } from '@/components/Web3WalletButton';
const Layout: React.FC<{
  children: React.ReactNode;
}> = ({
  children
}) => {
  const {
    hasAccess
  } = useAccessCode();
  return <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-white">
      {/* 顶部导航栏 */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* 左侧 - 可以放logo或标题 */}
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">山寨币社区拼车</h1>
            </div>
            
            {/* 右侧 - Web3钱包按钮 */}
            <div className="flex items-center">
              {hasAccess && <Web3WalletButton />}
            </div>
          </div>
        </div>
      </nav>

      {/* 页面内容 */}
      <main>{children}</main>
    </div>;
};
export default Layout;