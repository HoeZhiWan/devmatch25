// Server-side Firebase collection operations using Admin SDK
import { adminDb } from './admin';
import type { 
  Student, 
  Authorization, 
  PickupLog, 
  UserSession, 
  QRCodeData,
  User,
  PickupPerson,
  PickupHistory,
  AuthorizationRecord,
  QRCodeContent
} from '@/types/database';

// ===============================
// USER OPERATIONS
// ===============================

export const createUser = async (user: Omit<User, 'createdAt' | 'lastLoginAt'>): Promise<boolean> => {
  try {
    const normalizedAddress = user.walletAddress.toLowerCase();
    await adminDb.collection('users').doc(normalizedAddress).set({
      ...user,
      id: normalizedAddress,
      walletAddress: normalizedAddress,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    });
    return true;
  } catch (error) {
    console.error('Error creating user:', error);
    return false;
  }
};

export const getUserById = async (walletAddress: string): Promise<User | null> => {
  try {
    const normalizedAddress = walletAddress.toLowerCase();
    const userDoc = await adminDb.collection('users').doc(normalizedAddress).get();
    
    if (userDoc.exists) {
      const data = userDoc.data();
      return {
        id: data!.id,
        walletAddress: data!.walletAddress,
        name: data!.name,
        contactNumber: data!.contactNumber,
        role: data!.role,
        createdAt: data!.createdAt.toDate(),
        lastLoginAt: data!.lastLoginAt.toDate(),
        pickup: data!.pickup || {},
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
};

export const updateUserLastLogin = async (walletAddress: string): Promise<boolean> => {
  try {
    const normalizedAddress = walletAddress.toLowerCase();
    await adminDb.collection('users').doc(normalizedAddress).update({
      lastLoginAt: new Date(),
    });
    return true;
  } catch (error) {
    console.error('Error updating user last login:', error);
    return false;
  }
};

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const snapshot = await adminDb.collection('users').orderBy('createdAt', 'desc').get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: data.id,
        walletAddress: data.walletAddress,
        name: data.name,
        contactNumber: data.contactNumber,
        role: data.role,
        createdAt: data.createdAt.toDate(),
        lastLoginAt: data.lastLoginAt.toDate(),
        pickup: data.pickup || {},
      };
    });
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
};

export const getUsersByRole = async (role: string): Promise<User[]> => {
  try {
    const snapshot = await adminDb.collection('users')
      .where('role', '==', role)
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: data.id,
        walletAddress: data.walletAddress,
        name: data.name,
        contactNumber: data.contactNumber,
        role: data.role,
        createdAt: data.createdAt.toDate(),
        lastLoginAt: data.lastLoginAt.toDate(),
        pickup: data.pickup || {},
      };
    });
  } catch (error) {
    console.error('Error getting users by role:', error);
    return [];
  }
};

export const addPickupPersonToParent = async (
  parentWallet: string,
  pickupWallet: string,
  pickupPerson: PickupPerson
): Promise<boolean> => {
  try {
    const normalizedParentAddress = parentWallet.toLowerCase();
    const normalizedPickupAddress = pickupWallet.toLowerCase();
    
    return await adminDb.runTransaction(async (transaction) => {
      const userRef = adminDb.collection('users').doc(normalizedParentAddress);
      const userDoc = await transaction.get(userRef);
      
      if (!userDoc.exists) {
        throw new Error('Parent user not found');
      }
      
      const userData = userDoc.data()!;
      if (userData.role !== 'parent') {
        throw new Error('User is not a parent');
      }
      
      const currentPickup = userData.pickup || {};
      currentPickup[normalizedPickupAddress] = {
        ...pickupPerson,
        walletAddress: normalizedPickupAddress,
      };
      
      transaction.update(userRef, { pickup: currentPickup });
      return true;
    });
  } catch (error) {
    console.error('Error adding pickup person to parent:', error);
    return false;
  }
};

export const removePickupPersonFromParent = async (
  parentWallet: string,
  pickupWallet: string
): Promise<boolean> => {
  try {
    const normalizedParentAddress = parentWallet.toLowerCase();
    const normalizedPickupAddress = pickupWallet.toLowerCase();
    
    return await adminDb.runTransaction(async (transaction) => {
      const userRef = adminDb.collection('users').doc(normalizedParentAddress);
      const userDoc = await transaction.get(userRef);
      
      if (!userDoc.exists) {
        throw new Error('Parent user not found');
      }
      
      const userData = userDoc.data()!;
      const currentPickup = userData.pickup || {};
      delete currentPickup[normalizedPickupAddress];
      
      transaction.update(userRef, { pickup: currentPickup });
      return true;
    });
  } catch (error) {
    console.error('Error removing pickup person from parent:', error);
    return false;
  }
};

// ===============================
// STUDENT OPERATIONS
// ===============================

export const createStudent = async (student: Omit<Student, 'createdAt'>): Promise<boolean> => {
  try {
    await adminDb.collection('students').doc(student.id).set({
      ...student,
      parentId: student.parentId.toLowerCase(),
      createdAt: new Date(),
    });
    return true;
  } catch (error) {
    console.error('Error creating student:', error);
    return false;
  }
};

export const getStudentById = async (studentId: string): Promise<Student | null> => {
  try {
    const studentDoc = await adminDb.collection('students').doc(studentId).get();
    
    if (studentDoc.exists) {
      const data = studentDoc.data();
      return {
        id: studentDoc.id,
        name: data!.name,
        grade: data!.grade,
        parentId: data!.parentId,
        createdAt: data!.createdAt,
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting student by ID:', error);
    return null;
  }
};

export const getStudentsByParent = async (parentWallet: string): Promise<Student[]> => {
  try {
    const snapshot = await adminDb.collection('students')
      .where('parentId', '==', parentWallet.toLowerCase())
      .get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        grade: data.grade,
        parentId: data.parentId,
        createdAt: data.createdAt,
      };
    });
  } catch (error) {
    console.error('Error getting students by parent:', error);
    return [];
  }
};

export const getAllStudents = async (): Promise<Student[]> => {
  try {
    const snapshot = await adminDb.collection('students').orderBy('createdAt', 'desc').get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        grade: data.grade,
        parentId: data.parentId,
        createdAt: data.createdAt.toDate(),
      };
    });
  } catch (error) {
    console.error('Error getting all students:', error);
    return [];
  }
};

export const updateStudent = async (studentId: string, updates: Partial<Student>): Promise<boolean> => {
  try {
    await adminDb.collection('students').doc(studentId).update({
      ...updates,
      parentId: updates.parentId?.toLowerCase(),
    });
    return true;
  } catch (error) {
    console.error('Error updating student:', error);
    return false;
  }
};

export const deleteStudent = async (studentId: string): Promise<boolean> => {
  try {
    await adminDb.collection('students').doc(studentId).delete();
    return true;
  } catch (error) {
    console.error('Error deleting student:', error);
    return false;
  }
};

// ===============================
// AUTHORIZATION OPERATIONS
// ===============================

export const createAuthorization = async (auth: Omit<Authorization, 'id' | 'createdAt'>): Promise<string | null> => {
  try {
    const authRef = adminDb.collection('authorizations').doc();
    await authRef.set({
      ...auth,
      parentWallet: auth.parentWallet.toLowerCase(),
      pickupWallet: auth.pickupWallet.toLowerCase(),
      createdAt: new Date(),
      id: authRef.id,
    });
    return authRef.id;
  } catch (error) {
    console.error('Error creating authorization:', error);
    return null;
  }
};

export const getAuthorizationsByPickupWallet = async (pickupWallet: string): Promise<Authorization[]> => {
  try {
    const snapshot = await adminDb.collection('authorizations')
      .where('pickupWallet', '==', pickupWallet.toLowerCase())
      .where('isActive', '==', true)
      .get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        studentId: data.studentId,
        parentWallet: data.parentWallet,
        pickupWallet: data.pickupWallet,
        signature: data.signature,
        message: data.message,
        startDate: data.startDate,
        endDate: data.endDate,
        createdAt: data.createdAt.toDate(),
        isActive: data.isActive,
      };
    });
  } catch (error) {
    console.error('Error getting authorizations by pickup wallet:', error);
    return [];
  }
};

export const getAuthorizationsByParent = async (parentWallet: string): Promise<Authorization[]> => {
  try {
    const snapshot = await adminDb.collection('authorizations')
      .where('parentWallet', '==', parentWallet.toLowerCase())
      .get();
    
    const authorizations = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        studentId: data.studentId,
        parentWallet: data.parentWallet,
        pickupWallet: data.pickupWallet,
        signature: data.signature,
        message: data.message,
        startDate: data.startDate,
        endDate: data.endDate,
        createdAt: data.createdAt.toDate(),
        isActive: data.isActive,
      };
    });
    
    // Sort in memory since we removed orderBy to avoid index issues
    return authorizations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error getting authorizations by parent:', error);
    return [];
  }
};

export const getAuthorizationById = async (authId: string): Promise<Authorization | null> => {
  try {
    const authDoc = await adminDb.collection('authorizations').doc(authId).get();
    
    if (authDoc.exists) {
      const data = authDoc.data();
      return {
        id: authDoc.id,
        studentId: data!.studentId,
        parentWallet: data!.parentWallet,
        pickupWallet: data!.pickupWallet,
        signature: data!.signature,
        message: data!.message,
        startDate: data!.startDate,
        endDate: data!.endDate,
        createdAt: data!.createdAt.toDate(),
        isActive: data!.isActive,
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting authorization by ID:', error);
    return null;
  }
};

export const updateAuthorizationStatus = async (authId: string, isActive: boolean): Promise<boolean> => {
  try {
    await adminDb.collection('authorizations').doc(authId).update({ isActive });
    return true;
  } catch (error) {
    console.error('Error updating authorization status:', error);
    return false;
  }
};

// ===============================
// PICKUP LOG OPERATIONS
// ===============================

export const createPickupLog = async (log: Omit<PickupLog, 'timestamp'>): Promise<boolean> => {
  try {
    const logRef = adminDb.collection('pickup-logs').doc();
    await logRef.set({
      ...log,
      pickupWallet: log.pickupWallet.toLowerCase(),
      timestamp: new Date(),
    });
    return true;
  } catch (error) {
    console.error('Error creating pickup log:', error);
    return false;
  }
};

export const getPickupLogsByStudent = async (studentId: string): Promise<PickupLog[]> => {
  try {
    const snapshot = await adminDb.collection('pickup-logs')
      .where('studentId', '==', studentId)
      .orderBy('timestamp', 'desc')
      .get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        studentId: data.studentId,
        pickupWallet: data.pickupWallet,
        scannedBy: data.scannedBy,
        timestamp: data.timestamp.toDate(),
        status: data.status,
        qrCodeId: data.qrCodeId,
      };
    });
  } catch (error) {
    console.error('Error getting pickup logs by student:', error);
    return [];
  }
};

export const getAllPickupLogs = async (): Promise<PickupLog[]> => {
  try {
    const snapshot = await adminDb.collection('pickup-logs').orderBy('timestamp', 'desc').get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        studentId: data.studentId,
        pickupWallet: data.pickupWallet,
        scannedBy: data.scannedBy,
        timestamp: data.timestamp.toDate(),
        status: data.status,
        qrCodeId: data.qrCodeId,
      };
    });
  } catch (error) {
    console.error('Error getting all pickup logs:', error);
    return [];
  }
};

// ===============================
// QR CODE OPERATIONS
// ===============================

export const createQRCode = async (qrData: Omit<QRCodeData, 'generatedAt'>): Promise<boolean> => {
  try {
    await adminDb.collection('qr-codes').doc(qrData.id).set({
      ...qrData,
      pickupWallet: qrData.pickupWallet.toLowerCase(),
      generatedAt: new Date(),
      expiresAt: qrData.expiresAt,
    });
    return true;
  } catch (error) {
    console.error('Error creating QR code:', error);
    return false;
  }
};

export const getQRCodeById = async (qrCodeId: string): Promise<QRCodeData | null> => {
  try {
    const qrDoc = await adminDb.collection('qr-codes').doc(qrCodeId).get();
    
    if (qrDoc.exists) {
      const data = qrDoc.data();
      return {
        id: qrDoc.id,
        pickupWallet: data!.pickupWallet,
        studentId: data!.studentId,
        authorizationId: data!.authorizationId,
        generatedAt: data!.generatedAt.toDate(),
        expiresAt: data!.expiresAt.toDate(),
        isUsed: data!.isUsed,
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting QR code by ID:', error);
    return null;
  }
};

export const markQRCodeAsUsed = async (qrCodeId: string): Promise<boolean> => {
  try {
    await adminDb.collection('qr-codes').doc(qrCodeId).update({ isUsed: true });
    return true;
  } catch (error) {
    console.error('Error marking QR code as used:', error);
    return false;
  }
};

// ===============================
// USER SESSION OPERATIONS
// ===============================

export const createUserSession = async (session: UserSession): Promise<boolean> => {
  try {
    await adminDb.collection('user-sessions').doc(session.wallet.toLowerCase()).set({
      ...session,
      wallet: session.wallet.toLowerCase(),
      lastActive: new Date(),
    });
    return true;
  } catch (error) {
    console.error('Error creating user session:', error);
    return false;
  }
};

export const getUserSession = async (walletAddress: string): Promise<UserSession | null> => {
  try {
    const sessionDoc = await adminDb.collection('user-sessions').doc(walletAddress.toLowerCase()).get();
    
    if (sessionDoc.exists) {
      const data = sessionDoc.data();
      return {
        wallet: data!.wallet,
        role: data!.role,
        lastActive: data!.lastActive.toDate(),
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting user session:', error);
    return null;
  }
};

export const getUserRole = async (walletAddress: string): Promise<string | null> => {
  try {
    const session = await getUserSession(walletAddress);
    return session?.role || null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};

export const updateUserSession = async (walletAddress: string): Promise<boolean> => {
  try {
    await adminDb.collection('user-sessions').doc(walletAddress.toLowerCase()).update({
      lastActive: new Date(),
    });
    return true;
  } catch (error) {
    console.error('Error updating user session:', error);
    return false;
  }
};

export const deleteUserSession = async (walletAddress: string): Promise<boolean> => {
  try {
    await adminDb.collection('user-sessions').doc(walletAddress.toLowerCase()).delete();
    return true;
  } catch (error) {
    console.error('Error deleting user session:', error);
    return false;
  }
};

// ===============================
// AUTHORIZATION RECORD OPERATIONS
// ===============================

export const createAuthorizationRecord = async (
  authRecord: Omit<AuthorizationRecord, 'id' | 'generatedAt'>
): Promise<string | null> => {
  try {
    const authRef = adminDb.collection('authorizationRecords').doc();
    await authRef.set({
      ...authRecord,
      id: authRef.id,
      pickupWallet: authRecord.pickupWallet.toLowerCase(),
      parentWallet: authRecord.parentWallet.toLowerCase(),
      generatedAt: new Date(),
      expiresAt: authRecord.expiresAt,
    });
    return authRef.id;
  } catch (error) {
    console.error('Error creating authorization record:', error);
    return null;
  }
};

export const getAuthorizationRecordById = async (recordId: string): Promise<AuthorizationRecord | null> => {
  try {
    const authDoc = await adminDb.collection('authorizationRecords').doc(recordId).get();
    
    if (authDoc.exists) {
      const data = authDoc.data();
      return {
        id: authDoc.id,
        qrCodeId: data!.qrCodeId,
        hash: data!.hash,
        studentId: data!.studentId,
        pickupWallet: data!.pickupWallet,
        parentWallet: data!.parentWallet,
        generatedAt: data!.generatedAt.toDate(),
        expiresAt: data!.expiresAt.toDate(),
        isUsed: data!.isUsed,
        isActive: data!.isActive,
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting authorization record by ID:', error);
    return null;
  }
};

export const verifyAuthorizationRecord = async (
  recordId: string,
  hash: string
): Promise<{ valid: boolean; record: AuthorizationRecord | null }> => {
  try {
    const record = await getAuthorizationRecordById(recordId);
    
    if (!record) {
      return { valid: false, record: null };
    }
    
    const isValid = record.hash === hash && 
                   record.isActive && 
                   !record.isUsed && 
                   new Date() < record.expiresAt;
    
    return { valid: isValid, record };
  } catch (error) {
    console.error('Error verifying authorization record:', error);
    return { valid: false, record: null };
  }
};

export const markAuthorizationRecordAsUsed = async (recordId: string): Promise<boolean> => {
  try {
    await adminDb.collection('authorizationRecords').doc(recordId).update({ isUsed: true });
    return true;
  } catch (error) {
    console.error('Error marking authorization record as used:', error);
    return false;
  }
};

export const getActiveAuthorizationsByPickup = async (pickupWallet: string): Promise<AuthorizationRecord[]> => {
  try {
    const snapshot = await adminDb.collection('authorizationRecords')
      .where('pickupWallet', '==', pickupWallet.toLowerCase())
      .where('isActive', '==', true)
      .where('isUsed', '==', false)
      .get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        qrCodeId: data.qrCodeId,
        hash: data.hash,
        studentId: data.studentId,
        pickupWallet: data.pickupWallet,
        parentWallet: data.parentWallet,
        generatedAt: data.generatedAt.toDate(),
        expiresAt: data.expiresAt.toDate(),
        isUsed: data.isUsed,
        isActive: data.isActive,
      };
    });
  } catch (error) {
    console.error('Error getting active authorizations by pickup:', error);
    return [];
  }
};

// ===============================
// PICKUP HISTORY OPERATIONS
// ===============================

export const createPickupHistory = async (pickupHistory: Omit<PickupHistory, 'id' | 'time'>): Promise<string | null> => {
  try {
    const historyRef = adminDb.collection('pickupHistory').doc();
    await historyRef.set({
      ...pickupHistory,
      id: historyRef.id,
      pickupBy: pickupHistory.pickupBy.toLowerCase(),
      staffId: pickupHistory.staffId.toLowerCase(),
      time: new Date(),
    });
    return historyRef.id;
  } catch (error) {
    console.error('Error creating pickup history:', error);
    return null;
  }
};

export const getPickupHistoryByStudent = async (studentId: string): Promise<PickupHistory[]> => {
  try {
    const snapshot = await adminDb.collection('pickupHistory')
      .where('studentId', '==', studentId)
      .orderBy('time', 'desc')
      .get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        blockchainHash: data.blockchainHash,
        contractTxHash: data.contractTxHash,
        pickupBy: data.pickupBy,
        staffId: data.staffId,
        studentId: data.studentId,
        time: data.time.toDate(),
      };
    });
  } catch (error) {
    console.error('Error getting pickup history by student:', error);
    return [];
  }
};

export const getAllPickupHistory = async (): Promise<PickupHistory[]> => {
  try {
    const snapshot = await adminDb.collection('pickupHistory').orderBy('time', 'desc').get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        blockchainHash: data.blockchainHash,
        contractTxHash: data.contractTxHash,
        pickupBy: data.pickupBy,
        staffId: data.staffId,
        studentId: data.studentId,
        time: data.time.toDate(),
      };
    });
  } catch (error) {
    console.error('Error getting all pickup history:', error);
    return [];
  }
};
