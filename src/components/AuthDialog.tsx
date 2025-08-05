import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LogIn, UserPlus, Copy, Check, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthenticated: (accessCode: string, role?: string) => void;
  onSuperAdminClick?: () => void;
}
const AuthDialog: React.FC<AuthDialogProps> = ({
  open,
  onOpenChange,
  onAuthenticated,
  onSuperAdminClick
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'confirm'>('login');
  const [accessCode, setAccessCode] = useState('');
  const [newAccessCode, setNewAccessCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const {
    toast
  } = useToast();
  const handleLogin = async () => {
    if (!accessCode.trim()) {
      toast({
        title: "请输入访问码",
        description: "访问码不能为空",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      // 使用验证函数检查访问码是否存在
      const { data: validationResult, error: validationError } = await supabase.rpc('validate_access_code', {
        input_access_code: accessCode.trim()
      });

      if (validationError) {
        throw validationError;
      }

      // 检查是否有返回结果（访问码存在）
      if (validationResult && validationResult.length > 0) {
        const userInfo = validationResult[0];
        
        // 登录成功
        onAuthenticated(accessCode.trim(), userInfo.role);
        onOpenChange(false);
      } else {
        toast({
          title: "访问码不存在",
          description: "请检查访问码是否正确，或选择注册新账户",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('登录失败:', error);
      toast({
        title: "登录失败",
        description: "请检查访问码或稍后重试",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleRegister = async () => {
    setLoading(true);
    try {
      // 生成新的访问码
      const newCode = crypto.randomUUID();

      // 创建新用户
      const {
        data,
        error
      } = await supabase.from('users').insert({
        access_code: newCode,
        role: null
      }).select().single();
      if (error) {
        throw error;
      }
      setNewAccessCode(newCode);
      setMode('confirm');
      toast({
        title: "注册成功",
        description: "请复制并保存您的访问码"
      });
    } catch (error) {
      console.error('注册失败:', error);
      toast({
        title: "注册失败",
        description: "请稍后重试",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(newAccessCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "已复制",
        description: "访问码已复制到剪贴板"
      });
    } catch (error) {
      toast({
        title: "复制失败",
        description: "请手动复制访问码",
        variant: "destructive"
      });
    }
  };
  const handleConfirmSaved = () => {
    onAuthenticated(newAccessCode);
    onOpenChange(false);
  };
  const renderLoginForm = () => <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LogIn className="h-5 w-5" />
          登录
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="access_code">访问码</Label>
          <Input id="access_code" type="text" placeholder="输入您的访问码" value={accessCode} onChange={e => setAccessCode(e.target.value)} className="font-mono" />
        </div>
        <Button onClick={handleLogin} className="w-full" disabled={loading}>
          {loading ? '登录中...' : '登录'}
        </Button>
        <div className="text-center">
          <Button variant="link" onClick={() => setMode('register')}>
            没有账户？点击注册
          </Button>
        </div>
      </CardContent>
    </Card>;
  const renderRegisterForm = () => <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          注册
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          点击注册将为您生成唯一的访问码
        </p>
        <Button onClick={handleRegister} className="w-full" disabled={loading}>
          {loading ? '注册中...' : '生成访问码'}
        </Button>
        <div className="text-center">
          <Button variant="link" onClick={() => setMode('login')}>
            已有账户？点击登录
          </Button>
        </div>
      </CardContent>
    </Card>;
  const renderConfirmForm = () => <ScrollArea className="max-h-[60vh] w-full">
      <Card>
        <CardHeader>
          <CardTitle>保存您的访问码</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 font-medium mb-2">
              ⚠️ 重要：请务必保存您的访问码
            </p>
            <p className="text-xs text-yellow-700">
              访问码是您进入系统的唯一凭证，丢失后无法找回
            </p>
          </div>
          
          <div>
            <Label htmlFor="new_access_code">您的访问码</Label>
            <div className="flex gap-2">
              <Input id="new_access_code" value={newAccessCode} readOnly className="font-mono" />
              <Button size="sm" variant="outline" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Button onClick={handleConfirmSaved} className="w-full">
              我已保存访问码，继续
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              点击继续即表示您已安全保存访问码
            </p>
          </div>
        </CardContent>
      </Card>
    </ScrollArea>;
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onInteractOutside={e => e.preventDefault()}>
        <DialogHeader className="relative">
          <DialogTitle>欢迎使用山寨币社区拼车</DialogTitle>
          {onSuperAdminClick && <Button variant="ghost" size="icon" onClick={onSuperAdminClick} className="absolute right-0 top-0 h-6 w-6 my-0 py-0">
              <Shield className="h-4 w-4" />
            </Button>}
        </DialogHeader>
        
        {mode === 'login' && renderLoginForm()}
        {mode === 'register' && renderRegisterForm()}
        {mode === 'confirm' && renderConfirmForm()}
      </DialogContent>
    </Dialog>;
};
export default AuthDialog;