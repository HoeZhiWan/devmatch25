export interface Child {
  id: string;
  name: string;
  parentWallet: string;
}

export interface PickupPerson {
  id: string;
  name: string;
  walletAddress: string;
  relationship: string;
  phoneNumber: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface PickupHistory {
  id: string;
  studentId: string;
  studentName: string;
  pickupPerson: string;
  timestamp: string;
  status: 'completed' | 'pending';
}

export interface Student {
  id: string;
  name: string;
  parentWallet: string;
}

export interface Parent {
  name: string;
  walletAddress: string;
  relationship: string;
  phoneNumber: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  walletAddress: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type DashboardRole = 'parent' | 'pickup' | 'staff';

export interface DashboardTab {
  key: string;
  label: string;
  icon: string;
  gradientColors: string;
}

export interface QRData {
  childId?: string;
  childName?: string;
  pickupWallet: string;
  validUntil: string;
  parentWallet: string;
  signature: string;
  message: string;
  hash: string;
  type: 'self-pickup' | 'pickup-person-auth';
  pickupPersonName?: string;
  relationship?: string;
  phoneNumber?: string;
  startDate?: string;
  endDate?: string;
}
