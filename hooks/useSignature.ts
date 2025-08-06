'use client';

/**
 * Custom React hook for signature operations
 * Handles message signing, verification, and authorization workflows
 */

import { useState, useCallback } from 'react';
import type {
  SignatureResult,
  AuthorizationMessage,
  SignatureVerificationParams,
  SignatureVerificationResult
} from '../types/wallet';
import {
  signMessage,
  verifySignature,
  createAndSignAuthorization,
  createAuthorizationMessage,
  validateAuthorizationMessage,
  parseAuthorizationMessage
} from '../lib/wallet/signature';
import { useWallet } from './useWallet';

interface UseSignatureState {
  isLoading: boolean;
  error: string | null;
  lastSignature: string | null;
  lastMessage: string | null;
}

const initialState: UseSignatureState = {
  isLoading: false,
  error: null,
  lastSignature: null,
  lastMessage: null
};

export const useSignature = () => {
  const { provider, address, isConnected } = useWallet();
  const [state, setState] = useState<UseSignatureState>(initialState);

  /**
   * Updates the signature state
   */
  const updateState = useCallback((updates: Partial<UseSignatureState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Signs a custom message
   */
  const sign = useCallback(async (message: string): Promise<SignatureResult> => {
    if (!isConnected || !provider) {
      return {
        success: false,
        error: 'Wallet is not connected. Please connect your wallet first.'
      };
    }

    updateState({ isLoading: true, error: null });

    try {
      const result = await signMessage(provider, message);
      
      if (result.success) {
        updateState({
          isLoading: false,
          lastSignature: result.signature!,
          lastMessage: result.message!
        });
      } else {
        updateState({
          isLoading: false,
          error: result.error || 'Failed to sign message'
        });
      }

      return result;

    } catch (error: any) {
      console.error('Sign message error:', error);
      const errorMessage = error.message || 'Failed to sign message';
      updateState({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, [isConnected, provider, updateState]);

  /**
   * Creates and signs an authorization message
   */
  const signAuthorization = useCallback(async (
    authParams: Omit<AuthorizationMessage, 'parentWallet' | 'timestamp'>
  ): Promise<SignatureResult> => {
    if (!isConnected || !provider || !address) {
      return {
        success: false,
        error: 'Wallet is not connected. Please connect your wallet first.'
      };
    }

    updateState({ isLoading: true, error: null });

    try {
      const completeAuthParams: AuthorizationMessage = {
        ...authParams,
        parentWallet: address,
        timestamp: Date.now()
      };

      const result = await createAndSignAuthorization(provider, completeAuthParams);
      
      if (result.success) {
        updateState({
          isLoading: false,
          lastSignature: result.signature!,
          lastMessage: result.message!
        });
      } else {
        updateState({
          isLoading: false,
          error: result.error || 'Failed to sign authorization'
        });
      }

      return result;

    } catch (error: any) {
      console.error('Sign authorization error:', error);
      const errorMessage = error.message || 'Failed to sign authorization';
      updateState({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, [isConnected, provider, address, updateState]);

  /**
   * Verifies a signature (client-side verification)
   */
  const verify = useCallback((params: SignatureVerificationParams): SignatureVerificationResult => {
    return verifySignature(params);
  }, []);

  /**
   * Creates a human-readable authorization message without signing
   */
  const createMessage = useCallback((
    authParams: Omit<AuthorizationMessage, 'parentWallet' | 'timestamp'>
  ): string => {
    if (!address) return '';

    const completeAuthParams: AuthorizationMessage = {
      ...authParams,
      parentWallet: address,
      timestamp: Date.now()
    };

    return createAuthorizationMessage(completeAuthParams);
  }, [address]);

  /**
   * Validates if a message is a valid authorization message
   */
  const validateMessage = useCallback((message: string): boolean => {
    return validateAuthorizationMessage(message);
  }, []);

  /**
   * Parses authorization data from a message
   */
  const parseMessage = useCallback((message: string): Partial<AuthorizationMessage> | null => {
    return parseAuthorizationMessage(message);
  }, []);

  /**
   * Clears the current state
   */
  const clearState = useCallback(() => {
    setState(initialState);
  }, []);

  /**
   * Checks if the current wallet address matches a given address
   */
  const isCurrentWallet = useCallback((walletAddress: string): boolean => {
    return address ? address.toLowerCase() === walletAddress.toLowerCase() : false;
  }, [address]);

  return {
    // State
    ...state,
    isWalletConnected: isConnected,
    currentWalletAddress: address,

    // Actions
    sign,
    signAuthorization,
    verify,
    createMessage,
    validateMessage,
    parseMessage,
    clearState,
    isCurrentWallet,

    // Utilities
    formatAddress: (addr: string) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '',
  };
};
