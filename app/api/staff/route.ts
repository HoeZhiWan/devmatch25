import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { getAddress } from 'ethers';

// CREATE STAFF
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

    // Validate Ethereum address format
    const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethereumAddressRegex.test(walletAddress)) {
      return NextResponse.json({ error: 'Invalid wallet address format' }, { status: 400 });
    }

    // Normalize for DB storage
    const normalizedWalletAddress = walletAddress.toLowerCase();

    // Check if wallet already exists in staff
    const existingStaffQuery = await adminDb
      .collection('staff')
      .where('walletAddress', '==', normalizedWalletAddress)
      .get();

    if (!existingStaffQuery.empty) {
      return NextResponse.json({ error: 'Staff with this wallet address already exists' }, { status: 409 });
    }

    // Check if wallet already exists in users
    const existingUser = await adminDb.collection('users').doc(normalizedWalletAddress).get();
    if (existingUser.exists) {
      return NextResponse.json({ error: 'Wallet address is already registered as a user' }, { status: 409 });
    }

    // Prepare staff data
    const staffData = {
      name: name.trim(),
      role: role.trim(),
      walletAddress: normalizedWalletAddress,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Save to Firestore
    const staffRef = adminDb.collection('staff').doc();
    await staffRef.set(staffData);

    // Retrieve the created doc
    const createdStaffSnap = await staffRef.get();
    const staffDoc = createdStaffSnap.data();

    return NextResponse.json({
      success: true,
      message: 'Staff created successfully',
      staff: {
        id: staffRef.id,
        name: staffDoc?.name || '',
        role: staffDoc?.role || '',
        walletAddress: getAddress(staffDoc?.walletAddress || ''), // checksum format
        isActive: staffDoc?.isActive ?? true,
        createdAt: staffDoc?.createdAt?.toDate().toISOString() || null,
        updatedAt: staffDoc?.updatedAt?.toDate().toISOString() || null
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating staff:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET STAFF LIST
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Fetching staff list...');
    
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const lastCreatedAt = searchParams.get('lastCreatedAt');

    console.log('📊 Query params:', { isActive, limit, lastCreatedAt });

    let query: FirebaseFirestore.Query = adminDb.collection('staff');

    // Start with simplest possible query to handle legacy data
    query = query.limit(limit * 2); // Get more docs to account for filtering

    // Only add ordering if we have pagination (for existing data compatibility)
    if (lastCreatedAt) {
      try {
        query = query.orderBy('createdAt', 'desc');
        const cursorDate = admin.firestore.Timestamp.fromDate(new Date(lastCreatedAt));
        query = query.startAfter(cursorDate);
        console.log('📄 Using cursor pagination from:', lastCreatedAt);
      } catch (error) {
        console.warn('⚠️ Pagination failed, ignoring cursor:', error);
        query = adminDb.collection('staff').limit(limit * 2);
      }
    }

    console.log('🔥 Executing Firestore query...');
    const snapshot = await query.get();
    console.log('📦 Query returned', snapshot.docs.length, 'documents');

    // Map and filter documents with robust format handling
    let staff = snapshot.docs.map(doc => {
      const data = doc.data();
      console.log('👤 Processing staff doc:', doc.id, data);
      
      // Handle wallet address safely
      let walletAddress = null;
      if (data.walletAddress) {
        try {
          walletAddress = getAddress(data.walletAddress);
        } catch (error) {
          console.warn('⚠️ Invalid wallet address for doc', doc.id, ':', data.walletAddress);
          walletAddress = data.walletAddress; // Keep original if checksum fails
        }
      }

      // Handle timestamps safely
      let createdAt = null;
      let updatedAt = null;
      
      try {
        if (data.createdAt) {
          if (typeof data.createdAt.toDate === 'function') {
            createdAt = data.createdAt.toDate().toISOString();
          } else if (typeof data.createdAt === 'string') {
            createdAt = data.createdAt;
          } else if (data.createdAt instanceof Date) {
            createdAt = data.createdAt.toISOString();
          }
        }
      } catch (error) {
        console.warn('⚠️ Invalid createdAt for doc', doc.id, ':', data.createdAt);
      }

      try {
        if (data.updatedAt) {
          if (typeof data.updatedAt.toDate === 'function') {
            updatedAt = data.updatedAt.toDate().toISOString();
          } else if (typeof data.updatedAt === 'string') {
            updatedAt = data.updatedAt;
          } else if (data.updatedAt instanceof Date) {
            updatedAt = data.updatedAt.toISOString();
          }
        }
      } catch (error) {
        console.warn('⚠️ Invalid updatedAt for doc', doc.id, ':', data.updatedAt);
      }
      
      return {
        id: doc.id,
        name: data.name || 'Unknown Name',
        role: data.role || 'Unknown Role',
        walletAddress,
        isActive: data.isActive !== undefined ? data.isActive : true, // Default to true if missing
        createdAt,
        updatedAt
      };
    });

    // Apply isActive filter in memory if provided
    if (isActive !== null) {
      const activeFilter = isActive === 'true';
      staff = staff.filter(s => s.isActive === activeFilter);
      console.log('🔽 Filtered by isActive in memory:', activeFilter, '- Results:', staff.length);
    }

    // Apply limit after filtering
    staff = staff.slice(0, limit);

    // Pagination token
    const lastVisible = snapshot.docs[snapshot.docs.length - 1];
    const pagination = lastVisible
      ? { lastCreatedAt: lastVisible.data().createdAt?.toDate().toISOString() || null }
      : null;

    console.log('✅ Successfully returning', staff.length, 'staff members');
    return NextResponse.json({ success: true, staff, pagination }, { status: 200 });

  } catch (error) {
    console.error('❌ Error fetching staff:', error);
    console.error('📊 Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
