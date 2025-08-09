import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp,
  updateDoc,
  deleteDoc,
  startAt,
  endAt,
  runTransaction,
  writeBatch
} from 'firebase/firestore';
import { db } from './config';
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

// Collection references
export const studentsCollection = collection(db, 'students');
export const usersCollection = collection(db, 'users');
export const pickupHistoryCollection = collection(db, 'pickupHistory');
export const authorizationRecordsCollection = collection(db, 'authorizationRecords');

// Legacy collections for backward compatibility
export const authorizationsCollection = collection(db, 'authorizations');
export const pickupLogsCollection = collection(db, 'pickup-logs');
export const userSessionsCollection = collection(db, 'user-sessions');
export const qrCodesCollection = collection(db, 'qr-codes');

// Student operations
export const createStudent = async (student: Omit<Student, 'createdAt'>) => {
  try {
    const studentDoc = doc(studentsCollection, student.id);
    await setDoc(studentDoc, {
      ...student,
      parentId: student.parentId.toLowerCase(),
      createdAt: Timestamp.now(),
    });
    return true;
  } catch (error) {
    console.error('Error creating student:', error);
    return false;
  }
};

export const getStudentsByParent = async (parentWallet: string): Promise<Student[]> => {
  try {
    const q = query(
      studentsCollection,
      where('parentId', '==', parentWallet.toLowerCase())
    );
    const snapshot = await getDocs(q);
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
    console.error('Error getting students by parent:', error);
    return [];
  }
};

export const getStudentById = async (studentId: string): Promise<Student | null> => {
  try {
    const studentDoc = doc(studentsCollection, studentId);
    const studentSnap = await getDoc(studentDoc);
    
    if (studentSnap.exists()) {
      const data = studentSnap.data();
      return {
        id: studentSnap.id,
        name: data.name,
        grade: data.grade,
        parentId: data.parentId,
        createdAt: data.createdAt.toDate(),
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting student by ID:', error);
    return null;
  }
};

// NEW: Get all students for staff dashboard
export const getAllStudents = async (): Promise<Student[]> => {
  try {
    const q = query(studentsCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
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

// NEW: Update student information
export const updateStudent = async (studentId: string, updates: Partial<Student>): Promise<boolean> => {
  try {
    const studentDoc = doc(studentsCollection, studentId);
    await updateDoc(studentDoc, {
      ...updates,
      parentId: updates.parentId?.toLowerCase(),
    });
    return true;
  } catch (error) {
    console.error('Error updating student:', error);
    return false;
  }
};

// NEW: Delete student
export const deleteStudent = async (studentId: string): Promise<boolean> => {
  try {
    const studentDoc = doc(studentsCollection, studentId);
    await deleteDoc(studentDoc);
    return true;
  } catch (error) {
    console.error('Error deleting student:', error);
    return false;
  }
};

// Authorization operations
export const createAuthorization = async (auth: Omit<Authorization, 'id' | 'createdAt'>): Promise<string | null> => {
  try {
    const authDoc = doc(authorizationsCollection);
    await setDoc(authDoc, {
      ...auth,
      parentWallet: auth.parentWallet.toLowerCase(),
      pickupWallet: auth.pickupWallet.toLowerCase(),
      createdAt: Timestamp.now(),
      id: authDoc.id,
    });
    return authDoc.id;
  } catch (error) {
    console.error('Error creating authorization:', error);
    return null;
  }
};

export const getAuthorizationsByPickupWallet = async (pickupWallet: string): Promise<Authorization[]> => {
  try {
    const q = query(
      authorizationsCollection,
      where('pickupWallet', '==', pickupWallet.toLowerCase()),
      where('isActive', '==', true)
    );
    const snapshot = await getDocs(q);
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
    // Temporary fix: Remove orderBy to avoid composite index requirement
    // TODO: Add back orderBy once index is created
    const q = query(
      authorizationsCollection,
      where('parentWallet', '==', parentWallet.toLowerCase())
      // orderBy('createdAt', 'desc') // Temporarily removed
    );
    const snapshot = await getDocs(q);
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
    
    // Sort in memory instead of in query
    return authorizations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error getting authorizations by parent:', error);
    return [];
  }
};

// NEW: Get authorization by ID
export const getAuthorizationById = async (authId: string): Promise<Authorization | null> => {
  try {
    const authDoc = doc(authorizationsCollection, authId);
    const authSnap = await getDoc(authDoc);
    
    if (authSnap.exists()) {
      const data = authSnap.data();
      return {
        id: authSnap.id,
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
    }
    return null;
  } catch (error) {
    console.error('Error getting authorization by ID:', error);
    return null;
  }
};

export const updateAuthorizationStatus = async (authId: string, isActive: boolean): Promise<boolean> => {
  try {
    const authDoc = doc(authorizationsCollection, authId);
    await updateDoc(authDoc, { isActive });
    return true;
  } catch (error) {
    console.error('Error updating authorization status:', error);
    return false;
  }
};

// User session operations
export const createUserSession = async (session: UserSession): Promise<boolean> => {
  try {
    const sessionDoc = doc(userSessionsCollection, session.wallet.toLowerCase());
    await setDoc(sessionDoc, {
      ...session,
      wallet: session.wallet.toLowerCase(),
      lastActive: Timestamp.now(),
    });
    return true;
  } catch (error) {
    console.error('Error creating user session:', error);
    return false;
  }
};

export const getUserSession = async (walletAddress: string): Promise<UserSession | null> => {
  try {
    const sessionDoc = doc(userSessionsCollection, walletAddress.toLowerCase());
    const sessionSnap = await getDoc(sessionDoc);
    
    if (sessionSnap.exists()) {
      const data = sessionSnap.data();
      return {
        wallet: data.wallet,
        role: data.role,
        lastActive: data.lastActive.toDate(),
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting user session:', error);
    return null;
  }
};

// NEW: Get user role
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
    const sessionDoc = doc(userSessionsCollection, walletAddress.toLowerCase());
    await updateDoc(sessionDoc, {
      lastActive: Timestamp.now(),
    });
    return true;
  } catch (error) {
    console.error('Error updating user session:', error);
    return false;
  }
};

export const deleteUserSession = async (walletAddress: string): Promise<boolean> => {
  try {
    const sessionDoc = doc(userSessionsCollection, walletAddress.toLowerCase());
    await deleteDoc(sessionDoc);
    return true;
  } catch (error) {
    console.error('Error deleting user session:', error);
    return false;
  }
};

// QR Code operations
export const createQRCode = async (qrData: Omit<QRCodeData, 'generatedAt'>): Promise<boolean> => {
  try {
    const qrDoc = doc(qrCodesCollection, qrData.id);
    await setDoc(qrDoc, {
      ...qrData,
      pickupWallet: qrData.pickupWallet.toLowerCase(),
      generatedAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(qrData.expiresAt),
    });
    return true;
  } catch (error) {
    console.error('Error creating QR code:', error);
    return false;
  }
};

export const getQRCodeById = async (qrCodeId: string): Promise<QRCodeData | null> => {
  try {
    const qrDoc = doc(qrCodesCollection, qrCodeId);
    const qrSnap = await getDoc(qrDoc);
    
    if (qrSnap.exists()) {
      const data = qrSnap.data();
      return {
        id: qrSnap.id,
        pickupWallet: data.pickupWallet,
        studentId: data.studentId,
        authorizationId: data.authorizationId,
        generatedAt: data.generatedAt.toDate(),
        expiresAt: data.expiresAt.toDate(),
        isUsed: data.isUsed,
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
    const qrDoc = doc(qrCodesCollection, qrCodeId);
    await updateDoc(qrDoc, { isUsed: true });
    return true;
  } catch (error) {
    console.error('Error marking QR code as used:', error);
    return false;
  }
};

// Pickup log operations
export const createPickupLog = async (log: Omit<PickupLog, 'timestamp'>): Promise<boolean> => {
  try {
    const logDoc = doc(pickupLogsCollection);
    await setDoc(logDoc, {
      ...log,
      pickupWallet: log.pickupWallet.toLowerCase(),
      timestamp: Timestamp.now(),
    });
    return true;
  } catch (error) {
    console.error('Error creating pickup log:', error);
    return false;
  }
};

export const getPickupLogsByStudent = async (studentId: string): Promise<PickupLog[]> => {
  try {
    const q = query(
      pickupLogsCollection,
      where('studentId', '==', studentId),
      orderBy('timestamp', 'desc')
    );
    const snapshot = await getDocs(q);
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

// NEW: Get all pickup logs for staff dashboard
export const getAllPickupLogs = async (): Promise<PickupLog[]> => {
  try {
    const q = query(pickupLogsCollection, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
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

// NEW: Get pickup logs by date range
export const getPickupLogsByDateRange = async (startDate: Date, endDate: Date): Promise<PickupLog[]> => {
  try {
    const q = query(
      pickupLogsCollection,
      where('timestamp', '>=', Timestamp.fromDate(startDate)),
      where('timestamp', '<=', Timestamp.fromDate(endDate)),
      orderBy('timestamp', 'desc')
    );
    const snapshot = await getDocs(q);
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
    console.error('Error getting pickup logs by date range:', error);
    return [];
  }
};

// NEW: Get pickup logs by staff member
export const getPickupLogsByStaff = async (staffWallet: string): Promise<PickupLog[]> => {
  try {
    const q = query(
      pickupLogsCollection,
      where('scannedBy', '==', staffWallet.toLowerCase()),
      orderBy('timestamp', 'desc')
    );
    const snapshot = await getDocs(q);
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
    console.error('Error getting pickup logs by staff:', error);
    return [];
  }
};

// ===============================
// NEW COLLECTION OPERATIONS
// ===============================

// User operations
export const createUser = async (user: Omit<User, 'createdAt' | 'lastLoginAt'>): Promise<boolean> => {
  try {
    const normalizedAddress = user.walletAddress.toLowerCase();
    const userDoc = doc(usersCollection, normalizedAddress);
    await setDoc(userDoc, {
      ...user,
      id: normalizedAddress,
      walletAddress: normalizedAddress,
      createdAt: Timestamp.now(),
      lastLoginAt: Timestamp.now(),
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
    const userDoc = doc(usersCollection, normalizedAddress);
    const userSnap = await getDoc(userDoc);
    
    if (userSnap.exists()) {
      const data = userSnap.data();
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
    const userDoc = doc(usersCollection, normalizedAddress);
    await updateDoc(userDoc, {
      lastLoginAt: Timestamp.now(),
    });
    return true;
  } catch (error) {
    console.error('Error updating user last login:', error);
    return false;
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
    const userDoc = doc(usersCollection, normalizedParentAddress);
    
    return await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userDoc);
      
      if (!userSnap.exists()) {
        throw new Error('Parent user not found');
      }
      
      const userData = userSnap.data();
      if (userData.role !== 'parent') {
        throw new Error('User is not a parent');
      }
      
      const currentPickup = userData.pickup || {};
      currentPickup[normalizedPickupAddress] = {
        ...pickupPerson,
        walletAddress: normalizedPickupAddress,
      };
      
      transaction.update(userDoc, { pickup: currentPickup });
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
    const userDoc = doc(usersCollection, normalizedParentAddress);
    
    return await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userDoc);
      
      if (!userSnap.exists()) {
        throw new Error('Parent user not found');
      }
      
      const userData = userSnap.data();
      const currentPickup = userData.pickup || {};
      delete currentPickup[normalizedPickupAddress];
      
      transaction.update(userDoc, { pickup: currentPickup });
      return true;
    });
  } catch (error) {
    console.error('Error removing pickup person from parent:', error);
    return false;
  }
};

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const q = query(usersCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
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
    const q = query(
      usersCollection, 
      where('role', '==', role),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    
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

// Pickup History operations
export const createPickupHistory = async (pickupHistory: Omit<PickupHistory, 'id' | 'time'>): Promise<string | null> => {
  try {
    const historyDoc = doc(pickupHistoryCollection);
    await setDoc(historyDoc, {
      ...pickupHistory,
      id: historyDoc.id,
      pickupBy: pickupHistory.pickupBy.toLowerCase(),
      staffId: pickupHistory.staffId.toLowerCase(),
      time: Timestamp.now(),
    });
    return historyDoc.id;
  } catch (error) {
    console.error('Error creating pickup history:', error);
    return null;
  }
};

export const getPickupHistoryByStudent = async (studentId: string): Promise<PickupHistory[]> => {
  try {
    const q = query(
      pickupHistoryCollection,
      where('studentId', '==', studentId),
      orderBy('time', 'desc')
    );
    const snapshot = await getDocs(q);
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
    const q = query(pickupHistoryCollection, orderBy('time', 'desc'));
    const snapshot = await getDocs(q);
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

// Authorization Record operations
export const createAuthorizationRecord = async (
  authRecord: Omit<AuthorizationRecord, 'id' | 'generatedAt'>
): Promise<string | null> => {
  try {
    const authDoc = doc(authorizationRecordsCollection);
    await setDoc(authDoc, {
      ...authRecord,
      id: authDoc.id,
      pickupWallet: authRecord.pickupWallet.toLowerCase(),
      parentWallet: authRecord.parentWallet.toLowerCase(),
      generatedAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(authRecord.expiresAt),
    });
    return authDoc.id;
  } catch (error) {
    console.error('Error creating authorization record:', error);
    return null;
  }
};

export const getAuthorizationRecordById = async (recordId: string): Promise<AuthorizationRecord | null> => {
  try {
    const authDoc = doc(authorizationRecordsCollection, recordId);
    const authSnap = await getDoc(authDoc);
    
    if (authSnap.exists()) {
      const data = authSnap.data();
      return {
        id: authSnap.id,
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
    const authDoc = doc(authorizationRecordsCollection, recordId);
    await updateDoc(authDoc, { isUsed: true });
    return true;
  } catch (error) {
    console.error('Error marking authorization record as used:', error);
    return false;
  }
};

export const getActiveAuthorizationsByPickup = async (pickupWallet: string): Promise<AuthorizationRecord[]> => {
  try {
    const q = query(
      authorizationRecordsCollection,
      where('pickupWallet', '==', pickupWallet.toLowerCase()),
      where('isActive', '==', true),
      where('isUsed', '==', false)
    );
    const snapshot = await getDocs(q);
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
