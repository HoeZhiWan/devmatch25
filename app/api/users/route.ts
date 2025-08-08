import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';

// TypeScript interfaces
interface UserData {
  wallet: string;
  role: 'parent' | 'pickup' | 'staff';
  signature?: string;
  message?: string;
  nonce?: string;
  timestamp?: number;
  createdAt?: admin.firestore.FieldValue | admin.firestore.Timestamp;
  lastLoginAt?: admin.firestore.FieldValue | admin.firestore.Timestamp;
  isActive?: boolean;
}

interface UserDocument extends UserData {
  id: string;
}

// GET method - Read all users from the 'users' collection
export async function GET(request: NextRequest) {
  try {
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const isActive = searchParams.get('isActive');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query: any = adminDb.collection('users');

    // Apply filters
    if (role && ['parent', 'pickup', 'staff'].includes(role)) {
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
        users: [],
        total: 0,
        message: 'No users found'
      });
    }

    // Transform documents to UserDocument format
    const users: UserDocument[] = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        wallet: data.wallet || '',
        role: data.role || 'parent',
        signature: data.signature,
        message: data.message,
        nonce: data.nonce,
        timestamp: data.timestamp,
        createdAt: data.createdAt,
        lastLoginAt: data.lastLoginAt,
        isActive: data.isActive !== false // Default to true if not specified
      };
    });

    // Get total count for pagination
    const totalSnapshot = await adminDb.collection('users').count().get();
    const total = totalSnapshot.data().count;

    return NextResponse.json({
      success: true,
      users,
      total,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST method - Add a new user to the 'users' collection
export async function POST(request: NextRequest) {
  try {
    const { wallet, role, signature, message, nonce, timestamp } = await request.json();

    // Validate required fields
    if (!wallet || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: wallet and role are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['parent', 'pickup', 'staff'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be one of: parent, pickup, staff' },
        { status: 400 }
      );
    }

    // Validate wallet address format (basic Ethereum address validation)
    const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethereumAddressRegex.test(wallet)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    // Normalize wallet address
    const normalizedWallet = wallet.toLowerCase();

    // Check if user already exists
    const existingUser = await adminDb.collection('users').doc(normalizedWallet).get();
    if (existingUser.exists) {
      return NextResponse.json(
        { error: 'User with this wallet address already exists' },
        { status: 409 }
      );
    }

    // Prepare user data
    const userData: UserData = {
      wallet: normalizedWallet,
      role: role as 'parent' | 'pickup' | 'staff',
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Add optional fields if provided
    if (signature) userData.signature = signature;
    if (message) userData.message = message;
    if (nonce) userData.nonce = nonce;
    if (timestamp) userData.timestamp = timestamp;

    // Create user document
    await adminDb.collection('users').doc(normalizedWallet).set(userData);

    // Fetch the created user to return complete data
    const createdUser = await adminDb.collection('users').doc(normalizedWallet).get();
    const userDoc = createdUser.data();

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: normalizedWallet,
        wallet: userDoc?.wallet,
        role: userDoc?.role,
        isActive: userDoc?.isActive,
        createdAt: userDoc?.createdAt,
        lastLoginAt: userDoc?.lastLoginAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
