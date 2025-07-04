import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Car, Users, UserCheck, Crown } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

type UserRole = 'passenger' | 'driver' | 'owner' | 'admin';

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
  owner: {
    icon: Car,
    title: '车主',
    description: '分享车辆给司机，查看使用记录',
    color: 'bg-purple-100 text-purple-700',
  },
  admin: {
    icon: Crown,
    title: '管理员',
    description: '管理平台，查看所有数据',
    color: 'bg-red-100 text-red-700',
  },
};

const RoleSelector: React.FC<RoleSelectorProps> = ({ onRoleSelected, currentRoles = [] }) => {
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(currentRoles);
  const [isUpdating, setIsUpdating] = useState(false);
  const { user } = useAuth();

  const toggleRole = (role: UserRole) => {
    if (role === 'admin') return; // Admin role cannot be self-assigned
    
    setSelectedRoles(prev => {
      const newRoles = prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role];
      
      // Ensure passenger is always included if no other roles
      if (newRoles.length === 0) {
        return ['passenger'];
      }
      
      return newRoles;
    });
  };

  const handleSaveRoles = async () => {
    if (!user) return;
    
    setIsUpdating(true);
    try {
      // Create or update user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          roles: selectedRoles,
          updated_at: new Date().toISOString(),
        });

      if (profileError) throw profileError;

      // Create driver record if driver role is selected
      if (selectedRoles.includes('driver')) {
        const { error: driverError } = await supabase
          .from('drivers')
          .upsert({
            user_id: user.id,
            is_active: true,
            updated_at: new Date().toISOString(),
          });

        if (driverError && !driverError.message.includes('duplicate')) {
          throw driverError;
        }
      }

      toast({
        title: '角色设置成功',
        description: '您的角色已更新',
      });

      onRoleSelected(selectedRoles);
    } catch (error) {
      console.error('更新角色失败:', error);
      toast({
        title: '更新失败',
        description: '请重试',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">选择您的角色</CardTitle>
        <p className="text-sm text-muted-foreground text-center">
          您可以选择多个角色，随时切换使用不同功能
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(roleConfig).map(([role, config]) => {
            const Icon = config.icon;
            const isSelected = selectedRoles.includes(role as UserRole);
            const isAdmin = role === 'admin';
            
            return (
              <div
                key={role}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-muted-foreground'
                } ${isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => !isAdmin && toggleRole(role as UserRole)}
              >
                <div className="flex items-start space-x-3">
                  <Icon className="h-6 w-6 mt-1 text-primary" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">{config.title}</h3>
                      {isSelected && (
                        <Badge variant="secondary" className="text-xs">
                          已选择
                        </Badge>
                      )}
                      {isAdmin && (
                        <Badge variant="outline" className="text-xs">
                          仅管理员
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {config.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-center pt-4">
          <Button 
            onClick={handleSaveRoles}
            disabled={isUpdating || selectedRoles.length === 0}
            className="w-full max-w-xs"
          >
            {isUpdating ? '保存中...' : '保存角色设置'}
          </Button>
        </div>

        {selectedRoles.length > 0 && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              已选择角色: {selectedRoles.map(role => roleConfig[role].title).join('、')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RoleSelector;