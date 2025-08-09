import { NextRequest, NextResponse } from 'next/server';
import { 
  verifyAuthorizationRecord,
  markAuthorizationRecordAsUsed,
  createPickupHistory,
  getStudentById
} from '@/lib/firebase/server-collections';
import { 
  parseQRCodeContent,
  validateQRCodeFormat,
  generateBlockchainHash,
  generateContractTxHash
} from '@/lib/firebase/qr-utils';
import { verifyIdToken } from '@/lib/firebase/auth';

/**
 * POST /api/qr/verify
 * Verifies a scanned QR code and processes pickup
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { qrCodeData, idToken, selectedStudentId, verifyOnly = false, confirmPickup = false } = body;

    // Validate required fields
    if (!qrCodeData || !idToken) {
      return NextResponse.json(
        { error: 'QR code data and ID token are required' },
        { status: 400 }
      );
    }

    // Verify the staff's Firebase ID token
    const decodedToken = await verifyIdToken(idToken);
    if (!decodedToken) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Check if user is staff
    if (decodedToken.role !== 'staff') {
      return NextResponse.json(
        { error: 'Only staff members can verify pickups' },
        { status: 403 }
      );
    }

    const staffWallet = decodedToken.wallet;

    // Validate QR code format
    if (!validateQRCodeFormat(qrCodeData)) {
      return NextResponse.json(
        { error: 'Invalid QR code format' },
        { status: 400 }
      );
    }

    // Parse QR code content
    const qrContent = parseQRCodeContent(qrCodeData);
    if (!qrContent) {
      return NextResponse.json(
        { error: 'Unable to parse QR code content' },
        { status: 400 }
      );
    }

    // Verify authorization record
    const verificationResult = await verifyAuthorizationRecord(
      qrContent.id,
      qrContent.hash
    );

    if (!verificationResult.valid || !verificationResult.record) {
      const errorMessages = {
        expired: 'QR code has expired',
        used: 'QR code has already been used',
        invalid: 'Invalid or inactive QR code',
      };

      let errorType = 'invalid';
      if (verificationResult.record) {
        if (new Date() >= verificationResult.record.expiresAt) {
          errorType = 'expired';
        } else if (verificationResult.record.isUsed) {
          errorType = 'used';
        }
      }

      return NextResponse.json(
        { 
          error: errorMessages[errorType as keyof typeof errorMessages],
          status: errorType 
        },
        { status: 400 }
      );
    }

    const authRecord = verificationResult.record;

    // Get student information
    const student = await getStudentById(authRecord.studentId);
    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Additional validation: Check if QR code is for the selected student
    if (selectedStudentId && authRecord.studentId !== selectedStudentId) {
      return NextResponse.json(
        { 
          error: `QR code is for student "${student.name}" (${authRecord.studentId}), but you selected a different student. Please select the correct student or scan the right QR code.`,
          qrStudentId: authRecord.studentId,
          qrStudentName: student.name,
          selectedStudentId 
        },
        { status: 400 }
      );
    }

    // If this is verification only, return details without recording pickup
    if (verifyOnly) {
      return NextResponse.json({
        success: true,
        data: {
          studentId: authRecord.studentId,
          studentName: student.name,
          studentGrade: student.grade,
          pickupWallet: authRecord.pickupWallet,
          parentWallet: authRecord.parentWallet,
          authorizationId: authRecord.id,
          expiresAt: authRecord.expiresAt.toISOString(),
          relationship: 'Authorized Person', // This could be enhanced with actual relationship data
          authorizationDetails: {
            startDate: authRecord.generatedAt,
            endDate: authRecord.expiresAt,
          },
          verified: true,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // If confirmPickup is true, proceed with recording the pickup
    if (confirmPickup) {
      // Mark authorization record as used
      const markUsedSuccess = await markAuthorizationRecordAsUsed(authRecord.id);
      if (!markUsedSuccess) {
        return NextResponse.json(
          { error: 'Failed to mark authorization as used' },
          { status: 500 }
        );
      }

      // Generate blockchain hashes (placeholders for now)
      const blockchainHash = generateBlockchainHash();
      const contractTxHash = generateContractTxHash();

      // Create pickup history record
      const pickupHistoryId = await createPickupHistory({
        blockchainHash,
        contractTxHash,
        pickupBy: authRecord.pickupWallet,
        staffId: staffWallet,
        studentId: authRecord.studentId,
      });

      if (!pickupHistoryId) {
        return NextResponse.json(
          { error: 'Failed to create pickup history record' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          pickupHistoryId,
          studentName: student.name,
          studentGrade: student.grade,
          pickupBy: authRecord.pickupWallet,
          staffId: staffWallet,
          timestamp: new Date().toISOString(),
          blockchainHash,
          contractTxHash,
        },
      });
    }

    // Default behavior (for backward compatibility) - verify and record pickup
    // Mark authorization record as used
    const markUsedSuccess = await markAuthorizationRecordAsUsed(authRecord.id);
    if (!markUsedSuccess) {
      return NextResponse.json(
        { error: 'Failed to mark authorization as used' },
        { status: 500 }
      );
    }

    // Generate blockchain hashes (placeholders for now)
    const blockchainHash = generateBlockchainHash();
    const contractTxHash = generateContractTxHash();

    // Create pickup history record
    const pickupHistoryId = await createPickupHistory({
      blockchainHash,
      contractTxHash,
      pickupBy: authRecord.pickupWallet,
      staffId: staffWallet,
      studentId: authRecord.studentId,
    });

    if (!pickupHistoryId) {
      return NextResponse.json(
        { error: 'Failed to create pickup history record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        pickupHistoryId,
        studentName: student.name,
        studentGrade: student.grade,
        pickupBy: authRecord.pickupWallet,
        staffId: staffWallet,
        timestamp: new Date().toISOString(),
        blockchainHash,
        contractTxHash,
      },
    });

  } catch (error) {
    console.error('Error verifying QR code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
