'use client';

import React, { ReactNode } from 'react';

interface TabContainerProps {
  title: string;
  description: string;
  children: ReactNode;
}

const TabContainer: React.FC<TabContainerProps> = ({
  title,
  description,
  children
}) => {
  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-8">
      <div className="flex items-center space-x-3 mb-6">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
          <p className="text-slate-600">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
};

export default TabContainer;
