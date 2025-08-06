'use client';

/**
 * AuthorizationSigner Component
 * Handles the UI for creating and signing pickup authorizations
 */

import React, { useState, useEffect } from 'react';
import { useSignature } from '../../hooks/useSignature';
import type { AuthorizationMessage } from '../../types/wallet';

interface AuthorizationSignerProps {
  studentId: string;
  studentName: string;
  pickupWallet: string;
  onAuthorizationSigned?: (signature: string, message: string) => void;
  onCancel?: () => void;
  className?: string;
}

export const AuthorizationSigner: React.FC<AuthorizationSignerProps> = ({
  studentId,
  studentName,
  pickupWallet,
  onAuthorizationSigned,
  onCancel,
  className = ''
}) => {
  const [mounted, setMounted] = useState(false);
  const {
    isLoading,
    error,
    lastSignature,
    lastMessage,
    isWalletConnected,
    currentWalletAddress,
    signAuthorization,
    createMessage,
    formatAddress
  } = useSignature();

  const [authParams, setAuthParams] = useState({
    startDate: '',
    endDate: ''
  });

  const [showPreview, setShowPreview] = useState(false);

  // Initialize dates on client side to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    setAuthParams({
      startDate: today,
      endDate: nextWeek
    });
  }, []);

  // Create preview message
  const previewMessage = currentWalletAddress ? createMessage({
    pickupWallet,
    studentId,
    studentName,
    startDate: authParams.startDate,
    endDate: authParams.endDate
  }) : '';

  // Handle form submission
  const handleSign = async () => {
    const result = await signAuthorization({
      pickupWallet,
      studentId,
      studentName,
      startDate: authParams.startDate,
      endDate: authParams.endDate
    });

    if (result.success && onAuthorizationSigned) {
      onAuthorizationSigned(result.signature!, result.message!);
    }
  };

  // Validate form
  const isFormValid = authParams.startDate && 
                     authParams.endDate && 
                     new Date(authParams.startDate) <= new Date(authParams.endDate);

  // Show loading state during hydration
  if (!mounted) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-center p-8">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="ml-2 text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isWalletConnected) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <div className="text-center">
          <svg className="w-8 h-8 text-yellow-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 className="text-lg font-medium text-yellow-800 mb-1">Wallet Connection Required</h3>
          <p className="text-sm text-yellow-700">Please connect your wallet to create an authorization.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Create Pickup Authorization</h2>
          <p className="text-sm text-gray-600">
            Authorize <span className="font-medium">{formatAddress(pickupWallet)}</span> to pick up{' '}
            <span className="font-medium">{studentName}</span>
          </p>
        </div>

        {/* Authorization Details */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Student:</span>
              <span className="ml-2 text-gray-400 font-medium">{studentName} ({studentId})</span>
            </div>
            <div>
              <span className="text-gray-600">Pickup Person:</span>
              <span className="ml-2 text-gray-400 font-medium">{formatAddress(pickupWallet)}</span>
            </div>
            <div>
              <span className="text-gray-600">Parent:</span>
              <span className="ml-2 text-gray-400 font-medium">{formatAddress(currentWalletAddress!)}</span>
            </div>
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Valid From
            </label>
            <input
              type="date"
              id="startDate"
              value={authParams.startDate}
              onChange={(e) => setAuthParams(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 text-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min={mounted ? new Date().toISOString().split('T')[0] : ''}
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              Valid Until
            </label>
            <input
              type="date"
              id="endDate"
              value={authParams.endDate}
              onChange={(e) => setAuthParams(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 text-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min={authParams.startDate || (mounted ? new Date().toISOString().split('T')[0] : '')}
            />
          </div>
        </div>

        {/* Preview Button */}
        <div className="flex justify-center">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {showPreview ? 'Hide Preview' : 'Preview Message'}
          </button>
        </div>

        {/* Message Preview */}
        {showPreview && previewMessage && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Authorization Message Preview:</h4>
            <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words">{previewMessage}</pre>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-red-800">Signature Error</h4>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {lastSignature && lastMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-green-800">Authorization Signed Successfully</h4>
                <p className="text-sm text-green-700 mt-1">
                  The authorization has been signed and is ready to be submitted.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSign}
            disabled={!isFormValid || isLoading || !!lastSignature}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Signing...</span>
              </>
            ) : lastSignature ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Signed</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span>Sign Authorization</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
