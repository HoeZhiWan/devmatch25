import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const [parentsSnap, studentsSnap] = await Promise.all([
      adminDb.collection('users').where('role', '==', 'parent').get(),
      adminDb.collection('students').get(),
    ]);

    const students = studentsSnap.docs.map((d) => d.data() as any);

    const parentList = parentsSnap.docs.map((doc) => {
      const parent = doc.data() as any;
      const wallet: string = (parent.wallet || '').toLowerCase();

      const childrenNames = students
        .filter((s: any) => (s.parentId || '').toLowerCase() === wallet)
        .map((s: any) => s.name)
        .join(', ');

      return {
        parentName: wallet, // show wallet instead of parent name
        studentsNames: childrenNames,
        walletAddress: wallet,
        status: 'pending' as const,
        date: new Date().toISOString().slice(0, 10),
      };
    });

    return NextResponse.json(parentList);
  } catch (error) {
    console.error('Error fetching parents:', error);
    return NextResponse.json({ error: 'Failed to fetch parents' }, { status: 500 });
  }
}


