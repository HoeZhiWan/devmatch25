import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebaseUtils';

export type UserRole = 'staff' | 'parent' | 'pickup' | null;

export function useUserRole(address: string | null): UserRole {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) {
      setRole(null);
      return;
    }

    const fetchUserRole = async () => {
      setLoading(true);
      try {
        // Query Firestore for user role based on wallet address
        const userDoc = doc(db, 'users', address.toLowerCase());
        const userSnapshot = await getDoc(userDoc);
        
        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
          setRole(userData.role as UserRole);
        } else {
          // If user doesn't exist in database, use fallback logic for demo
          console.log('User not found in database, using fallback logic');
          if (address.toLowerCase().endsWith('1')) setRole('staff');
          else if (address.toLowerCase().endsWith('2')) setRole('parent');
          else setRole('pickup');
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        // Fallback to demo logic if Firebase fails
        if (address.toLowerCase().endsWith('1')) setRole('staff');
        else if (address.toLowerCase().endsWith('2')) setRole('parent');
        else setRole('pickup');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [address]);

  return role;
}