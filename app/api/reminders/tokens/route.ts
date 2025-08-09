import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET() {
  try {
    const parentsSnap = await adminDb
      .collection('users')
      .where('role', '==', 'parent')
      .get();

    const parents = parentsSnap.docs.map((doc) => {
      const data = doc.data() as any;
      const wallet: string = (data.wallet || '').toLowerCase();
      const token: string | undefined = data.fcmToken;
      return {
        wallet,
        name: data.name || null,
        hasToken: Boolean(token && token.length > 0),
        fcmToken: token || null,
      };
    });

    return NextResponse.json({ count: parents.length, parents });
  } catch (error) {
    console.error('Error listing parent FCM tokens:', error);
    return NextResponse.json({ error: 'Failed to list tokens' }, { status: 500 });
  }
}


