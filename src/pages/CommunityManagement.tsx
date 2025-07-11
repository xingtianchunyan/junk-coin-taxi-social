import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Wallet, Plus, Trash2, Route, Car, LogOut, Building2, Phone, CreditCard, Copy, Check, RotateCcw, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAccessCode } from '@/components/AccessCodeProvider';
import { useToast } from '@/hooks/use-toast';
import { rideRequestService } from '@/services/rideRequestService';
import { FixedRoute, WalletAddress, PresetDestination } from '@/types/RideRequest';
import { Vehicle } from '@/types/Vehicle';
import { supabase } from '@/integrations/supabase/client';
import BadgeSendDialog from '@/components/BadgeSendDialog';
import { ADMIN_WALLET_ADDRESS } from '@/config/badge-contract';

// 支付方式选项
const PAY_WAY_OPTIONS = [
  { value: 1, label: '区块链支付' },
  { value: 2, label: '交易所转账' },
  { value: 3, label: '支付宝或微信' },
  { value: 4, label: '现金支付' },
  { value: 5, label: '免费' }
];

// 区块链网络选项
const CHAIN_OPTIONS = [
  { value: 1, label: 'BITCOIN' },
  { value: 2, label: 'EVM-Compatible' },
  { value: 3, label: 'SOLANA' },
  { value: 4, label: 'TRON' },
  { value: 5, label: 'TON' },
  { value: 6, label: 'SUI' }
];

// 交易所选项
const EXCHANGE_OPTIONS = [
  { value: 1, label: 'BINANCE' },
  { value: 2, label: 'OKX' },
  { value: 3, label: 'coinbase' },
  { value: 4, label: 'Bitget' },
  { value: 5, label: 'Gate' },
  { value: 6, label: 'Bybit' },
  { value: 7, label: 'KuCoin' },
  { value: 8, label: '火币' }
];

// 根据区块链网络显示可用币种
const getAvailableCryptocurrencies = (chainId: number): string[] => {
  switch (chainId) {
    case 1: // BITCOIN
      return ['BTC'];
    case 2: // EVM-Compatible
      return ['ETH', 'USDT', 'USDC', 'BNB', 'MATIC'];
    case 3: // SOLANA
      return ['SOL', 'USDT', 'USDC'];
    case 4: // TRON
      return ['TRX', 'USDT'];
    case 5: // TON
      return ['TON'];
    case 6: // SUI
      return ['SUI'];
    default:
      return [];
  }
};

const CommunityManagement: React.FC = () => {
  const [destination, setDestination] = useState<PresetDestination | null>(null);
  const [routes, setRoutes] = useState<FixedRoute[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [walletAddresses, setWalletAddresses] = useState<WalletAddress[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 创建目的地相关状态
  const [showCreateDestinationDialog, setShowCreateDestinationDialog] = useState(false);
  const [newDestination, setNewDestination] = useState({
    name: '',
    address: '',
    description: ''
  });

  // 添加资源相关状态
  const [showAddRouteDialog, setShowAddRouteDialog] = useState(false);
  const [showAddVehicleDialog, setShowAddVehicleDialog] = useState(false);
  const [showAddPaymentDialog, setShowAddPaymentDialog] = useState(false);

  const [newRoute, setNewRoute] = useState({
    start_location: '',
    distance_km: '',
    estimated_duration_minutes: '',
    market_price: ''
  });

  const [newVehicle, setNewVehicle] = useState({
    driver_name: '',
    driver_phone: '',
    license_plate: '',
    max_passengers: 4,
    trunk_length_cm: 100,
    trunk_width_cm: 80,
    trunk_height_cm: 50,
    discount_percentage: 50 // 愿意的折扣，默认50%
  });

  // 支付管理新增状态 - 多选模式
  const [selectedRouteIds, setSelectedRouteIds] = useState<string[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedChainIds, setSelectedChainIds] = useState<number[]>([]);
  const [selectedExchangeIds, setSelectedExchangeIds] = useState<number[]>([]);
  const [blockchainAddresses, setBlockchainAddresses] = useState<Record<number, string>>({});
  const [exchangeAddresses, setExchangeAddresses] = useState<Record<number, string>>({});
  const [newPayment, setNewPayment] = useState({
    pay_way: 1,
    symbol: ''
  });

  // 复制访问码相关状态
  const [copiedAccessCode, setCopiedAccessCode] = useState<string | null>(null);

  // 一键返程相关状态
  const [isCreatingReturnRoutes, setIsCreatingReturnRoutes] = useState(false);
  const [showReturnButton, setShowReturnButton] = useState(true);

  // 路线多选删除相关状态
  const [selectedRouteIdsForDelete, setSelectedRouteIdsForDelete] = useState<string[]>([]);
  
  // 支付方式多选删除相关状态
  const [selectedPaymentIdsForDelete, setSelectedPaymentIdsForDelete] = useState<string[]>([]);

  // 徽章发送相关状态
  const [showBadgeDialog, setShowBadgeDialog] = useState(false);
  const [selectedDriverAddress, setSelectedDriverAddress] = useState<string>('');
  const [currentUserWalletAddress, setCurrentUserWalletAddress] = useState<string>('');

  const { toast } = useToast();
  const { accessCode, clearAccessCode } = useAccessCode();
  const navigate = useNavigate();

  useEffect(() => {
    if (accessCode) {
      loadCommunityData();
      loadCurrentUserWallet();
    }
  }, [accessCode]);

  // 加载当前用户的钱包地址
  const loadCurrentUserWallet = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setCurrentUserWalletAddress(accounts[0]);
        }
      }
    } catch (error) {
      console.error('获取钱包地址失败:', error);
    }
  };

  const loadCommunityData = async () => {
    if (!accessCode) return;
    
    setLoading(true);
    try {
      // 获取社区管理员管理的目的地
      const communityDestination = await rideRequestService.getCommunityDestination(accessCode);
      setDestination(communityDestination);

      if (communityDestination) {
        // 加载该目的地下的所有资源
        const [routeData, vehicleData, walletData] = await Promise.all([
          rideRequestService.getDestinationRoutes(communityDestination.id),
          rideRequestService.getDestinationVehicles(communityDestination.id),
          rideRequestService.getDestinationWallets(communityDestination.id)
        ]);

        setRoutes(routeData);
        setVehicles(vehicleData);
        setWalletAddresses(walletData);

        // 检查是否需要显示一键返程按钮
        await checkReturnButtonVisibility(communityDestination.id, routeData);
      }
    } catch (error) {
      console.error('加载社区数据失败:', error);
      toast({
        title: "加载失败",
        description: "无法加载社区数据",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDestination = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode) return;

    try {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('access_code', accessCode)
        .single();

      if (!user) throw new Error('用户不存在');

      const destinationData = {
        ...newDestination,
        admin_user_id: user.id
      };

      const newDest = await rideRequestService.createPresetDestination(destinationData);
      setDestination(newDest);
      setShowCreateDestinationDialog(false);
      setNewDestination({ name: '', address: '', description: '' });
      
      toast({
        title: "目的地已创建",
        description: "您的社区目的地已成功创建",
      });
    } catch (error) {
      console.error('创建目的地失败:', error);
      toast({
        title: "创建失败",
        description: "无法创建目的地，请检查输入信息",
        variant: "destructive",
      });
    }
  };

  const handleAddRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination) return;

    try {
      // 自动生成路线名称
      const routeName = `${newRoute.start_location}到${destination.name}`;
      
      const routeData = {
        name: routeName,
        start_location: newRoute.start_location,
        end_location: destination.address,
        distance_km: parseFloat(newRoute.distance_km) || undefined,
        estimated_duration_minutes: parseInt(newRoute.estimated_duration_minutes) || undefined,
        market_price: parseFloat(newRoute.market_price) || undefined,
        our_price: parseFloat(newRoute.market_price) || 0, // 默认设置为市场价，后续由车辆管理调整
        currency: 'CNY'
      };

      await rideRequestService.createDestinationRoute(routeData, destination.id);
      
      toast({
        title: "路线已添加",
        description: "新的路线已成功添加到您的目的地",
      });
      
      setNewRoute({ 
        start_location: '', 
        distance_km: '',
        estimated_duration_minutes: '',
        market_price: ''
      });
      setShowAddRouteDialog(false);
      loadCommunityData();
    } catch (error) {
      console.error('添加路线失败:', error);
      toast({
        title: "添加失败",
        description: "无法添加路线，请检查输入信息",
        variant: "destructive",
      });
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination) return;

    try {
      await rideRequestService.createDestinationVehicle(newVehicle, destination.id);
      
      toast({
        title: "车辆已添加",
        description: "新的车辆已成功添加到您的目的地",
      });
      
      setNewVehicle({
        driver_name: '',
        driver_phone: '',
        license_plate: '',
        max_passengers: 4,
        trunk_length_cm: 100,
        trunk_width_cm: 80,
        trunk_height_cm: 50,
        discount_percentage: 50
      });
      setShowAddVehicleDialog(false);
      loadCommunityData();
    } catch (error) {
      console.error('添加车辆失败:', error);
      toast({
        title: "添加失败",
        description: "无法添加车辆，请检查输入信息",
        variant: "destructive",
      });
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination || selectedRouteIds.length === 0 || !selectedVehicleId) {
      toast({
        title: "请选择路线和车辆",
        description: "添加支付方式前需要先选择路线和车辆",
        variant: "destructive",
      });
      return;
    }

    try {
      const createdWallets = [];

      // 区块链支付
      if (newPayment.pay_way === 1 && selectedChainIds.length > 0) {
        for (const chainId of selectedChainIds) {
          const address = blockchainAddresses[chainId];
          if (!address) continue;

          for (const routeId of selectedRouteIds) {
            const walletData = {
              pay_way: newPayment.pay_way,
              chain_name: chainId,
              exchange_name: 1, // 默认值
              symbol: newPayment.symbol,
              address: address,
              route_id: routeId,
              vehicle_id: selectedVehicleId
            };

            await rideRequestService.createDestinationWallet(walletData, destination.id);
            createdWallets.push(walletData);
          }
        }
      }
      // 交易所转账
      else if (newPayment.pay_way === 2 && selectedExchangeIds.length > 0) {
        for (const exchangeId of selectedExchangeIds) {
          const address = exchangeAddresses[exchangeId];
          if (!address) continue;

          for (const routeId of selectedRouteIds) {
            const walletData = {
              pay_way: newPayment.pay_way,
              chain_name: 2, // 默认值
              exchange_name: exchangeId,
              symbol: newPayment.symbol,
              address: address,
              route_id: routeId,
              vehicle_id: selectedVehicleId
            };

            await rideRequestService.createDestinationWallet(walletData, destination.id);
            createdWallets.push(walletData);
          }
        }
      }
      // 其他支付方式
      else if (newPayment.pay_way >= 3) {
        for (const routeId of selectedRouteIds) {
          const walletData = {
            pay_way: newPayment.pay_way,
            chain_name: 2, // 默认值
            exchange_name: 1, // 默认值
            symbol: 'CNY',
            address: 'N/A',
            route_id: routeId,
            vehicle_id: selectedVehicleId
          };

          await rideRequestService.createDestinationWallet(walletData, destination.id);
          createdWallets.push(walletData);
        }
      }

      if (createdWallets.length > 0) {
        toast({
          title: "支付方式已批量添加",
          description: `成功添加 ${createdWallets.length} 个支付方式配置`,
        });
      }
      
      // 重置表单
      setSelectedRouteIds([]);
      setSelectedVehicleId('');
      setSelectedChainIds([]);
      setSelectedExchangeIds([]);
      setBlockchainAddresses({});
      setExchangeAddresses({});
      setNewPayment({ 
        pay_way: 1,
        symbol: ''
      });
      setShowAddPaymentDialog(false);
      loadCommunityData();
    } catch (error) {
      console.error('添加支付方式失败:', error);
      toast({
        title: "添加失败",
        description: "无法添加支付方式，请检查输入信息",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRoute = async (routeId: string) => {
    try {
      await rideRequestService.deleteFixedRoute(routeId);
      toast({
        title: "路线已删除",
        description: "路线已成功删除",
      });
      loadCommunityData();
    } catch (error) {
      console.error('删除路线失败:', error);
      toast({
        title: "删除失败",
        description: "无法删除路线",
        variant: "destructive",
      });
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    try {
      // 先获取车辆的user_id
      const { data: vehicle, error: fetchError } = await supabase
        .from('vehicles')
        .select('user_id')
        .eq('id', vehicleId)
        .single();

      if (fetchError) throw fetchError;

      // 删除车辆记录（真删除）
      const { error: vehicleError } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId);

      if (vehicleError) throw vehicleError;

      // 如果有关联的用户，也删除用户记录
      if (vehicle?.user_id) {
        const { error: userError } = await supabase
          .from('users')
          .delete()
          .eq('id', vehicle.user_id);

        if (userError) {
          console.error('删除用户记录失败:', userError);
        }
      }

      toast({
        title: "车辆已删除",
        description: "车辆及司机账户已成功删除",
      });
      loadCommunityData();
    } catch (error) {
      console.error('删除车辆失败:', error);
      toast({
        title: "删除失败",
        description: "无法删除车辆",
        variant: "destructive",
      });
    }
  };

  const handleDeletePayment = async (walletId: string) => {
    try {
      await rideRequestService.deleteWalletAddress(walletId);
      toast({
        title: "支付方式已删除",
        description: "支付方式已成功删除",
      });
      loadCommunityData();
    } catch (error) {
      console.error('删除支付方式失败:', error);
      toast({
        title: "删除失败",
        description: "无法删除支付方式",
        variant: "destructive",
      });
    }
  };

  // 路线多选删除功能
  const handleBatchDeleteRoutes = async () => {
    if (selectedRouteIdsForDelete.length === 0) return;

    try {
      await Promise.all(
        selectedRouteIdsForDelete.map(routeId => 
          rideRequestService.deleteFixedRoute(routeId)
        )
      );
      toast({
        title: "路线已批量删除",
        description: `成功删除 ${selectedRouteIdsForDelete.length} 条路线`,
      });
      setSelectedRouteIdsForDelete([]);
      loadCommunityData();
    } catch (error) {
      console.error('批量删除路线失败:', error);
      toast({
        title: "删除失败",
        description: "无法删除路线",
        variant: "destructive",
      });
    }
  };

  // 支付方式多选删除功能
  const handleBatchDeletePayments = async () => {
    if (selectedPaymentIdsForDelete.length === 0) return;

    try {
      await Promise.all(
        selectedPaymentIdsForDelete.map(walletId => 
          rideRequestService.deleteWalletAddress(walletId)
        )
      );
      toast({
        title: "支付方式已批量删除",
        description: `成功删除 ${selectedPaymentIdsForDelete.length} 个支付方式`,
      });
      setSelectedPaymentIdsForDelete([]);
      loadCommunityData();
    } catch (error) {
      console.error('批量删除支付方式失败:', error);
      toast({
        title: "删除失败",
        description: "无法删除支付方式",
        variant: "destructive",
      });
    }
  };

  // 路线选择处理
  const handleRouteDeleteSelection = (routeId: string, checked: boolean) => {
    if (checked) {
      setSelectedRouteIdsForDelete(prev => [...prev, routeId]);
    } else {
      setSelectedRouteIdsForDelete(prev => prev.filter(id => id !== routeId));
    }
  };

  // 路线全选/取消全选
  const handleSelectAllRoutes = (checked: boolean) => {
    if (checked) {
      setSelectedRouteIdsForDelete(routes.map(route => route.id));
    } else {
      setSelectedRouteIdsForDelete([]);
    }
  };

  // 支付方式选择处理
  const handlePaymentDeleteSelection = (walletId: string, checked: boolean) => {
    if (checked) {
      setSelectedPaymentIdsForDelete(prev => [...prev, walletId]);
    } else {
      setSelectedPaymentIdsForDelete(prev => prev.filter(id => id !== walletId));
    }
  };

  // 支付方式全选/取消全选
  const handleSelectAllPayments = (checked: boolean) => {
    if (checked) {
      setSelectedPaymentIdsForDelete(walletAddresses.map(wallet => wallet.id));
    } else {
      setSelectedPaymentIdsForDelete([]);
    }
  };

  const handleCopyAccessCode = async (accessCode: string | undefined) => {
    if (!accessCode) {
      toast({
        title: "复制失败",
        description: "访问码不存在",
        variant: "destructive",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(accessCode);
      setCopiedAccessCode(accessCode);
      setTimeout(() => setCopiedAccessCode(null), 2000);
      toast({
        title: "复制成功",
        description: "司机访问码已复制到剪贴板",
      });
    } catch (error) {
      toast({
        title: "复制失败",
        description: "无法复制访问码",
        variant: "destructive",
      });
    }
  };

  // 检查是否需要显示一键返程按钮
  const checkReturnButtonVisibility = async (destinationId: string, routeData: FixedRoute[]) => {
    if (routeData.length === 0) {
      setShowReturnButton(false);
      return;
    }

    try {
      // 检查是否所有路线都已有对应的返程路线
      let hasUnpairedRoute = false;
      
      for (const route of routeData) {
        const returnExists = await rideRequestService.checkReturnRouteExists(
          destinationId,
          route.start_location,
          route.end_location
        );
        
        if (!returnExists) {
          hasUnpairedRoute = true;
          break;
        }
      }
      
      setShowReturnButton(hasUnpairedRoute);
    } catch (error) {
      console.error('检查返程路线失败:', error);
      setShowReturnButton(true); // 出错时默认显示按钮
    }
  };

  // 处理一键返程
  const handleCreateReturnRoutes = async () => {
    if (!destination) return;

    setIsCreatingReturnRoutes(true);
    try {
      const result = await rideRequestService.createReturnRoutesForDestination(destination.id);
      
      if (result.created > 0) {
        toast({
          title: "返程路线创建成功",
          description: `成功创建 ${result.created} 条返程路线${result.skipped > 0 ? `，跳过 ${result.skipped} 条已存在的路线` : ''}`,
        });
        
        // 重新加载数据
        await loadCommunityData();
      } else {
        toast({
          title: "无需创建",
          description: "所有路线的返程路线都已存在",
        });
        setShowReturnButton(false);
      }
    } catch (error) {
      console.error('创建返程路线失败:', error);
      toast({
        title: "创建失败",
        description: "创建返程路线时发生错误",
        variant: "destructive",
      });
    } finally {
      setIsCreatingReturnRoutes(false);
    }
  };

  const handleLogout = () => {
    clearAccessCode();
    navigate('/');
  };

  const getPayWayLabel = (payWay: number) => {
    return PAY_WAY_OPTIONS.find(option => option.value === payWay)?.label || '未知';
  };

  const getChainLabel = (chainId: number) => {
    return CHAIN_OPTIONS.find(option => option.value === chainId)?.label || '未知';
  };

  const getExchangeLabel = (exchangeId: number) => {
    return EXCHANGE_OPTIONS.find(option => option.value === exchangeId)?.label || '未知';
  };

  const getSelectedVehicle = () => {
    return vehicles.find(vehicle => vehicle.id === selectedVehicleId);
  };

  // 根据wallet中的route_id和vehicle_id获取对应信息
  const getWalletRoute = (routeId: string | undefined) => {
    return routes.find(route => route.id === routeId);
  };

  const getWalletVehicle = (vehicleId: string | undefined) => {
    return vehicles.find(vehicle => vehicle.id === vehicleId);
  };

  // 处理路线多选
  const handleRouteSelection = (routeId: string, checked: boolean) => {
    if (checked) {
      setSelectedRouteIds(prev => [...prev, routeId]);
    } else {
      setSelectedRouteIds(prev => prev.filter(id => id !== routeId));
    }
  };

  // 处理区块链网络多选
  const handleChainSelection = (chainId: number, checked: boolean) => {
    if (checked) {
      setSelectedChainIds(prev => [...prev, chainId]);
      // 为新选择的链添加空地址
      if (!blockchainAddresses[chainId]) {
        setBlockchainAddresses(prev => ({ ...prev, [chainId]: '' }));
      }
    } else {
      setSelectedChainIds(prev => prev.filter(id => id !== chainId));
      // 移除对应的地址
      setBlockchainAddresses(prev => {
        const newAddresses = { ...prev };
        delete newAddresses[chainId];
        return newAddresses;
      });
    }
  };

  // 处理交易所多选
  const handleExchangeSelection = (exchangeId: number, checked: boolean) => {
    if (checked) {
      setSelectedExchangeIds(prev => [...prev, exchangeId]);
      // 为新选择的交易所添加空地址
      if (!exchangeAddresses[exchangeId]) {
        setExchangeAddresses(prev => ({ ...prev, [exchangeId]: '' }));
      }
    } else {
      setSelectedExchangeIds(prev => prev.filter(id => id !== exchangeId));
      // 移除对应的地址
      setExchangeAddresses(prev => {
        const newAddresses = { ...prev };
        delete newAddresses[exchangeId];
        return newAddresses;
      });
    }
  };

  // 更新区块链地址
  const updateBlockchainAddress = (chainId: number, address: string) => {
    setBlockchainAddresses(prev => ({ ...prev, [chainId]: address }));
  };

  // 更新交易所地址
  const updateExchangeAddress = (exchangeId: number, address: string) => {
    setExchangeAddresses(prev => ({ ...prev, [exchangeId]: address }));
  };

  // 处理发送徽章
  const handleSendBadge = (driverAddress: string) => {
    setSelectedDriverAddress(driverAddress);
    setShowBadgeDialog(true);
  };

  // 检查是否为管理员钱包地址
  const isAdminWallet = currentUserWalletAddress.toLowerCase() === ADMIN_WALLET_ADDRESS.toLowerCase();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  // 如果没有关联的目的地，显示创建界面
  if (!destination) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">社区管理</h1>
          <div className="flex items-center justify-center gap-4">
            <p className="text-gray-600">欢迎使用社区管理系统</p>
            <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              退出登录
            </Button>
          </div>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              创建您的社区目的地
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-blue-50 rounded-lg mb-6">
              <p className="text-sm text-blue-700">
                您还没有关联的社区目的地。请先创建一个目的地，然后您就可以管理该目的地下的路线、车辆和收款信息。
              </p>
            </div>

            <form onSubmit={handleCreateDestination} className="space-y-4">
              <div>
                <Label htmlFor="dest_name">目的地名称</Label>
                <Input
                  id="dest_name"
                  value={newDestination.name}
                  onChange={(e) => setNewDestination({...newDestination, name: e.target.value})}
                  placeholder="例如: DN黄山"
                  required
                />
              </div>
              <div>
                <Label htmlFor="dest_address">目的地地址</Label>
                <Input
                  id="dest_address"
                  value={newDestination.address}
                  onChange={(e) => setNewDestination({...newDestination, address: e.target.value})}
                  placeholder="例如: 安徽省黄山市黄山风景区"
                  required
                />
              </div>
              <div>
                <Label htmlFor="dest_description">描述（可选）</Label>
                <Input
                  id="dest_description"
                  value={newDestination.description}
                  onChange={(e) => setNewDestination({...newDestination, description: e.target.value})}
                  placeholder="目的地的详细描述"
                />
              </div>
              <Button type="submit" className="w-full">
                <Building2 className="h-4 w-4 mr-2" />
                创建目的地
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 显示目的地管理界面
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">社区管理 - {destination.name}</h1>
        <div className="flex items-center justify-center gap-4">
          <p className="text-gray-600">{destination.address}</p>
          <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            退出登录
          </Button>
        </div>
      </div>

      <Tabs defaultValue="routes" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="routes" className="flex items-center gap-2">
            <Route className="h-4 w-4" />
            路线管理 ({routes.length})
          </TabsTrigger>
          <TabsTrigger value="vehicles" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            车辆管理 ({vehicles.length})
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            支付管理 ({walletAddresses.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="routes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Route className="h-5 w-5" />
                  路线管理
                </div>
                {showReturnButton && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCreateReturnRoutes}
                    disabled={isCreatingReturnRoutes}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className={`h-4 w-4 ${isCreatingReturnRoutes ? 'animate-spin' : ''}`} />
                    {isCreatingReturnRoutes ? '创建中...' : '一键返程'}
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 批量操作控制栏 */}
              {routes.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Checkbox
                      id="select-all-routes"
                      checked={selectedRouteIdsForDelete.length === routes.length}
                      onCheckedChange={handleSelectAllRoutes}
                    />
                    <Label htmlFor="select-all-routes" className="text-sm font-medium">
                      全选 ({selectedRouteIdsForDelete.length}/{routes.length})
                    </Label>
                  </div>
                  {selectedRouteIdsForDelete.length > 0 && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleBatchDeleteRoutes}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      删除选中 ({selectedRouteIdsForDelete.length})
                    </Button>
                  )}
                </div>
              )}

              <div className="space-y-3">
                {routes.map((route) => (
                  <div key={route.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <Checkbox
                          id={`route-delete-${route.id}`}
                          checked={selectedRouteIdsForDelete.includes(route.id)}
                          onCheckedChange={(checked) => handleRouteDeleteSelection(route.id, checked as boolean)}
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold">{route.name}</h4>
                          <p className="text-sm text-gray-600">
                            {route.start_location} → {destination.name}
                          </p>
                          <div className="flex gap-4 text-sm text-gray-600 mt-1">
                            {route.distance_km && <span>距离: {route.distance_km}km</span>}
                            {route.estimated_duration_minutes && <span>预计时长: {route.estimated_duration_minutes}分钟</span>}
                            {route.market_price && <span>市场价: ¥{route.market_price}</span>}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteRoute(route.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Dialog open={showAddRouteDialog} onOpenChange={setShowAddRouteDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    添加路线
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>添加新路线到 {destination.name}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddRoute} className="space-y-4">
                    <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                      路线名称将自动生成为：{newRoute.start_location ? `${newRoute.start_location}到${destination.name}` : `起点到${destination.name}`}
                    </div>
                    <div>
                      <Label htmlFor="start_location">起点</Label>
                      <Input
                        id="start_location"
                        value={newRoute.start_location}
                        onChange={(e) => setNewRoute({...newRoute, start_location: e.target.value})}
                        placeholder="例如: 合肥南站"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="distance_km">距离 (km)</Label>
                        <Input
                          id="distance_km"
                          value={newRoute.distance_km}
                          onChange={(e) => setNewRoute({...newRoute, distance_km: e.target.value})}
                          placeholder="150"
                          type="number"
                          step="0.1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="duration">预计时长 (分钟)</Label>
                        <Input
                          id="duration"
                          value={newRoute.estimated_duration_minutes}
                          onChange={(e) => setNewRoute({...newRoute, estimated_duration_minutes: e.target.value})}
                          placeholder="120"
                          type="number"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="market_price">市场价</Label>
                      <Input
                        id="market_price"
                        value={newRoute.market_price}
                        onChange={(e) => setNewRoute({...newRoute, market_price: e.target.value})}
                        placeholder="150"
                        type="number"
                        step="0.01"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit">添加</Button>
                      <Button type="button" variant="outline" onClick={() => setShowAddRouteDialog(false)}>
                        取消
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vehicles">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                车辆管理
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {vehicles.map((vehicle) => (
                  <div key={vehicle.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                       <div className="flex-1">
                         <h4 className="font-semibold">{vehicle.license_plate}</h4>
                         <p className="text-sm text-gray-600">司机: {vehicle.driver_name}</p>
                         {vehicle.driver_phone && (
                           <p className="text-sm text-gray-600 flex items-center gap-1">
                             <Phone className="h-3 w-3" />
                             {vehicle.driver_phone}
                           </p>
                         )}
                          <p className="text-sm text-gray-600">
                            载客: {vehicle.max_passengers}人 | 后备箱: {vehicle.trunk_length_cm}×{vehicle.trunk_width_cm}×{vehicle.trunk_height_cm}cm
                          </p>
                          {vehicle.access_code && (
                            <div className="mt-2 p-2 bg-green-50 rounded flex items-center justify-between">
                              <div>
                                <p className="text-sm text-green-700 font-medium">司机访问码:</p>
                                <p className="text-sm font-mono text-green-800">{vehicle.access_code}</p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopyAccessCode(vehicle.access_code)}
                                className="flex items-center gap-1"
                              >
                                {copiedAccessCode === vehicle.access_code ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                                {copiedAccessCode === vehicle.access_code ? '已复制' : '复制'}
                              </Button>
                            </div>
                          )}
                       </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteVehicle(vehicle.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Dialog open={showAddVehicleDialog} onOpenChange={setShowAddVehicleDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    添加车辆
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>添加新车辆到 {destination.name}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddVehicle} className="space-y-4">
                    <div>
                      <Label htmlFor="driver_name">司机姓名</Label>
                      <Input
                        id="driver_name"
                        value={newVehicle.driver_name}
                        onChange={(e) => setNewVehicle({...newVehicle, driver_name: e.target.value})}
                        placeholder="例如: 张师傅"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="driver_phone">司机电话</Label>
                      <Input
                        id="driver_phone"
                        value={newVehicle.driver_phone}
                        onChange={(e) => setNewVehicle({...newVehicle, driver_phone: e.target.value})}
                        placeholder="例如: 13800138000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="license_plate">车牌号</Label>
                      <Input
                        id="license_plate"
                        value={newVehicle.license_plate}
                        onChange={(e) => setNewVehicle({...newVehicle, license_plate: e.target.value})}
                        placeholder="例如: 皖A12345"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="max_passengers">最大载客数</Label>
                      <Input
                        id="max_passengers"
                        value={newVehicle.max_passengers}
                        onChange={(e) => setNewVehicle({...newVehicle, max_passengers: parseInt(e.target.value) || 4})}
                        type="number"
                        min="1"
                        max="8"
                        required
                      />
                    </div>
                    <div>
                      <Label>后备箱尺寸 (cm)</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          placeholder="长"
                          value={newVehicle.trunk_length_cm}
                          onChange={(e) => setNewVehicle({...newVehicle, trunk_length_cm: parseInt(e.target.value) || 100})}
                          type="number"
                        />
                        <Input
                          placeholder="宽"
                          value={newVehicle.trunk_width_cm}
                          onChange={(e) => setNewVehicle({...newVehicle, trunk_width_cm: parseInt(e.target.value) || 80})}
                          type="number"
                        />
                        <Input
                          placeholder="高"
                          value={newVehicle.trunk_height_cm}
                          onChange={(e) => setNewVehicle({...newVehicle, trunk_height_cm: parseInt(e.target.value) || 50})}
                          type="number"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>愿意的折扣: {newVehicle.discount_percentage}%</Label>
                      <div className="mt-2">
                        <Slider
                          value={[newVehicle.discount_percentage]}
                          onValueChange={(value) => setNewVehicle({...newVehicle, discount_percentage: value[0]})}
                          max={80}
                          min={0}
                          step={5}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0%</span>
                          <span>40%</span>
                          <span>80%</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit">添加</Button>
                      <Button type="button" variant="outline" onClick={() => setShowAddVehicleDialog(false)}>
                        取消
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                支付管理
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 批量操作控制栏 */}
              {walletAddresses.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Checkbox
                      id="select-all-payments"
                      checked={selectedPaymentIdsForDelete.length === walletAddresses.length}
                      onCheckedChange={handleSelectAllPayments}
                    />
                    <Label htmlFor="select-all-payments" className="text-sm font-medium">
                      全选 ({selectedPaymentIdsForDelete.length}/{walletAddresses.length})
                    </Label>
                  </div>
                  {selectedPaymentIdsForDelete.length > 0 && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleBatchDeletePayments}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      删除选中 ({selectedPaymentIdsForDelete.length})
                    </Button>
                  )}
                </div>
              )}

              <div className="space-y-3">
                {walletAddresses.map((wallet) => {
                  const walletRoute = getWalletRoute(wallet.route_id);
                  const walletVehicle = getWalletVehicle(wallet.vehicle_id);
                  
                  return (
                    <div key={wallet.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <Checkbox
                            id={`payment-delete-${wallet.id}`}
                            checked={selectedPaymentIdsForDelete.includes(wallet.id)}
                            onCheckedChange={(checked) => handlePaymentDeleteSelection(wallet.id, checked as boolean)}
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold">{getPayWayLabel(wallet.pay_way)}</h4>
                            
                            {/* 显示关联的路线和车辆信息 */}
                            <div className="mt-2 p-2 bg-blue-50 rounded">
                              <p className="text-sm text-blue-700">
                                <strong>路线:</strong> {walletRoute?.name || '未知路线'}<br/>
                                <strong>司机:</strong> {walletVehicle?.driver_name || '未知司机'} 
                                {walletVehicle?.license_plate && `(${walletVehicle.license_plate})`}
                              </p>
                            </div>
                            
                            {wallet.pay_way === 1 && (
                              <p className="text-sm text-gray-600 mt-1">
                                网络: {getChainLabel(wallet.chain_name)} | 币种: {wallet.symbol}
                              </p>
                            )}
                            {wallet.pay_way === 2 && wallet.exchange_name && (
                              <p className="text-sm text-gray-600 mt-1">
                                交易所: {getExchangeLabel(wallet.exchange_name)} | 币种: {wallet.symbol}
                              </p>
                            )}
                            {wallet.address !== 'N/A' && (
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-mono bg-gray-100 p-1 rounded mt-1 break-all flex-1">
                                  {wallet.address}
                                </p>
                                {/* 如果是管理员且是区块链支付，显示发送徽章按钮 */}
                                {isAdminWallet && wallet.pay_way === 1 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleSendBadge(wallet.address)}
                                    className="flex items-center gap-1"
                                  >
                                    <Award className="h-3 w-3" />
                                    发送徽章
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeletePayment(wallet.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Dialog open={showAddPaymentDialog} onOpenChange={setShowAddPaymentDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    添加支付方式
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh]">
                  <DialogHeader>
                    <DialogTitle>批量添加支付方式到 {destination.name}</DialogTitle>
                  </DialogHeader>
                  {/* 使用滚动容器 */}
                  <div className="overflow-y-auto max-h-[calc(90vh-120px)] pr-2">
                    <form onSubmit={handleAddPayment} className="space-y-6">
                      {/* 选择路线 - 多选 */}
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <Label className="text-sm font-medium text-blue-700">选择路线（可多选）</Label>
                        <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                          {routes.map((route) => (
                            <div key={route.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`route-${route.id}`}
                                checked={selectedRouteIds.includes(route.id)}
                                onCheckedChange={(checked) => handleRouteSelection(route.id, checked as boolean)}
                              />
                              <Label htmlFor={`route-${route.id}`} className="text-sm">
                                {route.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                        {selectedRouteIds.length > 0 && (
                          <div className="mt-2 p-2 bg-white rounded border">
                            <p className="text-sm">
                              <strong>已选择 {selectedRouteIds.length} 条路线</strong>
                            </p>
                          </div>
                        )}
                      </div>

                      {/* 选择车辆 */}
                      <div>
                        <Label htmlFor="vehicle_select">选择车辆</Label>
                        <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                          <SelectTrigger>
                            <SelectValue placeholder="选择车辆" />
                          </SelectTrigger>
                          <SelectContent>
                            {vehicles.map((vehicle) => (
                              <SelectItem key={vehicle.id} value={vehicle.id}>
                                {vehicle.license_plate} - {vehicle.driver_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* 选择支付方式 */}
                      <div>
                        <Label htmlFor="pay_way">支付方式</Label>
                        <Select 
                          value={newPayment.pay_way.toString()} 
                          onValueChange={(value) => setNewPayment({...newPayment, pay_way: parseInt(value)})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PAY_WAY_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value.toString()}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* 区块链支付 - 多选网络 */}
                      {newPayment.pay_way === 1 && (
                        <div className="space-y-4">
                          <div className="p-4 bg-green-50 rounded-lg">
                            <Label className="text-sm font-medium text-green-700">选择区块链网络（可多选）</Label>
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              {CHAIN_OPTIONS.map((chain) => (
                                <div key={chain.value} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`chain-${chain.value}`}
                                    checked={selectedChainIds.includes(chain.value)}
                                    onCheckedChange={(checked) => handleChainSelection(chain.value, checked as boolean)}
                                  />
                                  <Label htmlFor={`chain-${chain.value}`} className="text-sm">
                                    {chain.label}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* 币种符号 */}
                          <div>
                            <Label htmlFor="symbol">币种符号</Label>
                            <Input
                              id="symbol"
                              value={newPayment.symbol}
                              onChange={(e) => setNewPayment({...newPayment, symbol: e.target.value})}
                              placeholder="例如: BTC, ETH, USDT"
                              required
                            />
                          </div>

                          {/* 为每个选中的区块链网络显示地址输入框 */}
                          {selectedChainIds.map((chainId) => {
                            const chain = CHAIN_OPTIONS.find(c => c.value === chainId);
                            return (
                              <div key={chainId}>
                                <Input
                                  value={blockchainAddresses[chainId] || ''}
                                  onChange={(e) => updateBlockchainAddress(chainId, e.target.value)}
                                  placeholder={`输入${chain?.label}地址`}
                                  required
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* 交易所转账 - 多选交易所 */}
                      {newPayment.pay_way === 2 && (
                        <div className="space-y-4">
                          <div className="p-4 bg-yellow-50 rounded-lg">
                            <Label className="text-sm font-medium text-yellow-700">选择交易所（可多选）</Label>
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              {EXCHANGE_OPTIONS.map((exchange) => (
                                <div key={exchange.value} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`exchange-${exchange.value}`}
                                    checked={selectedExchangeIds.includes(exchange.value)}
                                    onCheckedChange={(checked) => handleExchangeSelection(exchange.value, checked as boolean)}
                                  />
                                  <Label htmlFor={`exchange-${exchange.value}`} className="text-sm">
                                    {exchange.label}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* 币种符号 */}
                          <div>
                            <Label htmlFor="symbol">币种符号</Label>
                            <Input
                              id="symbol"
                              value={newPayment.symbol}
                              onChange={(e) => setNewPayment({...newPayment, symbol: e.target.value})}
                              placeholder="例如: USDT"
                              required
                            />
                          </div>

                          {/* 为每个选中的交易所显示UID输入框 */}
                          {selectedExchangeIds.map((exchangeId) => {
                            const exchange = EXCHANGE_OPTIONS.find(e => e.value === exchangeId);
                            return (
                              <div key={exchangeId}>
                                <Input
                                  value={exchangeAddresses[exchangeId] || ''}
                                  onChange={(e) => updateExchangeAddress(exchangeId, e.target.value)}
                                  placeholder={`输入${exchange?.label}UID`}
                                  required
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* 其他支付方式 */}
                      {newPayment.pay_way >= 3 && (
                        <div className="p-4 bg-green-50 rounded-lg">
                          <p className="text-sm text-green-700">
                            该支付方式无需额外配置，将为所有选中的路线创建支付方式。
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2 pt-4">
                        <Button 
                          type="submit" 
                          disabled={
                            selectedRouteIds.length === 0 || 
                            !selectedVehicleId ||
                            (newPayment.pay_way === 1 && selectedChainIds.length === 0) ||
                            (newPayment.pay_way === 2 && selectedExchangeIds.length === 0)
                          }
                        >
                          批量添加
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setShowAddPaymentDialog(false)}>
                          取消
                        </Button>
                      </div>
                    </form>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 徽章发送对话框 */}
      <BadgeSendDialog
        open={showBadgeDialog}
        onOpenChange={setShowBadgeDialog}
        driverWalletAddress={selectedDriverAddress}
      />
    </div>
  );
};

export default CommunityManagement;