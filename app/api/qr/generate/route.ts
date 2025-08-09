import { NextRequest, NextResponse } from 'next/server';
import { 
  createAuthorizationRecord,
  getUserById,
  getStudentById
} from '@/lib/firebase/server-collections';
import { 
  generateQRHash,
  generateQRCodeId,
  createQRCodeContent,
  encodeQRContent,
  calculateExpirationTime
} from '@/lib/firebase/qr-utils';
import { verifyIdToken, validatePickupAuthorization } from '@/lib/firebase/auth';

/**
 * POST /api/qr/generate
 * Generates a new QR code for pickup authorization
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, idToken } = body;

    // Validate required fields
    if (!studentId || !idToken) {
      return NextResponse.json(
        { error: 'Student ID and ID token are required' },
        { status: 400 }
      );
    }

    // Verify the user's Firebase ID token
    const decodedToken = await verifyIdToken(idToken);
    if (!decodedToken) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const pickupWallet = decodedToken.wallet;

    // Get pickup person user data
    const pickupUser = await getUserById(pickupWallet);
    if (!pickupUser) {
      return NextResponse.json(
        { error: 'Pickup person not found' },
        { status: 404 }
      );
    }

    // Get student data
    const student = await getStudentById(studentId);
    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Validate pickup authorization
    const authResult = await validatePickupAuthorization(
      student.parentId,
      pickupWallet,
      studentId
    );

    if (!authResult.authorized) {
      return NextResponse.json(
        { error: 'Not authorized to pick up this student' },
        { status: 403 }
      );
    }

    // Generate QR code components
    const qrCodeId = generateQRCodeId();
    const timestamp = Date.now();
    const hash = generateQRHash(studentId, pickupWallet, timestamp);
    const expiresAt = calculateExpirationTime(5); // 5 minutes

    // Create authorization record
    const authorizationId = await createAuthorizationRecord({
      qrCodeId,
      hash,
      studentId,
      pickupWallet,
      parentWallet: student.parentId,
      expiresAt,
      isUsed: false,
      isActive: true,
    });

    if (!authorizationId) {
      return NextResponse.json(
        { error: 'Failed to create authorization record' },
        { status: 500 }
      );
    }

    // Create QR code content
    const qrContent = createQRCodeContent(authorizationId, hash);
    const qrCodeData = encodeQRContent(qrContent);

    return NextResponse.json({
      success: true,
      data: {
        qrCodeData,
        authorizationId,
        studentName: student.name,
        expiresAt: expiresAt.toISOString(),
        relationship: authResult.relationship,
      },
    });

  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
