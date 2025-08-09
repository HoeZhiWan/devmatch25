'use client';

import React, { useState } from 'react';
import { useFirebaseData } from '../../../hooks/useFirebaseData';
import { useFirebaseAuth } from '../../../hooks/useFirebaseAuth';
import QRCodeScanner from '../../QRCodeScanner';
import TabContainer from '../TabContainer';

interface StaffPickupValidationTabProps {
  onPickupComplete?: (pickup: any) => void;
}

const StaffPickupValidationTab: React.FC<StaffPickupValidationTabProps> = ({
  onPickupComplete
}) => {
  const { students, refreshData } = useFirebaseData();
  const { getIdToken } = useFirebaseAuth();
  
  const [scannedQR, setScannedQR] = useState<string | null>(null);
  const [qrDetails, setQrDetails] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pickupData, setPickupData] = useState<any>(null);

  // Parse QR code when scanned
  const handleQRScan = (qrData: any) => {
    console.log('QR Scanner received:', qrData);
    
    // Handle different data formats from QR scanner
    let qrString: string;
    if (typeof qrData === 'string') {
      qrString = qrData;
    } else if (qrData && qrData.rawData) {
      qrString = qrData.rawData;
    } else if (qrData && typeof qrData === 'object') {
      qrString = JSON.stringify(qrData);
    } else {
      qrString = String(qrData);
    }
    
    setScannedQR(qrString);
    
    // Try to parse QR details for display
    try {
      // If qrData is already an object (parsed JSON), use it
      if (typeof qrData === 'object' && qrData && !qrData.rawData) {
        setQrDetails(qrData);
        return;
      }
      
      // The QR data format is "id|hash" from our Firebase implementation
      const [id, hash] = qrString.split('|');
      if (id && hash) {
        setQrDetails({ id, hash });
      } else {
        // Try parsing as JSON (legacy format)
        const parsed = JSON.parse(qrString);
        setQrDetails(parsed);
      }
    } catch (e) {
      // Could not parse, just store raw data - ensure it's a string
      setQrDetails({ raw: qrString });
    }
    // Do not auto-validate; user will trigger validation
  };

  const handleValidatePickup = async () => {
    console.log('handleValidatePickup called', { scannedQR, loading, showConfirmation });
    
    setLoading(true);
    setValidationResult(null);
    
    try {
      if (!scannedQR) {
        throw new Error("Please scan QR code first");
      }

      console.log('Making API call to verify QR code...');

      // Get Firebase ID token
      const idToken = await getIdToken();
      if (!idToken) {
        throw new Error("Authentication required");
      }

      console.log('Making API call to verify QR code...');

      // Call the QR verification API (verify only, don't record pickup yet)
      const response = await fetch('/api/qr/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          qrCodeData: scannedQR,
          idToken,
          verifyOnly: true // Verify first; staff will confirm before recording
        })
      });

      const result = await response.json();
      console.log('API response:', { status: response.status, result });

      if (!response.ok) {
        throw new Error(result.error || 'Verification failed');
      }

      if (result.success) {
        // Store pickup data for confirmation (student info comes from QR code)
        setPickupData({
          ...result.data,
          scannedQR,
          idToken
        });
        setShowConfirmation(true);
        setValidationResult(`✅ QR Code verified! Please confirm pickup details below.`);
        // Close overlay so the staff confirmation section is visible
        setScannedQR(null);
      } else {
        throw new Error('Pickup validation failed');
      }
      
    } catch (e: any) {
      console.error('Validation error:', e);
      const msg = typeof e?.message === 'string' && e.message
        ? e.message
        : (typeof e === 'string' ? e : 'Verification failed');
      setValidationResult(`❌ ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPickup = async () => {
    setLoading(true);
    
    try {
      if (!pickupData?.scannedQR || !pickupData?.idToken) {
        throw new Error('No verified QR to confirm. Please validate the QR code first.');
      }
      // Record the actual pickup
      const response = await fetch('/api/qr/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          qrCodeData: pickupData.scannedQR,
          idToken: pickupData.idToken,
          confirmPickup: true // Flag to record the pickup
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || result?.message || 'Failed to record pickup');
      }

      if (result.success) {
        setValidationResult(`✅ Pickup recorded successfully! Student ${pickupData.studentName} has been fetched.`);
        
        // Refresh data to update pickup history
        await refreshData();
        
        // Notify parent component if callback provided
        if (onPickupComplete) {
          onPickupComplete(result.data);
        }
        
        // Clear form and hide confirmation
        setScannedQR(null);
        setQrDetails(null);
        setShowConfirmation(false);
        setPickupData(null);
      } else {
        throw new Error('Failed to record pickup');
      }
      
    } catch (e: any) {
      const msg = typeof e?.message === 'string' && e.message ? e.message : 'Failed to record pickup';
      setValidationResult(`❌ ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPickup = () => {
    setShowConfirmation(false);
    setPickupData(null);
    setValidationResult(null);
  };

  // Debug function to test API
  const debugAPI = async () => {
    try {
      const idToken = await getIdToken();
      console.log('ID Token available:', !!idToken);
      
      const response = await fetch('/api/qr/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          qrCodeData: 'test-qr-data',
          idToken,
          verifyOnly: true
        })
      });
      
      console.log('API Response Status:', response.status);
      const result = await response.json();
      console.log('API Response:', result);
    } catch (error) {
      console.error('API Debug Error:', error);
    }
  };

  return (
    <TabContainer
      title="Validate Student Pickup"
      description="Scan QR codes and validate pickup authorizations"
    >
      <div className="space-y-6">
        <div className="rounded-xl p-6 relative min-h-[300px]" style={{ backgroundColor: 'var(--light-blue)' }}>
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Scan Parent/Pickup Person QR Code
            {scannedQR && <span className="text-green-600 ml-2">✓ Scanned</span>}
          </label>
          <div className="text-sm text-slate-600 mb-3">
            The QR code will automatically identify the student. No manual selection needed.
          </div>
          <QRCodeScanner onScan={handleQRScan} />
          
          {/* Overlay showing student info and validate button after QR scan */}
          {scannedQR && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
              <div
                className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-gray-200"
                role="dialog"
                aria-modal="true"
              >
                <button
                  type="button"
                  aria-label="Close"
                  className="absolute top-3 right-3 inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={() => {
                    setScannedQR(null);
                    setQrDetails(null);
                    setValidationResult(null);
                    setShowConfirmation(false);
                  }}
                >
                  <span className="text-xl leading-none">×</span>
                </button>
                <div className="text-center">
                  <div className="text-lg font-semibold text-slate-800">QR Code Scanned</div>
                </div>
                
                {/* QR Details Summary */}
                {qrDetails && (
                  <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600">
                    <div className="font-medium text-slate-700 mb-1">QR Data</div>
                    {qrDetails.id && <div>ID: {qrDetails.id}</div>}
                    {qrDetails.hash && <div>Hash: {qrDetails.hash.slice(0, 16)}...</div>}
                    {qrDetails.raw && <div>Raw: {String(qrDetails.raw).slice(0, 30)}...</div>}
                  </div>
                )}
                
                {/* Actions */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
                    onClick={handleValidatePickup}
                    disabled={loading || !scannedQR}
                  >
                    {loading ? 'Validating...' : 'Validate'}
                  </button>
                  <button
                    className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-200"
                    onClick={() => {
                      setScannedQR(null);
                      setQrDetails(null);
                      setValidationResult(null);
                    }}
                    disabled={loading}
                  >
                    Scan Again
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pickup Confirmation Dialog */}
        {showConfirmation && pickupData && (
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border-2 border-yellow-200 shadow-lg">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-3xl">⚠️</span>
              <h3 className="text-xl font-bold text-yellow-800">Confirm Student Pickup</h3>
            </div>
            
            <div className="bg-white rounded-lg p-4 mb-4 space-y-3 border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <span className="font-semibold text-gray-700">Student Information:</span>
                  <div className="text-lg font-bold text-blue-600">
                    {pickupData.studentName}
                  </div>
                  <div className="text-sm text-gray-600">
                    ID: {pickupData.studentId} | Grade: {pickupData.studentGrade}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <span className="font-semibold text-gray-700">Pickup Person:</span>
                  <div className="text-lg font-bold text-green-600">
                    {pickupData.pickupPersonName || 'Authorized Person'}
                  </div>
                  <div className="text-xs text-gray-500 font-mono">
                    {pickupData.pickupWallet?.slice(0, 12)}...{pickupData.pickupWallet?.slice(-8)}
                  </div>
                </div>
                
                {pickupData.relationship && (
                  <div className="space-y-1">
                    <span className="font-semibold text-gray-700">Relationship:</span>
                    <div className="text-purple-600 font-medium">{pickupData.relationship}</div>
                  </div>
                )}
                
                <div className="space-y-1">
                  <span className="font-semibold text-gray-700">Pickup Time:</span>
                  <div className="text-gray-800 font-medium">{new Date().toLocaleString()}</div>
                </div>
              </div>
              
              {pickupData.authorizationDetails && (
                <div className="border-t pt-3 mt-3">
                  <span className="font-semibold text-gray-700">Authorization Period:</span>
                  <div className="text-sm text-gray-600 mt-1">
                    📅 Valid from {new Date(pickupData.authorizationDetails.startDate).toLocaleDateString()} 
                    to {new Date(pickupData.authorizationDetails.endDate).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-yellow-100 border-l-4 border-yellow-400 p-4 mb-4">
              <div className="flex items-start space-x-3">
                <span className="text-yellow-600 text-xl">⚠️</span>
                <div className="text-sm text-yellow-800">
                  <div className="font-semibold mb-2">Staff Verification Required:</div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="verify-student" className="rounded" />
                      <label htmlFor="verify-student" className="text-sm">Student identity confirmed</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="verify-pickup" className="rounded" />
                      <label htmlFor="verify-pickup" className="text-sm">Pickup person has valid ID</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="verify-auth" className="rounded" />
                      <label htmlFor="verify-auth" className="text-sm">Authorization is current and valid</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 font-semibold transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed"
                onClick={handleConfirmPickup}
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Recording Pickup...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <span>✅</span>
                    <span>Confirm & Record Pickup</span>
                  </div>
                )}
              </button>
              
              <button
                className="flex-1 py-3 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 font-semibold transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed"
                onClick={handleCancelPickup}
                disabled={loading}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span>❌</span>
                  <span>Cancel</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {validationResult && (
          <div className={`p-4 rounded-xl border ${
            validationResult.startsWith('✅') 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center space-x-2">
              <span>{validationResult.startsWith('✅') ? '✅' : '❌'}</span>
              <span>{validationResult}</span>
            </div>
          </div>
        )}
      </div>
    </TabContainer>
  );
};

export default StaffPickupValidationTab;
