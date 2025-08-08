/**
 * Verification Utilities
 * Functions for timestamping and proof verification using on-chain roots and off-chain trees
 */

import { ethers } from 'ethers';
import { VERIFICATION_SETTINGS, ERROR_CODES } from './constants';
import type { 
  AuthorizationData, 
  PickupEventData, 
  MerkleProof,
  VerificationResult,
  AuthorizationVerificationResult,
  PickupVerificationResult 
} from './types';
import { 
  createAuthorizationHash, 
  createPickupEventHash, 
  createStudentHash,
  verifyMerkleProof 
} from './hashing';
import { 
  verifyAuthorizationOnChain,
  getAuthorizationFromChain,
  getPickupEventFromChain,
  verifyPickupEventProof 
} from './contract';

/**
 * Verifies an authorization with timestamp validation
 * @param authData Authorization data to verify
 * @param provider Ethers provider
 * @param network Network configuration
 * @returns Authorization verification result
 */
export const verifyAuthorizationWithTimestamp = async (
  authData: AuthorizationData,
  provider: ethers.Provider,
  network?: any
): Promise<AuthorizationVerificationResult> => {
  try {
    // Check timestamp validity
    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = Math.abs(currentTime - authData.startDate);
    
    if (timeDiff > VERIFICATION_SETTINGS.AUTHORIZATION_TIMEOUT) {
      return {
        isValid: false,
        error: ERROR_CODES.AUTHORIZATION_EXPIRED
      };
    }

    // Verify on blockchain
    const authHash = createAuthorizationHash(authData);
    const isBlockchainValid = await verifyAuthorizationOnChain(
      provider,
      authHash,
      authData.pickupWallet,
      authData.studentHash,
      network
    );

    if (!isBlockchainValid) {
      return {
        isValid: false,
        error: ERROR_CODES.AUTHORIZATION_NOT_FOUND
      };
    }

    // Get full authorization details from blockchain
    const blockchainAuth = await getAuthorizationFromChain(provider, authHash, network);
    
    if (!blockchainAuth) {
      return {
        isValid: false,
        error: ERROR_CODES.AUTHORIZATION_NOT_FOUND
      };
    }

    return {
      isValid: true,
      authorization: blockchainAuth
    };

  } catch (error: any) {
    return {
      isValid: false,
      error: error.message || 'Verification failed'
    };
  }
};

/**
 * Verifies a pickup event with Merkle proof
 * @param eventData Pickup event data
 * @param merkleProof Merkle proof for the event
 * @param provider Ethers provider
 * @param network Network configuration
 * @returns Pickup verification result
 */
export const verifyPickupEventWithProof = async (
  eventData: PickupEventData,
  merkleProof: MerkleProof,
  provider: ethers.Provider,
  network?: any
): Promise<PickupVerificationResult> => {
  try {
    // Verify timestamp
    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = Math.abs(currentTime - eventData.timestamp);
    
    if (timeDiff > VERIFICATION_SETTINGS.SIGNATURE_TIMEOUT) {
      return {
        isValid: false,
        error: 'Pickup event timestamp is too old'
      };
    }

    // Verify Merkle proof on blockchain
    const eventHash = createPickupEventHash(eventData);
    const isProofValid = await verifyPickupEventProof(
      provider,
      eventHash,
      merkleProof.batchNumber,
      merkleProof.proof,
      network
    );

    if (!isProofValid) {
      return {
        isValid: false,
        error: ERROR_CODES.MERKLE_PROOF_INVALID
      };
    }

    // Get pickup event details from blockchain
    const blockchainEvent = await getPickupEventFromChain(provider, eventHash, network);
    
    if (!blockchainEvent) {
      return {
        isValid: false,
        error: ERROR_CODES.EVENT_NOT_FOUND
      };
    }

    return {
      isValid: true,
      pickupEvent: blockchainEvent
    };

  } catch (error: any) {
    return {
      isValid: false,
      error: error.message || 'Pickup verification failed'
    };
  }
};

/**
 * Creates a comprehensive verification proof
 * @param authData Authorization data
 * @param eventData Pickup event data
 * @param merkleProof Merkle proof
 * @returns Combined verification result
 */
export const createComprehensiveProof = (
  authData: AuthorizationData,
  eventData: PickupEventData,
  merkleProof: MerkleProof
): VerificationResult => {
  try {
    // Create verification hash
    const authHash = createAuthorizationHash(authData);
    const eventHash = createPickupEventHash(eventData);
    
    // Verify Merkle proof locally first
    const isLocalProofValid = verifyMerkleProof(
      eventHash,
      merkleProof.proof,
      merkleProof.merkleRoot || '' // This would need to be provided
    );

    if (!isLocalProofValid) {
      return {
        isValid: false,
        error: ERROR_CODES.MERKLE_PROOF_INVALID
      };
    }

    return {
      isValid: true,
      proof: merkleProof
    };

  } catch (error: any) {
    return {
      isValid: false,
      error: error.message || 'Failed to create comprehensive proof'
    };
  }
};

/**
 * Verifies a signature with timestamp validation
 * @param message Original message
 * @param signature Signature to verify
 * @param expectedAddress Expected signer address
 * @param timestamp Signature timestamp
 * @returns Whether signature is valid
 */
export const verifySignatureWithTimestamp = (
  message: string,
  signature: string,
  expectedAddress: string,
  timestamp: number
): boolean => {
  try {
    // Check timestamp
    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = Math.abs(currentTime - timestamp);
    
    if (timeDiff > VERIFICATION_SETTINGS.SIGNATURE_TIMEOUT) {
      return false;
    }

    // Verify signature
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();

  } catch (error) {
    return false;
  }
};

/**
 * Validates student hash for privacy
 * @param studentId Student ID
 * @param studentHash Expected student hash
 * @returns Whether student hash is valid
 */
export const validateStudentHash = (studentId: string, studentHash: string): boolean => {
  try {
    const calculatedHash = createStudentHash(studentId);
    return calculatedHash === studentHash;
  } catch (error) {
    return false;
  }
};

/**
 * Verifies QR code hash
 * @param qrCodeData QR code data
 * @param qrCodeHash Expected QR code hash
 * @returns Whether QR code hash is valid
 */
export const validateQRCodeHash = (qrCodeData: string, qrCodeHash: string): boolean => {
  try {
    const calculatedHash = ethers.keccak256(
      ethers.solidityPacked(['string', 'string'], ['QR', qrCodeData])
    );
    return calculatedHash === qrCodeHash;
  } catch (error) {
    return false;
  }
};

/**
 * Creates a timestamped verification record
 * @param verificationData Data to timestamp
 * @returns Timestamped verification record
 */
export const createTimestampedVerification = (verificationData: any) => {
  return {
    ...verificationData,
    timestamp: Date.now(),
    blockTimestamp: Math.floor(Date.now() / 1000),
    verificationId: ethers.id(JSON.stringify(verificationData) + Date.now())
  };
};

/**
 * Verifies a timestamped verification record
 * @param verificationRecord Timestamped verification record
 * @param maxAge Maximum age in milliseconds
 * @returns Whether verification record is valid
 */
export const verifyTimestampedRecord = (
  verificationRecord: any,
  maxAge: number = VERIFICATION_SETTINGS.SIGNATURE_TIMEOUT
): boolean => {
  try {
    const currentTime = Date.now();
    const recordAge = currentTime - verificationRecord.timestamp;
    
    return recordAge <= maxAge;
  } catch (error) {
    return false;
  }
};

/**
 * Creates a multi-level verification proof
 * @param authData Authorization data
 * @param eventData Pickup event data
 * @param merkleProof Merkle proof
 * @param additionalProofs Additional proofs
 * @returns Multi-level verification result
 */
export const createMultiLevelProof = (
  authData: AuthorizationData,
  eventData: PickupEventData,
  merkleProof: MerkleProof,
  additionalProofs: any[] = []
): VerificationResult => {
  try {
    // Level 1: Basic hash verification
    const authHash = createAuthorizationHash(authData);
    const eventHash = createPickupEventHash(eventData);
    
    // Level 2: Merkle proof verification
    const isMerkleValid = verifyMerkleProof(
      eventHash,
      merkleProof.proof,
      merkleProof.merkleRoot || ''
    );
    
    if (!isMerkleValid) {
      return {
        isValid: false,
        error: ERROR_CODES.MERKLE_PROOF_INVALID
      };
    }

    // Level 3: Additional proofs verification
    for (const proof of additionalProofs) {
      if (!proof.isValid) {
        return {
          isValid: false,
          error: proof.error || 'Additional proof verification failed'
        };
      }
    }

    return {
      isValid: true,
      proof: {
        authHash,
        eventHash,
        merkleProof,
        additionalProofs,
        verificationLevel: 'multi-level',
        timestamp: Date.now()
      }
    };

  } catch (error: any) {
    return {
      isValid: false,
      error: error.message || 'Multi-level proof creation failed'
    };
  }
};

/**
 * Validates verification chain integrity
 * @param verificationChain Array of verification steps
 * @returns Whether the verification chain is intact
 */
export const validateVerificationChain = (verificationChain: any[]): boolean => {
  try {
    if (verificationChain.length === 0) {
      return false;
    }

    // Check that each step in the chain is valid
    for (let i = 0; i < verificationChain.length; i++) {
      const step = verificationChain[i];
      
      if (!step.isValid) {
        return false;
      }

      // Check timestamp progression (each step should be after the previous)
      if (i > 0) {
        const prevStep = verificationChain[i - 1];
        if (step.timestamp < prevStep.timestamp) {
          return false;
        }
      }
    }

    return true;

  } catch (error) {
    return false;
  }
};
