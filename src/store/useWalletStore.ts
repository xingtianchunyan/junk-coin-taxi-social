import { create } from 'zustand';
import { ethers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';
import { toast } from 'sonner';

interface WalletState {
  walletAddress: string | null;
  isConnecting: boolean;
  provider: ethers.Eip1193Provider | null;
  
  // Actions
  connect: () => Promise<string | null>;
  disconnect: () => void;
  signMessage: (message: string) => Promise<string | null>;
  getBalance: (address: string) => Promise<string>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  walletAddress: null,
  isConnecting: false,
  provider: null,

  connect: async () => {
    try {
      set({ isConnecting: true });
      
      const provider = await detectEthereumProvider() as ethers.Eip1193Provider | null;
      if (!provider) {
        toast.error('请安装 MetaMask 或其他 Web3 钱包');
        return null;
      }

      const ethProvider = new ethers.BrowserProvider(provider);
      const accounts = await ethProvider.send('eth_requestAccounts', []);
      
      if (accounts.length === 0) {
        toast.error('未能获取钱包地址');
        return null;
      }

      const address = accounts[0];
      set({ 
        walletAddress: address,
        provider: provider
      });
      
      return address;
    } catch (error) {
      console.error('连接钱包失败:', error);
      toast.error('连接钱包失败');
      return null;
    } finally {
      set({ isConnecting: false });
    }
  },

  disconnect: () => {
    set({ 
      walletAddress: null,
      provider: null
    });
  },

  signMessage: async (message: string) => {
    const { provider } = get();
    if (!provider) {
      toast.error('请先连接钱包');
      return null;
    }

    try {
      const ethProvider = new ethers.BrowserProvider(provider);
      const signer = await ethProvider.getSigner();
      return await signer.signMessage(message);
    } catch (error) {
      console.error('签名失败:', error);
      toast.error('签名失败');
      return null;
    }
  },

  getBalance: async (address: string) => {
    const { provider } = get();
    if (!provider) return '0';

    try {
      const ethProvider = new ethers.BrowserProvider(provider);
      const balance = await ethProvider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('获取余额失败:', error);
      return '0';
    }
  }
}));
