export interface Student {
  id: string; // Format: "CH001"
  name: string;
  parentWallet: string; // Lowercase hex address
  createdAt: Date;
}

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