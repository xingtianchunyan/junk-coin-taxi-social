
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Key, Eye, EyeOff, Shield, LogIn, User } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useUserProfile } from '@/hooks/useUserProfile';
import { sanitizeTextInput } from '@/utils/inputValidation';

interface AccessControlProps {
  onAccessChange: (level: 'public' | 'private' | 'admin', accessCode?: string) => void;
  currentLevel: 'public' | 'private' | 'admin';
}

const AccessControl: React.FC<AccessControlProps> = ({ onAccessChange, currentLevel }) => {
  const [accessCode, setAccessCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [showPrivateAccess, setShowPrivateAccess] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const { profile } = useUserProfile();

  useEffect(() => {
    // Update access level based on authentication
    if (user && isAdmin) {
      onAccessChange('admin');
    } else if (user) {
      onAccessChange('private');
    } else {
      // Check for saved access code only if not authenticated
      const savedAccessCode = localStorage.getItem('rideAccessCode');
      if (savedAccessCode && currentLevel === 'public') {
        setAccessCode(savedAccessCode);
        handlePrivateAccess(savedAccessCode);
      }
    }
  }, [user, isAdmin]);

  const handlePrivateAccess = async (code: string) => {
    const sanitizedCode = sanitizeTextInput(code, 50);
    if (!sanitizedCode.trim()) return;
    
    setIsValidating(true);
    try {
      // Validate access code format (UUID v4)
      const isValid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sanitizedCode);
      
      if (isValid) {
        localStorage.setItem('rideAccessCode', sanitizedCode);
        onAccessChange('private', sanitizedCode);
      } else {
        alert('无效的访问码格式');
      }
    } catch (error) {
      console.error('验证访问码失败:', error);
      alert('验证失败，请重试');
    } finally {
      setIsValidating(false);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('rideAccessCode');
    if (user) {
      await signOut();
    }
    setAccessCode('');
    onAccessChange('public');
  };

  const getAccessLevelInfo = () => {
    switch (currentLevel) {
      case 'public':
        return {
          icon: <Eye className="h-4 w-4" />,
          label: '公开访问',
          description: '只能查看用车时间信息',
          color: 'bg-blue-100 text-blue-700'
        };
      case 'private':
        return {
          icon: <Key className="h-4 w-4" />,
          label: '私密访问',
          description: '可以查看完整需求信息',
          color: 'bg-green-100 text-green-700'
        };
      case 'admin':
        return {
          icon: <Shield className="h-4 w-4" />,
          label: '管理员',
          description: '可以管理所有需求',
          color: 'bg-purple-100 text-purple-700'
        };
    }
  };

  const accessInfo = getAccessLevelInfo();

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          访问控制
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className={accessInfo.color}>
              {accessInfo.icon}
              <span className="ml-1">{accessInfo.label}</span>
            </Badge>
            <span className="text-sm text-gray-600">{accessInfo.description}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {user && (
              <Button asChild variant="outline" size="sm">
                <Link to="/profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {profile?.role || '个人资料'}
                </Link>
              </Button>
            )}
            
            {currentLevel !== 'public' && (
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <EyeOff className="h-4 w-4 mr-1" />
                退出
              </Button>
            )}
          </div>
        </div>

        {currentLevel === 'public' && !user && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to="/auth" className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  登录/注册
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPrivateAccess(!showPrivateAccess)}
              >
                {showPrivateAccess ? '隐藏' : '输入访问码'}
              </Button>
            </div>
            
            {showPrivateAccess && (
              <div className="space-y-2">
                <Label htmlFor="accessCode">访问码</Label>
                <div className="flex gap-2">
                  <Input
                    id="accessCode"
                    type="password"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    placeholder="输入您的访问码"
                    onKeyPress={(e) => e.key === 'Enter' && handlePrivateAccess(accessCode)}
                  />
                  <Button
                    onClick={() => handlePrivateAccess(accessCode)}
                    disabled={isValidating || !accessCode.trim()}
                  >
                    {isValidating ? '验证中...' : '访问'}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  输入正确的访问码可以查看完整的用车需求信息
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AccessControl;
