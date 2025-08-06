import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

// User roles type definition
export type UserRole = 'staff' | 'parent' | 'pickup';

// User interface for Firebase
export interface User {
  walletAddress: string;
  role: UserRole;
  name: string;
  createdAt?: Date;
}

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

/**
 * Add a new user to Firebase
 */
export async function addUserToFirebase(userData: User): Promise<boolean> {
  try {
    // Use wallet address (lowercase) as the document ID for easy lookup
    const userDocRef = doc(db, 'users', userData.walletAddress.toLowerCase());
    
    const userDoc = {
      ...userData,
      walletAddress: userData.walletAddress.toLowerCase(),
      createdAt: new Date()
    };

    await setDoc(userDocRef, userDoc);
    console.log('User added to Firebase:', userData.walletAddress);
    return true;
  } catch (error) {
    console.error('Error adding user to Firebase:', error);
    return false;
  }
}

/**
 * Get user by wallet address
 */
export async function getUserByWallet(walletAddress: string): Promise<User | null> {
  try {
    const userDocRef = doc(db, 'users', walletAddress.toLowerCase());
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        walletAddress: userData.walletAddress,
        role: userData.role,
        name: userData.name,
        createdAt: userData.createdAt?.toDate()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user by wallet:', error);
    return null;
  }
}

/**
 * Update user role
 */
export async function updateUserRole(walletAddress: string, newRole: UserRole): Promise<boolean> {
  try {
    const userDocRef = doc(db, 'users', walletAddress.toLowerCase());
    await setDoc(userDocRef, { role: newRole }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error updating user role:', error);
    return false;
  }
}

/**
 * Get all users by role
 */
export async function getUsersByRole(role: UserRole): Promise<User[]> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', role));
    const querySnapshot = await getDocs(q);
    
    const users: User[] = [];
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      users.push({
        walletAddress: userData.walletAddress,
        role: userData.role,
        name: userData.name,
        createdAt: userData.createdAt?.toDate()
      });
    });
    
    return users;
  } catch (error) {
    console.error('Error getting users by role:', error);
    return [];
  }
}

export { firebaseApp, db };