'use client';

import React, { useState } from 'react';
import { useWallet } from '../../../hooks/useWallet';
import { useSignature } from '../../../hooks/useSignature';
import { DashboardTab } from '../../../types/dashboard';
import BaseDashboard from '../BaseDashboard';
import PickupAuthorizationsTab from './PickupAuthorizationsTab';
import PickupHistoryTab from './PickupHistoryTab';

const PICKUP_TABS: DashboardTab[] = [
  { 
    key: 'pickup', 
    label: 'Generate Pickup QR', 
  },
  { 
    key: 'history', 
    label: 'Pickup History', 
  },
];

const PickupDashboardSection: React.FC = () => {
  const { isConnected } = useWallet();
  const { error: signingError } = useSignature();
  const [activeTab, setActiveTab] = useState(PICKUP_TABS[0].key);

  const renderTabContent = () => {
    if (!isConnected) {
      return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-8 text-center">
          <div className="text-slate-400 text-6xl mb-4">🔒</div>
          <h3 className="text-xl font-medium text-slate-600 mb-2">Wallet Not Connected</h3>
          <p className="text-slate-500">Please connect your wallet to access the pickup dashboard.</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'pickup':
        return <PickupAuthorizationsTab />;
      case 'history':
        return <PickupHistoryTab />;
      default:
        return <PickupAuthorizationsTab />;
    }
  };

  return (
    <BaseDashboard
      tabs={PICKUP_TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      signingError={signingError}
    >
      {renderTabContent()}
    </BaseDashboard>
  );
};

export default PickupDashboardSection;
