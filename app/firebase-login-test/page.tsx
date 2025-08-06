'use client';

import React from 'react';
import FirebaseMetaMaskLogin from '@/components/FirebaseMetaMaskLogin';

export default function FirebaseLoginTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Firebase Authentication Test
          </h1>
          <p className="text-gray-600">
            Complete wallet authentication with Firebase integration
          </p>
        </div>

        <FirebaseMetaMaskLogin />

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">✅ New Features</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• <strong>Signature-based authentication</strong> - Users sign a message to prove wallet ownership</li>
            <li>• <strong>Firebase Authentication</strong> - Custom tokens for secure user sessions</li>
            <li>• <strong>User registration</strong> - Automatic account creation for new wallets</li>
            <li>• <strong>Role-based access</strong> - Parents, pickup persons, and staff roles</li>
            <li>• <strong>Secure Firestore rules</strong> - Data access based on authenticated user roles</li>
            <li>• <strong>Message validation</strong> - Timestamp and nonce for replay attack prevention</li>
          </ul>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">🔧 Testing Steps</h3>
          <ol className="text-sm text-yellow-700 space-y-1">
            <li>1. Connect your MetaMask wallet</li>
            <li>2. Select a role (Parent, Pickup Person, or Staff)</li>
            <li>3. Sign the authentication message</li>
            <li>4. Get redirected to role-specific dashboard</li>
            <li>5. Check Firebase for user creation and custom token authentication</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
