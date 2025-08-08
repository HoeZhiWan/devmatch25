/**
 * Blockchain Integration Types
 * Type definitions for blockchain operations and data structures
 */

export interface AuthorizationData {
  authHash: string;
  parentWallet: string;
  pickupWallet: string;
  studentHash: string;
  startDate: number;
  endDate: number;
  signature: string;
  message: string;
}

export interface PickupEventData {
  eventHash: string;
  studentHash: string;
  pickupWallet: string;
  staffWallet: string;
  qrCodeHash: string;
  timestamp: number;
}

export interface MerkleBatchData {
  merkleRoot: string;
  batchNumber: number;
  timestamp: number;
  blockNumber: number;
  eventCount: number;
  ipfsHash: string;
}

export interface BlockchainAuthorization {
  authHash: string;
  parentWallet: string;
  pickupWallet: string;
  studentHash: string;
  startDate: number;
  endDate: number;
  createdAt: number;
  isActive: boolean;
  isVerified: boolean;
}

export interface BlockchainPickupEvent {
  eventHash: string;
  studentHash: string;
  pickupWallet: string;
  staffWallet: string;
  timestamp: number;
  qrCodeHash: string;
  isVerified: boolean;
}

export interface BlockchainMerkleBatch {
  merkleRoot: string;
  batchNumber: number;
  timestamp: number;
  blockNumber: number;
  eventCount: number;
  ipfsHash: string;
}

export interface MerkleProof {
  eventHash: string;
  batchNumber: number;
  proof: string[];
  merkleRoot?: string; // Optional merkle root for verification
}

export interface ContractStats {
  authorizationCount: number;
  pickupEventCount: number;
  batchCount: number;
}

export interface BlockchainConfig {
  contractAddress: string;
  rpcUrl: string;
  chainId: number;
  gasPrice?: string;
  gasLimit?: number;
}

export interface TransactionResult {
  success: boolean;
  hash?: string;
  error?: string;
  gasUsed?: number;
  blockNumber?: number;
}

export interface VerificationResult {
  isValid: boolean;
  error?: string;
  proof?: any; // Allow flexible proof structure
}

export interface BatchAnchoringResult {
  success: boolean;
  batchNumber: number;
  merkleRoot: string;
  eventCount: number;
  transactionHash?: string;
  error?: string;
}

export interface AuthorizationVerificationResult {
  isValid: boolean;
  authorization?: BlockchainAuthorization;
  error?: string;
}

export interface PickupVerificationResult {
  isValid: boolean;
  pickupEvent?: BlockchainPickupEvent;
  error?: string;
}

export interface BlockchainError {
  code: string;
  message: string;
  details?: any;
}

export type BlockchainEventType = 
  | 'AuthorizationCreated'
  | 'AuthorizationVerified'
  | 'PickupEventRecorded'
  | 'MerkleBatchAnchored'
  | 'AuthorizationRevoked';

export interface BlockchainEvent {
  type: BlockchainEventType;
  data: any;
  blockNumber: number;
  transactionHash: string;
  timestamp: number;
}
