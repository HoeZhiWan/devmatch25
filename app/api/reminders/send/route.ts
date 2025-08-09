import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export async function POST(request: NextRequest) {
  try {
    const configSnap = await adminDb.doc('reminders/config').get();
    const config = configSnap.data() || {};
    const messageTemplate: string = config.messageTemplate || '';

    const [parentsSnap, studentsSnap] = await Promise.all([
      adminDb.collection('users').where('role', '==', 'parent').get(),
      adminDb.collection('students').get(),
    ]);
    const students = studentsSnap.docs.map((d) => d.data() as any);

    const parents = parentsSnap.docs.map((doc) => {
      const parent = doc.data() as any;
      const wallet: string = (parent.wallet || '').toLowerCase();
      const childrenNames = students
        .filter((s: any) => (s.parentId || '').toLowerCase() === wallet)
        .map((s: any) => s.name)
        .join(', ');
      return {
        parentName: wallet, // match UI mapping key
        studentsNames: childrenNames,
        walletAddress: wallet,
        status: 'pending' as const,
        date: new Date().toISOString().slice(0, 10),
        fcmToken: parent.fcmToken || '',
      };
    });

    const results = parents.map((parent) => {
      const isValid = isValidEthereumAddress(parent.walletAddress);
      return { ...parent, status: isValid ? 'sent' as const : 'pending' as const };
    });

    // Store logs
    const batch = adminDb.batch();
    const logsCollection = adminDb.collection('reminder_logs');
    const notificationsCollection = adminDb.collection('notifications');
    results.forEach((log) => {
      const logRef = logsCollection.doc();
      batch.set(logRef, log);
      if (log.status === 'sent') {
        const noteRef = notificationsCollection.doc();
        batch.set(noteRef, {
          wallet: log.walletAddress,
          title: 'School Reminder',
          body: messageTemplate,
          status: 'unread',
          createdAt: Date.now(),
          studentsNames: log.studentsNames,
        });
      }
    });
    await batch.commit();

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Error sending reminders:', error);
    const message = typeof error?.message === 'string' ? error.message : 'Failed to send reminders';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


