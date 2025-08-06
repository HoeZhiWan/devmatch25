import admin from 'firebase-admin';
import { adminDb } from './admin';

/**
 * Creates a custom Firebase token for wallet-based authentication
 */
export const createCustomToken = async (walletAddress: string, additionalClaims?: Record<string, any>): Promise<string | null> => {
  try {
    const normalizedAddress = walletAddress.toLowerCase();
    
    // Get user data from database
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
      ...additionalClaims,
    };
    
    // Create custom token using wallet address as UID
    const customToken = await admin.auth().createCustomToken(normalizedAddress, customClaims);
    
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
