'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';

interface Role {
  id: string;
  label: string;
  description: string;
  color: string;
  route: string;
}

const roles: Role[] = [
  {
    id: 'parent',
    label: 'Parent',
    description: 'Authorize pickup persons for your children',
    color: 'bg-blue-100 border-blue-300 text-blue-800',
    route: '/dashboard'
  },
  {
    id: 'pickup',
    label: 'Pickup Person',
    description: 'Receive authorization and generate QR codes',
    color: 'bg-green-100 border-green-300 text-green-800',
    route: '/dashboard'
  },
  {
    id: 'staff',
    label: 'Staff Member',
    description: 'Scan QR codes and verify pickup authorizations',
    color: 'bg-purple-100 border-purple-300 text-purple-800',
    route: '/dashboard'
  }
];

interface Props {
  onAutoRegister?: () => void;
}

export default function FirebaseMetaMaskLogin({ onAutoRegister }: Props) {
  const router = useRouter();
  const { connect, isConnected, address, isLoading: walletLoading, error: walletError } = useWallet();
  const { login, isLoading: authLoading, error: authError, clearError } = useFirebaseAuth();
  
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const handleConnect = async () => {
    try {
      const result = await connect();
      if (result.success) {
        // Small delay to ensure state is updated
        setTimeout(() => {
          setShowRoleSelection(true);
        }, 100);
      }
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleLogin = async (role: 'parent' | 'pickup' | 'staff') => {
    try {
      setStatusMessage('');
      console.log('Login attempt - Wallet state:', { address, isConnected });
      
      // The login function now handles automatic registration internally
      const authUser = await login(role);
      
      // Check if this was a new user (could be detected by checking if login initially failed)
      if (authUser && onAutoRegister) {
        onAutoRegister();
      }
      
      const selectedRoleData = roles.find(r => r.id === role);
      if (selectedRoleData) {
        router.push(selectedRoleData.route);
      }
    } catch (error) {
      console.error('Login/Auto-registration failed:', error);
      setStatusMessage('');
      
      // At this point, if we get an error, it means both login and auto-registration failed
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('auto-registration failed')) {
        setStatusMessage('Account creation failed. Please try again.');
      }
    }
  };

  const handleRoleSubmit = async () => {
    if (!selectedRole) return;
    const role = selectedRole as 'parent' | 'pickup' | 'staff';
    await handleLogin(role);
  };

  const isLoading = walletLoading || authLoading;
  const currentError = walletError || authError;

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-600">
            Connect your MetaMask wallet to access DevMatch25
          </p>
        </div>

        {currentError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {currentError}
          </div>
        )}

        <button
          onClick={handleConnect}
          disabled={isLoading}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <span>🦊</span>
              <span>Connect MetaMask</span>
            </>
          )}
        </button>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Don't have MetaMask?{' '}
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600"
            >
              Install it here
            </a>
          </p>
        </div>
      </div>
    );
  }

  if (showRoleSelection) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Select Your Role
          </h2>
          <p className="text-gray-600 mb-2">
            Wallet: {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
          <p className="text-sm text-gray-500">
            Choose your role to sign in. If you're new, we'll create your account automatically.
          </p>
          <div className="mt-2 text-xs text-gray-400">
            Debug: Connected={String(isConnected)} | Address={address ? 'Yes' : 'No'}
          </div>
        </div>

        {currentError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {currentError}
          </div>
        )}

        {statusMessage && (
          <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded text-sm">
            {statusMessage}
          </div>
        )}

        <div className="space-y-3 mb-6">
          {roles.map((role) => (
            <label
              key={role.id}
              className={`block border-2 rounded-lg p-4 cursor-pointer transition-all ${
                selectedRole === role.id
                  ? role.color
                  : 'border-gray-200 hover:border-gray-300 bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="role"
                value={role.id}
                checked={selectedRole === role.id}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="sr-only"
              />
              <div className="font-medium text-sm">{role.label}</div>
              <div className="text-xs text-gray-600 mt-1">{role.description}</div>
            </label>
          ))}
        </div>

        <div className="space-y-3">
          <button
            onClick={handleRoleSubmit}
            disabled={!selectedRole || isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>
                  {authError?.includes('creating account automatically') ? 'Creating Account...' : 'Signing In...'}
                </span>
              </div>
            ) : (
              `Sign In as ${roles.find(r => r.id === selectedRole)?.label || 'Selected Role'}`
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
