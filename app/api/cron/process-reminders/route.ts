import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from an authorized source (optional security)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all pending reminders using admin SDK
    const remindersSnapshot = await adminDb
      .collection('reminder-notifications')
      .where('status', '==', 'pending')
      .orderBy('scheduledFor', 'asc')
      .get();
    
    const pendingReminders = remindersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        studentId: data.studentId,
        parentWallet: data.parentWallet,
        studentName: data.studentName,
        parentName: data.parentName,
        message: data.message,
        scheduledFor: data.scheduledFor.toDate(),
        sentAt: data.sentAt ? data.sentAt.toDate() : undefined,
        status: data.status,
        type: data.type,
        createdAt: data.createdAt.toDate(),
      };
    });
    
    if (pendingReminders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending reminders to process',
        stats: { processed: 0, sent: 0, failed: 0 }
      });
    }

    const now = new Date();
    const currentTime = now.getTime();
    
    let sentCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    // Process each pending reminder
    for (const reminder of pendingReminders) {
      try {
        // Check if it's time to send the reminder
        if (reminder.scheduledFor.getTime() <= currentTime) {
          // In a real implementation, you would send the actual notification here
          // For now, we'll simulate sending by updating the status
          
          // Simulate sending notification (replace with actual notification service)
          const notificationSent = await simulateSendNotification(reminder);
          
          if (notificationSent) {
            await adminDb.collection('reminder-notifications').doc(reminder.id).update({
              status: 'sent',
              sentAt: Timestamp.now()
            });
            sentCount++;
          } else {
            await adminDb.collection('reminder-notifications').doc(reminder.id).update({
              status: 'failed'
            });
            failedCount++;
          }
        } else {
          // Reminder is scheduled for the future
          skippedCount++;
        }
      } catch (error) {
        console.error(`Error processing reminder ${reminder.id}:`, error);
        await adminDb.collection('reminder-notifications').doc(reminder.id).update({
          status: 'failed'
        });
        failedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Reminders processed successfully',
      stats: {
        total: pendingReminders.length,
        processed: sentCount + failedCount,
        sent: sentCount,
        failed: failedCount,
        skipped: skippedCount
      },
      timestamp: now.toISOString()
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Simulate sending notification (replace with actual notification service)
async function simulateSendNotification(reminder: any): Promise<boolean> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Simulate 95% success rate
  return Math.random() > 0.05;
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Reminder processing cron job is active',
    timestamp: new Date().toISOString()
  });
}
