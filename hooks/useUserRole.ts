'use client';

import { useState, useEffect } from 'react';
import { getUserByWallet, UserRole } from '../lib/firebaseUtils';

interface UseUserRoleResult {
  role: UserRole | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUserRole(address: string | null): UseUserRoleResult {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserRole = async () => {
    if (!address) {
      setRole(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get user from Firebase using wallet integration utilities
      const user = await getUserByWallet(address);
      
      if (user) {
        setRole(user.role);
      } else {
        // If user doesn't exist in database, they need to complete registration
        console.log('User not found in database, registration required');
        setRole(null);
        setError('User registration required. Please complete the signup process.');
      }
    } catch (fetchError) {
      console.error('Error fetching user role:', fetchError);
      setError('Failed to fetch user role. Please try again.');
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRole();
  }, [address]);

  return {
    role,
    loading,
    error,
    refetch: fetchUserRole
  };
}