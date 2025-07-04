import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Wallet, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { rideRequestService } from '@/services/rideRequestService';

const PaymentManagement: React.FC = () => {
  const [walletAddresses, setWalletAddresses] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showAddWalletDialog, setShowAddWalletDialog] = useState(false);
  const [newWallet, setNewWallet] = useState({
    chain_name: '',
    symbol: '',
    average_price_30d: '',
    address: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadWalletAddresses();
    loadTransactions();
  }, []);

  const loadWalletAddresses = async () => {
    try {
      const addresses = await rideRequestService.getAllWalletAddresses();
      setWalletAddresses(addresses);
    } catch (error) {
      console.error('加载钱包地址失败:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      // 这里将来实现区块链交易数据抓取
      // 目前显示空数组，等待区块链API集成
      setTransactions([]);
    } catch (error) {
      console.error('加载交易记录失败:', error);
    }
  };

  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await rideRequestService.createWalletAddress({
        chain_name: newWallet.chain_name,
        symbol: newWallet.symbol,
        address: newWallet.address,
        qr_code_url: ''
      });
      
      toast({
        title: "钱包地址已添加",
        description: "新的钱包地址已成功添加到系统",
      });
      
      setNewWallet({ chain_name: '', symbol: '', average_price_30d: '', address: '' });
      setShowAddWalletDialog(false);
      loadWalletAddresses();
    } catch (error) {
      toast({
        title: "添加失败",
        description: "无法添加钱包地址，请检查输入信息",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">支付管理</h1>
        <p className="text-gray-600">原则上我们不收取人民币，仅收取等值的垃圾币、山寨币，用以达成在帮助社区成员、结识新朋友的同时有基本收入的目的。</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 钱包管理 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              钱包管理
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 说明文字 */}
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                本网站只需登记钱包地址，无需将加密钱包链接到网站，完全可以在用户已有的加密钱包中进行安全操作，本质上该网站的一切交易都是依靠源自比特币网络的点对点交易功能。
              </p>
            </div>

            {/* 钱包地址列表 */}
            <div className="space-y-3">
              {walletAddresses.map((wallet) => (
                <div key={wallet.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{wallet.chain_name}</h4>
                      <p className="text-sm text-gray-600">{wallet.symbol}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        // 可以添加删除功能
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 font-mono break-all">
                      {wallet.address}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* 添加钱包按钮 */}
            <Dialog open={showAddWalletDialog} onOpenChange={setShowAddWalletDialog}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  添加钱包地址
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>添加钱包地址</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddWallet} className="space-y-4">
                  <div>
                    <Label htmlFor="chain_name">区块链网络</Label>
                    <Input
                      id="chain_name"
                      value={newWallet.chain_name}
                      onChange={(e) => setNewWallet({...newWallet, chain_name: e.target.value})}
                      placeholder="例如: Ethereum"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="symbol">币种</Label>
                    <Input
                      id="symbol"
                      value={newWallet.symbol}
                      onChange={(e) => setNewWallet({...newWallet, symbol: e.target.value})}
                      placeholder="例如: ETH"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="average_price_30d">30日平均币价</Label>
                    <Input
                      id="average_price_30d"
                      value={newWallet.average_price_30d}
                      onChange={(e) => setNewWallet({...newWallet, average_price_30d: e.target.value})}
                      placeholder="例如: 2000"
                      type="number"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">收款钱包地址</Label>
                    <Input
                      id="address"
                      value={newWallet.address}
                      onChange={(e) => setNewWallet({...newWallet, address: e.target.value})}
                      placeholder="输入钱包地址"
                      className="font-mono"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">添加</Button>
                    <Button type="button" variant="outline" onClick={() => setShowAddWalletDialog(false)}>
                      取消
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* 交易记录 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              交易记录
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>交易状态</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead>币种</TableHead>
                    <TableHead>时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Badge variant={tx.verified ? "default" : "destructive"}>
                          {tx.verified ? `${tx.passenger_name}-${tx.group_id}-已支付` : `${tx.passenger_name}-${tx.group_id}-未能成功支付`}
                        </Badge>
                      </TableCell>
                      <TableCell>{tx.amount}</TableCell>
                      <TableCell>{tx.currency}</TableCell>
                      <TableCell>{new Date(tx.timestamp).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">暂无交易记录</p>
                <p className="text-sm text-gray-400 mt-2">系统将自动从区块链浏览器抓取交易信息并进行核对</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentManagement;