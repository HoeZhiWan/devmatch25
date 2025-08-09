'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { addAuthorizationToFirebase } from '../../lib/firebase/actions';
import { createAuthorizationHash } from '../../lib/blockchain/hashing';
import { createAuthorizationOnChain } from '../../lib/blockchain/contract';
import type { Authorization } from '../../types/database';

// --- Mock Data ---
const MOCK_AUTH_DATA: Omit<Authorization, 'id' | 'createdAt' | 'signature' | 'message'> = {
  studentId: 'STU-001',
  parentWallet: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Hardhat account 0
  pickupWallet: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Hardhat account 1
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
  isActive: true,
};

export default function DebugPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [contractAddress, setContractAddress] = useState<string | null>(null);

  const addLog = (log: string) => {
    console.log(log);
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${log}`]);
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    addLog('🚀 Deploying contract via API...');
    try {
      const response = await fetch('/api/deploy', { method: 'POST' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Deployment failed.');
      }

      setContractAddress(data.contractAddress);
      addLog(`✅ Contract deployed at: ${data.contractAddress}`);
    } catch (error: any) {
      addLog(`❌ ERROR: ${error.message}`);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleRunFlow = async () => {
    setIsLoading(true);
    setLogs([]);
    addLog('🚀 Starting end-to-end authorization flow...');

    try {
      if (!contractAddress) {
        addLog('❌ Contract not deployed. Please deploy the contract first.');
        return;
      }

      // --- Step 1: Connect to Wallet ---
      if (typeof window.ethereum === 'undefined') {
        addLog('❌ MetaMask is not installed.');
        throw new Error('MetaMask not installed.');
      }
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      addLog(`✅ Connected to wallet: ${signer.address}`);

      // --- Step 2: Add to Firebase ---
      addLog('🔥 Writing authorization to Firebase...');
      const authDataForFirebase = { ...MOCK_AUTH_DATA, signature: '0x', message: '' };
      const firebaseId = await addAuthorizationToFirebase(authDataForFirebase);
      addLog(`📄 Firebase record created with ID: ${firebaseId}`);

      // --- Step 3: Generate Hash ---
      addLog('🔑 Generating on-chain hash...');
      // In a real app, you'd derive this properly
      const studentHash = ethers.keccak256(ethers.toUtf8Bytes(MOCK_AUTH_DATA.studentId));
      const fullAuthData = {
        ...authDataForFirebase,
        authHash: '',
        studentHash,
        startDate: Math.floor(new Date(MOCK_AUTH_DATA.startDate).getTime() / 1000),
        endDate: Math.floor(new Date(MOCK_AUTH_DATA.endDate).getTime() / 1000),
      };
      const authHash = createAuthorizationHash(firebaseId, fullAuthData as any);
      addLog(`🔒 Generated Hash: ${authHash}`);

      // --- Step 4: Anchor on Blockchain ---
      addLog('🔗 Anchoring hash on the blockchain...');
      const network = await provider.getNetwork();
      const txResult = await createAuthorizationOnChain(
        signer,
        authHash,
        MOCK_AUTH_DATA.parentWallet,
        {
          contractAddress: contractAddress!,
          rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || '',
          chainId: Number(network.chainId),
        }
      );
      if (!txResult.success) {
        throw new Error(txResult.error || 'Transaction failed.');
      }
      addLog(`✅ Transaction successful! Hash: ${txResult.hash}`);
      addLog('🎉 End-to-end flow completed successfully!');

    } catch (error: any) {
      addLog(`❌ ERROR: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">🛠️ Debug & Test Page</h1>
      <p className="mb-6 text-gray-600">
        Use this page to deploy your contract or test the end-to-end authorization flow.
      </p>

      <div className="space-y-4">
        <div className="flex space-x-4">
          <button
            onClick={handleDeploy}
            disabled={isDeploying}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400"
          >
            {isDeploying ? 'Deploying...' : 'Option 1: Deploy Contract'}
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Or paste contract address here"
            className="flex-grow p-2 border rounded-lg"
            onChange={(e) => setContractAddress(e.target.value)}
          />
        </div>
      </div>

      <hr className="my-8" />

      <button
        onClick={handleRunFlow}
        disabled={isLoading || !contractAddress}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isLoading ? 'Running...' : 'Run Authorization Flow'}
      </button>

      {contractAddress && (
        <p className="mt-4 text-sm text-gray-500">
          Using Contract Address: <span className="font-mono">{contractAddress}</span>
        </p>
      )}

      <div className="mt-8 bg-gray-900 text-white p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto">
        <p className="text-gray-400">// Logs will appear here...</p>
        {logs.map((log, index) => (
          <p key={index} className={log.includes('ERROR') ? 'text-red-400' : 'text-green-400'}>
            {log}
          </p>
        ))}
      </div>
    </div>
  );
}