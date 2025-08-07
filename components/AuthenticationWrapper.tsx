'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import WalletConnection from './WalletConnection';
import RoleSelection, { UserRole } from './RoleSelection';

interface AuthenticationWrapperProps {
  onAuthenticated?: (user: any) => void;
  autoSignIn?: boolean;
  redirectOnSuccess?: string;
}

export const AuthenticationWrapper: React.FC<AuthenticationWrapperProps> = ({
  onAuthenticated,
  autoSignIn = true,
  redirectOnSuccess = '/dashboard'
}) => {
  const router = useRouter();
  const wallet = useWallet();
  const auth = useFirebaseAuth();
  
  const [authState, setAuthState] = useState<'connecting' | 'role-selection' | 'authenticating' | 'authenticated' | 'error' | 'manual-signin'>('connecting');
  const [authError, setAuthError] = useState<string | null>(null);
  const [hasAttemptedAutoSignIn, setHasAttemptedAutoSignIn] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);

  // Clear errors when wallet state changes
  useEffect(() => {
    setAuthError(null);
    auth.clearError();
  }, [wallet.address, auth.clearError]);

  // Handle successful authentication
  useEffect(() => {
    if (auth.isAuthenticated && auth.user) {
      setAuthState('authenticated');
      if (onAuthenticated) {
        onAuthenticated(auth.user);
      }
      if (redirectOnSuccess) {
        router.push(redirectOnSuccess);
      }
    }
  }, [auth.isAuthenticated, auth.user, onAuthenticated, redirectOnSuccess, router]);

  // Auto sign-in with delay when wallet is connected
  useEffect(() => {
    let countdownInterval: NodeJS.Timeout | null = null;
    let signInTimeout: NodeJS.Timeout | null = null;
    let signerCheckInterval: NodeJS.Timeout | null = null;
    let isCancelled = false;

    const attemptAutoSignIn = async () => {
      // Only attempt auto sign-in if:
      // 1. Auto sign-in is enabled
      // 2. We haven't already attempted it
      // 3. Wallet is actually connected with an address AND signer
      // 4. Auth is not currently loading
      // 5. Not already in authentication process
      if (!autoSignIn || hasAttemptedAutoSignIn || !wallet.isConnected || !wallet.address || !wallet.signer || auth.isLoading || isCancelled) {
        return;
      }

      // Start countdown before attempting auto sign-in
      setAuthState('connecting');
      setCountdown(3);
      
      // Countdown timer
      countdownInterval = setInterval(() => {
        if (isCancelled) {
          if (countdownInterval) clearInterval(countdownInterval);
          return;
        }
        
        setCountdown(prev => {
          if (prev <= 1) {
            if (countdownInterval) clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Wait for countdown to finish, then check for signer availability
      signInTimeout = setTimeout(async () => {
        if (isCancelled) return;
        
        setHasAttemptedAutoSignIn(true);
        setAuthState('authenticating');
        setAuthError(null);

        // Check if signer is available, if not wait a bit more
        let signerWaitTime = 0;
        const maxWaitTime = 5000; // 5 seconds max wait for signer
        
        const waitForSigner = () => {
          return new Promise<boolean>((resolve) => {
            const checkSigner = () => {
              if (isCancelled) {
                resolve(false);
                return;
              }
              
              if (wallet.signer) {
                resolve(true);
                return;
              }
              
              if (signerWaitTime >= maxWaitTime) {
                resolve(false);
                return;
              }
              
              signerWaitTime += 500;
              setTimeout(checkSigner, 500);
            };
            
            checkSigner();
          });
        };

        const signerAvailable = await waitForSigner();
        
        if (!signerAvailable) {
          setAuthError('Wallet signer not ready. Please try signing in manually.');
          setAuthState('manual-signin');
          return;
        }

        try {
          // Try to login with any role first (backend will return the user's actual role)
          // Pass wallet details explicitly to avoid hook sync issues
          const authUser = await auth.login('staff', { 
            address: wallet.address!, 
            signer: wallet.signer! 
          });
          
          if (!isCancelled) {
            setAuthState('authenticated');
          }
          
        } catch (error) {
          if (isCancelled) return;
          
          const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
          
          // Check if this is a new user error
          if (errorMessage.includes('User not found') || 
              errorMessage.includes('not found') || 
              errorMessage.includes('does not exist')) {
            setAuthState('role-selection');
          } else {
            setAuthError(errorMessage);
            setAuthState('manual-signin'); // Show manual sign-in button instead of error state
          }
        }
      }, 3000); // 3 second delay
    };

    attemptAutoSignIn();

    // Cleanup function
    return () => {
      isCancelled = true;
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
      if (signInTimeout) {
        clearTimeout(signInTimeout);
      }
      if (signerCheckInterval) {
        clearInterval(signerCheckInterval);
      }
    };
  }, [wallet.isConnected, wallet.address, wallet.signer, autoSignIn, hasAttemptedAutoSignIn]);

  // Reset auto sign-in attempt when wallet disconnects
  useEffect(() => {
    if (!wallet.isConnected) {
      setHasAttemptedAutoSignIn(false);
      setAuthState('connecting');
      setCountdown(0);
    }
  }, [wallet.isConnected]);

  const handleWalletConnectionChange = useCallback((isConnected: boolean, address?: string) => {
    if (!isConnected) {
      setAuthState('connecting');
      setAuthError(null);
      setHasAttemptedAutoSignIn(false);
    }
  }, []);

  const handleManualSignIn = useCallback(async () => {
    // Prevent multiple simultaneous sign-in attempts
    if (auth.isLoading) {
      return;
    }
    
    // Check if wallet and signer are available
    if (!wallet.isConnected || !wallet.address) {
      setAuthError('Wallet not connected. Please connect your wallet first.');
      return;
    }
    
    if (!wallet.signer) {
      setAuthError('Wallet signer not available. Please reconnect your wallet.');
      return;
    }
    
    setAuthState('authenticating');
    setAuthError(null);
    
    try {
      // Pass wallet details explicitly to avoid hook sync issues
      const authUser = await auth.login('staff', { 
        address: wallet.address!, 
        signer: wallet.signer! 
      });
      setAuthState('authenticated');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      
      // Check if this is a new user error
      if (errorMessage.includes('User not found') || 
          errorMessage.includes('not found') || 
          errorMessage.includes('does not exist')) {
        setAuthState('role-selection');
      } else {
        setAuthError(errorMessage);
        setAuthState('manual-signin');
      }
    }
  }, [auth, wallet]);

  const handleRoleSelection = useCallback(async (role: UserRole) => {
    setAuthState('authenticating');
    setAuthError(null);
    
    try {
      const authUser = await auth.login(role);
      
      setAuthState('authenticated');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setAuthError(errorMessage);
      setAuthState('error');
    }
  }, [auth]);

  const handleRetry = useCallback(() => {
    setAuthError(null);
    setHasAttemptedAutoSignIn(false);
    setCountdown(0);
    
    if (wallet.isConnected) {
      setAuthState('authenticating');
    } else {
      setAuthState('connecting');
    }
  }, [wallet.isConnected]);

  const getStatusMessage = () => {
    if (!wallet.isMetaMaskInstalled) {
      return 'MetaMask not detected. Please install MetaMask extension.';
    }
    
    switch (authState) {
      case 'connecting':
        if (wallet.isLoading) {
          return 'Checking wallet connection...';
        }
        if (countdown > 0) {
          return `Wallet connected. Starting sign-in in ${countdown} seconds...`;
        }
        return wallet.isConnected ? 'Wallet connected. Preparing to sign in...' : 'Connect your wallet to continue';
      case 'authenticating':
        return 'Signing in with your wallet... Please confirm any MetaMask prompts.';
      case 'role-selection':
        return 'Please select your role to complete setup';
      case 'authenticated':
        return 'Successfully authenticated!';
      case 'manual-signin':
        return 'Auto sign-in failed. Click the button below to sign in manually.';
      case 'error':
        return 'Authentication failed. Please try again.';
      default:
        return 'Initializing authentication...';
    }
  };

  const getStatusColor = () => {
    switch (authState) {
      case 'authenticated':
        return 'text-green-600';
      case 'error':
      case 'manual-signin':
        return 'text-red-600';
      case 'authenticating':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  if (authState === 'role-selection') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <RoleSelection
          onRoleSelect={handleRoleSelection}
          isLoading={auth.isLoading}
          error={authError || auth.error}
          title="Welcome! Select Your Role"
          description="We couldn't find an existing account for your wallet. Please select your role to get started."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">D</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              DevMatch25
            </h1>
            <p className="text-gray-600">
              Secure Wallet-Based Authentication
            </p>
          </div>

          {/* Status */}
          <div className="mb-6 text-center">
            <p className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusMessage()}
            </p>
            
            {authState === 'authenticating' && (
              <div className="mt-2 flex justify-center">
                <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
          </div>

          {/* Error Messages */}
          {(authError || auth.error) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <span className="text-red-500 mt-0.5">⚠️</span>
                <div className="flex-1">
                  <p className="text-red-700 text-sm">
                    {authError || auth.error}
                  </p>
                  {authState === 'error' && (
                    <button
                      onClick={handleRetry}
                      className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                    >
                      Try again
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Manual Sign-In Button */}
          {authState === 'manual-signin' && wallet.isConnected && (
            <div className="mb-6">
              <button
                onClick={handleManualSignIn}
                disabled={auth.isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
              >
                {auth.isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>🔐</span>
                    <span>Sign In with Wallet</span>
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 text-center mt-2">
                Click to manually authenticate with your connected wallet
              </p>
            </div>
          )}

          {/* Wallet Connection */}
          <WalletConnection
            onConnectionChange={handleWalletConnectionChange}
            showStatus={true}
            autoConnect={false}
          />

          {/* Network Warning */}
          {wallet.isConnected && !wallet.isNetworkSupported && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-yellow-500">⚠️</span>
                <p className="text-yellow-700 text-sm">
                  Unsupported network. Please switch to a supported network.
                </p>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-6 text-center space-y-3">
            {!wallet.isMetaMaskInstalled ? (
              <div className="text-sm text-gray-600">
                <p className="mb-2">MetaMask is required to use this application.</p>
                <p>
                  <a 
                    href="https://metamask.io/download/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Download MetaMask extension
                  </a>
                </p>
              </div>
            ) : !wallet.isConnected ? (
              <div className="text-sm text-gray-600">
                <p className="mb-2">Click "Connect Wallet" to link your MetaMask account.</p>
                <p className="text-xs text-gray-500">
                  Make sure MetaMask is unlocked and you have an account selected.
                </p>
              </div>
            ) : authState === 'connecting' && countdown === 0 ? (
              <div className="text-sm text-gray-600">
                <p>Wallet connected! Authentication will begin automatically.</p>
              </div>
            ) : authState === 'manual-signin' ? (
              <div className="text-sm text-gray-600">
                <p className="mb-2">Automatic sign-in was unsuccessful.</p>
                <p className="text-xs text-gray-500">
                  Use the button above to try signing in manually, or reconnect your wallet.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthenticationWrapper;
