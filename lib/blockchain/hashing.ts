/**
 * Blockchain Hashing Utilities
 * Functions for creating hashes for authorization proofs and pickup events
 */

import { ethers } from 'ethers';
import { HASH_PREFIXES } from './constants';
import type { AuthorizationData, PickupEventData } from './types';

/**
 * Creates a hash for authorization data
 * @param authData Authorization data to hash
 * @returns Hash of the authorization data
 */
export const createAuthorizationHash = (authData: AuthorizationData): string => {
  const hashData = ethers.solidityPacked(
    ['string', 'address', 'address', 'bytes32', 'uint256', 'uint256', 'bytes'],
    [
      HASH_PREFIXES.AUTHORIZATION,
      authData.parentWallet,
      authData.pickupWallet,
      authData.studentHash,
      authData.startDate,
      authData.endDate,
      authData.signature
    ]
  );
  
  return ethers.keccak256(hashData);
};

/**
 * Creates a hash for pickup event data
 * @param eventData Pickup event data to hash
 * @returns Hash of the pickup event data
 */
export const createPickupEventHash = (eventData: PickupEventData): string => {
  const hashData = ethers.solidityPacked(
    ['string', 'bytes32', 'address', 'address', 'bytes32', 'uint256'],
    [
      HASH_PREFIXES.PICKUP_EVENT,
      eventData.studentHash,
      eventData.pickupWallet,
      eventData.staffWallet,
      eventData.qrCodeHash,
      eventData.timestamp
    ]
  );
  
  return ethers.keccak256(hashData);
};

/**
 * Creates a hash for student ID (for privacy)
 * @param studentId Student ID to hash
 * @returns Hash of the student ID
 */
export const createStudentHash = (studentId: string): string => {
  const hashData = ethers.solidityPacked(
    ['string', 'string'],
    [HASH_PREFIXES.STUDENT, studentId]
  );
  
  return ethers.keccak256(hashData);
};

/**
 * Creates a hash for QR code data
 * @param qrCodeData QR code data to hash
 * @returns Hash of the QR code data
 */
export const createQRCodeHash = (qrCodeData: string): string => {
  const hashData = ethers.solidityPacked(
    ['string', 'string'],
    [HASH_PREFIXES.QR_CODE, qrCodeData]
  );
  
  return ethers.keccak256(hashData);
};

/**
 * Creates a hash for signature verification
 * @param message Message that was signed
 * @param signature Signature to hash
 * @returns Hash of the signature data
 */
export const createSignatureHash = (message: string, signature: string): string => {
  const hashData = ethers.solidityPacked(
    ['string', 'string', 'bytes'],
    ['SIGNATURE', message, signature]
  );
  
  return ethers.keccak256(hashData);
};

/**
 * Creates a Merkle root hash from an array of event hashes
 * @param eventHashes Array of pickup event hashes
 * @returns Merkle root hash
 */
export const createMerkleRoot = (eventHashes: string[]): string => {
  if (eventHashes.length === 0) {
    throw new Error('Cannot create Merkle root from empty array');
  }
  
  if (eventHashes.length === 1) {
    return eventHashes[0];
  }
  
  // Sort hashes for consistent ordering
  const sortedHashes = [...eventHashes].sort();
  
  // Create pairs and hash them
  const pairedHashes: string[] = [];
  for (let i = 0; i < sortedHashes.length; i += 2) {
    if (i + 1 < sortedHashes.length) {
      // Hash pair of hashes
      const pairHash = ethers.keccak256(
        ethers.solidityPacked(['bytes32', 'bytes32'], [sortedHashes[i], sortedHashes[i + 1]])
      );
      pairedHashes.push(pairHash);
    } else {
      // Odd number of hashes, hash with itself
      const selfHash = ethers.keccak256(
        ethers.solidityPacked(['bytes32', 'bytes32'], [sortedHashes[i], sortedHashes[i]])
      );
      pairedHashes.push(selfHash);
    }
  }
  
  // Recursively create Merkle root
  return createMerkleRoot(pairedHashes);
};

/**
 * Generates a Merkle proof for a specific event hash
 * @param eventHashes Array of all event hashes
 * @param targetHash Hash to generate proof for
 * @returns Array of proof hashes
 */
export const generateMerkleProof = (eventHashes: string[], targetHash: string): string[] => {
  if (!eventHashes.includes(targetHash)) {
    throw new Error('Target hash not found in event hashes');
  }
  
  const sortedHashes = [...eventHashes].sort();
  const proof: string[] = [];
  
  let currentLevel = sortedHashes;
  let targetIndex = sortedHashes.indexOf(targetHash);
  
  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    
    for (let i = 0; i < currentLevel.length; i += 2) {
      if (i + 1 < currentLevel.length) {
        // Hash pair
        const pairHash = ethers.keccak256(
          ethers.solidityPacked(['bytes32', 'bytes32'], [currentLevel[i], currentLevel[i + 1]])
        );
        nextLevel.push(pairHash);
        
        // Add to proof if target is in this pair
        if (i === targetIndex || i + 1 === targetIndex) {
          const siblingIndex = i === targetIndex ? i + 1 : i;
          proof.push(currentLevel[siblingIndex]);
        }
      } else {
        // Hash with itself
        const selfHash = ethers.keccak256(
          ethers.solidityPacked(['bytes32', 'bytes32'], [currentLevel[i], currentLevel[i]])
        );
        nextLevel.push(selfHash);
        
        if (i === targetIndex) {
          proof.push(currentLevel[i]);
        }
      }
    }
    
    // Update target index for next level
    targetIndex = Math.floor(targetIndex / 2);
    currentLevel = nextLevel;
  }
  
  return proof;
};

/**
 * Verifies a Merkle proof
 * @param targetHash Hash to verify
 * @param proof Array of proof hashes
 * @param merkleRoot Expected Merkle root
 * @returns Whether the proof is valid
 */
export const verifyMerkleProof = (
  targetHash: string,
  proof: string[],
  merkleRoot: string
): boolean => {
  let currentHash = targetHash;
  
  for (const proofHash of proof) {
    // Determine order based on hash comparison
    const [left, right] = currentHash < proofHash 
      ? [currentHash, proofHash] 
      : [proofHash, currentHash];
    
    currentHash = ethers.keccak256(
      ethers.solidityPacked(['bytes32', 'bytes32'], [left, right])
    );
  }
  
  return currentHash === merkleRoot;
};

/**
 * Creates a combined hash for authorization verification
 * @param authData Authorization data
 * @param pickupData Pickup event data
 * @returns Combined hash for verification
 */
export const createVerificationHash = (
  authData: AuthorizationData,
  pickupData: PickupEventData
): string => {
  const authHash = createAuthorizationHash(authData);
  const eventHash = createPickupEventHash(pickupData);
  
  const combinedHash = ethers.solidityPacked(
    ['bytes32', 'bytes32'],
    [authHash, eventHash]
  );
  
  return ethers.keccak256(combinedHash);
};

/**
 * Validates hash format
 * @param hash Hash to validate
 * @returns Whether the hash is valid
 */
export const isValidHash = (hash: string): boolean => {
  return ethers.isHexString(hash, 32) && hash.length === 66; // 0x + 64 hex chars
};

/**
 * Normalizes address format
 * @param address Address to normalize
 * @returns Normalized address
 */
export const normalizeAddress = (address: string): string => {
  return ethers.getAddress(address);
};
