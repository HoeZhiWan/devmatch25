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
  login: (fallbackRole: 'parent' | 'pickup' | 'staff', walletOverride?: { address: string; signer: any }) => Promise<AuthUser>;
  logout: () => Promise<void>;
  clearError: () => void;
  getIdToken: () => Promise<string | null>;
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

  const register = useCallback(async (role: 'parent' | 'pickup' | 'staff'): Promise<AuthUser> => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if wallet is connected and has required data
      if (!walletHook.isConnected || !walletHook.address) {
        throw new Error('Wallet not connected. Please connect your wallet first.');
      }

      if (!walletHook.signer) {
        throw new Error('Wallet signer not available. Please reconnect your wallet.');
      }

      const walletAddress = walletHook.address;
      const signer = walletHook.signer;

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

  const login = useCallback(async (fallbackRole: 'parent' | 'pickup' | 'staff', walletOverride?: { address: string; signer: any }): Promise<AuthUser> => {
    setIsLoading(true);
    setError(null);

    try {
      // Use provided wallet details or fall back to hook
      const walletToUse = walletOverride || walletHook;
      const isConnected = walletOverride ? true : walletHook.isConnected;
      const address = walletOverride?.address || walletHook.address;
      const signer = walletOverride?.signer || walletHook.signer;

      // Check if wallet is connected and has required data
      if (!isConnected || !address) {
        throw new Error('Wallet not connected. Please connect your wallet first.');
      }

      if (!signer) {
        throw new Error('Wallet signer not available. Please reconnect your wallet.');
      }

      const walletAddress = address;

      // First, check if user exists and get their actual role from Firebase
      let actualRole = fallbackRole;
      try {
        const userRole = await FirebaseAuthService.getUserRoleFromFirebase(walletAddress);
        if (userRole) {
          actualRole = userRole;
        }
      } catch (roleError) {
        // If we can't get the role, continue with the fallback role
        console.log('Could not fetch user role from Firebase, using fallback role:', fallbackRole);
      }

      // Create signed payload with the actual role
      const nonce = FirebaseAuthService.generateNonce();
      const message = FirebaseAuthService.createSignatureMessage(walletAddress, actualRole, nonce);
      const signature = await signer.signMessage(message);
      const timestamp = Math.floor(Date.now() / 1000);

      const payload: SignaturePayload = {
        wallet: walletAddress,
        message,
        signature,
        role: actualRole,
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
        
        if (errorMessage.includes('User not found') || 
            errorMessage.includes('not found') || 
            errorMessage.includes('does not exist')) {
          
          // Show a temporary status while auto-registering
          setError('New user detected - creating account automatically...');
          
          // For new users, use the fallback role for registration
          const registrationPayload: SignaturePayload = {
            wallet: walletAddress,
            message: FirebaseAuthService.createSignatureMessage(walletAddress, fallbackRole, nonce),
            signature: await signer.signMessage(FirebaseAuthService.createSignatureMessage(walletAddress, fallbackRole, nonce)),
            role: fallbackRole,
            timestamp,
            nonce
          };
          
          // Attempt automatic registration
          try {
            const authUser = await FirebaseAuthService.registerWithSignature(registrationPayload);
            setUser(authUser);
            setError(null); // Clear the temporary status message
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
  }, [walletHook]);

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

  const getIdToken = useCallback(async (): Promise<string | null> => {
    return await FirebaseAuthService.getIdToken();
  }, []);

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
    clearError,
    getIdToken
  };
}
