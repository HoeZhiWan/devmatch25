import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, newRole } = await request.json();

    // Validate input
    if (!walletAddress || !newRole) {
      return NextResponse.json(
        { error: 'Missing walletAddress or newRole' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['parent', 'staff', 'pickup'];
    if (!validRoles.includes(newRole)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if user exists
    const userDoc = await adminDb.collection('users').doc(walletAddress.toLowerCase()).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found with this wallet address' },
        { status: 404 }
      );
    }

    // Update the role
    await adminDb.collection('users').doc(walletAddress.toLowerCase()).update({
      role: newRole,
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: `Successfully changed role for ${walletAddress} to ${newRole}`,
      walletAddress: walletAddress.toLowerCase(),
      newRole
    });

  } catch (error) {
    console.error('Error changing role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

