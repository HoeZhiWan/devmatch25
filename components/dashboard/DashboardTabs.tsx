import React from 'react';

export interface DashboardTab {
  label: string;
  key: string;
}

interface DashboardTabsProps {
  tabs: DashboardTab[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

const DashboardTabs: React.FC<DashboardTabsProps> = ({ tabs, activeTab, onTabChange }) => (
  <div className="flex space-x-2 mb-6">
    {tabs.map(tab => (
      <button
        key={tab.key}
        onClick={() => onTabChange(tab.key)}
        className={`px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none ${activeTab === tab.key ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
        aria-selected={activeTab === tab.key}
        aria-label={tab.label}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

export default DashboardTabs;
