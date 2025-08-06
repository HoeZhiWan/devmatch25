import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { adminDb } from '@/lib/firebase/admin';
import { createCustomToken } from '@/lib/firebase/auth';
import admin from 'firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { wallet, role, signature, message, nonce, timestamp } = await request.json();

    // Validate required fields
    if (!wallet || !role || !signature || !message || !nonce || !timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['parent', 'pickup', 'staff'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Normalize wallet address
    const normalizedWallet = wallet.toLowerCase();

    // Verify signature
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      if (recoveredAddress.toLowerCase() !== normalizedWallet) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Signature verification failed' },
        { status: 401 }
      );
    }

    // Check if message contains the correct wallet and role
    if (!message.includes(normalizedWallet) || !message.includes(role)) {
      return NextResponse.json(
        { error: 'Message content validation failed' },
        { status: 401 }
      );
    }

    // Check timestamp (5 minutes tolerance)
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime - timestamp > 300) {
      return NextResponse.json(
        { error: 'Signature expired' },
        { status: 401 }
      );
    }

    // Check if user already exists
    const userDoc = await adminDb.collection('users').doc(normalizedWallet).get();
    if (userDoc.exists) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // Create user in Firestore
    const userData = {
      wallet: normalizedWallet,
      role: role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true
    };

    await adminDb.collection('users').doc(normalizedWallet).set(userData);

    // Create custom token
    const customToken = await createCustomToken(normalizedWallet, { role });
    
    if (!customToken) {
      return NextResponse.json(
        { error: 'Failed to create authentication token' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      customToken,
      user: {
        wallet: normalizedWallet,
        role: role,
        uid: normalizedWallet
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
