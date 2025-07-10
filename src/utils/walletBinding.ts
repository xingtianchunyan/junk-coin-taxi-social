// 临时的钱包绑定工具，使用localStorage存储绑定关系
// 等数据库添加wallet_address字段后可以迁移到数据库

interface WalletBinding {
  accessCode: string;
  walletAddress: string;
  timestamp: number;
}

const WALLET_BINDING_KEY = 'wallet_bindings';

export class LocalWalletBinding {
  // 获取所有绑定关系
  private getBindings(): WalletBinding[] {
    try {
      const stored = localStorage.getItem(WALLET_BINDING_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('读取钱包绑定失败:', error);
      return [];
    }
  }

  // 保存绑定关系
  private saveBindings(bindings: WalletBinding[]): void {
    try {
      localStorage.setItem(WALLET_BINDING_KEY, JSON.stringify(bindings));
    } catch (error) {
      console.error('保存钱包绑定失败:', error);
    }
  }

  // 绑定钱包地址到访问码
  bindWallet(accessCode: string, walletAddress: string): boolean {
    try {
      const bindings = this.getBindings();
      
      // 检查钱包是否已被其他访问码绑定
      const existingBinding = bindings.find(
        b => b.walletAddress.toLowerCase() === walletAddress.toLowerCase() && b.accessCode !== accessCode
      );
      
      if (existingBinding) {
        throw new Error('该钱包地址已被其他访问码绑定');
      }
      
      // 移除当前访问码的旧绑定
      const filteredBindings = bindings.filter(b => b.accessCode !== accessCode);
      
      // 添加新绑定
      filteredBindings.push({
        accessCode,
        walletAddress: walletAddress.toLowerCase(),
        timestamp: Date.now()
      });
      
      this.saveBindings(filteredBindings);
      return true;
    } catch (error) {
      console.error('绑定钱包失败:', error);
      throw error;
    }
  }

  // 解除绑定
  unbindWallet(accessCode: string): boolean {
    try {
      const bindings = this.getBindings();
      const filteredBindings = bindings.filter(b => b.accessCode !== accessCode);
      this.saveBindings(filteredBindings);
      return true;
    } catch (error) {
      console.error('解绑钱包失败:', error);
      return false;
    }
  }

  // 获取访问码绑定的钱包地址
  getBoundWallet(accessCode: string): string | null {
    try {
      const bindings = this.getBindings();
      const binding = bindings.find(b => b.accessCode === accessCode);
      return binding ? binding.walletAddress : null;
    } catch (error) {
      console.error('获取绑定钱包失败:', error);
      return null;
    }
  }

  // 检查钱包是否已绑定
  isWalletBound(accessCode: string): boolean {
    return this.getBoundWallet(accessCode) !== null;
  }

  // 检查钱包是否被其他访问码绑定
  isWalletBoundToOther(walletAddress: string, currentAccessCode: string): boolean {
    try {
      const bindings = this.getBindings();
      return bindings.some(
        b => b.walletAddress.toLowerCase() === walletAddress.toLowerCase() && b.accessCode !== currentAccessCode
      );
    } catch (error) {
      console.error('检查钱包绑定失败:', error);
      return false;
    }
  }

  // 清理过期绑定（可选，比如30天后过期）
  cleanupExpiredBindings(maxAge: number = 30 * 24 * 60 * 60 * 1000): void {
    try {
      const bindings = this.getBindings();
      const now = Date.now();
      const validBindings = bindings.filter(b => (now - b.timestamp) < maxAge);
      this.saveBindings(validBindings);
    } catch (error) {
      console.error('清理过期绑定失败:', error);
    }
  }
}

export const localWalletBinding = new LocalWalletBinding();