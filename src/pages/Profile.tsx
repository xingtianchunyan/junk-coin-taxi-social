import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { User, Phone, Mail, Settings } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useUserProfile } from '@/hooks/useUserProfile';
import RoleSelector from '@/components/RoleSelector';
import { toast } from '@/hooks/use-toast';

const Profile: React.FC = () => {
  const { user, signOut } = useAuth();
  const { profile, loading, updateProfile, refetch } = useUserProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [isUpdating, setIsUpdating] = useState(false);

  React.useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    setIsUpdating(true);
    try {
      await updateProfile({
        display_name: displayName.trim() || null,
        phone: phone.trim() || null,
      });
      
      toast({
        title: '资料更新成功',
        description: '您的个人资料已保存',
      });
      
      setIsEditing(false);
    } catch (error) {
      toast({
        title: '更新失败',
        description: '请重试',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRoleSelected = (roles: string[]) => {
    refetch();
    toast({
      title: '角色更新成功',
      description: `您的角色已设置为: ${roles.join('、')}`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">请先登录</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">个人资料</h1>
          <Button variant="outline" onClick={signOut}>
            退出登录
          </Button>
        </div>

        {/* Basic Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              基本信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">邮箱</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{user.email}</span>
                </div>
              </div>

              <div>
                <Label htmlFor="displayName">显示名称</Label>
                {isEditing ? (
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="输入您的显示名称"
                  />
                ) : (
                  <div className="flex items-center space-x-2 mt-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {profile?.display_name || '未设置'}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="phone">手机号码</Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="输入您的手机号码"
                  />
                ) : (
                  <div className="flex items-center space-x-2 mt-1">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {profile?.phone || '未设置'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setDisplayName(profile?.display_name || '');
                      setPhone(profile?.phone || '');
                    }}
                  >
                    取消
                  </Button>
                  <Button onClick={handleSaveProfile} disabled={isUpdating}>
                    {isUpdating ? '保存中...' : '保存'}
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  编辑资料
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Role Management */}
        <RoleSelector
          currentRoles={profile?.roles || ['passenger']}
          onRoleSelected={handleRoleSelected}
        />
      </div>
    </div>
  );
};

export default Profile;