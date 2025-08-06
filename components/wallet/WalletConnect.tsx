'use client';

/**
 * WalletConnect Component
 * Handles MetaMask wallet connection UI and user interactions
 */

import React, { useState, useEffect } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { formatAddress } from '../../lib/wallet/connection';

interface WalletConnectProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
  showNetworkInfo?: boolean;
  className?: string;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({
  onConnect,
  onDisconnect,
  showNetworkInfo = true,
  className = ''
}) => {
  const [mounted, setMounted] = useState(false);
  const {
    isConnected,
    address,
    chainId,
    isLoading,
    error,
    isMetaMaskInstalled,
    isNetworkSupported: isCurrentNetworkSupported,
    connect,
    disconnect
  } = useWallet();

  // Ensure component is mounted before showing content to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle wallet connection
  const handleConnect = async () => {
    const result = await connect();
    if (result.success && onConnect && result.address) {
      onConnect(result.address);
    }
  };

  // Handle wallet disconnection
  const handleDisconnect = () => {
    disconnect();
    onDisconnect?.();
  };

  // Show loading state during hydration
  if (!mounted) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-center p-4">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="ml-2 text-gray-600">Loading wallet connection...</span>
        </div>
      </div>
    );
  }

  // If MetaMask is not installed
  if (!isMetaMaskInstalled) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-3">
          <div className="text-yellow-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-yellow-800">MetaMask Required</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Please install MetaMask to connect your wallet.
            </p>
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center mt-2 text-sm text-yellow-800 hover:text-yellow-900 font-medium underline"
            >
              Install MetaMask
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        {!isConnected ? (
          <button
            onClick={handleConnect}
            disabled={isLoading}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
                <span>Connect Wallet</span>
              </>
            )}
          </button>
        ) : (
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-800">
                {formatAddress(address!)}
              </span>
            </div>
            <button
              onClick={handleDisconnect}
              className="text-sm text-gray-600 hover:text-red-600 px-2 py-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              title="Disconnect Wallet"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Network Information */}
      {showNetworkInfo && isConnected && chainId && (
        <div className={`flex items-center space-x-2 text-sm ${
          isCurrentNetworkSupported
            ? 'text-green-700 bg-green-50 border border-green-200'
            : 'text-red-700 bg-red-50 border border-red-200'
        } px-3 py-2 rounded-lg`}>
          <div className={`w-2 h-2 rounded-full ${
            isCurrentNetworkSupported ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <span>
            Network: {chainId} {isCurrentNetworkSupported ? '(Supported)' : '(Unsupported)'}
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-red-800">Connection Error</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Unsupported Network Warning */}
      {isConnected && chainId && !isCurrentNetworkSupported && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-yellow-800">Unsupported Network</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Please switch to a supported network (Ethereum Mainnet, Sepolia, or Hardhat) to use all features.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
