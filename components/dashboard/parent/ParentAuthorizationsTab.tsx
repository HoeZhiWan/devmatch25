'use client';

import React, { useState } from 'react';
import { useWallet } from '../../../hooks/useWallet';
import { useSignature } from '../../../hooks/useSignature';
import { logAuthorization } from '../../../lib/web3';
import { AuthorizationMessage } from '../../../types/wallet';
import { PickupPerson, QRData } from '../../../types/dashboard';
import QRCodeGenerator from '../../QRCodeGenerator';
import TabContainer from '../TabContainer';

const ParentAuthorizationsTab: React.FC = () => {
  const { address, isConnected } = useWallet();
  const { signAuthorization } = useSignature();

  // Form states for authorizing pickup person
  const [pickupPersonName, setPickupPersonName] = useState("");
  const [pickupPersonWallet, setPickupPersonWallet] = useState("");
  const [relationship, setRelationship] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [authorizedQR, setAuthorizedQR] = useState<string | null>(null);
  const [blockchainResult, setBlockchainResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Mock data for existing pickup persons
  const [pickupPersons] = useState<PickupPerson[]>([
    { 
      id: '1', 
      name: 'Grandma Mary', 
      walletAddress: '0x9876...5432', 
      relationship: 'Grandmother', 
      phoneNumber: '+1234567890',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      isActive: true
    },
    { 
      id: '2', 
      name: 'Uncle John', 
      walletAddress: '0x5432...9876', 
      relationship: 'Uncle', 
      phoneNumber: '+0987654321',
      startDate: '2024-01-15',
      endDate: '2024-06-30',
      isActive: true
    },
  ]);

  const handleAuthorizePickupPerson = async () => {
    if (!isConnected || !address) {
      setBlockchainResult('Please connect your wallet first');
      return;
    }

    if (!pickupPersonName || !pickupPersonWallet || !startDate || !endDate) {
      setBlockchainResult('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setBlockchainResult(null);
    setAuthorizedQR(null);
    
    try {
      // Create authorization using wallet integration
      const authParams: Omit<AuthorizationMessage, 'parentWallet' | 'timestamp'> = {
        pickupWallet: pickupPersonWallet.toLowerCase(),
        studentName: pickupPersonName, // Using pickup person name as placeholder
        studentId: `AUTH-${Date.now()}`, // Generate unique ID for this authorization
        startDate: startDate,
        endDate: endDate
      };

      const signResult = await signAuthorization(authParams);
      
      if (!signResult.success) {
        throw new Error(signResult.error || 'Failed to sign authorization');
      }

      // Simulate blockchain anchoring
      const authHash = `auth-${Date.now()}-${Math.random().toString(16).substr(2, 8)}`;
      const txHash = await logAuthorization(authHash);
      setBlockchainResult(`Pickup person authorized! Tx: ${txHash}`);
      
      // Generate QR for pickup person
      const qrData: QRData = {
        pickupPersonName,
        pickupWallet: pickupPersonWallet.toLowerCase(),
        relationship,
        phoneNumber,
        startDate,
        endDate,
        parentWallet: address,
        signature: signResult.signature || '',
        message: signResult.message || '',
        hash: authHash,
        type: 'pickup-person-auth',
        validUntil: endDate
      };

      setAuthorizedQR(JSON.stringify(qrData));

      // Clear form
      setPickupPersonName("");
      setPickupPersonWallet("");
      setRelationship("");
      setPhoneNumber("");
      setStartDate("");
      setEndDate("");

    } catch (e: any) {
      setBlockchainResult(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Authorize New Pickup Person */}
      <TabContainer
        title="Authorize Pickup Person"
        description="Grant pickup authorization to trusted individuals"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--light-blue)' }}>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Pickup Person Name
              </label>
              <input
                className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-200 focus:border-green-500 bg-white transition-all duration-200"
                placeholder="Enter name"
                value={pickupPersonName}
                onChange={e => setPickupPersonName(e.target.value)}
              />
            </div>
            
            <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--light-blue)' }}>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                MetaMask Address/ID
              </label>
              <input
                className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-200 focus:border-green-500 bg-white transition-all duration-200"
                placeholder="0x..."
                value={pickupPersonWallet}
                onChange={e => setPickupPersonWallet(e.target.value)}
              />
            </div>
            
            <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--light-blue)' }}>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Relationship to Child
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
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--light-blue)' }}>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Phone Number
              </label>
              <input
                className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-200 focus:border-green-500 bg-white transition-all duration-200"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
              />
            </div>
            
            <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--light-blue)' }}>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Start Date
              </label>
              <input
                type="date"
                className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-200 focus:border-green-500 bg-white transition-all duration-200"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            
            <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--light-blue)' }}>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                End Date
              </label>
              <input
                type="date"
                className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-200 focus:border-green-500 bg-white transition-all duration-200"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <button
            className="w-full py-4 px-6 text-white rounded-xl disabled:opacity-50 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--color-dark)' }}
            onClick={handleAuthorizePickupPerson}
            disabled={loading || !pickupPersonName || !pickupPersonWallet || !relationship || !phoneNumber || !startDate || !endDate}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Authorizing...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <span>Authorize</span>
              </div>
            )}
          </button>

          {blockchainResult && (
            <div className={`p-4 rounded-xl border ${
              blockchainResult.startsWith('Pickup') 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center space-x-2">
                <span>{blockchainResult.startsWith('Pickup') ? '✅' : '❌'}</span>
                <span>{blockchainResult}</span>
              </div>
            </div>
          )}

          {authorizedQR && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-8">
              <div className="text-center">
                <h4 className="text-xl font-bold text-green-700 mb-4">Authorization QR Code</h4>
                <div className="bg-white rounded-xl p-6 inline-block shadow-lg">
                  <QRCodeGenerator value={authorizedQR} />
                </div>
                <p className="mt-4 text-sm text-green-600">
                  Share this QR code with the authorized pickup person
                </p>
              </div>
            </div>
          )}
        </div>
      </TabContainer>

      {/* Manage Existing Pickup Persons */}
      <TabContainer
        title="Manage Pickup Persons"
        description="View and manage authorized pickup persons"
      >
        <div className="space-y-4">
          {pickupPersons.map((person) => (
            <div key={person.id} className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">👤</span>
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-lg">{person.name}</div>
                      <div className="text-sm text-slate-600">Relationship: {person.relationship}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                    <div>Wallet: {person.walletAddress}</div>
                    <div>Phone: {person.phoneNumber}</div>
                    <div>Valid: {person.startDate} to {person.endDate}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    person.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {person.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  Edit
                </button>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
                  Deactivate
                </button>
              </div>
            </div>
          ))}
        </div>
      </TabContainer>
    </div>
  );
};

export default ParentAuthorizationsTab;
