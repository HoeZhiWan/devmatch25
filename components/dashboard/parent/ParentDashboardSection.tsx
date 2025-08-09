'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useWallet } from '../../../hooks/useWallet';
import { useSignature } from '../../../hooks/useSignature';
import { DashboardTab } from '../../../types/dashboard';
import BaseDashboard from '../BaseDashboard';
import ParentStudentsTab from './ParentStudentsTab';
import ParentAuthorizationsTab from './ParentAuthorizationsTab';
import { collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

const PARENT_TABS: DashboardTab[] = [
  { 
    key: 'pickup', 
    label: 'Pickup My Child', 
  },
  { 
    key: 'authorize', 
    label: 'Authorize Pickup Person', 
  },
];

const ParentDashboardSection: React.FC = () => {
  const { isConnected } = useWallet();
  const { error: signingError } = useSignature();
  const [activeTab, setActiveTab] = useState(PARENT_TABS[0].key);
  const walletHook = useWallet();
  const currentWallet = useMemo(() => walletHook.address?.toLowerCase() || null, [walletHook.address]);
  const [toast, setToast] = useState<null | { title: string; body: string }>(null);
  const [toastTimer, setToastTimer] = useState<NodeJS.Timeout | null>(null);

  // Listen for in-app notifications for the logged-in wallet
  useEffect(() => {
    if (!currentWallet) return;
    const q = query(
      collection(db, 'notifications'),
      where('wallet', '==', currentWallet),
      where('status', '==', 'unread')
    );
    const unsub = onSnapshot(q, async (snap) => {
      for (const change of snap.docChanges()) {
        if (change.type === 'added') {
          const data = change.doc.data() as any;
          // Show toast
          setToast({ title: data.title || 'Notification', body: data.body || '' });
          // Auto-hide after 5s
          if (toastTimer) clearTimeout(toastTimer);
          const t = setTimeout(() => setToast(null), 5000);
          setToastTimer(t);
          // Mark as read so it doesn't re-show
          try {
            await updateDoc(doc(db, 'notifications', change.doc.id), { status: 'read' });
          } catch (e) {
            console.error('Failed to mark notification as read', e);
          }
        }
      }
    });
    return () => unsub();
  }, [currentWallet]);

  const renderTabContent = () => {
    if (!isConnected) {
      return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-8 text-center">
          <div className="text-slate-400 text-6xl mb-4">🔒</div>
          <h3 className="text-xl font-medium text-slate-600 mb-2">Wallet Not Connected</h3>
          <p className="text-slate-500">Please connect your wallet to access the parent dashboard.</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'pickup':
        return <ParentStudentsTab />;
      case 'authorize':
        return <ParentAuthorizationsTab />;
      default:
        return <ParentStudentsTab />;
    }
  };

  return (
    <BaseDashboard
      tabs={PARENT_TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      signingError={signingError}
    >
      {toast && (
        <div className="fixed top-4 right-4 z-50 max-w-sm rounded-lg shadow-lg bg-white border border-slate-200 p-4">
          <div className="font-semibold text-slate-800 mb-1">{toast.title}</div>
          <div className="text-slate-600 text-sm">{toast.body}</div>
          <button
            className="mt-2 text-xs text-indigo-600 hover:underline"
            onClick={() => setToast(null)}
          >
            Dismiss
          </button>
        </div>
      )}
      {renderTabContent()}
    </BaseDashboard>
  );
};

export default ParentDashboardSection;
