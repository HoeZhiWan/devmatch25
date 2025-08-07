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

  // SSR safety check
  useEffect(() => {
    setMounted(true);
  }, []);

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
    // Prevent multiple simultaneous connection attempts
    if (walletState.isLoading) {
      return { success: false, error: 'Connection already in progress. Please wait.' };
    }

    updateWalletState({ isLoading: true, error: null });

    try {
      // Check if MetaMask is installed first
      if (!isMetaMaskInstalled()) {
        const error = 'MetaMask is not installed. Please install MetaMask to use this application.';
        updateWalletState({
          isLoading: false,
          error,
          isConnected: false,
          address: null,
          provider: null,
          signer: null,
          chainId: null
        });
        return { success: false, error };
      }

      const result = await connectWallet();
      
      if (!result.success) {
        updateWalletState({
          isLoading: false,
          error: result.error || 'Failed to connect wallet',
          isConnected: false,
          address: null,
          provider: null,
          signer: null,
          chainId: null
        });
        return result;
      }

      // Get provider and additional wallet info
      const provider = createProvider();
      if (!provider) {
        const error = 'Failed to create wallet provider';
        updateWalletState({ 
          isLoading: false, 
          error,
          isConnected: false,
          address: null,
          provider: null,
          signer: null,
          chainId: null
        });
        return { success: false, error };
      }

      try {
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
      } catch (signerError) {
        console.error('Error creating signer after connection:', signerError);
        
        // Still update with what we have, but note the signer issue
        const chainId = await getCurrentChainId();
        updateWalletState({
          isConnected: true,
          address: result.address!,
          provider,
          signer: null,
          chainId,
          isLoading: false,
          error: 'Connected but failed to create signer. Please try refreshing the page.'
        });

        return { 
          success: false, 
          error: 'Connected but failed to create signer. Please try refreshing the page.' 
        };
      }

    } catch (error: any) {
      console.error('Connect wallet error:', error);
      const errorMessage = error.message || 'Failed to connect wallet';
      updateWalletState({ 
        isLoading: false, 
        error: errorMessage,
        isConnected: false,
        address: null,
        provider: null,
        signer: null,
        chainId: null
      });
      return { success: false, error: errorMessage };
    }
  }, [walletState.isLoading, updateWalletState]);

  /**
   * Disconnects the wallet
   */
  const disconnect = useCallback(() => {
    updateWalletState({
      isConnected: false,
      address: null,
      provider: null,
      signer: null,
      chainId: null,
      isLoading: false,
      error: null
    });
  }, [updateWalletState]);

  /**
   * Checks if wallet is already connected
   */
  const checkConnection = useCallback(async () => {
    try {
      // First check if MetaMask is available
      if (!isMetaMaskInstalled()) {
        updateWalletState({
          isLoading: false,
          error: 'MetaMask is not installed. Please install MetaMask to use this application.'
        });
        return;
      }

      const accounts = await getConnectedAccounts();
      
      if (accounts.length > 0) {
        const provider = createProvider();
        if (provider) {
          try {
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
          } catch (signerError) {
            console.error('Error creating signer:', signerError);
            updateWalletState({
              isConnected: true,
              address: accounts[0],
              provider,
              signer: null,
              chainId: await getCurrentChainId(),
              isLoading: false,
              error: 'Failed to create signer. Please try reconnecting your wallet.'
            });
          }
        } else {
          updateWalletState({
            isConnected: false,
            isLoading: false,
            error: 'Failed to create wallet provider'
          });
        }
      } else {
        updateWalletState({ 
          isConnected: false, 
          address: null,
          provider: null,
          signer: null,
          chainId: null,
          isLoading: false,
          error: null
        });
      }
    } catch (error) {
      console.error('Check connection error:', error);
      updateWalletState({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to check connection',
        isConnected: false,
        address: null,
        provider: null,
        signer: null,
        chainId: null
      });
    }
  }, [updateWalletState]);

  /**
   * Handles account changes
   */
  const handleAccountsChanged = useCallback(async (accounts: string[]) => {
    if (accounts.length === 0) {
      // Wallet disconnected - reset all state
      updateWalletState({
        isConnected: false,
        address: null,
        provider: null,
        signer: null,
        chainId: null,
        isLoading: false,
        error: null
      });
    } else {
      // Account switched - need to update provider and signer too
      const newAddress = accounts[0].toLowerCase();
      
      try {
        const provider = createProvider();
        if (provider) {
          const signer = await provider.getSigner();
          const chainId = await getCurrentChainId();
          
          updateWalletState({ 
            address: newAddress,
            provider,
            signer,
            chainId,
            isConnected: true,
            error: null
          });
        } else {
          updateWalletState({ 
            address: newAddress,
            isConnected: true,
            provider: null,
            signer: null,
            error: 'Failed to create provider after account change'
          });
        }
      } catch (error) {
        console.error('Error updating wallet state after account change:', error);
        updateWalletState({ 
          address: newAddress,
          isConnected: true,
          error: error instanceof Error ? error.message : 'Failed to update wallet after account change'
        });
      }
    }
  }, [updateWalletState]);

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
    checkConnection();
  }, [checkConnection]);

  /**
   * Handles wallet disconnection events
   */
  const handleDisconnect = useCallback((error: { code: number; message: string }) => {
    disconnect();
  }, [disconnect]);

  /**
   * Setup event listeners and initial connection check
   */
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const initialize = async () => {
      // Only initialize after component has mounted
      if (!mounted) return;

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
    mounted, // Add mounted as dependency
    checkConnection,
    handleAccountsChanged,
    handleChainChanged,
    handleConnect,
    handleDisconnect,
    updateWalletState
  ]);

  // Safety check for server-side rendering
  if (!mounted) {
    return {
      isConnected: false,
      address: null,
      provider: null,
      signer: null,
      chainId: null,
      isLoading: true, // Show loading during hydration
      error: null,
      isMetaMaskInstalled: false,
      isNetworkSupported: false,
      connect: async () => ({ success: false, error: 'Not mounted' }),
      disconnect: () => {},
      checkConnection: async () => {}
    };
  }

  const returnValue = {
    // State
    isConnected: walletState.isConnected,
    address: walletState.address,
    provider: walletState.provider,
    signer: walletState.signer,
    chainId: walletState.chainId,
    isLoading: walletState.isLoading,
    error: walletState.error,
    
    // Computed state
    isMetaMaskInstalled: mounted ? isMetaMaskInstalled() : false,
    isNetworkSupported: walletState.chainId ? isNetworkSupported(walletState.chainId) : false,

    // Actions
    connect,
    disconnect,
    checkConnection
  };

  return returnValue;
};
