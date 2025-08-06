/**
 * Core wallet integration utilities for MetaMask connection and management
 * Handles wallet detection, connection, and basic operations
 */

import { BrowserProvider } from 'ethers';
import type {
  WalletState,
  WalletConnectionResult,
  MetaMaskEthereumProvider,
  NetworkInfo,
  WalletError,
} from '../../types/wallet';
import { WalletErrorCode, SUPPORTED_NETWORKS } from '../../types/wallet';

/**
 * Checks if MetaMask is installed in the browser
 */
export const isMetaMaskInstalled = (): boolean => {
  return typeof window !== 'undefined' && 
         typeof window.ethereum !== 'undefined' && 
         Boolean((window.ethereum as MetaMaskEthereumProvider)?.isMetaMask);
};

/**
 * Gets the MetaMask provider instance
 */
export const getMetaMaskProvider = (): MetaMaskEthereumProvider | null => {
  if (typeof window === 'undefined' || !window.ethereum) {
    return null;
  }
  return window.ethereum as MetaMaskEthereumProvider;
};

/**
 * Creates a BrowserProvider instance from MetaMask
 */
export const createProvider = (): BrowserProvider | null => {
  try {
    const ethereum = getMetaMaskProvider();
    if (!ethereum) return null;
    return new BrowserProvider(ethereum);
  } catch (error) {
    console.error('Failed to create provider:', error);
    return null;
  }
};

/**
 * Connects to MetaMask wallet
 */
export const connectWallet = async (): Promise<WalletConnectionResult> => {
  try {
    if (!isMetaMaskInstalled()) {
      return {
        success: false,
        error: 'MetaMask is not installed. Please install MetaMask to continue.'
      };
    }

    const ethereum = getMetaMaskProvider();
    if (!ethereum) {
      return {
        success: false,
        error: 'Failed to access MetaMask provider.'
      };
    }

    // Request account access
    const accounts = await ethereum.request({
      method: 'eth_requestAccounts'
    }) as string[];

    if (!accounts || accounts.length === 0) {
      return {
        success: false,
        error: 'No accounts found. Please make sure MetaMask is unlocked.'
      };
    }

    const address = accounts[0].toLowerCase();
    return {
      success: true,
      address
    };

  } catch (error: any) {
    console.error('Failed to connect wallet:', error);
    
    // Handle specific MetaMask errors
    if (error.code === WalletErrorCode.USER_REJECTED) {
      return {
        success: false,
        error: 'Connection was rejected. Please approve the connection request.'
      };
    }

    return {
      success: false,
      error: error.message || 'Failed to connect to wallet.'
    };
  }
};

/**
 * Gets the current connected accounts
 */
export const getConnectedAccounts = async (): Promise<string[]> => {
  try {
    const ethereum = getMetaMaskProvider();
    if (!ethereum) return [];

    const accounts = await ethereum.request({
      method: 'eth_accounts'
    }) as string[];

    return accounts.map(addr => addr.toLowerCase());
  } catch (error) {
    console.error('Failed to get connected accounts:', error);
    return [];
  }
};

/**
 * Gets the current network chain ID
 */
export const getCurrentChainId = async (): Promise<number | null> => {
  try {
    const ethereum = getMetaMaskProvider();
    if (!ethereum) return null;

    const chainId = await ethereum.request({
      method: 'eth_chainId'
    }) as string;

    return parseInt(chainId, 16);
  } catch (error) {
    console.error('Failed to get chain ID:', error);
    return null;
  }
};

/**
 * Checks if the current network is supported
 */
export const isNetworkSupported = (chainId: number): boolean => {
  return chainId in SUPPORTED_NETWORKS;
};

/**
 * Gets network information for a given chain ID
 */
export const getNetworkInfo = (chainId: number): NetworkInfo => {
  return SUPPORTED_NETWORKS[chainId] || {
    chainId,
    name: `Unknown Network (${chainId})`,
    isSupported: false
  };
};

/**
 * Validates an Ethereum address format
 */
export const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Formats an address for display (first 6 + last 4 characters)
 */
export const formatAddress = (address: string): string => {
  if (!address || !isValidAddress(address)) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Sets up event listeners for wallet events
 */
export const setupWalletEventListeners = (
  onAccountsChanged: (accounts: string[]) => void,
  onChainChanged: (chainId: string) => void,
  onConnect: (connectInfo: { chainId: string }) => void,
  onDisconnect: (error: { code: number; message: string }) => void
): (() => void) => {
  const ethereum = getMetaMaskProvider();
  if (!ethereum) {
    return () => {}; // Return empty cleanup function
  }

  const handleAccountsChanged = (accounts: unknown) => {
    const accountList = (accounts as string[]).map(addr => addr.toLowerCase());
    onAccountsChanged(accountList);
  };

  const handleChainChanged = (chainId: unknown) => {
    onChainChanged(chainId as string);
  };

  const handleConnect = (connectInfo: unknown) => {
    onConnect(connectInfo as { chainId: string });
  };

  const handleDisconnect = (error: unknown) => {
    onDisconnect(error as { code: number; message: string });
  };

  // Add event listeners
  ethereum.on('accountsChanged', handleAccountsChanged);
  ethereum.on('chainChanged', handleChainChanged);
  ethereum.on('connect', handleConnect);
  ethereum.on('disconnect', handleDisconnect);

  // Return cleanup function
  return () => {
    ethereum.removeListener('accountsChanged', handleAccountsChanged);
    ethereum.removeListener('chainChanged', handleChainChanged);
    ethereum.removeListener('connect', handleConnect);
    ethereum.removeListener('disconnect', handleDisconnect);
  };
};

/**
 * Creates a wallet error object with consistent formatting
 */
export const createWalletError = (
  type: WalletError['type'],
  message: string,
  code?: string
): WalletError => {
  return {
    type,
    message,
    code: code || 'UNKNOWN'
  };
};
