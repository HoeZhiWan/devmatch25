import React, { useState } from 'react';
import { ethers } from 'ethers';
import { addUserToFirebase, getUserByWallet, UserRole } from '../lib/firebaseUtils';

interface MetaMaskLoginProps {
  onLogin?: (address: string) => void;
}

const MetaMaskLogin: React.FC<MetaMaskLoginProps> = ({ onLogin }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('parent');
  const [userName, setUserName] = useState('');

  const connectWallet = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!window.ethereum) {
        setError('MetaMask is not installed.');
        setLoading(false);
        return;
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const userAddress = accounts[0];
      setAddress(userAddress);
      
      // Check if user exists in Firebase
      const existingUser = await getUserByWallet(userAddress);
      
      if (!existingUser) {
        // New user - show role selection
        setShowRoleSelection(true);
      } else {
        // Existing user - proceed to login
        if (onLogin) onLogin(userAddress);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelection = async () => {
    if (!address || !userName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    try {
      // Add user to Firebase
      const success = await addUserToFirebase({
        walletAddress: address,
        role: selectedRole,
        name: userName.trim()
      });

      if (success) {
        setShowRoleSelection(false);
        if (onLogin) onLogin(address);
      } else {
        setError('Failed to save user data');
      }
    } catch (err: any) {
      setError('Failed to save user data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 border rounded-xl shadow-lg bg-white/90 max-w-sm mx-auto">
      <div className="mb-3 flex items-center gap-2">
        <img src="https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg" alt="MetaMask" className="w-8 h-8" />
        <h2 className="text-xl font-bold text-indigo-700">MetaMask Login</h2>
      </div>
      
      {address && !showRoleSelection ? (
        <div className="text-green-600 font-mono mb-2 text-center">
          Connected:<br />
          <span className="break-all">{address}</span>
        </div>
      ) : !showRoleSelection ? (
        <button
          onClick={connectWallet}
          className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-lg font-semibold shadow hover:from-indigo-600 hover:to-blue-600 transition disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Connecting...' : 'Connect MetaMask'}
        </button>
      ) : (
        <div className="w-full space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Your Role
            </label>
            <select
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
            >
              <option value="parent">Parent</option>
              <option value="staff">Staff</option>
              <option value="pickup">Pickup Person</option>
            </select>
          </div>
          
          <button
            onClick={handleRoleSelection}
            className="w-full px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold shadow hover:from-green-600 hover:to-emerald-600 transition disabled:opacity-50"
            disabled={loading || !userName.trim()}
          >
            {loading ? 'Saving...' : 'Save & Continue'}
          </button>
        </div>
      )}
      
      {error && <div className="text-red-500 mt-2 text-center">{error}</div>}
    </div>
  );
};

export default MetaMaskLogin;