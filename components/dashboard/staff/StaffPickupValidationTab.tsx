'use client';

import React, { useState } from 'react';
import { verifyHash, logPickup } from '../../../lib/web3';
import { Student, PickupHistory } from '../../../types/dashboard';
import QRCodeScanner from '../../QRCodeScanner';
import TabContainer from '../TabContainer';

interface StaffPickupValidationTabProps {
  onPickupComplete?: (pickup: PickupHistory) => void;
}

const StaffPickupValidationTab: React.FC<StaffPickupValidationTabProps> = ({
  onPickupComplete
}) => {
  const [studentId, setStudentId] = useState("");
  const [scannedQR, setScannedQR] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Available student IDs for pickup validation
  const availableIds = ["123", "456", "789", "STU001", "STU002"];

  // Mock students data
  const [students] = useState<Student[]>([
    { id: 'STU001', name: 'Alice Johnson', parentWallet: '0x1234...5678' },
    { id: 'STU002', name: 'Bob Smith', parentWallet: '0x8765...4321' },
    { id: '123', name: 'Jenny', parentWallet: '0x9999...1111' },
    { id: '456', name: 'Tom', parentWallet: '0x8888...2222' },
  ]);

  const handleValidatePickup = async () => {
    setLoading(true);
    setValidationResult(null);
    try {
      if (!scannedQR || !studentId) {
        throw new Error("Please scan QR code and enter student ID");
      }
      if (!availableIds.includes(studentId.trim())) {
        throw new Error("Student ID not found in system");
      }
      if (scannedQR.childId !== studentId) {
        throw new Error("QR code does not match student ID");
      }
      const currentTime = new Date();
      const validUntil = new Date(scannedQR.validUntil);
      if (currentTime > validUntil) {
        throw new Error("Pickup authorization has expired");
      }
      const timestamp = await verifyHash(scannedQR.hash);
      if (timestamp === 0) {
        throw new Error("Demo Mode: QR code not found on blockchain");
      }
      setValidationResult("✅ Demo Mode: Pickup authorized! Student can be released.");
      await logPickup(scannedQR.hash);
      
      // Create pickup record
      const newPickup: PickupHistory = {
        id: Date.now().toString(),
        studentId: studentId,
        studentName: students.find(s => s.id === studentId)?.name || 'Unknown Student',
        pickupPerson: scannedQR.pickupWallet || 'Unknown Person',
        timestamp: new Date().toLocaleString(),
        status: 'completed'
      };
      
      // Notify parent component if callback provided
      if (onPickupComplete) {
        onPickupComplete(newPickup);
      }
      
    } catch (e: any) {
      setValidationResult(`❌ ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TabContainer
      title="Validate Student Pickup"
      description="Scan QR codes and validate pickup authorizations"
    >
      <div className="space-y-6">
        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--light-blue)' }}>
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Student ID
          </label>
          <input
            className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white transition-all duration-200"
            placeholder="Enter student ID (e.g., STU001, 123, 456)"
            value={studentId}
            onChange={e => setStudentId(e.target.value)}
          />
          {studentId && !availableIds.includes(studentId.trim()) && (
            <div className="mt-2 text-sm text-red-600">
              ⚠️ Student ID not found in system
            </div>
          )}
          {studentId && availableIds.includes(studentId.trim()) && (
            <div className="mt-2 text-sm text-green-700">
              ✅ Student ID found: {students.find(s => s.id === studentId)?.name || 'Student'}
            </div>
          )}
        </div>

        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--light-blue)' }}>
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Scan Parent/Pickup Person QR Code
          </label>
          <QRCodeScanner onScan={setScannedQR} />
        </div>

        {scannedQR && (
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-3">QR Code Data:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-700">
              <div className="bg-white rounded-lg p-3">
                <span className="font-medium">Child ID:</span> {scannedQR.childId}
              </div>
              <div className="bg-white rounded-lg p-3">
                <span className="font-medium">Pickup Wallet:</span> {scannedQR.pickupWallet}
              </div>
              <div className="bg-white rounded-lg p-3">
                <span className="font-medium">Valid Until:</span> {scannedQR.validUntil}
              </div>
              <div className="bg-white rounded-lg p-3">
                <span className="font-medium">Parent Wallet:</span> {scannedQR.parentWallet}
              </div>
            </div>
          </div>
        )}

        <button
          className="w-full py-4 px-6 text-white rounded-xl disabled:opacity-50 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
          style={{ backgroundColor: 'var(--color-dark)' }}
          onClick={handleValidatePickup}
          disabled={loading || !studentId || !scannedQR}
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Validating...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <span>Validate Pickup</span>
            </div>
          )}
        </button>

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
