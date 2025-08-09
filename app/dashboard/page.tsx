'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useFirebaseAuth } from "../../hooks/useFirebaseAuth";
import DashboardNavbar from '../../components/dashboard/DashboardNavbar';
import ParentDashboardSection from '../../components/dashboard/parent/ParentDashboardSection';
import StaffDashboardSection from '../../components/dashboard/staff/StaffDashboardSection';
import PickupDashboardSection from '../../components/dashboard/pickup/PickupDashboardSection';

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

  // ...existing code...

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <DashboardNavbar
        wallet={user.wallet}
        role={user.role}
        isLoading={isLoading}
        onLogout={handleLogout}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            {/* Role icon and dashboard title */}
            {/* You can further abstract this if needed */}
            <span className="text-3xl font-bold text-slate-900">
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard
            </span>
          </div>
        </div>
        <div className="space-y-8">
          {user.role === 'parent' && <ParentDashboardSection />}
          {user.role === 'staff' && <StaffDashboardSection />}
          {user.role === 'pickup' && <PickupDashboardSection />}
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
            <p>&copy; 2025 KidGuard. Secure Child Pickup System powered by blockchain technology.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
