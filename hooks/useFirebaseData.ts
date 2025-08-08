'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from './useWallet';
import { useFirebaseAuth } from './useFirebaseAuth';
import * as firebase from '@/lib/firebase/collections';
import type { Student, Authorization, PickupLog, QRCodeData } from '@/types/database';

interface FirebaseDataState {
  students: Student[];
  authorizations: Authorization[];
  pickupLogs: PickupLog[];
  qrCodes: QRCodeData[];
  loading: boolean;
  error: string | null;
}

export const useFirebaseData = () => {
  const { address, isConnected } = useWallet();
  const { user } = useFirebaseAuth();
  
  const [state, setState] = useState<FirebaseDataState>({
    students: [],
    authorizations: [],
    pickupLogs: [],
    qrCodes: [],
    loading: false,
    error: null,
  });

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }));
  };

  // Load students based on user role
  const loadStudents = useCallback(async () => {
    if (!isConnected || !address) return;

    setLoading(true);
    setError(null);

    try {
      let students: Student[] = [];
      
      if (user?.role === 'parent') {
        students = await firebase.getStudentsByParent(address);
      } else if (user?.role === 'staff') {
        students = await firebase.getAllStudents();
      }

      setState(prev => ({ ...prev, students }));
    } catch (error) {
      console.error('Error loading students:', error);
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [isConnected, address, user?.role]);

  // Load authorizations based on user role
  const loadAuthorizations = useCallback(async () => {
    if (!isConnected || !address) return;

    setLoading(true);
    setError(null);

    try {
      let authorizations: Authorization[] = [];
      
      if (user?.role === 'parent') {
        authorizations = await firebase.getAuthorizationsByParent(address);
      } else if (user?.role === 'pickup') {
        authorizations = await firebase.getAuthorizationsByPickupWallet(address);
      }

      setState(prev => ({ ...prev, authorizations }));
    } catch (error) {
      console.error('Error loading authorizations:', error);
      setError('Failed to load authorizations');
    } finally {
      setLoading(false);
    }
  }, [isConnected, address, user?.role]);

  // Load pickup logs based on user role
  const loadPickupLogs = useCallback(async () => {
    if (!isConnected || !address) return;

    setLoading(true);
    setError(null);

    try {
      let pickupLogs: PickupLog[] = [];
      
      if (user?.role === 'staff') {
        pickupLogs = await firebase.getAllPickupLogs();
      } else if (user?.role === 'parent') {
        // Get logs for all students of this parent
        const students = await firebase.getStudentsByParent(address);
        const allLogs: PickupLog[] = [];
        for (const student of students) {
          const logs = await firebase.getPickupLogsByStudent(student.id);
          allLogs.push(...logs);
        }
        pickupLogs = allLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      }

      setState(prev => ({ ...prev, pickupLogs }));
    } catch (error) {
      console.error('Error loading pickup logs:', error);
      setError('Failed to load pickup logs');
    } finally {
      setLoading(false);
    }
  }, [isConnected, address, user?.role]);

  // Create new student
  const createStudent = useCallback(async (studentData: Omit<Student, 'createdAt'>) => {
    setLoading(true);
    setError(null);

    try {
      const success = await firebase.createStudent(studentData);
      if (success) {
        await loadStudents(); // Refresh the list
        return true;
      } else {
        setError('Failed to create student');
        return false;
      }
    } catch (error) {
      console.error('Error creating student:', error);
      setError('Failed to create student');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadStudents]);

  // Create new authorization
  const createAuthorization = useCallback(async (authData: Omit<Authorization, 'id' | 'createdAt'>) => {
    setLoading(true);
    setError(null);

    try {
      const authId = await firebase.createAuthorization(authData);
      if (authId) {
        await loadAuthorizations(); // Refresh the list
        return authId;
      } else {
        setError('Failed to create authorization');
        return null;
      }
    } catch (error) {
      console.error('Error creating authorization:', error);
      setError('Failed to create authorization');
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadAuthorizations]);

  // Create QR code
  const createQRCode = useCallback(async (qrData: Omit<QRCodeData, 'generatedAt'>) => {
    setLoading(true);
    setError(null);

    try {
      const success = await firebase.createQRCode(qrData);
      if (success) {
        return true;
      } else {
        setError('Failed to create QR code');
        return false;
      }
    } catch (error) {
      console.error('Error creating QR code:', error);
      setError('Failed to create QR code');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create pickup log
  const createPickupLog = useCallback(async (logData: Omit<PickupLog, 'timestamp'>) => {
    setLoading(true);
    setError(null);

    try {
      const success = await firebase.createPickupLog(logData);
      if (success) {
        await loadPickupLogs(); // Refresh the list
        return true;
      } else {
        setError('Failed to create pickup log');
        return false;
      }
    } catch (error) {
      console.error('Error creating pickup log:', error);
      setError('Failed to create pickup log');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadPickupLogs]);

  // Update authorization status
  const updateAuthorizationStatus = useCallback(async (authId: string, isActive: boolean) => {
    setLoading(true);
    setError(null);

    try {
      const success = await firebase.updateAuthorizationStatus(authId, isActive);
      if (success) {
        await loadAuthorizations(); // Refresh the list
        return true;
      } else {
        setError('Failed to update authorization');
        return false;
      }
    } catch (error) {
      console.error('Error updating authorization:', error);
      setError('Failed to update authorization');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadAuthorizations]);

  // Mark QR code as used
  const markQRCodeAsUsed = useCallback(async (qrCodeId: string) => {
    setLoading(true);
    setError(null);

    try {
      const success = await firebase.markQRCodeAsUsed(qrCodeId);
      if (success) {
        return true;
      } else {
        setError('Failed to mark QR code as used');
        return false;
      }
    } catch (error) {
      console.error('Error marking QR code as used:', error);
      setError('Failed to mark QR code as used');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get QR code by ID
  const getQRCodeById = useCallback(async (qrCodeId: string) => {
    setLoading(true);
    setError(null);

    try {
      const qrCode = await firebase.getQRCodeById(qrCodeId);
      return qrCode;
    } catch (error) {
      console.error('Error getting QR code:', error);
      setError('Failed to get QR code');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get authorization by ID
  const getAuthorizationById = useCallback(async (authId: string) => {
    setLoading(true);
    setError(null);

    try {
      const authorization = await firebase.getAuthorizationById(authId);
      return authorization;
    } catch (error) {
      console.error('Error getting authorization:', error);
      setError('Failed to get authorization');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get student by ID
  const getStudentById = useCallback(async (studentId: string) => {
    setLoading(true);
    setError(null);

    try {
      const student = await firebase.getStudentById(studentId);
      return student;
    } catch (error) {
      console.error('Error getting student:', error);
      setError('Failed to get student');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data based on user role
  useEffect(() => {
    if (isConnected && address && user?.role) {
      loadStudents();
      loadAuthorizations();
      loadPickupLogs();
    }
  }, [isConnected, address, user?.role, loadStudents, loadAuthorizations, loadPickupLogs]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Data
    students: state.students,
    authorizations: state.authorizations,
    pickupLogs: state.pickupLogs,
    qrCodes: state.qrCodes,
    
    // State
    loading: state.loading,
    error: state.error,
    
    // Actions
    createStudent,
    createAuthorization,
    createQRCode,
    createPickupLog,
    updateAuthorizationStatus,
    markQRCodeAsUsed,
    getQRCodeById,
    getAuthorizationById,
    getStudentById,
    
    // Utilities
    clearError,
    loadStudents,
    loadAuthorizations,
    loadPickupLogs,
  };
};
