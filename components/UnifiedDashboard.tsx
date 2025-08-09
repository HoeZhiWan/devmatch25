'use client';

import React from 'react';
import { useWallet } from '../hooks/useWallet';
import { DashboardRole } from '../types/dashboard';
import ParentDashboardSection from './dashboard/parent/ParentDashboardSection';
import PickupDashboardSection from './dashboard/pickup/PickupDashboardSection';
import StaffDashboardSection from './dashboard/staff/StaffDashboardSection';

interface UnifiedDashboardProps {
  role: DashboardRole;
}

const UnifiedDashboard: React.FC<UnifiedDashboardProps> = ({ role }) => {
  const { isConnected } = useWallet();

  if (!isConnected) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-8 text-center">
        <div className="text-slate-400 text-6xl mb-4">🔒</div>
        <h3 className="text-xl font-medium text-slate-600 mb-2">Wallet Not Connected</h3>
        <p className="text-slate-500">Please connect your wallet to access the dashboard.</p>
      </div>
    );
  }

  switch (role) {
    case 'parent':
      return <ParentDashboardSection />;
    case 'pickup':
      return <PickupDashboardSection />;
    case 'staff':
      return <StaffDashboardSection />;
    default:
      return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-8 text-center">
          <div className="text-slate-400 text-6xl mb-4">❓</div>
          <h3 className="text-xl font-medium text-slate-600 mb-2">Unknown Role</h3>
          <p className="text-slate-500">The role "{role}" is not recognized.</p>
        </div>
      );
  }
};

export default UnifiedDashboard;
