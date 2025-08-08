'use client';

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from './useWallet';
import * as blockchain from '@/lib/blockchain';
import type { 
  AuthorizationData, 
  PickupEventData, 
  MerkleBatchData,
  TransactionResult,
  BatchAnchoringResult,
  VerificationResult 
} from '@/lib/blockchain/types';

interface UseBlockchainReturn {
  // State
  isLoading: boolean;
  error: string | null;
  contractStats: {
    authorizationCount: number;
    pickupEventCount: number;
    batchCount: number;
  };
  
  // Authorization functions
  createAuthorization: (authData: AuthorizationData) => Promise<TransactionResult>;
  verifyAuthorization: (authData: AuthorizationData) => Promise<VerificationResult>;
  revokeAuthorization: (authHash: string) => Promise<TransactionResult>;
  
  // Pickup event functions
  recordPickupEvent: (eventData: PickupEventData) => Promise<TransactionResult>;
  verifyPickupEvent: (eventData: PickupEventData, merkleProof: any) => Promise<VerificationResult>;
  
  // Merkle batch functions
  anchorMerkleBatch: (batchData: MerkleBatchData) => Promise<BatchAnchoringResult>;
  createBatch: (events: PickupEventData[], batchNumber: number) => any;
  
  // Utility functions
  clearError: () => void;
  getContractStats: () => Promise<void>;
}

export function useBlockchain(): UseBlockchainReturn {
  const walletHook = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contractStats, setContractStats] = useState({
    authorizationCount: 0,
    pickupEventCount: 0,
    batchCount: 0
  });

  // Get provider and signer from wallet hook
  const getProvider = useCallback(() => {
    if (!walletHook.provider) {
      throw new Error('Wallet provider not available');
    }
    return walletHook.provider;
  }, [walletHook.provider]);

  const getSigner = useCallback(() => {
    if (!walletHook.signer) {
      throw new Error('Wallet signer not available');
    }
    return walletHook.signer;
  }, [walletHook.signer]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Get contract statistics
  const getContractStats = useCallback(async () => {
    try {
      const provider = getProvider();
      const stats = await blockchain.getContractStats(provider);
      setContractStats(stats);
    } catch (err: any) {
      setError(err.message || 'Failed to get contract stats');
    }
  }, [getProvider]);

  // Create authorization on blockchain
  const createAuthorization = useCallback(async (authData: AuthorizationData): Promise<TransactionResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const signer = getSigner();
      const result = await blockchain.createAuthorizationOnChain(signer, authData);
      
      if (result.success) {
        // Refresh contract stats
        await getContractStats();
      } else {
        setError(result.error || 'Failed to create authorization');
      }
      
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create authorization on blockchain';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [getSigner, getContractStats]);

  // Verify authorization
  const verifyAuthorization = useCallback(async (authData: AuthorizationData): Promise<VerificationResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const provider = getProvider();
      const result = await blockchain.verifyAuthorizationWithTimestamp(authData, provider);
      
      if (!result.isValid) {
        setError(result.error || 'Authorization verification failed');
      }
      
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to verify authorization';
      setError(errorMessage);
      return {
        isValid: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [getProvider]);

  // Revoke authorization
  const revokeAuthorization = useCallback(async (authHash: string): Promise<TransactionResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const signer = getSigner();
      const result = await blockchain.revokeAuthorizationOnChain(signer, authHash);
      
      if (result.success) {
        // Refresh contract stats
        await getContractStats();
      } else {
        setError(result.error || 'Failed to revoke authorization');
      }
      
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to revoke authorization on blockchain';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [getSigner, getContractStats]);

  // Record pickup event on blockchain
  const recordPickupEvent = useCallback(async (eventData: PickupEventData): Promise<TransactionResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const signer = getSigner();
      const result = await blockchain.recordPickupEventOnChain(signer, eventData);
      
      if (result.success) {
        // Refresh contract stats
        await getContractStats();
      } else {
        setError(result.error || 'Failed to record pickup event');
      }
      
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to record pickup event on blockchain';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [getSigner, getContractStats]);

  // Verify pickup event
  const verifyPickupEvent = useCallback(async (eventData: PickupEventData, merkleProof: any): Promise<VerificationResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const provider = getProvider();
      const result = await blockchain.verifyPickupEventWithProof(eventData, merkleProof, provider);
      
      if (!result.isValid) {
        setError(result.error || 'Pickup event verification failed');
      }
      
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to verify pickup event';
      setError(errorMessage);
      return {
        isValid: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [getProvider]);

  // Anchor Merkle batch on blockchain
  const anchorMerkleBatch = useCallback(async (batchData: MerkleBatchData): Promise<BatchAnchoringResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const signer = getSigner();
      const result = await blockchain.anchorMerkleBatchOnChain(signer, batchData);
      
      if (result.success) {
        // Refresh contract stats
        await getContractStats();
      } else {
        setError(result.error || 'Failed to anchor Merkle batch');
      }
      
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to anchor Merkle batch on blockchain';
      setError(errorMessage);
      return {
        success: false,
        batchNumber: batchData.batchNumber,
        merkleRoot: batchData.merkleRoot,
        eventCount: batchData.eventCount,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [getSigner, getContractStats]);

  // Create batch (off-chain)
  const createBatch = useCallback((events: PickupEventData[], batchNumber: number) => {
    try {
      return blockchain.createBatch(events, batchNumber);
    } catch (err: any) {
      setError(err.message || 'Failed to create batch');
      return null;
    }
  }, []);

  // Load contract stats on mount
  useEffect(() => {
    if (walletHook.isConnected) {
      getContractStats();
    }
  }, [walletHook.isConnected, getContractStats]);

  return {
    // State
    isLoading,
    error,
    contractStats,
    
    // Authorization functions
    createAuthorization,
    verifyAuthorization,
    revokeAuthorization,
    
    // Pickup event functions
    recordPickupEvent,
    verifyPickupEvent,
    
    // Merkle batch functions
    anchorMerkleBatch,
    createBatch,
    
    // Utility functions
    clearError,
    getContractStats
  };
}
