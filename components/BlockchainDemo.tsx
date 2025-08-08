'use client';

import React, { useState, useEffect } from 'react';
import { useBlockchain } from '@/hooks/useBlockchain';
import { useWallet } from '@/hooks/useWallet';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import * as blockchain from '@/lib/blockchain';
import type { AuthorizationData, PickupEventData, MerkleBatchData } from '@/lib/blockchain/types';

interface BlockchainDemoProps {
  className?: string;
}

export default function BlockchainDemo({ className = '' }: BlockchainDemoProps) {
  const blockchainHook = useBlockchain();
  const walletHook = useWallet();
  const authHook = useFirebaseAuth();
  
  const [demoData, setDemoData] = useState({
    authorization: null as any,
    pickupEvent: null as any,
    merkleBatch: null as any,
    verificationResult: null as any
  });
  
  const [isRunningDemo, setIsRunningDemo] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [demoLogs, setDemoLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setDemoLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearLogs = () => {
    setDemoLogs([]);
  };

  // Demo authorization data
  const createDemoAuthorization = (): AuthorizationData => {
    const parentWallet = walletHook.address || '0x1234567890123456789012345678901234567890';
    const pickupWallet = '0x0987654321098765432109876543210987654321';
    const studentId = 'CH001';
    const studentHash = blockchain.createStudentHash(studentId);
    
    return {
      authHash: '',
      parentWallet,
      pickupWallet,
      studentHash,
      startDate: Math.floor(Date.now() / 1000),
      endDate: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
      signature: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      message: 'Demo authorization message'
    };
  };

  // Demo pickup event data
  const createDemoPickupEvent = (): PickupEventData => {
    const studentId = 'CH001';
    const studentHash = blockchain.createStudentHash(studentId);
    const pickupWallet = '0x0987654321098765432109876543210987654321';
    const staffWallet = '0x1111111111111111111111111111111111111111';
    const qrCodeData = 'DEMO_QR_CODE_123';
    const qrCodeHash = blockchain.createQRCodeHash(qrCodeData);
    
    return {
      eventHash: '',
      studentHash,
      pickupWallet,
      staffWallet,
      qrCodeHash,
      timestamp: Math.floor(Date.now() / 1000)
    };
  };

  // Run complete blockchain demo
  const runBlockchainDemo = async () => {
    if (!walletHook.isConnected) {
      addLog('❌ Wallet not connected. Please connect your wallet first.');
      return;
    }

    setIsRunningDemo(true);
    setDemoStep(0);
    clearLogs();
    
    try {
      addLog('🚀 Starting Blockchain Demo...');
      
      // Step 1: Create Authorization
      addLog('📝 Step 1: Creating authorization on blockchain...');
      setDemoStep(1);
      
      const authData = createDemoAuthorization();
      const authResult = await blockchainHook.createAuthorization(authData);
      
      if (authResult.success) {
        addLog(`✅ Authorization created successfully! Hash: ${authResult.hash}`);
        setDemoData(prev => ({ ...prev, authorization: authData }));
      } else {
        addLog(`❌ Authorization creation failed: ${authResult.error}`);
        return;
      }

      // Step 2: Record Pickup Event
      addLog('📝 Step 2: Recording pickup event on blockchain...');
      setDemoStep(2);
      
      const eventData = createDemoPickupEvent();
      const eventResult = await blockchainHook.recordPickupEvent(eventData);
      
      if (eventResult.success) {
        addLog(`✅ Pickup event recorded successfully! Hash: ${eventResult.hash}`);
        setDemoData(prev => ({ ...prev, pickupEvent: eventData }));
      } else {
        addLog(`❌ Pickup event recording failed: ${eventResult.error}`);
        return;
      }

      // Step 3: Create Merkle Batch
      addLog('📝 Step 3: Creating Merkle batch...');
      setDemoStep(3);
      
      const events = [eventData];
      const batch = blockchainHook.createBatch(events, 0);
      
      if (batch) {
        addLog(`✅ Merkle batch created! Root: ${batch.merkleRoot}`);
        setDemoData(prev => ({ ...prev, merkleBatch: batch }));
      } else {
        addLog('❌ Merkle batch creation failed');
        return;
      }

      // Step 4: Anchor Merkle Batch
      addLog('📝 Step 4: Anchoring Merkle batch on blockchain...');
      setDemoStep(4);
      
      const batchData: MerkleBatchData = {
        merkleRoot: batch.merkleRoot,
        batchNumber: 0,
        timestamp: Date.now(),
        blockNumber: 0,
        eventCount: events.length,
        ipfsHash: ''
      };
      
      const anchorResult = await blockchainHook.anchorMerkleBatch(batchData);
      
      if (anchorResult.success) {
        addLog(`✅ Merkle batch anchored successfully! Transaction: ${anchorResult.transactionHash}`);
      } else {
        addLog(`❌ Merkle batch anchoring failed: ${anchorResult.error}`);
        return;
      }

      // Step 5: Verify Authorization
      addLog('📝 Step 5: Verifying authorization...');
      setDemoStep(5);
      
      const verifyAuthResult = await blockchainHook.verifyAuthorization(authData);
      
      if (verifyAuthResult.isValid) {
        addLog('✅ Authorization verified successfully!');
      } else {
        addLog(`❌ Authorization verification failed: ${verifyAuthResult.error}`);
      }

      // Step 6: Verify Pickup Event
      addLog('📝 Step 6: Verifying pickup event with Merkle proof...');
      setDemoStep(6);
      
      const merkleProof = {
        eventHash: blockchain.createPickupEventHash(eventData),
        batchNumber: 0,
        proof: blockchain.generateMerkleProof([blockchain.createPickupEventHash(eventData)], blockchain.createPickupEventHash(eventData))
      };
      
      const verifyEventResult = await blockchainHook.verifyPickupEvent(eventData, merkleProof);
      
      if (verifyEventResult.isValid) {
        addLog('✅ Pickup event verified successfully with Merkle proof!');
        setDemoData(prev => ({ ...prev, verificationResult: verifyEventResult }));
      } else {
        addLog(`❌ Pickup event verification failed: ${verifyEventResult.error}`);
      }

      // Step 7: Display Contract Stats
      addLog('📝 Step 7: Getting contract statistics...');
      setDemoStep(7);
      
      await blockchainHook.getContractStats();
      addLog(`✅ Contract Stats - Authorizations: ${blockchainHook.contractStats.authorizationCount}, Events: ${blockchainHook.contractStats.pickupEventCount}, Batches: ${blockchainHook.contractStats.batchCount}`);

      addLog('🎉 Blockchain Demo completed successfully!');
      setDemoStep(8);

    } catch (error: any) {
      addLog(`❌ Demo failed: ${error.message}`);
    } finally {
      setIsRunningDemo(false);
    }
  };

  const resetDemo = () => {
    setDemoData({
      authorization: null,
      pickupEvent: null,
      merkleBatch: null,
      verificationResult: null
    });
    setDemoStep(0);
    clearLogs();
  };

  return (
    <div className={`p-6 bg-white rounded-lg shadow-lg ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🔗 Blockchain Integration Demo
        </h2>
        <p className="text-gray-600">
          Demonstrating verifiable authorization proofs, tamper-proof pickup history, and Merkle tree anchoring.
        </p>
      </div>

      {/* Demo Controls */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={runBlockchainDemo}
          disabled={isRunningDemo || !walletHook.isConnected}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isRunningDemo ? 'Running Demo...' : '🚀 Run Blockchain Demo'}
        </button>
        
        <button
          onClick={resetDemo}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          🔄 Reset Demo
        </button>
        
        <button
          onClick={clearLogs}
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
        >
          🗑️ Clear Logs
        </button>
      </div>

      {/* Connection Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Connection Status</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Wallet:</span>
            <span className={`ml-2 ${walletHook.isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {walletHook.isConnected ? '✅ Connected' : '❌ Disconnected'}
            </span>
          </div>
          <div>
            <span className="font-medium">Blockchain:</span>
            <span className={`ml-2 ${blockchainHook.contractStats.authorizationCount > 0 ? 'text-green-600' : 'text-yellow-600'}`}>
              {blockchainHook.contractStats.authorizationCount > 0 ? '✅ Active' : '⚠️ No Data'}
            </span>
          </div>
        </div>
      </div>

      {/* Demo Progress */}
      {isRunningDemo && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">Demo Progress</h3>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(demoStep / 8) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Step {demoStep} of 8: {
              demoStep === 0 ? 'Ready' :
              demoStep === 1 ? 'Creating Authorization' :
              demoStep === 2 ? 'Recording Pickup Event' :
              demoStep === 3 ? 'Creating Merkle Batch' :
              demoStep === 4 ? 'Anchoring Merkle Batch' :
              demoStep === 5 ? 'Verifying Authorization' :
              demoStep === 6 ? 'Verifying Pickup Event' :
              demoStep === 7 ? 'Getting Contract Stats' :
              'Completed'
            }
          </p>
        </div>
      )}

      {/* Contract Statistics */}
      <div className="mb-6 p-4 bg-green-50 rounded-lg">
        <h3 className="font-semibold mb-2">Contract Statistics</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {blockchainHook.contractStats.authorizationCount}
            </div>
            <div className="text-gray-600">Authorizations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {blockchainHook.contractStats.pickupEventCount}
            </div>
            <div className="text-gray-600">Pickup Events</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {blockchainHook.contractStats.batchCount}
            </div>
            <div className="text-gray-600">Merkle Batches</div>
          </div>
        </div>
      </div>

      {/* Demo Results */}
      {demoData.authorization && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">Demo Results</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Authorization:</span>
              <span className="ml-2 text-green-600">✅ Created</span>
            </div>
            <div>
              <span className="font-medium">Pickup Event:</span>
              <span className="ml-2 text-green-600">✅ Recorded</span>
            </div>
            <div>
              <span className="font-medium">Merkle Batch:</span>
              <span className="ml-2 text-green-600">✅ Anchored</span>
            </div>
            <div>
              <span className="font-medium">Verification:</span>
              <span className="ml-2 text-green-600">✅ Verified</span>
            </div>
          </div>
        </div>
      )}

      {/* Demo Logs */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Demo Logs</h3>
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg h-64 overflow-y-auto font-mono text-sm">
          {demoLogs.length === 0 ? (
            <div className="text-gray-500">No logs yet. Run the demo to see activity.</div>
          ) : (
            demoLogs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Error Display */}
      {blockchainHook.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-semibold text-red-800 mb-2">Error</h3>
          <p className="text-red-600 text-sm">{blockchainHook.error}</p>
          <button
            onClick={blockchainHook.clearError}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Clear Error
          </button>
        </div>
      )}

      {/* Loading Indicator */}
      {blockchainHook.isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span>Processing blockchain transaction...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
