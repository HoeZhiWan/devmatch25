import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';

// TypeScript interfaces
interface StaffData {
  name: string;
  role: string;
  walletAddress: string;
  createdAt?: admin.firestore.Timestamp;
  updatedAt?: admin.firestore.Timestamp;
  isActive?: boolean;
}

interface StaffDocument extends StaffData {
  id: string;
}

// GET method - Read all staff from the 'staff' collection
export async function GET(request: NextRequest) {
  try {
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const isActive = searchParams.get('isActive');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = adminDb.collection('staff');

    // Apply filters
    if (role) {
      query = query.where('role', '==', role);
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
        staff: [],
        total: 0,
        message: 'No staff found'
      });
    }

    // Transform documents to StaffDocument format
    const staff: StaffDocument[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        role: data.role || '',
        walletAddress: data.walletAddress || '',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        isActive: data.isActive !== false // Default to true if not specified
      };
    });

    // Get total count for pagination
    const totalSnapshot = await adminDb.collection('staff').count().get();
    const total = totalSnapshot.data().count;

    return NextResponse.json({
      success: true,
      staff,
      total,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST method - Add a new staff to the 'staff' collection
export async function POST(request: NextRequest) {
  try {
    const { name, role, walletAddress } = await request.json();

    // Validate required fields
    if (!name || !role || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: name, role, and walletAddress are required' },
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

    // Validate role (non-empty string)
    if (typeof role !== 'string' || role.trim().length === 0) {
      return NextResponse.json(
        { error: 'Role must be a non-empty string' },
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

    // Normalize wallet address
    const normalizedWalletAddress = walletAddress.toLowerCase();

    // Check if staff already exists with this wallet address
    const existingStaffQuery = await adminDb.collection('staff')
      .where('walletAddress', '==', normalizedWalletAddress)
      .get();

    if (!existingStaffQuery.empty) {
      return NextResponse.json(
        { error: 'Staff with this wallet address already exists' },
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

    // Prepare staff data
    const staffData: StaffData = {
      name: name.trim(),
      role: role.trim(),
      walletAddress: normalizedWalletAddress,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Create staff document with auto-generated ID
    const staffRef = adminDb.collection('staff').doc();
    await staffRef.set(staffData);

    // Fetch the created staff to return complete data
    const createdStaff = await staffRef.get();
    const staffDoc = createdStaff.data();

    return NextResponse.json({
      success: true,
      message: 'Staff created successfully',
      staff: {
        id: staffRef.id,
        name: staffDoc?.name,
        role: staffDoc?.role,
        walletAddress: staffDoc?.walletAddress,
        isActive: staffDoc?.isActive,
        createdAt: staffDoc?.createdAt,
        updatedAt: staffDoc?.updatedAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating staff:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
