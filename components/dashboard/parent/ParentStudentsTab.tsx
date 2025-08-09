'use client';

import React, { useState } from 'react';
import { useWallet } from '../../../hooks/useWallet';
import { useSignature } from '../../../hooks/useSignature';
import { logAuthorization } from '../../../lib/web3';
import { AuthorizationMessage } from '../../../types/wallet';
import { Child, QRData } from '../../../types/dashboard';
import QRCodeGenerator from '../../QRCodeGenerator';
import TabContainer from '../TabContainer';

const ParentStudentsTab: React.FC = () => {
  const { address, isConnected } = useWallet();
  const { signAuthorization } = useSignature();

  const [selectedChild, setSelectedChild] = useState<string>("");
  const [qrValue, setQrValue] = useState<string | null>(null);
  const [blockchainResult, setBlockchainResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Mock data - in real app, fetch from database
  const [children] = useState<Child[]>([
    { id: 'STU001', name: 'Alice Johnson', parentWallet: address || '0x1234...5678' },
    { id: 'STU002', name: 'Bob Smith', parentWallet: address || '0x8765...4321' },
  ]);

  const handlePickupMyChild = async () => {
    if (!isConnected || !address) {
      setBlockchainResult('Please connect your wallet first');
      return;
    }

    if (!selectedChild) {
      setBlockchainResult('Please select a child first');
      return;
    }

    setLoading(true);
    setBlockchainResult(null);
    setQrValue(null);
    
    try {
      const selectedChildData = children.find(child => child.id === selectedChild);
      if (!selectedChildData) {
        throw new Error('Selected child not found');
      }

      // Create authorization using wallet integration
      const authParams: Omit<AuthorizationMessage, 'parentWallet' | 'timestamp'> = {
        pickupWallet: address, // Parent picking up their own child
        studentName: selectedChildData.name,
        studentId: selectedChildData.id,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Valid for 24 hours
      };

      const signResult = await signAuthorization(authParams);
      
      if (!signResult.success) {
        throw new Error(signResult.error || 'Failed to sign authorization');
      }

      // Simulate blockchain anchoring
      const authHash = `pickup-${Date.now()}-${Math.random().toString(16).substr(2, 8)}`;
      const txHash = await logAuthorization(authHash);
      setBlockchainResult(`Authorization signed and anchored! Tx: ${txHash}`);
      
      // Create QR data
      const qrData: QRData = {
        childId: selectedChild,
        childName: selectedChildData.name,
        pickupWallet: address,
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        parentWallet: address,
        signature: signResult.signature || '',
        message: signResult.message || '',
        hash: authHash,
        type: 'self-pickup'
      };

      setQrValue(JSON.stringify(qrData));

    } catch (e: any) {
      setBlockchainResult(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TabContainer
      title="Pickup My Child"
      description="Generate a QR code for child pickup authorization"
    >
      <div className="space-y-6">
        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--light-blue)' }}>
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Select Child
          </label>
          <select
            className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 bg-white transition-all duration-200"
            value={selectedChild}
            onChange={e => setSelectedChild(e.target.value)}
          >
            <option value="">Choose a child...</option>
            {children.map(child => (
              <option key={child.id} value={child.id}>
                {child.name} ({child.id})
              </option>
            ))}
          </select>
        </div>

        <button
          className="w-full py-4 px-6 text-white rounded-xl disabled:opacity-50 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
          style={{ backgroundColor: 'var(--color-dark)' }}
          onClick={handlePickupMyChild}
          disabled={loading || !selectedChild}
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Generating QR...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <span>Generate Pickup QR</span>
            </div>
          )}
        </button>

        {blockchainResult && (
          <div className={`p-4 rounded-xl border ${
            blockchainResult.startsWith('Authorization') 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center space-x-2">
              <span>{blockchainResult.startsWith('Authorization') ? '✅' : '❌'}</span>
              <span>{blockchainResult}</span>
            </div>
          </div>
        )}

        {qrValue && (
          <div className="rounded-2xl border border-blue-200 p-8" style={{ backgroundColor: 'var(--light-blue)' }}>
            <div className="text-center">
              <h4 className="text-xl font-bold mb-4" style={{ color: 'var(--color-dark)' }}>Your Pickup QR Code</h4>
              <div className="bg-white rounded-xl p-6 inline-block shadow-lg">
                <QRCodeGenerator value={qrValue} />
              </div>
              <p className="mt-4 text-sm" style={{ color: 'var(--color-dark)' }}>
                Show this QR code to staff for pickup authorization
              </p>
            </div>
          </div>
        )}
      </div>
    </TabContainer>
  );
};

export default ParentStudentsTab;
