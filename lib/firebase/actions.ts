import { addDoc, serverTimestamp } from 'firebase/firestore';
import { authorizationsCollection, pickupLogsCollection } from './collections';
import type { Authorization, PickupLog } from '../../types/database';

/**
 * Adds a new authorization record to Firebase.
 * @param authData The authorization data to add.
 * @returns The ID of the newly created document.
 */
export const addAuthorizationToFirebase = async (authData: Omit<Authorization, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(authorizationsCollection, {
      ...authData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding authorization to Firebase:', error);
    throw new Error('Failed to create authorization in database.');
  }
};

/**
 * Adds a new pickup event record to Firebase.
 * @param pickupData The pickup event data to add.
 * @returns The ID of the newly created document.
 */
export const addPickupToFirebase = async (pickupData: Omit<PickupLog, 'id' | 'timestamp'>): Promise<string> => {
  try {
    const docRef = await addDoc(pickupLogsCollection, {
      ...pickupData,
      timestamp: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding pickup to Firebase:', error);
    throw new Error('Failed to create pickup in database.');
  }
};