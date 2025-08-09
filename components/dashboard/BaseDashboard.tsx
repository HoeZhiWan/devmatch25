'use client';

import React, { ReactNode } from 'react';
import { DashboardTab } from '../../types/dashboard';

interface BaseDashboardProps {
  tabs: DashboardTab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: ReactNode;
  signingError?: string | null;
}

const BaseDashboard: React.FC<BaseDashboardProps> = ({
  tabs,
  activeTab,
  onTabChange,
  children,
  signingError
}) => {
  return (
    <div className="space-y-8">
      {/* Error Display */}
      {signingError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <div className="text-red-800 font-semibold mb-2">Signing Error</div>
          <div className="text-red-600">{signingError}</div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-2">
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 ${
                activeTab === tab.key 
                  ? `bg-[#003751] text-white shadow-lg` 
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
              }`}
              aria-selected={activeTab === tab.key}
              aria-label={tab.label}
            >
              <div className="flex items-center justify-center space-x-2">
                <span>{tab.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {children}
    </div>
  );
};

export default BaseDashboard;
