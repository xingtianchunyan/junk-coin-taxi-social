import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, Crown } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

type UserRole = 'passenger' | 'driver' | 'community_admin';

interface RoleSelectorProps {
  onRoleSelected: (roles: UserRole[]) => void;
  currentRoles?: UserRole[];
}

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
    icon: Crown,
    title: '社区管理员',
    description: '管理社区目的地，车辆和路线',
    color: 'bg-red-100 text-red-700',
  },
};

const RoleSelector: React.FC<RoleSelectorProps> = ({ onRoleSelected, currentRoles = [] }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { user } = useAuth();

  const selectRole = (role: UserRole) => {
    if (role === 'community_admin') {
      toast({
        title: "角色限制",
        description: "管理员角色需要特殊权限，请联系系统管理员",
        variant: "destructive"
      });
      return;
    }
    setSelectedRole(role);
  };

  const handleSaveRole = async () => {
    if (!selectedRole || !user) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: selectedRole })
        .eq('id', user.id);

      if (error) throw error;

      onRoleSelected([selectedRole]);
      toast({
        title: "角色更新成功",
        description: `您的角色已更新为 ${roleConfig[selectedRole].title}`,
      });
    } catch (error) {
      console.error('更新角色失败:', error);
      toast({
        title: "更新失败",
        description: "角色更新失败，请重试",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">选择您的角色</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Object.entries(roleConfig) as [UserRole, typeof roleConfig[UserRole]][]).map(([role, config]) => {
            const Icon = config.icon;
            const isSelected = selectedRole === role;
            
            return (
              <div
                key={role}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-primary bg-primary/10' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => selectRole(role)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${config.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{config.title}</h3>
                    <p className="text-sm text-gray-600">{config.description}</p>
                  </div>
                  {isSelected && (
                    <Badge variant="default">已选择</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {selectedRole && (
          <div className="text-center space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                您选择了 <span className="font-semibold">{roleConfig[selectedRole].title}</span> 角色
              </p>
            </div>
            <Button 
              onClick={handleSaveRole}
              disabled={isUpdating}
              className="px-8"
            >
              {isUpdating ? '保存中...' : '确认并保存'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RoleSelector;