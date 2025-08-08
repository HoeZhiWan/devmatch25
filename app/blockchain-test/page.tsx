'use client';

import React from 'react';
import BlockchainDemo from '@/components/BlockchainDemo';
import WalletConnection from '@/components/WalletConnection';

export default function BlockchainTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🔗 Blockchain Integration Test
          </h1>
          <p className="text-lg text-gray-600">
            Test the blockchain features: verifiable authorization proofs, tamper-proof pickup history, 
            and Merkle root anchoring.
          </p>
        </div>

        {/* Wallet Connection */}
        <div className="mb-8">
          <WalletConnection />
        </div>

        {/* Blockchain Demo */}
        <BlockchainDemo />
      </div>
    </div>
  );
}
