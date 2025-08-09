import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug: Checking staff collection...');
    
    // Get ALL staff documents without any filters or ordering
    const snapshot = await adminDb.collection('staff').get();
    
    console.log('📊 Total documents found:', snapshot.size);
    
    const allDocs = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        docId: doc.id,
        data: data,
        dataTypes: {
          name: typeof data.name,
          role: typeof data.role,
          walletAddress: typeof data.walletAddress,
          isActive: typeof data.isActive,
          createdAt: typeof data.createdAt,
          updatedAt: typeof data.updatedAt
        }
      };
    });
    
    return NextResponse.json({
      success: true,
      totalDocuments: snapshot.size,
      documents: allDocs,
      sampleDocument: allDocs[0] || null
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Debug staff failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
