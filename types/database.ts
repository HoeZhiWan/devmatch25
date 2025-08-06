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
