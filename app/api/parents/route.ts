import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';

// TypeScript interfaces
interface ParentData {
  name: string;
  contactNumber: string;
  studentIds: string[];
  walletAddress: string;
  createdAt?: admin.firestore.Timestamp;
  updatedAt?: admin.firestore.Timestamp;
  isActive?: boolean;
}

interface ParentDocument extends ParentData {
  id: string;
}

// GET method - Read all parents from the 'parents' collection
export async function GET(request: NextRequest) {
  try {
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');
    const isActive = searchParams.get('isActive');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = adminDb.collection('parents');

    // Apply filters
    if (walletAddress) {
      query = query.where('walletAddress', '==', walletAddress.toLowerCase());
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
        parents: [],
        total: 0,
        message: 'No parents found'
      });
    }

    // Transform documents to ParentDocument format
    const parents: ParentDocument[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        contactNumber: data.contactNumber || '',
        studentIds: data.studentIds || [],
        walletAddress: data.walletAddress || '',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        isActive: data.isActive !== false // Default to true if not specified
      };
    });

    // Get total count for pagination
    const totalSnapshot = await adminDb.collection('parents').count().get();
    const total = totalSnapshot.data().count;

    return NextResponse.json({
      success: true,
      parents,
      total,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Error fetching parents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST method - Add a new parent to the 'parents' collection
export async function POST(request: NextRequest) {
  try {
    const { name, contactNumber, studentIds, walletAddress } = await request.json();

    // Validate required fields
    if (!name || !contactNumber || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: name, contactNumber, and walletAddress are required' },
        { status: 400 }
      );
    }

    // Validate name (non-empty string)
    if (typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name must be a non-empty string' },
        { status: 400 }
      );
    }

    // Validate contact number (non-empty string)
    if (typeof contactNumber !== 'string' || contactNumber.trim().length === 0) {
      return NextResponse.json(
        { error: 'Contact number must be a non-empty string' },
        { status: 400 }
      );
    }

    // Validate wallet address format (basic Ethereum address validation)
    const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethereumAddressRegex.test(walletAddress)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    // Validate studentIds (must be an array)
    if (studentIds && !Array.isArray(studentIds)) {
      return NextResponse.json(
        { error: 'StudentIds must be an array' },
        { status: 400 }
      );
    }

    // Normalize wallet address
    const normalizedWalletAddress = walletAddress.toLowerCase();

    // Check if parent already exists with this wallet address
    const existingParentQuery = await adminDb.collection('parents')
      .where('walletAddress', '==', normalizedWalletAddress)
      .get();

    if (!existingParentQuery.empty) {
      return NextResponse.json(
        { error: 'Parent with this wallet address already exists' },
        { status: 409 }
      );
    }

    // Check if wallet address is already used in users collection
    const existingUser = await adminDb.collection('users').doc(normalizedWalletAddress).get();
    if (existingUser.exists) {
      return NextResponse.json(
        { error: 'Wallet address is already registered as a user' },
        { status: 409 }
      );
    }

    // Validate student IDs if provided
    if (studentIds && studentIds.length > 0) {
      for (const studentId of studentIds) {
        if (typeof studentId !== 'string' || studentId.trim().length === 0) {
          return NextResponse.json(
            { error: 'All student IDs must be non-empty strings' },
            { status: 400 }
          );
        }

        // Check if student exists in students collection
        const studentDoc = await adminDb.collection('students').doc(studentId.trim()).get();
        if (!studentDoc.exists) {
          return NextResponse.json(
            { error: `Student with ID '${studentId}' not found` },
            { status: 404 }
          );
        }
      }
    }

    // Prepare parent data
    const parentData: ParentData = {
      name: name.trim(),
      contactNumber: contactNumber.trim(),
      studentIds: studentIds ? studentIds.map((id: string) => id.trim()) : [],
      walletAddress: normalizedWalletAddress,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Create parent document with auto-generated ID
    const parentRef = adminDb.collection('parents').doc();
    await parentRef.set(parentData);

    // Fetch the created parent to return complete data
    const createdParent = await parentRef.get();
    const parentDoc = createdParent.data();

    return NextResponse.json({
      success: true,
      message: 'Parent created successfully',
      parent: {
        id: parentRef.id,
        name: parentDoc?.name,
        contactNumber: parentDoc?.contactNumber,
        studentIds: parentDoc?.studentIds,
        walletAddress: parentDoc?.walletAddress,
        isActive: parentDoc?.isActive,
        createdAt: parentDoc?.createdAt,
        updatedAt: parentDoc?.updatedAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating parent:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
