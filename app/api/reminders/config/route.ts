import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

const CONFIG_DOC_PATH = 'reminders/config';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const docSnap = await adminDb.doc(CONFIG_DOC_PATH).get();
    const data = docSnap.exists ? docSnap.data() : {};
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching reminder config:', error);
    const message = (error as any)?.message || 'Failed to fetch reminder config';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { finishSchoolTime, messageTemplate } = await request.json();

    await adminDb.doc(CONFIG_DOC_PATH).set({
      finishSchoolTime,
      messageTemplate,
      updatedAt: Date.now(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating reminder config:', error);
    const message = (error as any)?.message || 'Failed to update reminder config';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


