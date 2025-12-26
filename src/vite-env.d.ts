/// <reference types="vite/client" />

interface EIP1193RequestArguments {
  method: string;
  params?: unknown[] | object;
}

interface EIP1193Provider {
  request: (args: EIP1193RequestArguments) => Promise<unknown>;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
}

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}

export {};
