import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, CreditCard, TrendingUp, Download, Eye, Plus } from 'lucide-react';

const PaymentManagement: React.FC = () => {
  const [selectedWallet, setSelectedWallet] = useState('USDT');

  // 模拟数据
  const walletData = {
    balance: {
      USDT: 1250.50,
      BTC: 0.05432,
      ETH: 2.1567
    },
    transactions: [
      {
        id: 1,
        type: 'income',
        amount: 45,
        currency: 'USDT',
        description: '订单收入 #12345',
        date: '2024-01-15 10:30',
        status: 'completed'
      },
      {
        id: 2,
        type: 'income',
        amount: 25,
        currency: 'USDT',
        description: '订单收入 #12344',
        date: '2024-01-15 14:00',
        status: 'completed'
      },
      {
        id: 3,
        type: 'withdraw',
        amount: 200,
        currency: 'USDT',
        description: '提现到钱包',
        date: '2024-01-14 16:30',
        status: 'pending'
      },
      {
        id: 4,
        type: 'income',
        amount: 35,
        currency: 'USDT',
        description: '订单收入 #12343',
        date: '2024-01-14 11:15',
        status: 'completed'
      }
    ],
    stats: {
      totalEarnings: 1850.75,
      thisWeekEarnings: 320.50,
      pendingWithdraw: 200.00,
      completedOrders: 28
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">支付管理</h1>
        <p className="text-gray-600">管理您的收入和钱包余额</p>
      </div>

      {/* 余额概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">总收入</p>
                <p className="text-2xl font-bold">{walletData.stats.totalEarnings} USDT</p>
              </div>
              <TrendingUp className="h-10 w-10 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">本周收入</p>
                <p className="text-2xl font-bold">{walletData.stats.thisWeekEarnings} USDT</p>
              </div>
              <Wallet className="h-10 w-10 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">可用余额</p>
                <p className="text-2xl font-bold">{walletData.balance.USDT} USDT</p>
              </div>
              <CreditCard className="h-10 w-10 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100">处理中</p>
                <p className="text-2xl font-bold">{walletData.stats.pendingWithdraw} USDT</p>
              </div>
              <Download className="h-10 w-10 text-orange-200" />
            </div>
          </CardContent>
        </Card>
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
            {/* 币种选择 */}
            <div className="space-y-3">
              {Object.entries(walletData.balance).map(([currency, balance]) => (
                <div 
                  key={currency}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedWallet === currency ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedWallet(currency)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{currency}</h4>
                      <p className="text-sm text-gray-600">
                        {currency === 'USDT' ? 'Tether' : currency === 'BTC' ? 'Bitcoin' : 'Ethereum'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{balance}</p>
                      <p className="text-sm text-gray-600">{currency}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 操作按钮 */}
            <div className="space-y-2 pt-4 border-t">
              <Button className="w-full">
                <Download className="h-4 w-4 mr-2" />
                提现
              </Button>
              <Button variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                添加钱包地址
              </Button>
            </div>

            {/* 钱包地址 */}
            <div className="pt-4 border-t">
              <Label className="text-sm font-medium">当前 {selectedWallet} 地址</Label>
              <div className="mt-2 p-3 bg-gray-100 rounded font-mono text-xs break-all">
                1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa
              </div>
              <Button variant="ghost" size="sm" className="mt-2">
                <Eye className="h-4 w-4 mr-1" />
                查看二维码
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 交易记录 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                交易记录
              </span>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                导出
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {walletData.transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'income' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      {transaction.type === 'income' ? (
                        <TrendingUp className="h-5 w-5" />
                      ) : (
                        <Download className="h-5 w-5" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-semibold">{transaction.description}</h4>
                    <p className="text-sm text-gray-600">{transaction.date}</p>
                  </div>
                  
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{transaction.amount} {transaction.currency}
                    </p>
                    <Badge 
                      variant={transaction.status === 'completed' ? 'default' : 'outline'}
                      className={transaction.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}
                    >
                      {transaction.status === 'completed' ? '已完成' : '处理中'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            
            <Button variant="outline" className="w-full mt-4">
              查看更多记录
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 提现设置 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>提现设置</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="minWithdraw">最低提现金额</Label>
                <Input 
                  id="minWithdraw"
                  type="number"
                  placeholder="50"
                  className="mt-1"
                />
                <p className="text-sm text-gray-600 mt-1">当前设置: 50 USDT</p>
              </div>
              
              <div>
                <Label htmlFor="autoWithdraw">自动提现阈值</Label>
                <Input 
                  id="autoWithdraw"
                  type="number"
                  placeholder="1000"
                  className="mt-1"
                />
                <p className="text-sm text-gray-600 mt-1">余额达到此金额时自动提现</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">提现说明</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 提现手续费: 2 USDT</li>
                  <li>• 处理时间: 1-3个工作日</li>
                  <li>• 每日限额: 5000 USDT</li>
                  <li>• 最低金额: 50 USDT</li>
                </ul>
              </div>
              
              <Button className="w-full">
                保存设置
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentManagement;