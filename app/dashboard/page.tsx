'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useFirebaseAuth } from "../../hooks/useFirebaseAuth";
import ParentDashboard from "../../components/ParentDashboard";
import StaffDashboard from "../../components/StaffDashboard";
import PickupDashboard from "../../components/PickupDashboard";

export default function Dashboard() {
  const router = useRouter();
  const { user, isAuthenticated, logout, isLoading } = useFirebaseAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-slate-600 text-lg">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Will be redirected by useEffect
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'parent':
        return '👨‍👩‍👧‍👦';
      case 'staff':
        return '👩‍🏫';
      case 'pickup':
        return '🚗';
      default:
        return '👤';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'parent':
        return 'from-blue-500 to-blue-600';
      case 'staff':
        return 'from-green-500 to-green-600';
      case 'pickup':
        return 'from-purple-500 to-purple-600';
      default:
        return 'from-slate-500 to-slate-600';
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
            
            {/* User Profile */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 bg-gradient-to-r ${getRoleColor(user.role)} rounded-xl flex items-center justify-center`}>
                  <span className="text-white text-lg">
                    {getRoleIcon(user.role)}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-slate-700">
                    {user.wallet.slice(0, 6)}...{user.wallet.slice(-4)}
                  </div>
                  <div className="text-xs text-slate-500 capitalize">
                    {user.role}
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
                disabled={isLoading}
              >
                {isLoading ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Title */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className={`w-12 h-12 bg-gradient-to-r ${getRoleColor(user.role)} rounded-xl flex items-center justify-center`}>
              <span className="text-white text-xl">
                {getRoleIcon(user.role)}
              </span>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-900">
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard
              </h2>
              <p className="text-slate-600">
                Welcome back! Here's your personalized interface for managing child pickups.
              </p>
            </div>
          </div>
        </div>

        {/* Role-based Dashboard Content */}
        <div className="space-y-8">
          {user.role === 'parent' && <ParentDashboard />}
          {user.role === 'staff' && <StaffDashboard />}
          {user.role === 'pickup' && <PickupDashboard />}
          
          {/* Fallback for unknown roles */}
          {!['parent', 'staff', 'pickup'].includes(user.role) && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-slate-500 to-slate-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-2xl">❓</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Unknown Role: {user.role}
              </h3>
              <p className="text-slate-600 mb-6">
                Your account role is not recognized. Please contact support for assistance.
              </p>
              <button
                onClick={handleLogout}
                className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium"
              >
                Logout and Try Again
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
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
