/**
 * Blockchain Integration Constants
 * Configuration constants for blockchain operations
 */

// Network configurations
export const NETWORKS = {
  POLYGON_MUMBAI: {
    chainId: 80001,
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    name: 'Polygon Mumbai',
    currency: 'MATIC',
    blockExplorer: 'https://mumbai.polygonscan.com'
  },
  SEPOLIA: {
    chainId: 11155111,
    rpcUrl: 'https://sepolia.infura.io/v3/',
    name: 'Sepolia',
    currency: 'ETH',
    blockExplorer: 'https://sepolia.etherscan.io'
  },
  LOCALHOST: {
    chainId: 31337,
    rpcUrl: 'http://localhost:8545',
    name: 'Localhost',
    currency: 'ETH',
    blockExplorer: ''
  }
} as const;

// Default network for development
export const DEFAULT_NETWORK = NETWORKS.POLYGON_MUMBAI;

// Contract addresses (update these after deployment)
export const CONTRACT_ADDRESSES = {
  [NETWORKS.POLYGON_MUMBAI.chainId]: {
    PICKUP_SECURITY: process.env.NEXT_PUBLIC_PICKUP_SECURITY_CONTRACT || '0x0000000000000000000000000000000000000000'
  },
  [NETWORKS.SEPOLIA.chainId]: {
    PICKUP_SECURITY: process.env.NEXT_PUBLIC_PICKUP_SECURITY_CONTRACT || '0x0000000000000000000000000000000000000000'
  },
  [NETWORKS.LOCALHOST.chainId]: {
    PICKUP_SECURITY: process.env.NEXT_PUBLIC_PICKUP_SECURITY_CONTRACT || '0x0000000000000000000000000000000000000000'
  }
} as const;

// Gas settings
export const GAS_SETTINGS = {
  DEFAULT_GAS_LIMIT: 500000,
  AUTHORIZATION_GAS_LIMIT: 200000,
  PICKUP_EVENT_GAS_LIMIT: 150000,
  MERKLE_BATCH_GAS_LIMIT: 300000,
  VERIFICATION_GAS_LIMIT: 100000
} as const;

// Batch settings for Merkle tree anchoring
export const BATCH_SETTINGS = {
  DEFAULT_BATCH_SIZE: 10,
  MAX_BATCH_SIZE: 50,
  MIN_BATCH_SIZE: 5,
  BATCH_TIMEOUT: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
} as const;

// Verification settings
export const VERIFICATION_SETTINGS = {
  SIGNATURE_TIMEOUT: 5 * 60 * 1000, // 5 minutes
  AUTHORIZATION_TIMEOUT: 30 * 24 * 60 * 60 * 1000, // 30 days
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000 // 1 second
} as const;

// Error codes
export const ERROR_CODES = {
  CONTRACT_NOT_DEPLOYED: 'CONTRACT_NOT_DEPLOYED',
  INVALID_NETWORK: 'INVALID_NETWORK',
  WALLET_NOT_CONNECTED: 'WALLET_NOT_CONNECTED',
  INSUFFICIENT_GAS: 'INSUFFICIENT_GAS',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  AUTHORIZATION_NOT_FOUND: 'AUTHORIZATION_NOT_FOUND',
  AUTHORIZATION_EXPIRED: 'AUTHORIZATION_EXPIRED',
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',
  MERKLE_PROOF_INVALID: 'MERKLE_PROOF_INVALID',
  BATCH_NOT_FOUND: 'BATCH_NOT_FOUND',
  EVENT_NOT_FOUND: 'EVENT_NOT_FOUND'
} as const;

// Event types
export const EVENT_TYPES = {
  AUTHORIZATION_CREATED: 'AuthorizationCreated',
  AUTHORIZATION_VERIFIED: 'AuthorizationVerified',
  PICKUP_EVENT_RECORDED: 'PickupEventRecorded',
  MERKLE_BATCH_ANCHORED: 'MerkleBatchAnchored',
  AUTHORIZATION_REVOKED: 'AuthorizationRevoked'
} as const;

// IPFS settings
export const IPFS_SETTINGS = {
  GATEWAY_URL: 'https://ipfs.io/ipfs/',
  PINATA_API_URL: 'https://api.pinata.cloud',
  MAX_FILE_SIZE: 10 * 1024 * 1024 // 10MB
} as const;

// Hash prefixes for different data types
export const HASH_PREFIXES = {
  AUTHORIZATION: 'AUTH',
  PICKUP_EVENT: 'PICKUP',
  STUDENT: 'STUDENT',
  QR_CODE: 'QR',
  MERKLE_ROOT: 'MERKLE'
} as const;

// Blockchain operation timeouts
export const TIMEOUTS = {
  TRANSACTION_CONFIRMATION: 60000, // 60 seconds
  BLOCK_CONFIRMATION: 120000, // 2 minutes
  EVENT_LISTENING: 30000, // 30 seconds
  CONTRACT_CALL: 10000 // 10 seconds
} as const;
