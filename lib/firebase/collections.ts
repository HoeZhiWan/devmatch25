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
  endAt
} from 'firebase/firestore';
import { db } from './config';
import type {
  Student,
  Authorization,
  PickupLog,
  UserSession,
  QRCodeData
} from '@/types/database';

// Collection references
export const studentsCollection = collection(db, 'students');
export const authorizationsCollection = collection(db, 'authorizations');
export const pickupLogsCollection = collection(db, 'pickup-logs');
export const userSessionsCollection = collection(db, 'user-sessions');
export const qrCodesCollection = collection(db, 'qr-codes');

// New unified schema: root users and pickup history
export const usersRootCollection = collection(db, 'user');
export const pickupHistoryCollection = collection(db, 'pickupHistory');

// Student operations
export const createStudent = async (student: Omit<Student, 'createdAt'>) => {
  try {
    const studentDoc = doc(studentsCollection, student.id);
    await setDoc(studentDoc, {
      ...student,
      parentWallet: student.parentWallet.toLowerCase(),
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
      where('parentWallet', '==', parentWallet.toLowerCase())
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        parentWallet: data.parentWallet,
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
        parentWallet: data.parentWallet,
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
        parentWallet: data.parentWallet,
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
      parentWallet: updates.parentWallet?.toLowerCase(),
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

// =========================
// New helpers for unified schema
// =========================

// Ensure a user root document exists and upsert basic fields
export const upsertUserRoot = async (user: { walletAddress: string; role: string }): Promise<boolean> => {
  try {
    const normalizedWallet = user.walletAddress.toLowerCase();
    const userDocRef = doc(usersRootCollection, normalizedWallet);
    await setDoc(userDocRef, {
      walletAddress: normalizedWallet,
      role: user.role,
      createdAt: Timestamp.now(),
      lastLoginAt: Timestamp.now()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error upserting user root:', error);
    return false;
  }
};

// Add a student under a parent user subcollection `student`
export const addStudentUnderUser = async (
  parentWallet: string,
  student: { name: string; grade: string; parentId: string }
): Promise<string | null> => {
  try {
    const parentRef = doc(usersRootCollection, parentWallet.toLowerCase());
    const studentCol = collection(parentRef, 'student');
    const studentDocRef = doc(studentCol);
    await setDoc(studentDocRef, {
      name: student.name,
      grade: student.grade,
      parentId: student.parentId.toLowerCase()
    });
    return studentDocRef.id;
  } catch (error) {
    console.error('Error adding student under user:', error);
    return null;
  }
};

// Add or update parent profile under user subcollection `parents`
export const upsertParentProfile = async (
  parentWallet: string,
  parentData: { contactNumber: string; name: string; studentIds?: string[]; walletAddressParent: string }
): Promise<boolean> => {
  try {
    const parentRef = doc(usersRootCollection, parentWallet.toLowerCase());
    const parentsCol = collection(parentRef, 'parents');
    const parentDocRef = doc(parentsCol);
    await setDoc(parentDocRef, {
      name: parentData.name,
      contactNumber: parentData.contactNumber,
      studentIds: parentData.studentIds || [],
      walletAddressParent: parentData.walletAddressParent.toLowerCase()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error upserting parent profile under user:', error);
    return false;
  }
};

// Add a staff record under user subcollection `staff`
export const addStaffUnderUser = async (
  staffWallet: string,
  staff: { staffid: string; name: string; walletaddress: string }
): Promise<string | null> => {
  try {
    const staffUserRef = doc(usersRootCollection, staffWallet.toLowerCase());
    const staffCol = collection(staffUserRef, 'staff');
    const staffDocRef = doc(staffCol);
    await setDoc(staffDocRef, {
      staffid: staff.staffid,
      name: staff.name,
      walletaddress: staff.walletaddress.toLowerCase()
    });
    return staffDocRef.id;
  } catch (error) {
    console.error('Error adding staff under user:', error);
    return null;
  }
};

// Create a pickup authorization under a parent user subcollection `pickup`
export const addPickupAuthorizationForParent = async (
  parentWallet: string,
  pickup: {
    blockchainHash: string;
    contractTxHash: string;
    contactNumber: string;
    endDate: Date | string;
    parentId: string;
    relationship: string;
    signature: string;
    startDate: Date | string;
    studentId: string;
    walletAddressPickup: string;
  }
): Promise<string | null> => {
  try {
    const normalizedParent = parentWallet.toLowerCase();
    const parentRef = doc(usersRootCollection, normalizedParent);
    // Ensure root user exists
    await setDoc(parentRef, {
      walletAddress: normalizedParent,
      role: 'parent',
      lastLoginAt: Timestamp.now()
    }, { merge: true });

    const pickupCol = collection(parentRef, 'pickup');
    const pickupDocRef = doc(pickupCol);
    await setDoc(pickupDocRef, {
      blockchainHash: pickup.blockchainHash,
      contractTxHash: pickup.contractTxHash,
      contactNumber: pickup.contactNumber,
      createdAt: Timestamp.now(),
      endDate: pickup.endDate instanceof Date ? Timestamp.fromDate(pickup.endDate) : pickup.endDate,
      parentId: pickup.parentId.toLowerCase(),
      relationship: pickup.relationship,
      signature: pickup.signature,
      startDate: pickup.startDate instanceof Date ? Timestamp.fromDate(pickup.startDate) : pickup.startDate,
      studentId: pickup.studentId,
      walletAddressPickup: pickup.walletAddressPickup.toLowerCase()
    });
    return pickupDocRef.id;
  } catch (error) {
    console.error('Error adding pickup authorization for parent:', error);
    return null;
  }
};

// Log a pickup event in global collection `pickupHistory`
export const createPickupHistoryLog = async (
  history: {
    blockchainHash: string;
    contractTxHash: string;
    pickupBy: string;
    staffId: string;
    studentId: string;
  }
): Promise<boolean> => {
  try {
    const logDocRef = doc(pickupHistoryCollection);
    await setDoc(logDocRef, {
      ...history,
      pickupBy: history.pickupBy.toLowerCase(),
      staffId: history.staffId.toLowerCase(),
      time: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error creating pickup history log:', error);
    return false;
  }
};
