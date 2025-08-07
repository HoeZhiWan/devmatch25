'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useWallet } from '@/hooks/useWallet';

interface WalletConnectionProps {
  onConnectionChange?: (isConnected: boolean, address?: string) => void;
  showStatus?: boolean;
  autoConnect?: boolean;
}

export const WalletConnection: React.FC<WalletConnectionProps> = ({
  onConnectionChange,
  showStatus = true,
  autoConnect = false
}) => {
  const wallet = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);

  // Notify parent component of connection changes
  useEffect(() => {
    if (onConnectionChange) {
      onConnectionChange(wallet.isConnected, wallet.address || undefined);
    }
  }, [wallet.isConnected, wallet.address, onConnectionChange]);

  // Auto-connect on mount if requested
  useEffect(() => {
    if (autoConnect && !wallet.isConnected && !wallet.isLoading && wallet.isMetaMaskInstalled) {
      // Check if there are already connected accounts first
      const checkExistingConnection = async () => {
        try {
          await wallet.checkConnection();
        } catch (error) {
          console.error('Auto-connect: Error checking existing connection:', error);
        }
      };
      
      checkExistingConnection();
    }
  }, [autoConnect, wallet.isConnected, wallet.isLoading, wallet.isMetaMaskInstalled, wallet.checkConnection]);

  const handleConnect = useCallback(async () => {
    try {
      setIsConnecting(true);
      const result = await wallet.connect();
      
      if (!result.success) {
        console.error('Wallet connection failed:', result.error);
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
    } finally {
      setIsConnecting(false);
    }
  }, [wallet]);

  const handleDisconnect = useCallback(() => {
    wallet.disconnect();
  }, [wallet]);

  const getStatusColor = () => {
    if (wallet.isConnected) return 'text-green-600';
    if (wallet.error) return 'text-red-600';
    return 'text-gray-600';
  };

  const getStatusIcon = () => {
    if (wallet.isConnected) return '🟢';
    if (wallet.error) return '🔴';
    if (wallet.isLoading || isConnecting) return '🟡';
    return '⚪';
  };

  const getStatusText = () => {
    if (!wallet.isMetaMaskInstalled) {
      return 'MetaMask not installed';
    }
    if (wallet.isLoading || isConnecting) {
      return 'Connecting...';
    }
    if (wallet.isConnected && wallet.address) {
      return `Connected: ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`;
    }
    if (wallet.error) {
      return wallet.error;
    }
    return 'Ready to connect';
  };

  const getButtonText = () => {
    if (!wallet.isMetaMaskInstalled) {
      return 'Install MetaMask';
    }
    if (wallet.isLoading || isConnecting) {
      return 'Connecting...';
    }
    if (wallet.isConnected) {
      return 'Disconnect';
    }
    return 'Connect Wallet';
  };

  const handleButtonClick = () => {
    if (!wallet.isMetaMaskInstalled) {
      window.open('https://metamask.io/download/', '_blank');
      return;
    }
    if (wallet.isConnected) {
      handleDisconnect();
    } else {
      handleConnect();
    }
  };

  const isButtonDisabled = wallet.isLoading || isConnecting;

  return (
    <div className="wallet-connection">
      {showStatus && (
        <div className="mb-4">
          <div className={`flex items-center space-x-2 text-sm ${getStatusColor()}`}>
            <span>{getStatusIcon()}</span>
            <span>{getStatusText()}</span>
          </div>
          
          {wallet.isConnected && !wallet.isNetworkSupported && (
            <div className="mt-2 text-sm text-yellow-600">
              ⚠️ Unsupported network. Please switch to a supported network.
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleButtonClick}
        disabled={isButtonDisabled}
        className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
      >
        <span>
          {!wallet.isMetaMaskInstalled ? '🦊' : wallet.isConnected ? '🔌' : '🔐'}
        </span>
        <span>{getButtonText()}</span>
      </button>
    </div>
  );
};

export default WalletConnection;
