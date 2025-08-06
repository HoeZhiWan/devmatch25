'use client';

import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { useWallet } from './useWallet';
import { 
  FirebaseAuthService, 
  AuthUser, 
  SignaturePayload 
} from '@/lib/firebase/client-auth';

interface UseFirebaseAuthReturn {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (role: 'parent' | 'pickup' | 'staff') => Promise<AuthUser>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export function useFirebaseAuth(): UseFirebaseAuthReturn {
  const walletHook = useWallet();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = FirebaseAuthService.onAuthStateChanged(async (firebaseUser: User | null) => {
      if (firebaseUser) {
        try {
          // Get custom claims to extract wallet and role
          const claims = await FirebaseAuthService.getUserClaims();
          
          if (claims?.wallet && claims?.role) {
            setUser({
              uid: firebaseUser.uid,
              wallet: claims.wallet,
              role: claims.role,
              firebaseUser
            });
          } else {
            // If no claims, user might need to re-authenticate
            setUser(null);
          }
        } catch (error) {
          console.error('Error getting user claims:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Helper function to wait for wallet to be ready
  const waitForWalletReady = useCallback(async (maxWaitTime = 3000): Promise<{ address: string; signer: any }> => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      let attemptCount = 0;
      
      const checkWallet = async () => {
        attemptCount++;
        const { address, signer, isConnected, provider } = walletHook;
        
        console.log(`Wallet check attempt ${attemptCount}:`, { 
          address: !!address, 
          signer: !!signer, 
          isConnected,
          provider: !!provider 
        });
        
        // If we have address but no signer, try to create one
        if (address && !signer && provider) {
          try {
            console.log('Attempting to create signer from existing provider...');
            const newSigner = await provider.getSigner();
            if (newSigner) {
              console.log('Successfully created signer');
              resolve({ address, signer: newSigner });
              return;
            }
          } catch (error) {
            console.log('Failed to create signer:', error);
          }
        }
        
        // If we have both address and signer, we're good
        if (address && signer) {
          console.log('Wallet is ready');
          resolve({ address, signer });
          return;
        }
        
        // Check if we've exceeded max wait time
        if (Date.now() - startTime > maxWaitTime) {
          console.error('Wallet timeout. Final state:', { address: !!address, signer: !!signer, isConnected });
          reject(new Error(`Wallet not ready. Please ensure MetaMask is connected and try again.`));
          return;
        }
        
        // Check again in 200ms
        setTimeout(checkWallet, 200);
      };
      
      checkWallet();
    });
  }, [walletHook]);

  const register = useCallback(async (role: 'parent' | 'pickup' | 'staff'): Promise<AuthUser> => {
    setIsLoading(true);
    setError(null);

    try {
      let walletAddress: string;
      let signer: any;

      try {
        // First try the normal wait approach
        const walletReady = await waitForWalletReady();
        walletAddress = walletReady.address;
        signer = walletReady.signer;
      } catch (waitError) {
        console.log('waitForWalletReady failed, trying fallback approach...');
        
        // Fallback: use current wallet state directly
        const { address, signer: currentSigner } = walletHook;
        
        if (!address) {
          throw new Error('No wallet address found. Please connect your wallet.');
        }
        
        if (!currentSigner) {
          throw new Error('No signer available. Please reconnect your wallet.');
        }
        
        walletAddress = address;
        signer = currentSigner;
      }
      
      console.log('Register - Using wallet:', { walletAddress, signer: !!signer });

      // Create signed payload
      const nonce = FirebaseAuthService.generateNonce();
      const message = FirebaseAuthService.createSignatureMessage(walletAddress, role, nonce);
      const signature = await signer.signMessage(message);
      const timestamp = Math.floor(Date.now() / 1000);

      const payload: SignaturePayload = {
        wallet: walletAddress,
        message,
        signature,
        role,
        timestamp,
        nonce
      };

      const authUser = await FirebaseAuthService.registerWithSignature(payload);
      
      setUser(authUser);
      return authUser;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [walletHook]);

  const login = useCallback(async (role: 'parent' | 'pickup' | 'staff'): Promise<AuthUser> => {
    setIsLoading(true);
    setError(null);

    try {
      let walletAddress: string;
      let signer: any;

      try {
        // First try the normal wait approach
        const walletReady = await waitForWalletReady();
        walletAddress = walletReady.address;
        signer = walletReady.signer;
      } catch (waitError) {
        console.log('waitForWalletReady failed, trying fallback approach...');
        
        // Fallback: use current wallet state directly
        const { address, signer: currentSigner } = walletHook;
        
        if (!address) {
          throw new Error('No wallet address found. Please connect your wallet.');
        }
        
        if (!currentSigner) {
          throw new Error('No signer available. Please reconnect your wallet.');
        }
        
        walletAddress = address;
        signer = currentSigner;
      }
      
      console.log('Login - Using wallet:', { walletAddress, signer: !!signer });

      // Create signed payload
      const nonce = FirebaseAuthService.generateNonce();
      const message = FirebaseAuthService.createSignatureMessage(walletAddress, role, nonce);
      const signature = await signer.signMessage(message);
      const timestamp = Math.floor(Date.now() / 1000);

      const payload: SignaturePayload = {
        wallet: walletAddress,
        message,
        signature,
        role,
        timestamp,
        nonce
      };

      try {
        // Attempt login first
        const authUser = await FirebaseAuthService.authenticateWithSignature(payload);
        setUser(authUser);
        return authUser;
      } catch (loginError) {
        // Check if the error is due to user not found
        const errorMessage = loginError instanceof Error ? loginError.message : String(loginError);
        console.log('Login failed, checking if user needs registration:', errorMessage);
        
        if (errorMessage.includes('User not found') || 
            errorMessage.includes('not found') || 
            errorMessage.includes('does not exist')) {
          
          console.log('User not found, attempting automatic registration...');
          
          // Show a temporary status while auto-registering
          setError('New user detected - creating account automatically...');
          
          // Attempt automatic registration
          try {
            const authUser = await FirebaseAuthService.registerWithSignature(payload);
            setUser(authUser);
            setError(null); // Clear the temporary status message
            console.log('Successfully registered new user automatically');
            return authUser;
          } catch (registerError) {
            const registerErrorMessage = registerError instanceof Error ? registerError.message : String(registerError);
            console.error('Auto-registration failed:', registerErrorMessage);
            throw new Error(`Login failed and auto-registration failed: ${registerErrorMessage}`);
          }
        }
        
        // If it's not a "user not found" error, throw the original login error
        throw loginError;
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [waitForWalletReady, walletHook]);

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await FirebaseAuthService.signOut();
      setUser(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
    clearError
  };
}
