/**
 * Wallet-related TypeScript type definitions
 * Defines interfaces and types for wallet integration, signature handling, and MetaMask operations
 */

import { BrowserProvider, JsonRpcSigner } from 'ethers';

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  chainId: number | null;
  isLoading: boolean;
  error: string | null;
}

export interface WalletConnectionResult {
  success: boolean;
  address?: string;
  error?: string;
}

export interface SignatureResult {
  success: boolean;
  signature?: string;
  message?: string;
  error?: string;
}

export interface SignatureVerificationParams {
  message: string;
  signature: string;
  expectedAddress: string;
}

export interface SignatureVerificationResult {
  isValid: boolean;
  recoveredAddress?: string;
  error?: string;
}

export interface AuthorizationMessage {
  parentWallet: string;
  pickupWallet: string;
  studentId: string;
  studentName: string;
  startDate: string;
  endDate: string;
  timestamp: number;
}

export interface WalletError {
  code: string;
  message: string;
  type: 'connection' | 'signature' | 'network' | 'permission' | 'installation';
}

export interface MetaMaskEthereumProvider {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, handler: (data: unknown) => void) => void;
  removeListener: (event: string, handler: (data: unknown) => void) => void;
  selectedAddress: string | null;
  chainId: string | null;
  isConnected(): boolean;
}

export interface WindowEthereum {
  ethereum?: MetaMaskEthereumProvider;
}

// Extend the global Window interface
declare global {
  interface Window extends WindowEthereum {}
}

export const WalletErrorCode = {
  USER_REJECTED: '4001',
  UNAUTHORIZED: '4100',
  UNSUPPORTED_METHOD: '4200',
  DISCONNECTED: '4900',
  CHAIN_DISCONNECTED: '4901',
} as const;

export interface NetworkInfo {
  chainId: number;
  name: string;
  isSupported: boolean;
}

export const SUPPORTED_NETWORKS: Record<number, NetworkInfo> = {
  1: { chainId: 1, name: 'Ethereum Mainnet', isSupported: true },
  11155111: { chainId: 11155111, name: 'Ethereum Sepolia', isSupported: true },
  1337: { chainId: 1337, name: 'Hardhat', isSupported: true },
};
