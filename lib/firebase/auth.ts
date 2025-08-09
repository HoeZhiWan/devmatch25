import admin from 'firebase-admin';
import { adminDb } from './admin';

/**
 * Creates a custom Firebase token for wallet-based authentication
 */
export const createCustomToken = async (walletAddress: string, additionalClaims?: Record<string, any>): Promise<string | null> => {
  try {
    const normalizedAddress = walletAddress.toLowerCase();
    
    // Get user data from database using the new users collection
    const userDoc = await adminDb.collection('users').doc(normalizedAddress).get();
    
    if (!userDoc.exists) {
      console.error('User not found in database:', normalizedAddress);
      return null;
    }
    
    const userData = userDoc.data();
    
    // Create custom claims
    const customClaims = {
      wallet: normalizedAddress,
      role: userData?.role || 'user',
      name: userData?.name || '',
      ...additionalClaims,
    };
    
    // Create custom token using wallet address as UID
    const customToken = await admin.auth().createCustomToken(normalizedAddress, customClaims);
    
    // Update user's last login time
    await adminDb.collection('users').doc(normalizedAddress).update({
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    return customToken;
  } catch (error) {
    console.error('Error creating custom token:', error);
    return null;
  }
};

/**
 * Verifies a Firebase ID token and returns the decoded token
 */
export const verifyIdToken = async (idToken: string) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying ID token:', error);
    return null;
  }
};

/**
 * Updates custom claims for a user
 */
export const updateUserClaims = async (walletAddress: string, claims: Record<string, any>): Promise<boolean> => {
  try {
    const normalizedAddress = walletAddress.toLowerCase();
    await admin.auth().setCustomUserClaims(normalizedAddress, {
      wallet: normalizedAddress,
      ...claims,
    });
    return true;
  } catch (error) {
    console.error('Error updating user claims:', error);
    return false;
  }
};

/**
 * Creates or updates a user in the database
 */
export const createOrUpdateUser = async (
  walletAddress: string,
  userData: {
    name: string;
    role: 'parent' | 'pickup_person' | 'staff';
    contactNumber?: string;
  }
): Promise<boolean> => {
  try {
    const normalizedAddress = walletAddress.toLowerCase();
    const userRef = adminDb.collection('users').doc(normalizedAddress);
    
    // Check if user exists
    const userDoc = await userRef.get();
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    
    if (userDoc.exists) {
      // Update existing user
      await userRef.update({
        ...userData,
        walletAddress: normalizedAddress,
        lastLoginAt: timestamp,
      });
    } else {
      // Create new user
      await userRef.set({
        id: normalizedAddress,
        walletAddress: normalizedAddress,
        ...userData,
        createdAt: timestamp,
        lastLoginAt: timestamp,
        pickup: userData.role === 'parent' ? {} : undefined,
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error creating or updating user:', error);
    return false;
  }
};

/**
 * Validates if a pickup person is authorized for a student
 */
export const validatePickupAuthorization = async (
  parentWallet: string,
  pickupWallet: string,
  studentId: string
): Promise<{ authorized: boolean; relationship?: string }> => {
  try {
    const normalizedParentAddress = parentWallet.toLowerCase();
    const normalizedPickupAddress = pickupWallet.toLowerCase();
    
    // Get parent user data
    const parentDoc = await adminDb.collection('users').doc(normalizedParentAddress).get();
    
    if (!parentDoc.exists) {
      return { authorized: false };
    }
    
    const parentData = parentDoc.data();
    
    // Check if student belongs to this parent
    const studentDoc = await adminDb.collection('students').doc(studentId).get();
    if (!studentDoc.exists || studentDoc.data()?.parentId !== normalizedParentAddress) {
      return { authorized: false };
    }

    console.log(studentDoc.data());
    
    // If pickup person is the same as parent, allow it (parent picking up their own child)
    if (normalizedParentAddress === normalizedPickupAddress) {
      return { 
        authorized: true, 
        relationship: 'parent' 
      };
    }
    
    // Check if pickup person is authorized and within date range
    const pickupPersons = parentData?.pickup || {};
    const pickupPerson = pickupPersons[normalizedPickupAddress];
    
    if (!pickupPerson) {
      return { authorized: false };
    }
    
    const now = new Date();
    const startDate = new Date(pickupPerson.startDate);
    const endDate = new Date(pickupPerson.endDate);
    
    if (now >= startDate && now <= endDate) {
      return { 
        authorized: true, 
        relationship: pickupPerson.relationship 
      };
    }
    
    return { authorized: false };
  } catch (error) {
    console.error('Error validating pickup authorization:', error);
    return { authorized: false };
  }
};
