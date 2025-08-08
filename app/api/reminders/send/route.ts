import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

// Helper function to validate wallet address format
function isValidWalletAddress(address: string): boolean {
  // Basic Ethereum address validation
  const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  return ethereumAddressRegex.test(address);
}

export async function POST(request: NextRequest) {
  try {
    const { message, scheduledFor, createdBy } = await request.json();

    // Validate required fields
    if (!message || !scheduledFor || !createdBy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get all students
    const studentsSnapshot = await adminDb.collection('students').get();
    const students = studentsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        parentWallet: data.parentWallet,
        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
      };
    });
    
    if (students.length === 0) {
      return NextResponse.json(
        { error: 'No students found in the system' },
        { status: 404 }
      );
    }

    // Get active school schedule for context
    const scheduleSnapshot = await adminDb
      .collection('school-schedules')
      .where('isActive', '==', true)
      .limit(1)
      .get();
    
    let schoolName = 'School';
    if (!scheduleSnapshot.empty) {
      const scheduleData = scheduleSnapshot.docs[0].data();
      schoolName = scheduleData.schoolName;
    }

    // Get all parents (from both parents and users collections)
    const allParents = new Map<string, { name: string, status: 'valid' | 'invalid_address' | 'no_wallet' }>();
    
    // Get parents from "parents" collection
    const parentsSnapshot = await adminDb.collection('parents').get();
    parentsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const wallet = data.wallet?.toLowerCase() || '';
      const name = data.name || 'Unknown Parent';
      
      let status: 'valid' | 'invalid_address' | 'no_wallet' = 'valid';
      if (!wallet || wallet === '') {
        status = 'no_wallet';
      } else if (!isValidWalletAddress(wallet)) {
        status = 'invalid_address';
      }
      
      allParents.set(wallet, { name, status });
    });

    // Get users with role "parent" from "users" collection (takes precedence)
    const usersSnapshot = await adminDb.collection('users').where('role', '==', 'parent').get();
    usersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const wallet = data.wallet?.toLowerCase() || '';
      const name = data.name || 'Unknown Parent';
      
      let status: 'valid' | 'invalid_address' | 'no_wallet' = 'valid';
      if (!wallet || wallet === '') {
        status = 'no_wallet';
      } else if (!isValidWalletAddress(wallet)) {
        status = 'invalid_address';
      }
      
      allParents.set(wallet, { name, status });
    });

    // Filter students with valid parent wallets (only send to valid addresses)
    const validStudents = students.filter(student => {
      if (!student.parentWallet) return false;
      const parentInfo = allParents.get(student.parentWallet.toLowerCase());
      return parentInfo && parentInfo.status === 'valid';
    });
    
    if (validStudents.length === 0) {
      return NextResponse.json(
        { error: 'No students found with valid parent wallets' },
        { status: 404 }
      );
    }

    // Create reminder notifications for each student's parent
    const reminderPromises = validStudents.map(async (student) => {
      const parentInfo = allParents.get(student.parentWallet.toLowerCase());
      const parentName = parentInfo?.name || 'Parent';

      // Process template variables
      let reminderMessage = message || `🔔 Reminder: It's time to pick up ${student.name} from ${schoolName}! Please arrive at the pickup area.`;
      
      // Replace template variables with actual values
      const templateReplacements = {
        '{parentName}': parentName,
        '{childName}': student.name,
        '{schoolName}': schoolName,
        '{finishTime}': scheduleSnapshot.empty ? 'finish time' : scheduleSnapshot.docs[0].data().finishTime,
        '{pickupLocation}': 'Main Entrance'
      };
      
      Object.entries(templateReplacements).forEach(([variable, value]) => {
        reminderMessage = reminderMessage.replace(new RegExp(variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
      });
      
      const notificationDoc = adminDb.collection('reminder-notifications').doc();
      await notificationDoc.set({
        studentId: student.id,
        parentWallet: student.parentWallet.toLowerCase(),
        studentName: student.name,
        parentName: parentName,
        message: reminderMessage,
        scheduledFor: Timestamp.fromDate(new Date(scheduledFor)),
        status: 'pending',
        type: 'pickup_reminder',
        createdAt: Timestamp.now(),
        id: notificationDoc.id,
      });
      
      return notificationDoc.id;
    });

    const results = await Promise.all(reminderPromises);
    const successfulReminders = results.filter(id => id !== null).length;
    const failedReminders = validStudents.length - successfulReminders;

    return NextResponse.json({
      success: true,
      message: `Reminders created successfully`,
      stats: {
        total: validStudents.length,
        successful: successfulReminders,
        failed: failedReminders
      }
    });

  } catch (error) {
    console.error('Reminder creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
