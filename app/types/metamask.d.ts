export {};

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request?: (args: { method: string; params?: any[] }) => Promise<any>;
    };
  }
}

// interface EthereumProvider {
//   isMetaMask?: boolean;
//   request?: (args: { method: string; params?: any[] }) => Promise<any>;
// }

// interface Window {
//   ethereum?: EthereumProvider;
// }
