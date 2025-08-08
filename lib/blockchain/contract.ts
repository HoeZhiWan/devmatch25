/**
 * Smart Contract Interaction Utilities
 * Functions for interacting with the PickupSecurity smart contract
 */

import { ethers } from 'ethers';
import { 
  CONTRACT_ADDRESSES, 
  DEFAULT_NETWORK, 
  GAS_SETTINGS, 
  ERROR_CODES,
  TIMEOUTS 
} from './constants';
import type { 
  AuthorizationData, 
  PickupEventData, 
  MerkleBatchData,
  TransactionResult,
  BatchAnchoringResult,
  BlockchainConfig 
} from './types';
import { createAuthorizationHash, createPickupEventHash } from './hashing';

// Contract ABI (simplified for the main functions)
const PICKUP_SECURITY_ABI = [
  // Authorization functions
  'function createAuthorization(bytes32 authHash, address parentWallet, address pickupWallet, bytes32 studentHash, uint256 startDate, uint256 endDate) external',
  'function verifyAuthorization(bytes32 authHash, bool isVerified) external',
  'function revokeAuthorization(bytes32 authHash) external',
  'function getAuthorization(bytes32 authHash) external view returns (bytes32 authHash, address parentWallet, address pickupWallet, bytes32 studentHash, uint256 startDate, uint256 endDate, uint256 createdAt, bool isActive, bool isVerified)',
  'function isAuthorizationValid(bytes32 authHash, address pickupWallet, bytes32 studentHash) external view returns (bool)',
  
  // Pickup event functions
  'function recordPickupEvent(bytes32 eventHash, bytes32 studentHash, address pickupWallet, address staffWallet, bytes32 qrCodeHash) external',
  'function getPickupEvent(bytes32 eventHash) external view returns (bytes32 eventHash, bytes32 studentHash, address pickupWallet, address staffWallet, uint256 timestamp, bytes32 qrCodeHash, bool isVerified)',
  
  // Merkle batch functions
  'function anchorMerkleBatch(bytes32 merkleRoot, uint256 eventCount, string memory ipfsHash) external',
  'function getMerkleBatch(uint256 batchNumber) external view returns (bytes32 merkleRoot, uint256 batchNumber, uint256 timestamp, uint256 blockNumber, uint256 eventCount, string memory ipfsHash)',
  'function verifyPickupEvent(bytes32 eventHash, uint256 batchNumber, bytes32[] memory proof) external view returns (bool)',
  
  // Statistics
  'function getContractStats() external view returns (uint256, uint256, uint256)',
  
  // Events
  'event AuthorizationCreated(bytes32 indexed authHash, address indexed parentWallet, address indexed pickupWallet, bytes32 studentHash, uint256 startDate, uint256 endDate)',
  'event AuthorizationVerified(bytes32 indexed authHash, bool isVerified)',
  'event PickupEventRecorded(bytes32 indexed eventHash, bytes32 indexed studentHash, address indexed pickupWallet, uint256 timestamp)',
  'event MerkleBatchAnchored(uint256 indexed batchNumber, bytes32 indexed merkleRoot, uint256 timestamp, uint256 eventCount)',
  'event AuthorizationRevoked(bytes32 indexed authHash, address indexed parentWallet)'
];

/**
 * Gets the contract instance for the specified network
 * @param provider Ethers provider
 * @param network Network configuration
 * @returns Contract instance
 */
export const getContract = (
  provider: ethers.Provider | ethers.Signer,
  network: BlockchainConfig = { 
    contractAddress: CONTRACT_ADDRESSES[DEFAULT_NETWORK.chainId].PICKUP_SECURITY,
    rpcUrl: DEFAULT_NETWORK.rpcUrl,
    chainId: DEFAULT_NETWORK.chainId
  }
) => {
  const contractAddress = network.contractAddress;
  
  if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
    throw new Error(ERROR_CODES.CONTRACT_NOT_DEPLOYED);
  }
  
  return new ethers.Contract(contractAddress, PICKUP_SECURITY_ABI, provider);
};

/**
 * Creates an authorization on the blockchain
 * @param signer Ethers signer
 * @param authData Authorization data
 * @param network Network configuration
 * @returns Transaction result
 */
export const createAuthorizationOnChain = async (
  signer: ethers.Signer,
  authData: AuthorizationData,
  network?: BlockchainConfig
): Promise<TransactionResult> => {
  try {
    const contract = getContract(signer, network);
    const authHash = createAuthorizationHash(authData);
    
    const tx = await contract.createAuthorization(
      authHash,
      authData.parentWallet,
      authData.pickupWallet,
      authData.studentHash,
      authData.startDate,
      authData.endDate,
      {
        gasLimit: GAS_SETTINGS.AUTHORIZATION_GAS_LIMIT
      }
    );
    
    const receipt = await tx.wait();
    
    return {
      success: true,
      hash: tx.hash,
      gasUsed: receipt.gasUsed.toNumber(),
      blockNumber: receipt.blockNumber
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to create authorization on blockchain'
    };
  }
};

/**
 * Records a pickup event on the blockchain
 * @param signer Ethers signer
 * @param eventData Pickup event data
 * @param network Network configuration
 * @returns Transaction result
 */
export const recordPickupEventOnChain = async (
  signer: ethers.Signer,
  eventData: PickupEventData,
  network?: BlockchainConfig
): Promise<TransactionResult> => {
  try {
    const contract = getContract(signer, network);
    const eventHash = createPickupEventHash(eventData);
    
    const tx = await contract.recordPickupEvent(
      eventHash,
      eventData.studentHash,
      eventData.pickupWallet,
      eventData.staffWallet,
      eventData.qrCodeHash,
      {
        gasLimit: GAS_SETTINGS.PICKUP_EVENT_GAS_LIMIT
      }
    );
    
    const receipt = await tx.wait();
    
    return {
      success: true,
      hash: tx.hash,
      gasUsed: receipt.gasUsed.toNumber(),
      blockNumber: receipt.blockNumber
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to record pickup event on blockchain'
    };
  }
};

/**
 * Anchors a Merkle batch on the blockchain
 * @param signer Ethers signer
 * @param batchData Merkle batch data
 * @param network Network configuration
 * @returns Batch anchoring result
 */
export const anchorMerkleBatchOnChain = async (
  signer: ethers.Signer,
  batchData: MerkleBatchData,
  network?: BlockchainConfig
): Promise<BatchAnchoringResult> => {
  try {
    const contract = getContract(signer, network);
    
    const tx = await contract.anchorMerkleBatch(
      batchData.merkleRoot,
      batchData.eventCount,
      batchData.ipfsHash,
      {
        gasLimit: GAS_SETTINGS.MERKLE_BATCH_GAS_LIMIT
      }
    );
    
    const receipt = await tx.wait();
    
    return {
      success: true,
      batchNumber: batchData.batchNumber,
      merkleRoot: batchData.merkleRoot,
      eventCount: batchData.eventCount,
      transactionHash: tx.hash
    };
  } catch (error: any) {
    return {
      success: false,
      batchNumber: batchData.batchNumber,
      merkleRoot: batchData.merkleRoot,
      eventCount: batchData.eventCount,
      error: error.message || 'Failed to anchor Merkle batch on blockchain'
    };
  }
};

/**
 * Verifies an authorization on the blockchain
 * @param provider Ethers provider
 * @param authHash Authorization hash
 * @param pickupWallet Pickup person's wallet
 * @param studentHash Student hash
 * @param network Network configuration
 * @returns Whether authorization is valid
 */
export const verifyAuthorizationOnChain = async (
  provider: ethers.Provider,
  authHash: string,
  pickupWallet: string,
  studentHash: string,
  network?: BlockchainConfig
): Promise<boolean> => {
  try {
    const contract = getContract(provider, network);
    return await contract.isAuthorizationValid(authHash, pickupWallet, studentHash);
  } catch (error: any) {
    console.error('Failed to verify authorization on blockchain:', error);
    return false;
  }
};

/**
 * Gets authorization details from the blockchain
 * @param provider Ethers provider
 * @param authHash Authorization hash
 * @param network Network configuration
 * @returns Authorization details or null
 */
export const getAuthorizationFromChain = async (
  provider: ethers.Provider,
  authHash: string,
  network?: BlockchainConfig
) => {
  try {
    const contract = getContract(provider, network);
    const auth = await contract.getAuthorization(authHash);
    
    if (auth.authHash === ethers.ZeroHash) {
      return null;
    }
    
    return {
      authHash: auth.authHash,
      parentWallet: auth.parentWallet,
      pickupWallet: auth.pickupWallet,
      studentHash: auth.studentHash,
      startDate: auth.startDate.toNumber(),
      endDate: auth.endDate.toNumber(),
      createdAt: auth.createdAt.toNumber(),
      isActive: auth.isActive,
      isVerified: auth.isVerified
    };
  } catch (error: any) {
    console.error('Failed to get authorization from blockchain:', error);
    return null;
  }
};

/**
 * Gets pickup event details from the blockchain
 * @param provider Ethers provider
 * @param eventHash Event hash
 * @param network Network configuration
 * @returns Pickup event details or null
 */
export const getPickupEventFromChain = async (
  provider: ethers.Provider,
  eventHash: string,
  network?: BlockchainConfig
) => {
  try {
    const contract = getContract(provider, network);
    const event = await contract.getPickupEvent(eventHash);
    
    if (event.eventHash === ethers.ZeroHash) {
      return null;
    }
    
    return {
      eventHash: event.eventHash,
      studentHash: event.studentHash,
      pickupWallet: event.pickupWallet,
      staffWallet: event.staffWallet,
      timestamp: event.timestamp.toNumber(),
      qrCodeHash: event.qrCodeHash,
      isVerified: event.isVerified
    };
  } catch (error: any) {
    console.error('Failed to get pickup event from blockchain:', error);
    return null;
  }
};

/**
 * Gets Merkle batch details from the blockchain
 * @param provider Ethers provider
 * @param batchNumber Batch number
 * @param network Network configuration
 * @returns Merkle batch details or null
 */
export const getMerkleBatchFromChain = async (
  provider: ethers.Provider,
  batchNumber: number,
  network?: BlockchainConfig
) => {
  try {
    const contract = getContract(provider, network);
    const batch = await contract.getMerkleBatch(batchNumber);
    
    if (batch.merkleRoot === ethers.ZeroHash) {
      return null;
    }
    
    return {
      merkleRoot: batch.merkleRoot,
      batchNumber: batch.batchNumber.toNumber(),
      timestamp: batch.timestamp.toNumber(),
      blockNumber: batch.blockNumber.toNumber(),
      eventCount: batch.eventCount.toNumber(),
      ipfsHash: batch.ipfsHash
    };
  } catch (error: any) {
    console.error('Failed to get Merkle batch from blockchain:', error);
    return null;
  }
};

/**
 * Gets contract statistics
 * @param provider Ethers provider
 * @param network Network configuration
 * @returns Contract statistics
 */
export const getContractStats = async (
  provider: ethers.Provider,
  network?: BlockchainConfig
) => {
  try {
    const contract = getContract(provider, network);
    const stats = await contract.getContractStats();
    
    return {
      authorizationCount: stats[0].toNumber(),
      pickupEventCount: stats[1].toNumber(),
      batchCount: stats[2].toNumber()
    };
  } catch (error: any) {
    console.error('Failed to get contract stats:', error);
    return {
      authorizationCount: 0,
      pickupEventCount: 0,
      batchCount: 0
    };
  }
};

/**
 * Revokes an authorization on the blockchain
 * @param signer Ethers signer
 * @param authHash Authorization hash
 * @param network Network configuration
 * @returns Transaction result
 */
export const revokeAuthorizationOnChain = async (
  signer: ethers.Signer,
  authHash: string,
  network?: BlockchainConfig
): Promise<TransactionResult> => {
  try {
    const contract = getContract(signer, network);
    
    const tx = await contract.revokeAuthorization(authHash, {
      gasLimit: GAS_SETTINGS.AUTHORIZATION_GAS_LIMIT
    });
    
    const receipt = await tx.wait();
    
    return {
      success: true,
      hash: tx.hash,
      gasUsed: receipt.gasUsed.toNumber(),
      blockNumber: receipt.blockNumber
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to revoke authorization on blockchain'
    };
  }
};

/**
 * Verifies a pickup event using Merkle proof
 * @param provider Ethers provider
 * @param eventHash Event hash
 * @param batchNumber Batch number
 * @param proof Merkle proof
 * @param network Network configuration
 * @returns Whether the proof is valid
 */
export const verifyPickupEventProof = async (
  provider: ethers.Provider,
  eventHash: string,
  batchNumber: number,
  proof: string[],
  network?: BlockchainConfig
): Promise<boolean> => {
  try {
    const contract = getContract(provider, network);
    return await contract.verifyPickupEvent(eventHash, batchNumber, proof);
  } catch (error: any) {
    console.error('Failed to verify pickup event proof:', error);
    return false;
  }
};
