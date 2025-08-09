/**
 * Signature utilities for authorization message signing and verification
 * Handles message formatting, signing with MetaMask, and signature validation
 */

import { BrowserProvider, verifyMessage } from 'ethers';
import type {
  SignatureResult,
  SignatureVerificationParams,
  SignatureVerificationResult,
  AuthorizationMessage,
  WalletError
} from '../../types/wallet';
import { createWalletError } from './connection';

/**
 * Creates a human-readable authorization message for signing
 */
export const createAuthorizationMessage = (params: AuthorizationMessage): string => {
  const message = [
    '🔐 KidGuard - Child Pickup Authorization',
    '',
    `I, the parent with wallet ${params.parentWallet},`,
    `authorize wallet ${params.pickupWallet}`,
    `to pick up my child: ${params.studentName} (ID: ${params.studentId})`,
    '',
    `📅 Valid from: ${params.startDate}`,
    `📅 Valid until: ${params.endDate}`,
    '',
    `⏰ Authorized at: ${new Date(params.timestamp).toISOString()}`,
    '',
    '⚠️ This authorization is legally binding.',
    '⚠️ Only sign if you trust the pickup person.',
    '',
    '🌐 KidGuard Secure Pickup System'
  ].join('\n');

  return message;
};

/**
 * Signs a message using MetaMask wallet
 */
export const signMessage = async (
  provider: BrowserProvider,
  message: string
): Promise<SignatureResult> => {
  try {
    if (!provider) {
      return {
        success: false,
        error: 'No wallet provider available. Please connect your wallet first.'
      };
    }

    const signer = await provider.getSigner();
    const signature = await signer.signMessage(message);

    return {
      success: true,
      signature,
      message
    };

  } catch (error: any) {
    console.error('Failed to sign message:', error);

    // Handle specific signing errors
    if (error.code === '4001') {
      return {
        success: false,
        error: 'Signature was rejected. Please approve the signing request to continue.'
      };
    }

    if (error.code === 'NETWORK_ERROR') {
      return {
        success: false,
        error: 'Network error occurred. Please check your connection and try again.'
      };
    }

    return {
      success: false,
      error: error.message || 'Failed to sign message. Please try again.'
    };
  }
};

/**
 * Verifies a signature against an expected address (client-side)
 */
export const verifySignature = (params: SignatureVerificationParams): SignatureVerificationResult => {
  try {
    const { message, signature, expectedAddress } = params;

    if (!message || !signature || !expectedAddress) {
      return {
        isValid: false,
        error: 'Missing required parameters for signature verification.'
      };
    }

    // Verify the signature and recover the address
    const recoveredAddress = verifyMessage(message, signature);
    
    // Compare addresses (case-insensitive)
    const isValid = recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();

    return {
      isValid,
      recoveredAddress: recoveredAddress.toLowerCase()
    };

  } catch (error: any) {
    console.error('Failed to verify signature:', error);
    return {
      isValid: false,
      error: error.message || 'Failed to verify signature.'
    };
  }
};

/**
 * Creates a complete authorization workflow
 */
export const createAndSignAuthorization = async (
  provider: BrowserProvider,
  authParams: AuthorizationMessage
): Promise<SignatureResult> => {
  try {
    // Create the human-readable message
    const message = createAuthorizationMessage(authParams);
    
    // Sign the message
    const result = await signMessage(provider, message);
    
    if (!result.success) {
      return result;
    }

    // Verify the signature matches the parent wallet
    const verification = verifySignature({
      message,
      signature: result.signature!,
      expectedAddress: authParams.parentWallet
    });

    if (!verification.isValid) {
      return {
        success: false,
        error: 'Signature verification failed. The signed message does not match the parent wallet.'
      };
    }

    return {
      success: true,
      signature: result.signature,
      message
    };

  } catch (error: any) {
    console.error('Failed to create and sign authorization:', error);
    return {
      success: false,
      error: error.message || 'Failed to complete authorization process.'
    };
  }
};

/**
 * Validates authorization message format
 */
export const validateAuthorizationMessage = (message: string): boolean => {
  const requiredPhrases = [
    'KidGuard - Child Pickup Authorization',
    'authorize wallet',
    'to pick up my child',
    'Valid from:',
    'Valid until:',
    'Authorized at:'
  ];

  return requiredPhrases.every(phrase => message.includes(phrase));
};

/**
 * Extracts authorization data from a signed message
 */
export const parseAuthorizationMessage = (message: string): Partial<AuthorizationMessage> | null => {
  try {
    const lines = message.split('\n');
    const result: Partial<AuthorizationMessage> = {};

    // Extract parent wallet
    const parentLine = lines.find(line => line.includes('I, the parent with wallet'));
    if (parentLine) {
      const parentMatch = parentLine.match(/wallet (0x[a-fA-F0-9]{40})/);
      if (parentMatch) result.parentWallet = parentMatch[1].toLowerCase();
    }

    // Extract pickup wallet
    const authorizeLine = lines.find(line => line.includes('authorize wallet'));
    if (authorizeLine) {
      const pickupMatch = authorizeLine.match(/wallet (0x[a-fA-F0-9]{40})/);
      if (pickupMatch) result.pickupWallet = pickupMatch[1].toLowerCase();
    }

    // Extract student info
    const studentLine = lines.find(line => line.includes('to pick up my child:'));
    if (studentLine) {
      const studentMatch = studentLine.match(/child: (.*?) \(ID: (.*?)\)/);
      if (studentMatch) {
        result.studentName = studentMatch[1].trim();
        result.studentId = studentMatch[2].trim();
      }
    }

    // Extract dates
    const startDateLine = lines.find(line => line.includes('Valid from:'));
    if (startDateLine) {
      const startMatch = startDateLine.match(/Valid from: (.*?)$/);
      if (startMatch) result.startDate = startMatch[1].trim();
    }

    const endDateLine = lines.find(line => line.includes('Valid until:'));
    if (endDateLine) {
      const endMatch = endDateLine.match(/Valid until: (.*?)$/);
      if (endMatch) result.endDate = endMatch[1].trim();
    }

    // Extract timestamp
    const timestampLine = lines.find(line => line.includes('Authorized at:'));
    if (timestampLine) {
      const timestampMatch = timestampLine.match(/Authorized at: (.*?)$/);
      if (timestampMatch) {
        const timestamp = new Date(timestampMatch[1].trim()).getTime();
        if (!isNaN(timestamp)) result.timestamp = timestamp;
      }
    }

    return result;
  } catch (error) {
    console.error('Failed to parse authorization message:', error);
    return null;
  }
};

/**
 * Creates a signature error object
 */
export const createSignatureError = (message: string): WalletError => {
  return createWalletError('signature', message);
};
