'use client';

import React, { useState } from 'react';
import { useFirebaseData } from '../../../hooks/useFirebaseData';
import TabContainer from '../TabContainer';

const ParentAuthorizationsTab: React.FC = () => {
  const {
    pickupAuthorizations,
    addPickupAuthorization,
    removePickupAuthorization,
    error,
    clearError,
    refreshData
  } = useFirebaseData();

  // Form states for authorizing pickup person
  const [pickupPersonWallet, setPickupPersonWallet] = useState("");
  const [relationship, setRelationship] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [blockchainResult, setBlockchainResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAuthorizePickupPerson = async () => {
    if (!pickupPersonWallet || !relationship || !startDate || !endDate) {
      setBlockchainResult('Please fill in all required fields');
      return;
    }

    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start >= end) {
      setBlockchainResult('Start date must be before end date');
      return;
    }

    if (end <= now) {
      setBlockchainResult('End date must be in the future');
      return;
    }

    setLoading(true);
    setBlockchainResult(null);
    clearError();
    
    try {
      const success = await addPickupAuthorization(pickupPersonWallet, {
        walletAddress: pickupPersonWallet.toLowerCase(),
        relationship,
        startDate,
        endDate,
      });

      if (success) {
        setBlockchainResult('Pickup person authorized successfully!');
        
        // Clear form
        setPickupPersonWallet("");
        setRelationship("");
        setStartDate("");
        setEndDate("");
      } else {
        setBlockchainResult('Failed to authorize pickup person');
      }

    } catch (e: any) {
      setBlockchainResult(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAuthorization = async (pickupWallet: string, personName?: string) => {
    if (!confirm(`Are you sure you want to remove pickup authorization for ${personName || pickupWallet}?`)) {
      return;
    }

    try {
      const success = await removePickupAuthorization(pickupWallet);
      if (success) {
        setBlockchainResult(`Authorization removed for ${personName || pickupWallet}`);
      }
    } catch (e: any) {
      setBlockchainResult(`Error removing authorization: ${e.message}`);
    }
  };

  // Convert pickup authorizations object to array for display
  const authorizationsList = Object.entries(pickupAuthorizations).map(([wallet, person]) => {
    const now = new Date();
    const startDate = new Date(person.startDate);
    const endDate = new Date(person.endDate);
    const isActive = now >= startDate && now <= endDate;
    const isExpired = now > endDate;
    const isFuture = now < startDate;
    
    return {
      wallet,
      ...person,
      isActive,
      isExpired,
      isFuture,
      statusText: isActive ? 'Active' : isExpired ? 'Expired' : 'Future',
      statusColor: isActive ? 'green' : isExpired ? 'red' : 'yellow',
    };
  });

  return (
    <div className="space-y-8">
      {/* Error display */}
      {error && (
        <div className="p-4 rounded-xl border bg-red-50 border-red-200 text-red-800">
          <div className="flex items-center space-x-2">
            <span>❌</span>
            <span>{error}</span>
            <button 
              onClick={clearError}
              className="ml-auto text-sm underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Authorize New Pickup Person */}
      <TabContainer
        title="Authorize Pickup Person"
        description="Grant pickup authorization to trusted individuals"
        icon="🔑"
        gradientColors="from-green-500 to-green-600"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 rounded-xl p-6">
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                MetaMask Wallet Address <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-200 focus:border-green-500 bg-white transition-all duration-200"
                placeholder="0x..."
                value={pickupPersonWallet}
                onChange={e => setPickupPersonWallet(e.target.value)}
              />
              <p className="text-xs text-slate-500 mt-2">
                The pickup person doesn't need to be registered yet. They can register later.
              </p>
            </div>
            
            <div className="bg-slate-50 rounded-xl p-6">
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Relationship to Child <span className="text-red-500">*</span>
              </label>
              <select 
                className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-200 focus:border-green-500 bg-white transition-all duration-200"
                value={relationship}
                onChange={e => setRelationship(e.target.value)}
              >
                <option value="">Select relationship...</option>
                <option value="Grandparent">Grandparent</option>
                <option value="Uncle/Aunt">Uncle/Aunt</option>
                <option value="Family Friend">Family Friend</option>
                <option value="Guardian">Guardian</option>
                <option value="Sibling">Sibling</option>
                <option value="Caregiver">Caregiver</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className="bg-slate-50 rounded-xl p-6">
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-200 focus:border-green-500 bg-white transition-all duration-200"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="bg-slate-50 rounded-xl p-6">
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-200 focus:border-green-500 bg-white transition-all duration-200"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                min={startDate || new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <button
            className="w-full py-4 px-6 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
            onClick={handleAuthorizePickupPerson}
            disabled={loading || !pickupPersonWallet || !relationship || !startDate || !endDate}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Authorizing...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <span>🔐</span>
                <span>Authorize Pickup Person</span>
              </div>
            )}
          </button>

          {blockchainResult && (
            <div className={`p-4 rounded-xl border ${
              blockchainResult.includes('successfully') || blockchainResult.includes('removed')
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center space-x-2">
                <span>{blockchainResult.includes('successfully') || blockchainResult.includes('removed') ? '✅' : '❌'}</span>
                <span>{blockchainResult}</span>
              </div>
            </div>
          )}
        </div>
      </TabContainer>

      {/* Manage Existing Pickup Persons */}
      <TabContainer
        title="Manage Pickup Persons"
        description="View and manage authorized pickup persons"
        icon="👥"
        gradientColors="from-purple-500 to-purple-600"
      >
        <div className="space-y-4">
          {authorizationsList.length === 0 ? (
            <div className="text-center p-8 text-slate-500">
              <div className="text-4xl mb-2">👥</div>
              <p>No pickup persons authorized yet.</p>
              <p className="text-sm">Use the form above to authorize pickup persons.</p>
            </div>
          ) : (
            authorizationsList.map((person) => (
              <div key={person.wallet} className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm">👤</span>
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-lg">
                          {person.wallet.slice(0, 6)}...{person.wallet.slice(-4)}
                        </div>
                        <div className="text-sm text-slate-600">Relationship: {person.relationship}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                      <div>Wallet: <span className="font-mono">{person.wallet}</span></div>
                      <div>Valid: {new Date(person.startDate).toLocaleDateString()} to {new Date(person.endDate).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      person.statusColor === 'green' 
                        ? 'bg-green-100 text-green-800' 
                        : person.statusColor === 'red'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {person.statusText}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button 
                    onClick={() => handleRemoveAuthorization(person.wallet, person.relationship)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    Remove Authorization
                  </button>
                  <button 
                    onClick={refreshData}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </TabContainer>
    </div>
  );
};

export default ParentAuthorizationsTab;
