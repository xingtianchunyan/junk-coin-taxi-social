import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Car, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { user, signIn, signUp } = useAuth();
  const { toast } = useToast();

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/" replace />;
  }

  const validateInput = () => {
    // Sanitize inputs
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedPassword = password.trim();
    
    if (!sanitizedEmail || !sanitizedPassword) {
      setError('请填写所有必填字段');
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      setError('请输入有效的邮箱地址');
      return false;
    }

    if (sanitizedPassword.length < 6) {
      setError('密码至少需要6个字符');
      return false;
    }

    if (isSignUp && sanitizedPassword !== confirmPassword.trim()) {
      setError('密码确认不匹配');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateInput()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const sanitizedEmail = email.trim().toLowerCase();
      const sanitizedPassword = password.trim();
      
      if (isSignUp) {
        const { error } = await signUp(sanitizedEmail, sanitizedPassword);
        if (error) {
          if (error.message?.includes('already registered')) {
            setError('该邮箱已经注册，请直接登录');
          } else {
            setError(error.message || '注册失败，请重试');
          }
        } else {
          toast({
            title: "注册成功",
            description: "请检查您的邮箱以验证账户",
          });
          setIsSignUp(false);
          setPassword('');
          setConfirmPassword('');
        }
      } else {
        const { error } = await signIn(sanitizedEmail, sanitizedPassword);
        if (error) {
          if (error.message?.includes('Invalid login credentials')) {
            setError('邮箱或密码错误');
          } else {
            setError(error.message || '登录失败，请重试');
          }
        }
      }
    } catch (error) {
      setError('网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Car className="h-8 w-8 text-green-600" />
            <CardTitle className="text-2xl font-bold text-gray-800">垃圾币打车</CardTitle>
          </div>
          <p className="text-gray-600">
            {isSignUp ? '创建新账户' : '登录您的账户'}
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="输入您的邮箱"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入密码"
                  required
                  disabled={isLoading}
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">确认密码</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入密码"
                  required
                  disabled={isLoading}
                  minLength={6}
                />
              </div>
            )}
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? '处理中...' : isSignUp ? (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  注册
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  登录
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setPassword('');
                setConfirmPassword('');
              }}
              disabled={isLoading}
            >
              {isSignUp ? '已有账户？点击登录' : '没有账户？点击注册'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;