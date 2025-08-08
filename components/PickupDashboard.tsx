import React, { useState } from "react";
import QRCodeGenerator from "./QRCodeGenerator";
import { logAuthorization } from "../lib/web3";
import { useWallet } from "../hooks/useWallet";
import { useSignature } from "../hooks/useSignature";
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

const PickupDashboard: React.FC = () => {

  const { address, isConnected } = useWallet();
  const {
    signAuthorization,
    error: signingError,
  } = useSignature();

  // Mock Data
  const [children] = useState<Child[]>([
    { id: 'STU001', name: 'Alice Johnson', parentWallet: address || '0x1234...5678' },
    { id: 'STU002', name: 'Bob Smith', parentWallet: address || '0x8765...4321' },
  ]);

  // const [pickupPersons] = useState<PickupPerson[]>([
  //   {
  //     id: '1',
  //     name: 'Grandma Mary',
  //     walletAddress: '0x9876...5432',
  //     relationship: 'Grandmother',
  //     phoneNumber: '+1234567890',
  //     startDate: '2024-01-01',
  //     endDate: '2024-12-31',
  //     isActive: true
  //   },
  //   {
  //     id: '2',
  //     name: 'Uncle John',
  //     walletAddress: '0x5432...9876',
  //     relationship: 'Uncle',
  //     phoneNumber: '+0987654321',
  //     startDate: '2024-01-15',
  //     endDate: '2024-06-30',
  //     isActive: true
  //   },
  // ]);


  const [selectedChild, setSelectedChild] = useState<string>("");
  const [qrValue, setQrValue] = useState<string | null>(null);
  const [blockchainResult, setBlockchainResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      //link children to backend
      const selectedChildData = children.find(child => child.id === selectedChild);
      if (!selectedChildData) {
        throw new Error('Selected child not found');
      }

      // Create authorization using wallet integration
      const authParams: Omit<AuthorizationMessage, 'parentWallet' | 'timestamp'> = {
        pickupWallet: address,
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

  return (
    <div className="space-y-8">

      {/* Error Display */}
      {signingError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <div className="text-red-800 font-semibold mb-2">Signing Error</div>
          <div className="text-red-600">{signingError}</div>
        </div>
      )}

      {/* Main Dashboard Content */}
      {isConnected && (
        <>
          {/* Pickup My Child Tab */}
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

        </>
      )}
    </div>
  );
};

export default PickupDashboard;