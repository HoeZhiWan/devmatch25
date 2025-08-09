'use client';

import React, { useState } from 'react';
import { DashboardTab, PickupHistory } from '../../../types/dashboard';
import BaseDashboard from '../BaseDashboard';
import StaffPickupValidationTab from './StaffPickupValidationTab';
import StaffPickupLogsTab from './StaffPickupLogsTab';
import StaffManagementTab from './StaffManagementTab';

const STAFF_TABS: DashboardTab[] = [
  { 
    key: 'pickup', 
    label: 'Validate Pickup', 
  },
  { 
    key: 'history', 
    label: 'Pickup History', 
  },
  { 
    key: 'management', 
    label: 'Management', 
  },
];

const StaffDashboardSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState(STAFF_TABS[0].key);
  const [newPickups, setNewPickups] = useState<PickupHistory[]>([]);

  const handlePickupComplete = (pickup: PickupHistory) => {
    setNewPickups(prev => [pickup, ...prev]);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'pickup':
        return <StaffPickupValidationTab onPickupComplete={handlePickupComplete} />;
      case 'history':
        return <StaffPickupLogsTab newPickups={newPickups} />;
      case 'management':
        return <StaffManagementTab />;
      default:
        return <StaffPickupValidationTab onPickupComplete={handlePickupComplete} />;
    }
  };

  return (
    <BaseDashboard
      tabs={STAFF_TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {renderTabContent()}
    </BaseDashboard>
  );
};

export default StaffDashboardSection;
