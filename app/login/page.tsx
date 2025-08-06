'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from "next/image";
import { useFirebaseAuth } from "../../hooks/useFirebaseAuth";

export default function Login() {
  const router = useRouter();
  const { user, isAuthenticated, login, isLoading, error, clearError } = useFirebaseAuth();
  const [selectedRole, setSelectedRole] = useState<'parent' | 'staff' | 'pickup' | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user && !isLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, isLoading, router]);

  const handleRoleSelect = (role: 'parent' | 'staff' | 'pickup') => {
    setSelectedRole(role);
    setLoginError(null);
    clearError();
  };

  const handleLogin = async () => {
    if (!selectedRole) return;
    
    setLoginError(null);
    clearError();
    
    try {
      await login(selectedRole);
      // The useEffect hook will handle the redirect
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setLoginError(errorMessage);
    }
  };

  const handleBackToHome = () => {
    router.push('/');
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
            
            <button
              onClick={handleBackToHome}
              className="text-slate-600 hover:text-slate-800 font-medium"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </header>

      <main className="flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center">
            <Image
              src="/logo.jpg"
              alt="DevMatch25 Logo"
              width={120}
              height={120}
              className="mx-auto rounded-2xl shadow-lg"
              priority
            />
            <h2 className="mt-6 text-3xl font-bold text-slate-900">
              Welcome Back
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Connect your wallet and choose your role to continue
            </p>
          </div>

          {/* Role Selection */}
          {!selectedRole ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-8 space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Choose Your Role
                </h3>
                <p className="text-sm text-slate-600">
                  Select the role that matches your access level
                </p>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={() => handleRoleSelect('parent')}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-transparent rounded-xl hover:border-blue-300 hover:shadow-lg transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="text-white text-xl">👨‍👩‍👧‍👦</span>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-slate-900">Parent</div>
                      <div className="text-sm text-slate-600">Manage child pickups and authorize others</div>
                    </div>
                  </div>
                  <svg className="w-6 h-6 text-slate-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button
                  onClick={() => handleRoleSelect('staff')}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 border-2 border-transparent rounded-xl hover:border-green-300 hover:shadow-lg transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="text-white text-xl">👩‍🏫</span>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-slate-900">Staff</div>
                      <div className="text-sm text-slate-600">Verify pickups and scan QR codes</div>
                    </div>
                  </div>
                  <svg className="w-6 h-6 text-slate-400 group-hover:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button
                  onClick={() => handleRoleSelect('pickup')}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-transparent rounded-xl hover:border-purple-300 hover:shadow-lg transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="text-white text-xl">🚗</span>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-slate-900">Pickup Person</div>
                      <div className="text-sm text-slate-600">Generate QR codes for authorized pickups</div>
                    </div>
                  </div>
                  <svg className="w-6 h-6 text-slate-400 group-hover:text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            /* Wallet Connection */
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-8 space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <span className="text-white text-2xl">
                    {selectedRole === 'parent' && '👨‍👩‍👧‍👦'}
                    {selectedRole === 'staff' && '👩‍🏫'}
                    {selectedRole === 'pickup' && '🚗'}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Login as {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
                </h3>
                <p className="text-sm text-slate-600">
                  Connect your MetaMask wallet to authenticate
                </p>
              </div>

              {/* Error Display */}
              {(error || loginError) && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-red-500">⚠️</span>
                    <span className="text-red-800 text-sm">
                      {loginError || error}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <button
                  onClick={handleLogin}
                  disabled={isLoading}
                  className="w-full py-4 px-6 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Connecting Wallet...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <span>🦊</span>
                      <span>Connect with MetaMask</span>
                    </div>
                  )}
                </button>

                <button
                  onClick={() => setSelectedRole(null)}
                  className="w-full py-2 px-4 text-slate-600 hover:text-slate-800 font-medium"
                  disabled={isLoading}
                >
                  ← Change Role
                </button>
              </div>

              {/* MetaMask Instructions */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="font-medium text-slate-800 mb-2">Need MetaMask?</h4>
                <p className="text-sm text-slate-600 mb-3">
                  MetaMask is required to authenticate and sign transactions securely.
                </p>
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  <span>Download MetaMask</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
