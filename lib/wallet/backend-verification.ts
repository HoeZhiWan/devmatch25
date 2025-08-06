/**
 * Backend signature verification utilities
 * Used for server-side validation of wallet signatures
 */

import { verifyMessage } from 'ethers';
import type { AuthorizationMessage } from '../../types/wallet';
import { parseAuthorizationMessage } from './signature';

interface BackendVerificationResult {
  isValid: boolean;
  parentWallet?: string;
  pickupWallet?: string;
  studentId?: string;
  studentName?: string;
  authorizationData?: Partial<AuthorizationMessage>;
  error?: string;
}

/**
 * Verifies a complete authorization signature on the backend
 * This function should be used by the backend to verify parent authorizations
 */
export const verifyParentAuthorization = async (
  message: string,
  signature: string,
  expectedParentWallet: string
): Promise<BackendVerificationResult> => {
  try {
    // First verify the signature
    const recoveredAddress = verifyMessage(message, signature);
    const normalizedRecovered = recoveredAddress.toLowerCase();
    const normalizedExpected = expectedParentWallet.toLowerCase();

    if (normalizedRecovered !== normalizedExpected) {
      return {
        isValid: false,
        error: `Signature verification failed. Expected ${normalizedExpected}, got ${normalizedRecovered}`
      };
    }

    // Parse the authorization message to extract data
    const authorizationData = parseAuthorizationMessage(message);
    
    if (!authorizationData) {
      return {
        isValid: false,
        error: 'Failed to parse authorization message'
      };
    }

    // Validate required fields
    const requiredFields = ['parentWallet', 'pickupWallet', 'studentId', 'studentName'];
    for (const field of requiredFields) {
      if (!authorizationData[field as keyof AuthorizationMessage]) {
        return {
          isValid: false,
          error: `Missing required field: ${field}`
        };
      }
    }

    // Verify the parent wallet in the message matches the expected wallet
    if (authorizationData.parentWallet?.toLowerCase() !== normalizedExpected) {
      return {
        isValid: false,
        error: 'Parent wallet in message does not match expected wallet'
      };
    }

    return {
      isValid: true,
      parentWallet: authorizationData.parentWallet,
      pickupWallet: authorizationData.pickupWallet,
      studentId: authorizationData.studentId,
      studentName: authorizationData.studentName,
      authorizationData
    };

  } catch (error: any) {
    console.error('Backend authorization verification error:', error);
    return {
      isValid: false,
      error: error.message || 'Verification failed'
    };
  }
};

/**
 * Validates that an authorization is still valid (within date range)
 */
export const isAuthorizationValid = (authData: Partial<AuthorizationMessage>): boolean => {
  if (!authData.startDate || !authData.endDate) {
    return false;
  }

  const now = new Date();
  const startDate = new Date(authData.startDate);
  const endDate = new Date(authData.endDate);

  return now >= startDate && now <= endDate;
};

/**
 * Creates a verification summary for logging
 */
export const createVerificationSummary = (
  result: BackendVerificationResult,
  additionalData?: any
): object => {
  return {
    timestamp: new Date().toISOString(),
    isValid: result.isValid,
    parentWallet: result.parentWallet,
    pickupWallet: result.pickupWallet,
    studentId: result.studentId,
    studentName: result.studentName,
    error: result.error,
    ...additionalData
  };
};
