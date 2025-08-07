'use client';

import { signInWithCustomToken, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './config';
import { ethers } from 'ethers';

export interface AuthUser {
  uid: string;
  wallet: string;
  role: 'parent' | 'pickup' | 'staff';
  firebaseUser: User;
}

export interface SignaturePayload {
  wallet: string;
  message: string;
  signature: string;
  role: 'parent' | 'pickup' | 'staff';
  timestamp: number;
  nonce: string;
}

export class FirebaseAuthService {
  /**
   * Creates a signature message for wallet authentication
   */
  static createSignatureMessage(wallet: string, role: string, nonce: string): string {
    const timestamp = Math.floor(Date.now() / 1000);
    return `Welcome to DevMatch25!

Sign this message to authenticate your ${role} role.

Wallet: ${wallet.toLowerCase()}
Role: ${role}
Nonce: ${nonce}
Timestamp: ${timestamp}

This request will not trigger a blockchain transaction or cost any gas fees.`;
  }

  /**
   * Generates a random nonce for signature security
   */
  static generateNonce(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Verifies a wallet signature client-side (for immediate feedback)
   */
  static async verifyWalletSignature(
    message: string, 
    signature: string, 
    expectedWallet: string
  ): Promise<boolean> {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === expectedWallet.toLowerCase();
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Registers a new user with wallet signature
   */
  static async registerWithSignature(payload: SignaturePayload): Promise<AuthUser> {
    try {
      // Verify signature first
      const isValidSignature = await this.verifyWalletSignature(
        payload.message,
        payload.signature,
        payload.wallet
      );

      if (!isValidSignature) {
        throw new Error('Invalid signature');
      }

      // Register user and get custom token from server
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet: payload.wallet.toLowerCase(),
          role: payload.role,
          signature: payload.signature,
          message: payload.message,
          nonce: payload.nonce,
          timestamp: payload.timestamp
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Register API error:', { status: response.status, error });
        throw new Error(error.error || error.message || 'Registration failed');
      }

      const { customToken } = await response.json();

      // Sign in with custom token
      const userCredential = await signInWithCustomToken(auth, customToken);
      
      return {
        uid: userCredential.user.uid,
        wallet: payload.wallet.toLowerCase(),
        role: payload.role,
        firebaseUser: userCredential.user
      };

    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  /**
   * Authenticates existing user with wallet signature
   */
  static async authenticateWithSignature(payload: SignaturePayload): Promise<AuthUser> {
    try {
      // Verify signature first
      const isValidSignature = await this.verifyWalletSignature(
        payload.message,
        payload.signature,
        payload.wallet
      );

      if (!isValidSignature) {
        throw new Error('Invalid signature');
      }

      // Check timestamp (5 minutes tolerance)
      const currentTime = Math.floor(Date.now() / 1000);
      if (currentTime - payload.timestamp > 300) {
        throw new Error('Signature expired');
      }

      // Get custom token from server
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet: payload.wallet.toLowerCase(),
          signature: payload.signature,
          message: payload.message,
          nonce: payload.nonce,
          timestamp: payload.timestamp
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Login API error:', { status: response.status, error });
        throw new Error(error.error || error.message || 'Authentication failed');
      }

      const { customToken, role } = await response.json();

      // Sign in with custom token
      const userCredential = await signInWithCustomToken(auth, customToken);
      
      return {
        uid: userCredential.user.uid,
        wallet: payload.wallet.toLowerCase(),
        role: role,
        firebaseUser: userCredential.user
      };

    } catch (error) {
      console.error('Authentication failed:', error);
      throw error;
    }
  }

  /**
   * Signs out the current user
   */
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw new Error('Failed to sign out');
    }
  }

  /**
   * Gets the current authenticated user
   */
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  /**
   * Listens for auth state changes
   */
  static onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }

  /**
   * Checks if user is authenticated
   */
  static isAuthenticated(): boolean {
    return !!auth.currentUser;
  }

  /**
   * Gets the current user's custom claims
   */
  static async getUserClaims(): Promise<any> {
    try {
      const user = auth.currentUser;
      if (!user) return null;

      const idTokenResult = await user.getIdTokenResult();
      return idTokenResult.claims;
    } catch (error) {
      console.error('Error getting user claims:', error);
      return null;
    }
  }
}

// Legacy functions for backward compatibility
export const signInWithWallet = async (customToken: string): Promise<boolean> => {
  try {
    await signInWithCustomToken(auth, customToken);
    return true;
  } catch (error) {
    console.error('Error signing in with custom token:', error);
    return false;
  }
};

export const signOutWallet = async (): Promise<boolean> => {
  try {
    await FirebaseAuthService.signOut();
    return true;
  } catch (error) {
    return false;
  }
};

export const getCurrentUser = () => {
  return FirebaseAuthService.getCurrentUser();
};

export const waitForAuthState = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const unsubscribe = FirebaseAuthService.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(!!user);
    });
  });
};
