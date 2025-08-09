'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFirebaseAuth } from './useFirebaseAuth';
import type { 
  Student, 
  User, 
  PickupHistory, 
  AuthorizationRecord, 
  PickupPerson 
} from '@/types/database';

interface UseFirebaseDataReturn {
  // User data
  currentUser: User | null;
  
  // Students
  students: Student[];
  loadingStudents: boolean;
  
  // Pickup authorizations (for parents)
  pickupAuthorizations: Record<string, PickupPerson>;
  loadingAuthorizations: boolean;
  
  // Pickup history
  pickupHistory: PickupHistory[];
  loadingHistory: boolean;
  
  // Authorization records (for pickup persons)
  authorizationRecords: AuthorizationRecord[];
  loadingRecords: boolean;
  
  // Authorized students (for pickup persons - students they can pick up)
  authorizedStudents: Student[];
  
  // All users (for staff)
  allUsers: User[];
  loadingAllUsers: boolean;
  
  // Loading state
  loading: boolean;
  
  // Error states
  error: string | null;
  
  // Methods
  refreshData: () => Promise<void>;
  clearError: () => void;
  
  // Actions
  addPickupAuthorization: (pickupWallet: string, person: PickupPerson) => Promise<boolean>;
  removePickupAuthorization: (pickupWallet: string) => Promise<boolean>;
  generateQRCode: (studentId: string) => Promise<{ qrCodeData: string; expiresAt: string } | null>;
}

export function useFirebaseData(): UseFirebaseDataReturn {
  const { user: authUser, isAuthenticated } = useFirebaseAuth();
  
  // State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [pickupAuthorizations, setPickupAuthorizations] = useState<Record<string, PickupPerson>>({});
  const [pickupHistory, setPickupHistory] = useState<PickupHistory[]>([]);
  const [authorizationRecords, setAuthorizationRecords] = useState<AuthorizationRecord[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  
  // Loading states
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingAuthorizations, setLoadingAuthorizations] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [loadingAllUsers, setLoadingAllUsers] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Get ID token for API calls
  const getIdToken = useCallback(async (): Promise<string | null> => {
    try {
      if (!authUser?.firebaseUser) return null;
      return await authUser.firebaseUser.getIdToken();
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  }, [authUser]);

  // Fetch current user data
  const fetchCurrentUser = useCallback(async () => {
    if (!authUser?.wallet) return;
    
    try {
      const response = await fetch(`/api/users?wallet=${authUser.wallet}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setCurrentUser(data.user);
          if (data.user.pickup) {
            setPickupAuthorizations(data.user.pickup);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  }, [authUser?.wallet]);

  // Fetch students
  const fetchStudents = useCallback(async () => {
    if (!authUser?.wallet) return;
    
    setLoadingStudents(true);
    try {
      const params = new URLSearchParams();
      if (authUser.role === 'parent') {
        params.append('parentId', authUser.wallet);
      }
      // For pickup persons and staff, fetch all students (needed to check authorizations)
      
      const response = await fetch(`/api/students?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStudents(data.students || []);
        }
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to load students');
    } finally {
      setLoadingStudents(false);
    }
  }, [authUser?.wallet, authUser?.role]);

  // Fetch pickup history
  const fetchPickupHistory = useCallback(async () => {
    if (!authUser?.wallet) return;
    
    setLoadingHistory(true);
    try {
      const response = await fetch('/api/pickup/history');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPickupHistory(data.history || []);
        }
      }
    } catch (error) {
      console.error('Error fetching pickup history:', error);
      setError('Failed to load pickup history');
    } finally {
      setLoadingHistory(false);
    }
  }, [authUser?.wallet]);

  // Fetch authorization records (for pickup persons)
  const fetchAuthorizationRecords = useCallback(async () => {
    if (!authUser?.wallet || authUser.role !== 'pickup') return;
    
    setLoadingRecords(true);
    try {
      const idToken = await getIdToken();
      if (!idToken) return;
      
      const response = await fetch('/api/pickup/authorizations', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAuthorizationRecords(data.authorizations || []);
        }
      }
    } catch (error) {
      console.error('Error fetching authorization records:', error);
      setError('Failed to load authorizations');
    } finally {
      setLoadingRecords(false);
    }
  }, [authUser?.wallet, authUser?.role, getIdToken]);

  // Fetch all users (for staff)
  const fetchAllUsers = useCallback(async () => {
    if (!authUser?.wallet || authUser.role !== 'staff') return;
    
    setLoadingAllUsers(true);
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAllUsers(data.users || []);
        }
      }
    } catch (error) {
      console.error('Error fetching all users:', error);
      setError('Failed to load users');
    } finally {
      setLoadingAllUsers(false);
    }
  }, [authUser?.wallet, authUser?.role]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    clearError();
    await Promise.all([
      fetchCurrentUser(),
      fetchStudents(),
      fetchPickupHistory(),
      fetchAuthorizationRecords(),
      fetchAllUsers(),
    ]);
  }, [
    fetchCurrentUser,
    fetchStudents,
    fetchPickupHistory,
    fetchAuthorizationRecords,
    fetchAllUsers,
    clearError
  ]);

  // Add pickup authorization
  const addPickupAuthorization = useCallback(async (
    pickupWallet: string, 
    person: PickupPerson
  ): Promise<boolean> => {
    try {
      const idToken = await getIdToken();
      if (!idToken) return false;
      
      const response = await fetch('/api/pickup/authorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pickupWallet,
          relationship: person.relationship,
          startDate: person.startDate,
          endDate: person.endDate,
          idToken,
        }),
      });
      
      if (response.ok) {
        await fetchCurrentUser(); // Refresh user data
        return true;
      }
      
      const errorData = await response.json();
      setError(errorData.error || 'Failed to add pickup authorization');
      return false;
    } catch (error) {
      console.error('Error adding pickup authorization:', error);
      setError('Failed to add pickup authorization');
      return false;
    }
  }, [getIdToken, fetchCurrentUser]);

  // Remove pickup authorization
  const removePickupAuthorization = useCallback(async (pickupWallet: string): Promise<boolean> => {
    try {
      const idToken = await getIdToken();
      if (!idToken) return false;
      
      const response = await fetch(`/api/pickup/authorize?pickupWallet=${pickupWallet}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });
      
      if (response.ok) {
        await fetchCurrentUser(); // Refresh user data
        return true;
      }
      
      const errorData = await response.json();
      setError(errorData.error || 'Failed to remove pickup authorization');
      return false;
    } catch (error) {
      console.error('Error removing pickup authorization:', error);
      setError('Failed to remove pickup authorization');
      return false;
    }
  }, [getIdToken, fetchCurrentUser]);

  // Generate QR code
  const generateQRCode = useCallback(async (
    studentId: string
  ): Promise<{ qrCodeData: string; expiresAt: string } | null> => {
    try {
      const idToken = await getIdToken();
      if (!idToken) return null;
      
      const response = await fetch('/api/qr/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          idToken,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return {
            qrCodeData: data.data.qrCodeData,
            expiresAt: data.data.expiresAt,
          };
        }
      }
      
      const errorData = await response.json();
      setError(errorData.error || 'Failed to generate QR code');
      return null;
    } catch (error) {
      console.error('Error generating QR code:', error);
      setError('Failed to generate QR code');
      return null;
    }
  }, [getIdToken]);

  // Load data when authentication state changes
  useEffect(() => {
    if (isAuthenticated && authUser) {
      refreshData();
    } else {
      // Clear data when not authenticated
      setCurrentUser(null);
      setStudents([]);
      setPickupAuthorizations({});
      setPickupHistory([]);
      setAuthorizationRecords([]);
      setAllUsers([]);
    }
  }, [isAuthenticated, authUser, refreshData]);

  return {
    currentUser,
    students,
    loadingStudents,
    pickupAuthorizations,
    loadingAuthorizations,
    pickupHistory,
    loadingHistory,
    authorizationRecords,
    loadingRecords,
    // For pickup persons - return students they are authorized to pick up
    authorizedStudents: students.filter(student => {
      // If current user is a parent, they can pick up their own children
      if (authUser?.role === 'parent' && student.parentId === authUser.wallet) {
        console.log('Parent can pick up own child:', student.name);
        return true;
      }
      
      // For pickup persons: find parents who have authorized this pickup person
      if (authUser?.role === 'pickup') {
        // Find if any parent has authorized the current pickup person (authUser.wallet)
        // and if this student belongs to that parent
        const isAuthorized = allUsers.some(parentUser => {
          // Check if this user is a parent
          if (parentUser.role !== 'parent') return false;
          
          // Check if this parent has authorized the current pickup person
          const pickupAuth = parentUser.pickup?.[authUser.wallet || ''];
          if (!pickupAuth) return false;
          
          // Check if this student belongs to this parent
          const studentBelongsToParent = student.parentId === parentUser.id;
          
          // Check if authorization is currently valid (date range)
          const now = new Date();
          const startDate = new Date(pickupAuth.startDate);
          const endDate = new Date(pickupAuth.endDate);
          const isDateValid = now >= startDate && now <= endDate;
          
          if (studentBelongsToParent && isDateValid) {
            console.log('Pickup person authorized for student:', {
              student: student.name,
              studentId: student.id,
              parentUser: parentUser.name,
              parentId: parentUser.id,
              pickupAuth: pickupAuth,
              relationship: pickupAuth.relationship,
              validFrom: pickupAuth.startDate,
              validTo: pickupAuth.endDate
            });
            return true;
          }
          
          return false;
        });
        
        return isAuthorized;
      }
      
      return false;
    }),
    allUsers,
    loadingAllUsers,
    // General loading state
    loading: loadingStudents || loadingAuthorizations || loadingHistory || loadingRecords || loadingAllUsers,
    error,
    refreshData,
    clearError,
    addPickupAuthorization,
    removePickupAuthorization,
    generateQRCode,
  };
}
