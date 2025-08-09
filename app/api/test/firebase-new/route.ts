import { NextRequest, NextResponse } from 'next/server';
import { 
  createUser,
  createStudent,
  addPickupPersonToParent,
  createAuthorizationRecord,
  createPickupHistory,
  getUserById,
  getStudentById
} from '@/lib/firebase/server-collections';
import { 
  generateQRHash,
  generateQRCodeId,
  calculateExpirationTime,
  generateBlockchainHash,
  generateContractTxHash
} from '@/lib/firebase/qr-utils';

/**
 * GET /api/test/firebase-new
 * Tests the new Firebase collections and operations
 */
export async function GET() {
  try {
    const testResults: any[] = [];

    // Test 1: Create a test parent user
    testResults.push('=== Testing User Creation ===');
    const parentWallet = '0x' + Math.random().toString(16).slice(2, 42).padStart(40, '0');
    const createUserResult = await createUser({
      id: parentWallet.toLowerCase(),
      walletAddress: parentWallet,
      name: 'Test Parent',
      contactNumber: '+1234567890',
      role: 'parent',
    });
    testResults.push(`Create parent user: ${createUserResult ? '✅ SUCCESS' : '❌ FAILED'}`);

    // Test 2: Create a test student
    testResults.push('=== Testing Student Creation ===');
    const studentId = 'TEST001';
    const createStudentResult = await createStudent({
      id: studentId,
      name: 'Test Student',
      grade: 'Grade 5',
      parentId: parentWallet.toLowerCase(),
    });
    testResults.push(`Create student: ${createStudentResult ? '✅ SUCCESS' : '❌ FAILED'}`);

    // Test 3: Add pickup person authorization
    testResults.push('=== Testing Pickup Authorization ===');
    const pickupWallet = '0x' + Math.random().toString(16).slice(2, 42).padStart(40, '0');
    const addPickupResult = await addPickupPersonToParent(parentWallet, pickupWallet, {
      walletAddress: pickupWallet.toLowerCase(),
      relationship: 'Uncle',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    });
    testResults.push(`Add pickup authorization: ${addPickupResult ? '✅ SUCCESS' : '❌ FAILED'}`);

    // Test 4: Generate QR code authorization
    testResults.push('=== Testing QR Code Generation ===');
    const qrCodeId = generateQRCodeId();
    const timestamp = Date.now();
    const hash = generateQRHash(studentId, pickupWallet, timestamp);
    const expiresAt = calculateExpirationTime(5);

    const authRecordId = await createAuthorizationRecord({
      qrCodeId,
      hash,
      studentId,
      pickupWallet: pickupWallet.toLowerCase(),
      parentWallet: parentWallet.toLowerCase(),
      expiresAt,
      isUsed: false,
      isActive: true,
    });
    testResults.push(`Create authorization record: ${authRecordId ? '✅ SUCCESS' : '❌ FAILED'}`);

    // Test 5: Create pickup history
    testResults.push('=== Testing Pickup History ===');
    const staffWallet = '0x' + Math.random().toString(16).slice(2, 42).padStart(40, '0');
    const blockchainHash = generateBlockchainHash();
    const contractTxHash = generateContractTxHash();

    const pickupHistoryId = await createPickupHistory({
      blockchainHash,
      contractTxHash,
      pickupBy: pickupWallet.toLowerCase(),
      staffId: staffWallet.toLowerCase(),
      studentId,
    });
    testResults.push(`Create pickup history: ${pickupHistoryId ? '✅ SUCCESS' : '❌ FAILED'}`);

    // Test 6: Read data back
    testResults.push('=== Testing Data Retrieval ===');
    const retrievedUser = await getUserById(parentWallet);
    const retrievedStudent = await getStudentById(studentId);

    testResults.push(`Retrieve user: ${retrievedUser ? '✅ SUCCESS' : '❌ FAILED'}`);
    testResults.push(`Retrieve student: ${retrievedStudent ? '✅ SUCCESS' : '❌ FAILED'}`);

    // Test results summary
    testResults.push('=== Test Summary ===');
    testResults.push(`Parent Wallet: ${parentWallet}`);
    testResults.push(`Student ID: ${studentId}`);
    testResults.push(`Pickup Wallet: ${pickupWallet}`);
    testResults.push(`Staff Wallet: ${staffWallet}`);
    testResults.push(`QR Code ID: ${qrCodeId}`);
    testResults.push(`Hash: ${hash}`);
    testResults.push(`Authorization Record ID: ${authRecordId}`);
    testResults.push(`Pickup History ID: ${pickupHistoryId}`);

    if (retrievedUser) {
      testResults.push(`User Data: ${JSON.stringify(retrievedUser, null, 2)}`);
    }

    if (retrievedStudent) {
      testResults.push(`Student Data: ${JSON.stringify(retrievedStudent, null, 2)}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Firebase new collections test completed',
      results: testResults,
    });

  } catch (error) {
    console.error('Error testing new Firebase collections:', error);
    return NextResponse.json(
      { 
        error: 'Firebase test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
