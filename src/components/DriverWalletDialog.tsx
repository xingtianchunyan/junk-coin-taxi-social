import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WalletAddress {
  id: string;
  chain_name: string;
  symbol: string;
  address: string;
}

interface DriverWalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedNetwork: string;
  selectedCurrency: string;
  walletAddresses: WalletAddress[];
}

const DriverWalletDialog: React.FC<DriverWalletDialogProps> = ({
  open,
  onOpenChange,
  selectedNetwork,
  selectedCurrency,
  walletAddresses
}) => {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const { toast } = useToast();

  // 根据选择的网络和币种过滤钱包地址
  const filteredAddresses = walletAddresses.filter(addr => 
    addr.chain_name.toLowerCase() === selectedNetwork.toLowerCase() && 
    addr.symbol.toLowerCase() === selectedCurrency.toLowerCase()
  );

  const copyToClipboard = async (address: string, id: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(id);
      toast({
        title: "地址已复制",
        description: "钱包地址已复制到剪贴板"
      });
      
      setTimeout(() => {
        setCopiedAddress(null);
      }, 2000);
    } catch (error) {
      toast({
        title: "复制失败",
        description: "无法复制地址，请手动复制",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            司机钱包地址
            <Badge variant="outline" className="bg-green-100 text-green-700">
              {selectedNetwork} - {selectedCurrency}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            请向以下钱包地址支付车费：
          </div>
          
          {filteredAddresses.length > 0 ? (
            <div className="space-y-3">
              {filteredAddresses.map((addr) => (
                <div key={addr.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium">
                      {addr.chain_name} ({addr.symbol})
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="font-mono text-xs bg-white p-2 rounded border flex-1 break-all">
                      {addr.address}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(addr.address, addr.id)}
                      className="shrink-0"
                    >
                      {copiedAddress === addr.id ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <div className="text-sm">暂无对应网络的钱包地址</div>
              <div className="text-xs mt-1">请联系司机获取支付信息</div>
            </div>
          )}
          
          <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
            💡 支付完成后，系统将自动检测您的付款交易并更新订单状态
          </div>
          
          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)}>
              确定
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DriverWalletDialog;