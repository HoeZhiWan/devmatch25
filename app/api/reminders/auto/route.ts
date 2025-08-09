import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr) return null;
  const s = timeStr.trim().toLowerCase().replace(/\./g, ':');
  const ampm = s.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/);
  if (ampm) {
    let h = parseInt(ampm[1], 10);
    const m = parseInt(ampm[2], 10);
    const mer = ampm[3];
    if (mer === 'pm' && h !== 12) h += 12;
    if (mer === 'am' && h === 12) h = 0;
    return h * 60 + m;
  }
  const hhmm = s.match(/^(\d{1,2}):(\d{2})$/);
  if (hhmm) {
    const h = parseInt(hhmm[1], 10);
    const m = parseInt(hhmm[2], 10);
    if (h >= 0 && h < 24 && m >= 0 && m < 60) return h * 60 + m;
  }
  return null;
}

function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export async function GET() {
  try {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    // Load config
    const configSnap = await adminDb.doc('reminders/config').get();
    const config = configSnap.data() || {};
    const targetMinutes = parseTimeToMinutes(config.finishSchoolTime || '');

    if (targetMinutes == null) {
      return NextResponse.json({ skipped: true, reason: 'Invalid or missing finishSchoolTime' });
    }

    if (nowMinutes < targetMinutes) {
      return NextResponse.json({ skipped: true, reason: 'Before target time' });
    }

    // Guard: only run once per day server-side
    const runsDoc = adminDb.collection('reminder_runs').doc(today);
    const already = await runsDoc.get();
    if (already.exists) {
      return NextResponse.json({ skipped: true, reason: 'Already ran today' });
    }

    // Build recipients
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
        parentName: wallet,
        studentsNames: childrenNames,
        walletAddress: wallet,
        status: isValidEthereumAddress(wallet) ? 'sent' as const : 'pending' as const,
        date: today,
      };
    });

    // Write logs and notifications
    const batch = adminDb.batch();
    const logsCol = adminDb.collection('reminder_logs');
    const notesCol = adminDb.collection('notifications');
    parents.forEach((log) => {
      batch.set(logsCol.doc(), log);
      if (log.status === 'sent') {
        batch.set(notesCol.doc(), {
          wallet: log.walletAddress,
          title: 'School Reminder',
          body: config.messageTemplate || '',
          status: 'unread',
          createdAt: Date.now(),
          studentsNames: log.studentsNames,
        });
      }
    });
    batch.set(runsDoc, { ranAt: Date.now() });
    await batch.commit();

    return NextResponse.json({ success: true, count: parents.length });
  } catch (error: any) {
    console.error('Auto reminder error:', error);
    return NextResponse.json({ error: error?.message || 'Auto failed' }, { status: 500 });
  }
}


