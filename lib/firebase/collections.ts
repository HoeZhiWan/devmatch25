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
  deleteDoc 
} from 'firebase/firestore';
import { db } from './config';
import type { Student, Authorization, PickupLog, UserSession, QRCodeData } from '@/types/database';

// Collection references
export const studentsCollection = collection(db, 'students');
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
    const q = query(
      authorizationsCollection,
      where('parentWallet', '==', parentWallet.toLowerCase()),
      orderBy('createdAt', 'desc')
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
    console.error('Error getting authorizations by parent:', error);
    return [];
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
