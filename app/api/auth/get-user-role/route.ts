import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet } = body;

    // Validate required fields
    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Normalize wallet address
    const normalizedWallet = wallet.toLowerCase();

    // Get user from database
    const userDoc = await adminDb.collection('users').doc(normalizedWallet).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    
    if (!userData?.role) {
      return NextResponse.json(
        { error: 'User role not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      role: userData.role,
      wallet: normalizedWallet
    });

  } catch (error) {
    console.error('Get user role error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
