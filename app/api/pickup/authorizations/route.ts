import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';

// TypeScript interfaces
interface PickupAuthorizationData {
  authorizedPickupId: string;
  blockchainHash: string;
  contractTxHash: string;
  parentId: string;
  signature: string;
  studentId: string;
  createdAt?: admin.firestore.FieldValue | admin.firestore.Timestamp;
  updatedAt?: admin.firestore.FieldValue | admin.firestore.Timestamp;
  isActive?: boolean;
}

interface PickupAuthorizationDocument extends PickupAuthorizationData {
  id: string;
}

// GET method - Read all pickup authorizations from the 'pickup_authorizations' collection
export async function GET(request: NextRequest) {
  try {
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');
    const studentId = searchParams.get('studentId');
    const authorizedPickupId = searchParams.get('authorizedPickupId');
    const isActive = searchParams.get('isActive');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query: any = adminDb.collection('pickup_authorizations');

    // Apply filters
    if (parentId) {
      query = query.where('parentId', '==', parentId.toLowerCase());
    }

    if (studentId) {
      query = query.where('studentId', '==', studentId);
    }

    if (authorizedPickupId) {
      query = query.where('authorizedPickupId', '==', authorizedPickupId.toLowerCase());
    }

    if (isActive !== null) {
      const activeValue = isActive === 'true';
      query = query.where('isActive', '==', activeValue);
    }

    // Apply pagination
    query = query.limit(limit).offset(offset);

    // Execute query
    const snapshot = await query.get();

    if (snapshot.empty) {
      return NextResponse.json({
        success: true,
        authorizations: [],
        total: 0,
        message: 'No pickup authorizations found'
      });
    }

    // Transform documents to PickupAuthorizationDocument format
    const authorizations: PickupAuthorizationDocument[] = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        authorizedPickupId: data.authorizedPickupId || '',
        blockchainHash: data.blockchainHash || '',
        contractTxHash: data.contractTxHash || '',
        parentId: data.parentId || '',
        signature: data.signature || '',
        studentId: data.studentId || '',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        isActive: data.isActive !== false // Default to true if not specified
      };
    });

    // Get total count for pagination
    const totalSnapshot = await adminDb.collection('pickup_authorizations').count().get();
    const total = totalSnapshot.data().count;

    return NextResponse.json({
      success: true,
      authorizations,
      total,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Error fetching pickup authorizations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST method - Add a new pickup authorization to the 'pickup_authorizations' collection
export async function POST(request: NextRequest) {
  try {
    const { 
      authorizedPickupId, 
      blockchainHash, 
      contractTxHash, 
      parentId, 
      signature, 
      studentId 
    } = await request.json();

    // Validate required fields
    if (!authorizedPickupId || !blockchainHash || !contractTxHash || !parentId || !signature || !studentId) {
      return NextResponse.json(
        { error: 'Missing required fields: authorizedPickupId, blockchainHash, contractTxHash, parentId, signature, and studentId are required' },
        { status: 400 }
      );
    }

    // Validate wallet address format (basic Ethereum address validation)
    const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethereumAddressRegex.test(authorizedPickupId)) {
      return NextResponse.json(
        { error: 'Invalid authorizedPickupId format' },
        { status: 400 }
      );
    }

    if (!ethereumAddressRegex.test(parentId)) {
      return NextResponse.json(
        { error: 'Invalid parentId format' },
        { status: 400 }
      );
    }

    // Validate blockchain hash format (basic hex validation)
    const hexRegex = /^0x[a-fA-F0-9]+$/;
    if (!hexRegex.test(blockchainHash)) {
      return NextResponse.json(
        { error: 'Invalid blockchainHash format' },
        { status: 400 }
      );
    }

    if (!hexRegex.test(contractTxHash)) {
      return NextResponse.json(
        { error: 'Invalid contractTxHash format' },
        { status: 400 }
      );
    }

    // Validate signature format
    if (!hexRegex.test(signature)) {
      return NextResponse.json(
        { error: 'Invalid signature format' },
        { status: 400 }
      );
    }

    // Validate studentId (non-empty string)
    if (typeof studentId !== 'string' || studentId.trim().length === 0) {
      return NextResponse.json(
        { error: 'StudentId must be a non-empty string' },
        { status: 400 }
      );
    }

    // Normalize wallet addresses
    const normalizedAuthorizedPickupId = authorizedPickupId.toLowerCase();
    const normalizedParentId = parentId.toLowerCase();

    // Check if parent exists in users collection
    const parentDoc = await adminDb.collection('users').doc(normalizedParentId).get();
    if (!parentDoc.exists) {
      return NextResponse.json(
        { error: 'Parent not found in users collection' },
        { status: 404 }
      );
    }

    // Check if student exists in students collection
    const studentDoc = await adminDb.collection('students').doc(studentId.trim()).get();
    if (!studentDoc.exists) {
      return NextResponse.json(
        { error: 'Student not found in students collection' },
        { status: 404 }
      );
    }

    // Check if authorization already exists for this parent-student combination
    const existingAuthQuery = await adminDb.collection('pickup_authorizations')
      .where('parentId', '==', normalizedParentId)
      .where('studentId', '==', studentId.trim())
      .where('authorizedPickupId', '==', normalizedAuthorizedPickupId)
      .get();

    if (!existingAuthQuery.empty) {
      return NextResponse.json(
        { error: 'Pickup authorization already exists for this parent-student-pickup combination' },
        { status: 409 }
      );
    }

    // Prepare authorization data
    const authorizationData: PickupAuthorizationData = {
      authorizedPickupId: normalizedAuthorizedPickupId,
      blockchainHash: blockchainHash.toLowerCase(),
      contractTxHash: contractTxHash.toLowerCase(),
      parentId: normalizedParentId,
      signature: signature.toLowerCase(),
      studentId: studentId.trim(),
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Create authorization document with auto-generated ID
    const authRef = adminDb.collection('pickup_authorizations').doc();
    await authRef.set(authorizationData);

    // Fetch the created authorization to return complete data
    const createdAuth = await authRef.get();
    const authDoc = createdAuth.data();

    return NextResponse.json({
      success: true,
      message: 'Pickup authorization created successfully',
      authorization: {
        id: authRef.id,
        authorizedPickupId: authDoc?.authorizedPickupId,
        blockchainHash: authDoc?.blockchainHash,
        contractTxHash: authDoc?.contractTxHash,
        parentId: authDoc?.parentId,
        signature: authDoc?.signature,
        studentId: authDoc?.studentId,
        isActive: authDoc?.isActive,
        createdAt: authDoc?.createdAt,
        updatedAt: authDoc?.updatedAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating pickup authorization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
