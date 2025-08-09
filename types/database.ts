export interface Student {
  id: string; // Format: "CH001"
  name: string;
  grade: string;
  parentId: string; // Parent wallet address (lowercase hex)
  createdAt: Date;
}

export interface PickupPerson {
  walletAddress: string; // Pickup person's wallet (lowercase hex)
  relationship: string; // e.g., "father", "mother", "guardian", etc.
  startDate: string; // ISO date string
  endDate: string; // ISO date string
}

export interface User {
  id: string; // Wallet address (lowercase hex)
  walletAddress: string; // Wallet address (lowercase hex)
  name: string;
  contactNumber?: string;
  role: 'parent' | 'pickup_person' | 'staff';
  createdAt: Date;
  lastLoginAt: Date;
  // Pickup collection exists only when role is 'parent'
  pickup?: Record<string, PickupPerson>; // Key is pickup person's wallet address
}

export interface PickupHistory {
  id: string; // Random ID
  blockchainHash: string;
  contractTxHash: string;
  pickupBy: string; // Pickup person wallet address
  staffId: string; // Staff wallet address
  studentId: string; // Student ID
  time: Date;
}

export interface AuthorizationRecord {
  id: string;
  qrCodeId: string;
  hash: string; // Hash for verification
  studentId: string;
  pickupWallet: string; // Pickup person's wallet
  parentWallet: string; // Parent's wallet
  generatedAt: Date;
  expiresAt: Date;
  isUsed: boolean;
  isActive: boolean;
}

// Legacy interfaces for backward compatibility
export interface Authorization {
  id: string;
  studentId: string;
  parentWallet: string; // Lowercase hex address
  pickupWallet: string; // Lowercase hex address
  signature: string;
  message: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  createdAt: Date;
  isActive: boolean;
}

export interface PickupLog {
  id: string;
  studentId: string;
  pickupWallet: string;
  scannedBy: string; // Staff wallet or ID
  timestamp: Date;
  status: 'success' | 'failed' | 'expired';
  qrCodeId: string; // For one-time use tracking
}

export interface UserSession {
  wallet: string;
  role: 'parent' | 'pickup_person' | 'staff';
  lastActive: Date;
}

export interface QRCodeData {
  id: string;
  pickupWallet: string;
  studentId: string;
  authorizationId: string;
  generatedAt: Date;
  expiresAt: Date;
  isUsed: boolean;
}

// QR Code for simplified scanning
export interface QRCodeContent {
  id: string; // Authorization record ID
  hash: string; // Verification hash
}

// =========================
// New unified schema types
// =========================

// Root document under collection `user`
export interface UserRoot {
  walletAddress: string; // lowercase
  role: 'parent' | 'pickup' | 'staff' | string;
  createdAt?: Date;
  lastLoginAt?: Date;
}

// `user/{wallet}/staff/{doc}`
export interface StaffSubDoc {
  staffid: string;
  name: string;
  walletaddress: string; // lowercase
}

// `user/{wallet}/student/{doc}`
export interface StudentSubDoc {
  name: string;
  grade: string;
  parentId: string; // lowercase wallet
}

// `user/{wallet}/parents/{doc}`
export interface ParentSubDoc {
  contactNumber: string;
  name: string;
  studentIds: string[];
  walletAddressParent: string; // lowercase
}

// `user/{wallet}/pickup/{doc}` (authorization records)
export interface PickupAuthSubDoc {
  blockchainHash: string;
  contractTxHash: string;
  contactNumber: string;
  createdAt: Date | string; // stored as Timestamp
  endDate: Date | string; // ISO or Date; stored as Timestamp
  parentId: string; // lowercase wallet
  relationship: string;
  signature: string;
  startDate: Date | string; // ISO or Date; stored as Timestamp
  studentId: string;
  walletAddressPickup: string; // lowercase
}

// Collection `pickupHistory` (global)
export interface PickupHistoryDoc {
  blockchainHash: string;
  contractTxHash: string;
  pickupBy: string; // pickup wallet lowercase
  staffId: string; // staff wallet lowercase
  studentId: string;
  time: Date; // stored as Timestamp
}