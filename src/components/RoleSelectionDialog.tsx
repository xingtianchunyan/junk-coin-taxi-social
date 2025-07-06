import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Car, Users, UserCheck, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'passenger' | 'driver' | 'community_admin';

interface RoleSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accessCode: string;
  onRoleSelected: (role: UserRole) => void;
}

const RoleSelectionDialog: React.FC<RoleSelectionDialogProps> = ({
  open,
  onOpenChange,
  accessCode,
  onRoleSelected
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const roleConfig = {
    passenger: {
      icon: Users,
      title: '乘客',
      description: '需要出行服务，快速约车支付',
      color: 'bg-blue-100 text-blue-700',
    },
    driver: {
      icon: UserCheck,
      title: '司机',
      description: '提供驾驶服务，赚取车费收入',
      color: 'bg-green-100 text-green-700',
    },
    community_admin: {
      icon: Shield,
      title: '社区管理员',
      description: '管理路线和收款地址，维护社区秩序',
      color: 'bg-purple-100 text-purple-700',
    },
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleConfirmRole = async () => {
    if (!selectedRole) {
      toast({
        title: "请选择角色",
        description: "请选择一个角色后继续",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // 更新用户角色
      const { error } = await supabase
        .from('users')
        .update({ role: selectedRole })
        .eq('access_code', accessCode);

      if (error) {
        throw error;
      }

      toast({
        title: "角色设置成功",
        description: `您已成功设置为${roleConfig[selectedRole].title}`,
      });

      onRoleSelected(selectedRole);
      onOpenChange(false);
    } catch (error) {
      console.error('设置角色失败:', error);
      toast({
        title: "设置失败",
        description: "无法设置角色，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>选择您的身份角色</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground text-center">
            每个用户只能选择一个身份角色，选择后下次登录将直接进入对应页面
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(roleConfig).map(([role, config]) => {
              const Icon = config.icon;
              const isSelected = selectedRole === role;
              
              return (
                <Card
                  key={role}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    isSelected 
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                      : 'border-border hover:border-muted-foreground'
                  }`}
                  onClick={() => handleRoleSelect(role as UserRole)}
                >
                  <CardContent className="p-6">
                    <div className="text-center space-y-4">
                      <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${config.color}`}>
                        <Icon className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2">{config.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {config.description}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="mt-3">
                          <span className="inline-block px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                            已选择
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="text-center">
            <Button 
              onClick={handleConfirmRole}
              size="lg"
              disabled={!selectedRole || loading}
              className="px-8"
            >
              {loading ? '设置中...' : '确认角色选择'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoleSelectionDialog;