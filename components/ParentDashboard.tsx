'use client';

import React, { useState, useEffect } from "react";
import QRCodeGenerator from "./QRCodeGenerator";
import { logAuthorization } from "../lib/web3";
import { useWallet } from "../hooks/useWallet";
import { useSignature } from "../hooks/useSignature";
import { useUserRole } from "../hooks/useUserRole";
import { AuthorizationMessage } from "../types/wallet";

interface Child {
  id: string;
  name: string;
  parentWallet: string;
}

interface PickupPerson {
  id: string;
  name: string;
  walletAddress: string;
  relationship: string;
  phoneNumber: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

const ParentDashboard: React.FC = () => {
  const { address, isConnected } = useWallet();
  const { role, loading: roleLoading } = useUserRole(address);
  const { 
    signAuthorization, 
    isLoading: signingLoading, 
    error: signingError,
    lastSignature,
    lastMessage
  } = useSignature();

  const [activeTab, setActiveTab] = useState<'pickup' | 'authorize' | 'manage'>('pickup');
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [qrValue, setQrValue] = useState<string | null>(null);
  const [blockchainResult, setBlockchainResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form states for authorizing pickup person
  const [pickupPersonName, setPickupPersonName] = useState("");
  const [pickupPersonWallet, setPickupPersonWallet] = useState("");
  const [relationship, setRelationship] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [authorizedQR, setAuthorizedQR] = useState<string | null>(null);

  // Mock data - in real app, fetch from database
  const [children] = useState<Child[]>([
    { id: 'STU001', name: 'Alice Johnson', parentWallet: address || '0x1234...5678' },
    { id: 'STU002', name: 'Bob Smith', parentWallet: address || '0x8765...4321' },
  ]);

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

  // Check if user is authorized parent
  useEffect(() => {
    if (!roleLoading && role !== 'parent' && role !== null) {
      console.warn('User is not authorized as a parent');
    }
  }, [role, roleLoading]);

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
      
      // Encode QR value
      setQrValue(JSON.stringify({
        childId: selectedChild,
        childName: selectedChildData.name,
        pickupWallet: address,
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        parentWallet: address,
        signature: signResult.signature,
        message: signResult.message,
        hash: authHash,
        type: 'self-pickup'
      }));

    } catch (e: any) {
      setBlockchainResult(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

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
      setAuthorizedQR(JSON.stringify({
        pickupPersonName,
        pickupPersonWallet: pickupPersonWallet.toLowerCase(),
        relationship,
        phoneNumber,
        startDate,
        endDate,
        parentWallet: address,
        signature: signResult.signature,
        message: signResult.message,
        hash: authHash,
        type: 'pickup-person-auth'
      }));

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
      {/* Wallet Connection Check */}
      {!isConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center">
          <div className="text-yellow-800 font-semibold mb-2">Wallet Connection Required</div>
          <div className="text-yellow-600">Please connect your MetaMask wallet to access parent dashboard features.</div>
        </div>
      )}

      {/* Role Authorization Check */}
      {isConnected && role !== 'parent' && !roleLoading && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <div className="text-red-800 font-semibold mb-2">Access Restricted</div>
          <div className="text-red-600">This dashboard is only available for users with parent role.</div>
        </div>
      )}

      {/* Error Display */}
      {signingError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <div className="text-red-800 font-semibold mb-2">Signing Error</div>
          <div className="text-red-600">{signingError}</div>
        </div>
      )}

      {/* Main Dashboard Content */}
      {isConnected && (role === 'parent' || roleLoading) && (
        <>
          {/* Navigation Tabs */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-2">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('pickup')}
            className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 ${
              activeTab === 'pickup' 
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg' 
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <span>👶</span>
              <span>Pickup My Child</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('authorize')}
            className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 ${
              activeTab === 'authorize' 
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg' 
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <span>🔑</span>
              <span>Authorize Pickup Person</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 ${
              activeTab === 'manage' 
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg' 
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <span>👥</span>
              <span>Manage Pickup Persons</span>
            </div>
          </button>
        </div>
      </div>

      {/* Pickup My Child Tab */}
      {activeTab === 'pickup' && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">👶</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Pickup My Child</h3>
              <p className="text-slate-600">Generate a QR code for child pickup authorization</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-slate-50 rounded-xl p-6">
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
              className="w-full py-4 px-6 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
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
                  <span>🔐</span>
                  <span>Generate Pickup QR</span>
                </div>
              )}
            </button>

            {blockchainResult && (
              <div className={`p-4 rounded-xl border ${
                blockchainResult.startsWith('Anchored') 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-center space-x-2">
                  <span>{blockchainResult.startsWith('Anchored') ? '✅' : '❌'}</span>
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
                  <p className="mt-4 text-sm text-indigo-600">
                    Show this QR code to staff for pickup authorization
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Authorize Pickup Person Tab */}
      {activeTab === 'authorize' && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">🔑</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Authorize Pickup Person</h3>
              <p className="text-slate-600">Grant pickup authorization to trusted individuals</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 rounded-xl p-6">
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
              
              <div className="bg-slate-50 rounded-xl p-6">
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
              
              <div className="bg-slate-50 rounded-xl p-6">
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
              
              <div className="bg-slate-50 rounded-xl p-6">
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
              
              <div className="bg-slate-50 rounded-xl p-6">
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
              
              <div className="bg-slate-50 rounded-xl p-6">
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
              className="w-full py-4 px-6 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
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
                  <span>🔐</span>
                  <span>Authorize & Generate QR</span>
                </div>
              )}
            </button>

            {blockchainResult && (
              <div className={`p-4 rounded-xl border ${
                blockchainResult.startsWith('Authorized') 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-center space-x-2">
                  <span>{blockchainResult.startsWith('Authorized') ? '✅' : '❌'}</span>
                  <span>{blockchainResult}</span>
                </div>
              </div>
            )}

            {authorizedQR && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-8">
                <div className="text-center">
                  <h4 className="text-xl font-bold text-green-700 mb-4">Pickup Person QR Code</h4>
                  <div className="bg-white rounded-xl p-6 inline-block shadow-lg">
                    <QRCodeGenerator value={authorizedQR} />
                  </div>
                  <p className="mt-4 text-sm text-green-600">
                    Send this QR code to the pickup person
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manage Pickup Persons Tab */}
      {activeTab === 'manage' && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">👥</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Manage Pickup Persons</h3>
              <p className="text-slate-600">View and manage authorized pickup persons</p>
            </div>
          </div>
          
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
        </div>
      )}
      </>
      )}
    </div>
  );
};

export default ParentDashboard;