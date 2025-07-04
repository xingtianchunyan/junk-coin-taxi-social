import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Car, Users, UserCheck } from 'lucide-react';
import { useAccessCode } from '@/components/AccessCodeProvider';
import { toast } from '@/hooks/use-toast';

type UserRole = 'passenger' | 'driver' | 'owner';

const RoleSelection: React.FC = () => {
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
  const { setAccessCode } = useAccessCode();
  const navigate = useNavigate();

  const roleConfig = {
    passenger: {
      icon: Users,
      title: '乘客',
      description: '需要出行服务，快速约车支付',
      color: 'bg-blue-100 text-blue-700',
      exclusive: true,
    },
    driver: {
      icon: UserCheck,
      title: '司机',
      description: '提供驾驶服务，赚取车费收入',
      color: 'bg-green-100 text-green-700',
      exclusive: false,
    },
    owner: {
      icon: Car,
      title: '车主',
      description: '分享车辆给司机，查看使用记录',
      color: 'bg-purple-100 text-purple-700',
      exclusive: false,
    },
  };

  const toggleRole = (role: UserRole) => {
    setSelectedRoles(prev => {
      if (role === 'passenger') {
        // 乘客身份是唯一的
        return prev.includes(role) ? [] : [role];
      } else {
        // 司机和车主可以同时选择
        if (prev.includes(role)) {
          return prev.filter(r => r !== role);
        } else {
          // 如果选择司机或车主，移除乘客身份
          return [...prev.filter(r => r !== 'passenger'), role];
        }
      }
    });
  };

  const generateAccessCode = (): string => {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  };

  const handleConfirmRoles = () => {
    if (selectedRoles.length === 0) {
      toast({
        title: '请选择角色',
        description: '请至少选择一个角色',
        variant: 'destructive',
      });
      return;
    }

    // 生成访问码
    const accessCode = generateAccessCode();
    setAccessCode(accessCode);

    // 显示访问码
    toast({
      title: '角色选择成功',
      description: `您的访问码是: ${accessCode}，请妥善保管`,
      duration: 10000,
    });

    // 根据角色选择导航
    if (selectedRoles.includes('passenger')) {
      navigate('/passenger');
    } else if (selectedRoles.includes('owner')) {
      // 如果同时选择司机和车主，优先进入车主页面
      navigate('/vehicle-sharing');
    } else if (selectedRoles.includes('driver')) {
      // 只选择司机时，显示导航弹窗（这里简化为直接进入车辆申请页面）
      navigate('/vehicle-application');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Car className="h-8 w-8 text-green-600" />
            <CardTitle className="text-3xl font-bold text-gray-800">垃圾币打车</CardTitle>
          </div>
          <p className="text-gray-600 text-lg">请选择您的身份角色</p>
          <p className="text-sm text-muted-foreground">
            乘客身份是唯一的，司机和车主身份可以同时选择
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(roleConfig).map(([role, config]) => {
              const Icon = config.icon;
              const isSelected = selectedRoles.includes(role as UserRole);
              
              return (
                <div
                  key={role}
                  className={`p-6 border-2 rounded-lg cursor-pointer transition-all hover:shadow-lg ${
                    isSelected 
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                      : 'border-border hover:border-muted-foreground'
                  }`}
                  onClick={() => toggleRole(role as UserRole)}
                >
                  <div className="text-center space-y-4">
                    <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${config.color}`}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{config.title}</h3>
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
                </div>
              );
            })}
          </div>

          {selectedRoles.length > 0 && (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                已选择角色: {selectedRoles.map(role => roleConfig[role].title).join('、')}
              </p>
              <Button 
                onClick={handleConfirmRoles}
                size="lg"
                className="px-8 py-3 text-lg"
              >
                确认角色选择
              </Button>
            </div>
          )}

          <div className="text-center text-sm text-muted-foreground">
            <p>选择角色后将为您生成唯一的访问码</p>
            <p>凭借访问码可以在网站内编辑和查看您的数据</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleSelection;