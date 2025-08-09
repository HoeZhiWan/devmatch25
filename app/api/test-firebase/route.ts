import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Firebase connection...');
    
    // Test basic connection
    const testRef = adminDb.collection('test').doc('connection-test');
    await testRef.set({ 
      timestamp: new Date(),
      test: 'Firebase connection successful'
    });
    
    console.log('✅ Firebase write test successful');
    
    // Test reading staff collection
    const staffCollection = adminDb.collection('staff');
    const staffSnapshot = await staffCollection.limit(1).get();
    
    console.log('📊 Staff collection exists:', !staffSnapshot.empty);
    console.log('📊 Staff collection size:', staffSnapshot.size);
    
    // List all collections
    const collections = await adminDb.listCollections();
    const collectionNames = collections.map(col => col.id);
    
    console.log('📋 Available collections:', collectionNames);
    
    return NextResponse.json({
      success: true,
      firebase: 'connected',
      staffCollectionExists: !staffSnapshot.empty,
      staffCount: staffSnapshot.size,
      availableCollections: collectionNames,
      environment: {
        projectId: process.env.FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? '✅ Set' : '❌ Missing', 
        privateKey: process.env.FIREBASE_PRIVATE_KEY ? '✅ Set' : '❌ Missing'
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Firebase test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      environment: {
        projectId: process.env.FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? '✅ Set' : '❌ Missing',
        privateKey: process.env.FIREBASE_PRIVATE_KEY ? '✅ Set' : '❌ Missing'
      }
    }, { status: 500 });
  }
}
