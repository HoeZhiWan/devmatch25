import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    // Get all reminder notifications
    const notificationsSnapshot = await adminDb
      .collection('reminder-notifications')
      .orderBy('createdAt', 'desc')
      .get();

    const statuses = notificationsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        parentName: data.parentName || 'Parent',
        studentName: data.studentName || 'Student',
        status: data.status || 'pending',
        scheduledFor: data.scheduledFor ? data.scheduledFor.toDate().toISOString() : null,
        sentAt: data.sentAt ? data.sentAt.toDate().toISOString() : null,
        message: data.message || '',
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
      };
    });

    return NextResponse.json({
      success: true,
      statuses: statuses
    });

  } catch (error) {
    console.error('Error fetching reminder statuses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

