/**
 * Merkle Tree Utilities
 * Functions for creating and managing Merkle trees for tamper-proof pickup history
 */

import { ethers } from 'ethers';
import { BATCH_SETTINGS } from './constants';
import type { PickupEventData, MerkleBatchData } from './types';
import { createPickupEventHash, createMerkleRoot, generateMerkleProof, verifyMerkleProof } from './hashing';

export interface MerkleTree {
  root: string;
  leaves: string[];
  proofs: Map<string, string[]>;
}

export interface BatchData {
  events: PickupEventData[];
  eventHashes: string[];
  merkleRoot: string;
  batchNumber: number;
  timestamp: number;
  ipfsHash: string;
}

/**
 * Creates a Merkle tree from pickup events
 * @param events Array of pickup events
 * @returns Merkle tree with root, leaves, and proofs
 */
export const createMerkleTree = (events: PickupEventData[]): MerkleTree => {
  if (events.length === 0) {
    throw new Error('Cannot create Merkle tree from empty events array');
  }

  // Create hashes for all events
  const eventHashes = events.map(event => createPickupEventHash(event));
  
  // Create Merkle root
  const root = createMerkleRoot(eventHashes);
  
  // Generate proofs for each event
  const proofs = new Map<string, string[]>();
  eventHashes.forEach((hash, index) => {
    const proof = generateMerkleProof(eventHashes, hash);
    proofs.set(hash, proof);
  });

  return {
    root,
    leaves: eventHashes,
    proofs
  };
};

/**
 * Creates a batch of pickup events for anchoring
 * @param events Array of pickup events
 * @param batchNumber Sequential batch number
 * @param ipfsHash IPFS hash of off-chain data
 * @returns Batch data ready for blockchain anchoring
 */
export const createBatch = (
  events: PickupEventData[],
  batchNumber: number,
  ipfsHash: string = ''
): BatchData => {
  if (events.length === 0) {
    throw new Error('Cannot create batch from empty events array');
  }

  if (events.length > BATCH_SETTINGS.MAX_BATCH_SIZE) {
    throw new Error(`Batch size exceeds maximum of ${BATCH_SETTINGS.MAX_BATCH_SIZE}`);
  }

  // Create event hashes
  const eventHashes = events.map(event => createPickupEventHash(event));
  
  // Create Merkle root
  const merkleRoot = createMerkleRoot(eventHashes);

  return {
    events,
    eventHashes,
    merkleRoot,
    batchNumber,
    timestamp: Date.now(),
    ipfsHash
  };
};

/**
 * Prepares batch data for blockchain anchoring
 * @param batchData Batch data
 * @returns Merkle batch data for blockchain
 */
export const prepareBatchForAnchoring = (batchData: BatchData): MerkleBatchData => {
  return {
    merkleRoot: batchData.merkleRoot,
    batchNumber: batchData.batchNumber,
    timestamp: batchData.timestamp,
    blockNumber: 0, // Will be set by blockchain
    eventCount: batchData.events.length,
    ipfsHash: batchData.ipfsHash
  };
};

/**
 * Verifies a pickup event using Merkle proof
 * @param eventHash Hash of the pickup event
 * @param proof Merkle proof for the event
 * @param merkleRoot Expected Merkle root
 * @returns Whether the proof is valid
 */
export const verifyEventProof = (
  eventHash: string,
  proof: string[],
  merkleRoot: string
): boolean => {
  return verifyMerkleProof(eventHash, proof, merkleRoot);
};

/**
 * Generates a Merkle proof for a specific event
 * @param events Array of all events in the batch
 * @param targetEvent Target event to generate proof for
 * @returns Merkle proof for the target event
 */
export const generateEventProof = (
  events: PickupEventData[],
  targetEvent: PickupEventData
): string[] => {
  const eventHashes = events.map(event => createPickupEventHash(event));
  const targetHash = createPickupEventHash(targetEvent);
  
  return generateMerkleProof(eventHashes, targetHash);
};

/**
 * Splits events into batches for efficient processing
 * @param events Array of all pickup events
 * @param batchSize Size of each batch (default from settings)
 * @returns Array of event batches
 */
export const splitIntoBatches = (
  events: PickupEventData[],
  batchSize: number = BATCH_SETTINGS.DEFAULT_BATCH_SIZE
): PickupEventData[][] => {
  if (batchSize <= 0) {
    throw new Error('Batch size must be positive');
  }

  const batches: PickupEventData[][] = [];
  
  for (let i = 0; i < events.length; i += batchSize) {
    batches.push(events.slice(i, i + batchSize));
  }

  return batches;
};

/**
 * Creates multiple batches from events
 * @param events Array of all pickup events
 * @param batchSize Size of each batch
 * @returns Array of batch data
 */
export const createMultipleBatches = (
  events: PickupEventData[],
  batchSize: number = BATCH_SETTINGS.DEFAULT_BATCH_SIZE
): BatchData[] => {
  const eventBatches = splitIntoBatches(events, batchSize);
  
  return eventBatches.map((batchEvents, index) => {
    return createBatch(batchEvents, index, '');
  });
};

/**
 * Validates batch data
 * @param batchData Batch data to validate
 * @returns Whether the batch is valid
 */
export const validateBatch = (batchData: BatchData): boolean => {
  // Check if batch has events
  if (batchData.events.length === 0) {
    return false;
  }

  // Check batch size limits
  if (batchData.events.length > BATCH_SETTINGS.MAX_BATCH_SIZE) {
    return false;
  }

  if (batchData.events.length < BATCH_SETTINGS.MIN_BATCH_SIZE) {
    return false;
  }

  // Verify Merkle root matches events
  const eventHashes = batchData.events.map(event => createPickupEventHash(event));
  const calculatedRoot = createMerkleRoot(eventHashes);
  
  if (calculatedRoot !== batchData.merkleRoot) {
    return false;
  }

  // Verify all event hashes match
  const expectedHashes = batchData.events.map(event => createPickupEventHash(event));
  if (JSON.stringify(expectedHashes) !== JSON.stringify(batchData.eventHashes)) {
    return false;
  }

  return true;
};

/**
 * Gets batch statistics
 * @param batches Array of batch data
 * @returns Batch statistics
 */
export const getBatchStats = (batches: BatchData[]) => {
  const totalEvents = batches.reduce((sum, batch) => sum + batch.events.length, 0);
  const totalBatches = batches.length;
  const averageBatchSize = totalBatches > 0 ? totalEvents / totalBatches : 0;
  
  const batchSizes = batches.map(batch => batch.events.length);
  const minBatchSize = Math.min(...batchSizes);
  const maxBatchSize = Math.max(...batchSizes);

  return {
    totalEvents,
    totalBatches,
    averageBatchSize,
    minBatchSize,
    maxBatchSize,
    totalMerkleRoots: batches.length
  };
};

/**
 * Creates a compact representation of batch data for storage
 * @param batchData Batch data
 * @returns Compact batch representation
 */
export const createCompactBatch = (batchData: BatchData) => {
  return {
    merkleRoot: batchData.merkleRoot,
    batchNumber: batchData.batchNumber,
    timestamp: batchData.timestamp,
    eventCount: batchData.events.length,
    ipfsHash: batchData.ipfsHash,
    // Store only essential event data
    eventSummaries: batchData.events.map(event => ({
      studentHash: event.studentHash,
      pickupWallet: event.pickupWallet,
      timestamp: event.timestamp
    }))
  };
};

/**
 * Reconstructs batch data from compact representation
 * @param compactBatch Compact batch data
 * @param fullEvents Full event data (if available)
 * @returns Full batch data
 */
export const reconstructBatch = (
  compactBatch: any,
  fullEvents?: PickupEventData[]
): BatchData => {
  const events = fullEvents || [];
  const eventHashes = events.map(event => createPickupEventHash(event));
  
  return {
    events,
    eventHashes,
    merkleRoot: compactBatch.merkleRoot,
    batchNumber: compactBatch.batchNumber,
    timestamp: compactBatch.timestamp,
    ipfsHash: compactBatch.ipfsHash
  };
};
