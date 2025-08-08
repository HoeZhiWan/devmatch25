import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const { schoolName, finishTime, timezone, createdBy } = await request.json();

    // Validate required fields
    if (!schoolName || !finishTime || !timezone || !createdBy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate time format (HH:mm)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(finishTime)) {
      return NextResponse.json(
        { error: 'Invalid time format. Use HH:mm (24-hour format)' },
        { status: 400 }
      );
    }

    // Deactivate any existing active schedule
    const existingSchedulesSnapshot = await adminDb
      .collection('school-schedules')
      .where('isActive', '==', true)
      .get();
    
    for (const doc of existingSchedulesSnapshot.docs) {
      await doc.ref.update({ isActive: false });
    }

    // Create new schedule
    const scheduleDoc = adminDb.collection('school-schedules').doc();
    await scheduleDoc.set({
      schoolName,
      finishTime,
      timezone,
      isActive: true,
      createdBy: createdBy.toLowerCase(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      id: scheduleDoc.id,
    });
    
    const scheduleId = scheduleDoc.id;

    if (!scheduleId) {
      return NextResponse.json(
        { error: 'Failed to create school schedule' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      scheduleId,
      message: 'School schedule created successfully'
    });

  } catch (error) {
    console.error('Schedule creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Simple approach: just get the first active schedule
    const scheduleSnapshot = await adminDb
      .collection('school-schedules')
      .where('isActive', '==', true)
      .limit(1)
      .get();
    
    let schedule = null;
    if (!scheduleSnapshot.empty) {
      const doc = scheduleSnapshot.docs[0];
      const data = doc.data();
      schedule = {
        id: doc.id,
        schoolName: data.schoolName,
        finishTime: data.finishTime,
        timezone: data.timezone,
        isActive: data.isActive,
        createdBy: data.createdBy,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      };
    }
    
    return NextResponse.json({
      success: true,
      schedule
    });

  } catch (error) {
    console.error('Schedule retrieval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
