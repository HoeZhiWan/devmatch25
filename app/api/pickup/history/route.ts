import { NextRequest, NextResponse } from 'next/server';
import { getAllPickupHistory, getStudentById } from '@/lib/firebase/server-collections';

export async function GET(request: NextRequest) {
  try {
    // Optional filters (not yet applied): wallet, limit, date range
    // const searchParams = request.nextUrl.searchParams;

    const rawHistory = await getAllPickupHistory();

    // Enrich with student names and normalized ISO time
    const history = await Promise.all(
      rawHistory.map(async (rec) => {
        const student = await getStudentById(rec.studentId);
        let isoTime = '';
        try {
          if (rec.time instanceof Date) {
            isoTime = rec.time.toISOString();
          } else if (rec.time && typeof (rec.time as any)?.toDate === 'function') {
            isoTime = (rec.time as any).toDate().toISOString();
          } else if (rec.time) {
            const d = new Date(rec.time as any);
            isoTime = isNaN(d.getTime()) ? '' : d.toISOString();
          }
        } catch {
          isoTime = '';
        }
        return {
          id: rec.id,
          blockchainHash: rec.blockchainHash,
          contractTxHash: rec.contractTxHash,
          pickupBy: rec.pickupBy,
          staffId: rec.staffId,
          studentId: rec.studentId,
          studentName: student?.name || rec.studentId,
          time: isoTime,
        };
      })
    );

    return NextResponse.json({ success: true, history });
  } catch (error) {
    console.error('Error fetching pickup history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}