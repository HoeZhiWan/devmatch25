'use client';

/**
 * Custom React hook for wallet connection and management
 * Provides wallet state, connection methods, and event handling
 */

import { useState, useEffect, useCallback } from 'react';
import { BrowserProvider } from 'ethers';
import type { WalletState, WalletConnectionResult } from '../types/wallet';
import {
  isMetaMaskInstalled,
  connectWallet,
  getConnectedAccounts,
  getCurrentChainId,
  setupWalletEventListeners,
  createProvider,
  isNetworkSupported
} from '../lib/wallet/connection';

const initialWalletState: WalletState = {
  isConnected: false,
  address: null,
  provider: null,
  signer: null,
  chainId: null,
  isLoading: false,
  error: null
};

export const useWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>(initialWalletState);
  const [mounted, setMounted] = useState(false);

  /**
   * Updates the wallet state
   */
  const updateWalletState = useCallback((updates: Partial<WalletState>) => {
    setWalletState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Connects to MetaMask wallet
   */
  const connect = useCallback(async (): Promise<WalletConnectionResult> => {
    updateWalletState({ isLoading: true, error: null });

    try {
      const result = await connectWallet();
      
      if (!result.success) {
        updateWalletState({
          isLoading: false,
          error: result.error || 'Failed to connect wallet'
        });
        return result;
      }

      // Get provider and additional wallet info
      const provider = createProvider();
      if (!provider) {
        const error = 'Failed to create wallet provider';
        updateWalletState({ isLoading: false, error });
        return { success: false, error };
      }

      const signer = await provider.getSigner();
      const chainId = await getCurrentChainId();

      updateWalletState({
        isConnected: true,
        address: result.address!,
        provider,
        signer,
        chainId,
        isLoading: false,
        error: null
      });

      return result;

    } catch (error: any) {
      console.error('Connect wallet error:', error);
      const errorMessage = error.message || 'Failed to connect wallet';
      updateWalletState({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, [updateWalletState]);

  /**
   * Disconnects the wallet
   */
  const disconnect = useCallback(() => {
    updateWalletState(initialWalletState);
  }, [updateWalletState]);

  /**
   * Checks if wallet is already connected
   */
  const checkConnection = useCallback(async () => {
    try {
      const accounts = await getConnectedAccounts();
      
      if (accounts.length > 0) {
        const provider = createProvider();
        if (provider) {
          const signer = await provider.getSigner();
          const chainId = await getCurrentChainId();

          updateWalletState({
            isConnected: true,
            address: accounts[0],
            provider,
            signer,
            chainId,
            isLoading: false,
            error: null
          });
        }
      } else {
        updateWalletState({ isConnected: false, isLoading: false });
      }
    } catch (error) {
      console.error('Check connection error:', error);
      updateWalletState({ isLoading: false, error: 'Failed to check connection' });
    }
  }, [updateWalletState]);

  /**
   * Handles account changes
   */
  const handleAccountsChanged = useCallback(async (accounts: string[]) => {
    if (accounts.length === 0) {
      // Wallet disconnected
      disconnect();
    } else {
      // Account switched - need to update provider and signer too
      const newAddress = accounts[0].toLowerCase();
      
      try {
        const provider = createProvider();
        if (provider) {
          const signer = await provider.getSigner();
          updateWalletState({ 
            address: newAddress,
            provider,
            signer,
            isConnected: true 
          });
        } else {
          updateWalletState({ address: newAddress });
        }
      } catch (error) {
        console.error('Error updating wallet state after account change:', error);
        updateWalletState({ address: newAddress });
      }
    }
  }, [disconnect, updateWalletState]);

  /**
   * Handles chain changes
   */
  const handleChainChanged = useCallback(async (chainId: string) => {
    const newChainId = parseInt(chainId, 16);
    updateWalletState({ chainId: newChainId });

    // Check if network is supported
    if (!isNetworkSupported(newChainId)) {
      updateWalletState({
        error: `Unsupported network. Please switch to a supported network.`
      });
    } else {
      updateWalletState({ error: null });
    }
  }, [updateWalletState]);

  /**
   * Handles wallet connection events
   */
  const handleConnect = useCallback((connectInfo: { chainId: string }) => {
    console.log('Wallet connected:', connectInfo);
    checkConnection();
  }, [checkConnection]);

  /**
   * Handles wallet disconnection events
   */
  const handleDisconnect = useCallback((error: { code: number; message: string }) => {
    console.log('Wallet disconnected:', error);
    disconnect();
  }, [disconnect]);

  /**
   * Setup event listeners and initial connection check
   */
  useEffect(() => {
    setMounted(true);
    let cleanup: (() => void) | undefined;

    const initialize = async () => {
      // Check if MetaMask is installed (only on client)
      if (!isMetaMaskInstalled()) {
        updateWalletState({
          isLoading: false,
          error: 'MetaMask is not installed. Please install MetaMask to use this application.'
        });
        return;
      }

      // Setup event listeners
      cleanup = setupWalletEventListeners(
        handleAccountsChanged,
        handleChainChanged,
        handleConnect,
        handleDisconnect
      );

      // Check existing connection
      await checkConnection();
    };

    initialize();

    // Cleanup function
    return () => {
      if (cleanup) cleanup();
    };
  }, [
    checkConnection,
    handleAccountsChanged,
    handleChainChanged,
    handleConnect,
    handleDisconnect,
    updateWalletState
  ]);

  return {
    // State
    ...walletState,
    isMetaMaskInstalled: mounted ? isMetaMaskInstalled() : false,
    isNetworkSupported: walletState.chainId ? isNetworkSupported(walletState.chainId) : false,

    // Actions
    connect,
    disconnect,
    checkConnection
  };
};
