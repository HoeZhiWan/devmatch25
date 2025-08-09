'use client';

import React, { useState } from 'react';
import { useFirebaseData } from '../../../hooks/useFirebaseData';
import QRCodeGenerator from '../../QRCodeGenerator';
import TabContainer from '../TabContainer';

const ParentStudentsTab: React.FC = () => {
  const { 
    students, 
    loadingStudents, 
    generateQRCode, 
    error, 
    clearError 
  } = useFirebaseData();

  const [selectedChild, setSelectedChild] = useState<string>("");
  const [qrValue, setQrValue] = useState<string | null>(null);
  const [qrExpiration, setQrExpiration] = useState<string | null>(null);
  const [blockchainResult, setBlockchainResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePickupMyChild = async () => {
    if (!selectedChild) {
      setBlockchainResult('Please select a child first');
      return;
    }

    setLoading(true);
    setBlockchainResult(null);
    setQrValue(null);
    setQrExpiration(null);
    clearError();
    
    try {
      const selectedChildData = students.find(child => child.id === selectedChild);
      if (!selectedChildData) {
        throw new Error('Selected child not found');
      }

      // Generate QR code using the new Firebase API
      const result = await generateQRCode(selectedChild);
      
      if (!result) {
        throw new Error('Failed to generate QR code');
      }

      setQrValue(result.qrCodeData);
      setQrExpiration(result.expiresAt);
      setBlockchainResult(`QR code generated successfully for ${selectedChildData.name}!`);

    } catch (e: any) {
      setBlockchainResult(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Clear results when changing child selection
  const handleChildChange = (childId: string) => {
    setSelectedChild(childId);
    setQrValue(null);
    setQrExpiration(null);
    setBlockchainResult(null);
    clearError();
  };

  return (
    <TabContainer
      title="Pickup My Child"
      description="Generate a QR code for child pickup authorization"
      icon="👶"
      gradientColors="from-indigo-500 to-indigo-600"
    >
      <div className="space-y-6">
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

        <div className="bg-slate-50 rounded-xl p-6">
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Select Child
          </label>
          
          {loadingStudents ? (
            <div className="flex items-center justify-center p-8">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-slate-600">Loading students...</span>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center p-8 text-slate-500">
              <div className="text-4xl mb-2">👶</div>
              <p>No students found. Please add students first.</p>
            </div>
          ) : (
            <select
              className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 bg-white transition-all duration-200"
              value={selectedChild}
              onChange={e => handleChildChange(e.target.value)}
            >
              <option value="">Choose a child...</option>
              {students.map(child => (
                <option key={child.id} value={child.id}>
                  {child.name} - {child.grade} ({child.id})
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          className="w-full py-4 px-6 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
          onClick={handlePickupMyChild}
          disabled={loading || !selectedChild || loadingStudents}
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Generating QR...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <span>🔐</span>
              <span>Generate Pickup QR</span>
            </div>
          )}
        </button>

        {blockchainResult && (
          <div className={`p-4 rounded-xl border ${
            blockchainResult.startsWith('QR code generated') 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center space-x-2">
              <span>{blockchainResult.startsWith('QR code generated') ? '✅' : '❌'}</span>
              <span>{blockchainResult}</span>
            </div>
          </div>
        )}

        {qrValue && (
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-200 p-8">
            <div className="text-center">
              <h4 className="text-xl font-bold text-indigo-700 mb-4">Your Pickup QR Code</h4>
              <div className="bg-white rounded-xl p-6 inline-block shadow-lg">
                <QRCodeGenerator value={qrValue} />
              </div>
              <div className="mt-4 space-y-2 text-sm text-indigo-600">
                <p>Show this QR code to staff for pickup authorization</p>
                {qrExpiration && (
                  <p className="font-medium">
                    Expires: {new Date(qrExpiration).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="mt-4 p-3 bg-indigo-100 rounded-lg text-xs text-indigo-700">
                <p>⚠️ This QR code is for one-time use only and will expire automatically.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </TabContainer>
  );
};

export default ParentStudentsTab;
