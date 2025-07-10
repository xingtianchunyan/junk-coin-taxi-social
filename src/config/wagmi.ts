import { http, createConfig } from 'wagmi';
import { mainnet, sepolia, polygon, bsc } from 'wagmi/chains';
import { injected, metaMask, walletConnect } from 'wagmi/connectors';

// WalletConnect项目ID - 需要在https://cloud.walletconnect.com/注册获取
const projectId = 'YOUR_WALLETCONNECT_PROJECT_ID';

export const config = createConfig({
  chains: [mainnet, sepolia, polygon, bsc],
  connectors: [
    injected(),
    metaMask(),
    walletConnect({ 
      projectId,
      metadata: {
        name: 'Junk Coin Taxi Social',
        description: 'Web3 Taxi Social Platform',
        url: 'https://localhost:8080',
        icons: ['https://localhost:8080/favicon.ico']
      }
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [polygon.id]: http(),
    [bsc.id]: http(),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}