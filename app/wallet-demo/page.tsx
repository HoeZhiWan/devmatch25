'use client';

/**
 * Wallet Demo Page
 * Demonstrates the wallet integration and authorization workflow
 */

import React, { useState } from 'react';
import { WalletConnect, AuthorizationSigner } from '../../components/wallet';
import { useWallet, useSignature } from '../../hooks';

interface AuthorizationData {
  signature: string;
  message: string;
  timestamp: number;
}

export default function WalletDemoPage() {
  const { isConnected, address } = useWallet();
  const { verify } = useSignature();
  const [showSigner, setShowSigner] = useState(false);
  const [authorization, setAuthorization] = useState<AuthorizationData | null>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  // Example data for demonstration
  const exampleStudentId = 'STD001';
  const exampleStudentName = 'Emma Johnson';
  const examplePickupWallet = '0x742d35Cc6075C2532C2C43E1e7C5E62Ca28a79fd';

  const handleAuthorizationSigned = async (signature: string, message: string) => {
    const authData: AuthorizationData = {
      signature,
      message,
      timestamp: Date.now()
    };
    
    setAuthorization(authData);
    setShowSigner(false);

    // Verify the signature client-side
    if (address) {
      const verificationResult = verify({
        message,
        signature,
        expectedAddress: address
      });
      setVerificationResult(verificationResult);

      // Also verify server-side
      try {
        const response = await fetch('/api/auth/verify-signature', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            signature,
            expectedAddress: address
          }),
        });
        
        const serverVerification = await response.json();
        console.log('Server verification result:', serverVerification);
      } catch (error) {
        console.error('Server verification failed:', error);
      }
    }
  };

  const resetDemo = () => {
    setAuthorization(null);
    setVerificationResult(null);
    setShowSigner(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              DevMatch25 - Wallet Integration Demo
            </h1>
            <p className="text-lg text-gray-600">
              Demonstrates MetaMask connection, message signing, and signature verification
            </p>
          </div>

          {/* Wallet Connection */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Wallet Connection</h2>
            <WalletConnect 
              onConnect={(address: string) => console.log('Wallet connected:', address)}
              onDisconnect={() => console.log('Wallet disconnected')}
              showNetworkInfo={true}
            />
          </div>

          {/* Authorization Workflow */}
          {isConnected && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Authorization Workflow</h2>
              
              {!showSigner && !authorization && (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    Create a pickup authorization for demonstration
                  </p>
                  <button
                    onClick={() => setShowSigner(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Create Authorization
                  </button>
                </div>
              )}

              {showSigner && (
                <AuthorizationSigner
                  studentId={exampleStudentId}
                  studentName={exampleStudentName}
                  pickupWallet={examplePickupWallet}
                  onAuthorizationSigned={handleAuthorizationSigned}
                  onCancel={() => setShowSigner(false)}
                />
              )}
            </div>
          )}

          {/* Authorization Result */}
          {authorization && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Authorization Result</h2>
              
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium text-green-800">Authorization Signed Successfully</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Created at: {new Date(authorization.timestamp).toLocaleString()}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Signature:</h4>
                    <div className="bg-gray-50 p-3 rounded border text-xs font-mono break-all">
                      {authorization.signature}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Client Verification:</h4>
                    <div className={`p-3 rounded border text-sm ${
                      verificationResult?.isValid 
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                      Status: {verificationResult?.isValid ? 'Valid ✓' : 'Invalid ✗'}
                      {verificationResult?.recoveredAddress && (
                        <div className="mt-1 text-xs">
                          Recovered: {verificationResult.recoveredAddress}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Signed Message:</h4>
                  <div className="bg-gray-50 p-3 rounded border">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words">
                      {authorization.message}
                    </pre>
                  </div>
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={resetDemo}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Reset Demo
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Integration Guide */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Integration Guide</h2>
            
            <div className="prose prose-sm max-w-none text-gray-600">
              <h3>Components Available:</h3>
              <ul>
                <li><code>WalletConnect</code> - Handles MetaMask connection UI</li>
                <li><code>AuthorizationSigner</code> - Creates and signs pickup authorizations</li>
              </ul>

              <h3>Hooks Available:</h3>
              <ul>
                <li><code>useWallet()</code> - Manages wallet connection state</li>
                <li><code>useSignature()</code> - Handles message signing and verification</li>
              </ul>

              <h3>API Endpoints:</h3>
              <ul>
                <li><code>POST /api/auth/connect-wallet</code> - Wallet connection verification</li>
                <li><code>POST /api/auth/verify-signature</code> - Server-side signature verification</li>
              </ul>

              <h3>Key Features:</h3>
              <ul>
                <li>✓ MetaMask detection and installation guidance</li>
                <li>✓ Network validation and switching</li>
                <li>✓ Human-readable authorization messages</li>
                <li>✓ Client and server-side signature verification</li>
                <li>✓ Comprehensive error handling</li>
                <li>✓ Mobile-responsive design</li>
                <li>✓ TypeScript support</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
