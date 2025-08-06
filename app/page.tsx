'use client';

import { useState } from 'react';
import Image from "next/image";
import FirebaseMetaMaskLogin from "../components/FirebaseMetaMaskLogin";
import { useFirebaseAuth } from "../hooks/useFirebaseAuth";

export default function Home() {
  const { user, isAuthenticated, logout, isLoading } = useFirebaseAuth();

  const handleRoleNavigation = (userRole: string) => {
    switch (userRole) {
      case 'parent':
        window.location.href = '/parent';
        break;
      case 'staff':
        window.location.href = '/staff';
        break;
      case 'pickup':
        window.location.href = '/pickup';
        break;
      default:
        console.log('Unknown role:', userRole);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      {/* Header */}
      <header className="border-b border-slate-200/50 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                  DevMatch25
                </h1>
                <p className="text-sm text-slate-600">Secure Child Pickup System</p>
              </div>
            </div>
            
            {user && isAuthenticated && (
              <div className="text-right">
                <div className="text-sm text-slate-600">Connected as</div>
                <div className="font-mono text-sm bg-slate-100 px-3 py-1 rounded">
                  {user.wallet.slice(0, 6)}...{user.wallet.slice(-4)}
                </div>
                <div className="text-xs text-slate-500 capitalize">
                  {user.role}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!isAuthenticated ? (
          <div className="text-center space-y-12">
            {/* Hero Section */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                  Secure Child Pickup
                </h2>
                <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                  A blockchain-powered system ensuring safe and verified child pickup authorization 
                  using MetaMask wallet signatures and QR code verification.
                </p>
              </div>
              
              <div className="flex justify-center">
                <Image
                  src="/logo.jpg"
                  alt="DevMatch25 Logo"
                  width={200}
                  height={200}
                  className="rounded-2xl shadow-xl"
                  priority
                />
              </div>
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-800">Secure Authentication</h3>
                <p className="text-slate-600">Wallet-based authentication ensures only authorized users can access child pickup features.</p>
              </div>

              <div className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-800">Role-Based Access</h3>
                <p className="text-slate-600">Different interfaces for parents, staff, and authorized pickup persons with appropriate permissions.</p>
              </div>

              <div className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-800">QR Code Verification</h3>
                <p className="text-slate-600">Generate and scan QR codes for quick and secure pickup authorization verification.</p>
              </div>
            </div>

            {/* Login Section */}
            <div className="flex justify-center">
              <FirebaseMetaMaskLogin />
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-4 text-slate-600">Loading user profile...</p>
              </div>
            ) : user ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-8 text-center space-y-6">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-slate-800">Welcome!</h2>
                  <p className="text-slate-600">
                    You are logged in as: <span className="font-semibold capitalize text-indigo-600">{user.role}</span>
                  </p>
                  <div className="text-sm text-slate-500 font-mono bg-slate-100 px-3 py-1 rounded inline-block">
                    {user.wallet.slice(0, 6)}...{user.wallet.slice(-4)}
                  </div>
                </div>
                
                <button
                  onClick={() => handleRoleNavigation(user.role)}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                >
                  Go to {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard
                </button>

                <div className="pt-4 border-t border-slate-200">
                  <button
                    onClick={handleLogout}
                    className="text-slate-500 hover:text-slate-700 text-sm"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Logging out...' : 'Logout'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 text-center space-y-4">
                <h2 className="text-2xl font-semibold text-yellow-800">Authentication Error</h2>
                <p className="text-yellow-700">
                  There was an issue with your authentication. Please try connecting your wallet again.
                </p>
                <button
                  onClick={handleLogout}
                  className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200/50 bg-white/80 backdrop-blur-sm mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-slate-600">
            <p>&copy; 2025 DevMatch25. Secure Child Pickup System powered by blockchain technology.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
