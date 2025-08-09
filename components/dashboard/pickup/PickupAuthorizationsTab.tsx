'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '../../../hooks/useWallet';
import { useFirebaseData } from '../../../hooks/useFirebaseData';
import { useFirebaseAuth } from '../../../hooks/useFirebaseAuth';
import QRCodeGenerator from '../../QRCodeGenerator';
import TabContainer from '../TabContainer';

const PickupAuthorizationsTab: React.FC = () => {
  const { address, isConnected } = useWallet();
  const { 
    authorizedStudents, 
    students,
    allUsers,
    currentUser,
    loading: dataLoading, 
    generateQRCode 
  } = useFirebaseData();
  const { user: authUser } = useFirebaseAuth();

  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [qrValue, setQrValue] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('Pickup Authorization Debug:', {
      address,
      currentUser,
      authUser,
      authRole: authUser?.role,
      currentUserRole: currentUser?.role,
      authorizedStudents,
      allStudents: students,
      allUsers,
      dataLoading
    });

    // Additional detailed debugging for pickup authorization
    if (authUser?.role === 'pickup') {
      console.log('Pickup Person Debug - Checking authorizations:');
      allUsers.forEach(user => {
        if (user.role === 'parent' && user.pickup) {
          const pickupAuth = user.pickup[address || ''];
          if (pickupAuth) {
            console.log(`Found authorization from parent ${user.name} (${user.id}):`, pickupAuth);
            const parentStudents = students.filter(s => s.parentId === user.id);
            console.log(`Parent's students:`, parentStudents);
          }
        }
      });
    }
  }, [address, currentUser, authorizedStudents, students, allUsers, dataLoading]);

  const handlePickupStudent = async () => {
    if (!isConnected || !address) {
      setResult('Please connect your wallet first');
      return;
    }

    if (!selectedStudent) {
      setResult('Please select a student first');
      return;
    }

    setLoading(true);
    setResult(null);
    setQrValue(null);

    try {
      const selectedStudentData = authorizedStudents.find(student => student.id === selectedStudent);
      if (!selectedStudentData) {
        throw new Error('Selected student not found');
      }

      // Generate QR code using Firebase integration
      const qrData = await generateQRCode(selectedStudent);
      
      if (!qrData) {
        throw new Error('Failed to generate QR code');
      }

      setQrValue(qrData.qrCodeData);
      setResult(`QR code generated successfully! Valid until: ${new Date(qrData.expiresAt).toLocaleString()}`);

    } catch (e: any) {
      setResult(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TabContainer
      title="Generate Pickup QR"
      description="Generate a QR code for authorized child pickup"
      icon="👶"
      gradientColors="from-indigo-500 to-indigo-600"
    >
      <div className="space-y-6">
        <div className="bg-slate-50 rounded-xl p-6">
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Select Student (Authorized to You)
          </label>
          <select
            className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 bg-white transition-all duration-200"
            value={selectedStudent}
            onChange={e => setSelectedStudent(e.target.value)}
            disabled={dataLoading}
          >
            <option value="">Choose a student...</option>
            {authorizedStudents.map(student => (
              <option key={student.id} value={student.id}>
                {student.name} ({student.id}) - Grade {student.grade}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-2">
            {dataLoading ? (
              'Loading authorized students...'
            ) : authorizedStudents.length === 0 ? (
              <div>
                <div>No students authorized for pickup.</div>
                <div className="text-xs text-gray-400 mt-1">
                  Debug: Total students: {students.length}, All users: {allUsers.length}
                  {currentUser && (
                    <div>Current user role: {currentUser.role}, wallet: {address}</div>
                  )}
                  {authUser && (
                    <div>Auth user role: {authUser.role}, wallet: {authUser.wallet}</div>
                  )}
                  <div>Role check: Is pickup? {authUser?.role === 'pickup' ? 'Yes' : 'No'}</div>
                </div>
              </div>
            ) : (
              `${authorizedStudents.length} students you're authorized to pick up`
            )}
          </p>
        </div>

        <button
          className="w-full py-4 px-6 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
          onClick={handlePickupStudent}
          disabled={loading || !selectedStudent || dataLoading}
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

        {result && (
          <div className={`p-4 rounded-xl border ${
            result.startsWith('QR code generated') 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center space-x-2">
              <span>{result.startsWith('QR code generated') ? '✅' : '❌'}</span>
              <span>{result}</span>
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
              <p className="mt-4 text-sm text-indigo-600">
                Show this QR code to staff for pickup authorization
              </p>
              <div className="mt-4 p-3 bg-white rounded-lg border border-indigo-200">
                <p className="text-xs text-indigo-600 font-medium">
                  QR Code generated for immediate use
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </TabContainer>
  );
};

export default PickupAuthorizationsTab;
