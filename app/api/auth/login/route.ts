import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { adminDb } from '@/lib/firebase/admin';
import { createCustomToken } from '@/lib/firebase/auth';
import admin from 'firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet, signature, message, nonce, timestamp } = body;

    // Validate required fields
    if (!wallet || !signature || !message || !nonce || !timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Check timestamp (5 minutes tolerance)
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime - timestamp > 300) {
      return NextResponse.json(
        { error: 'Signature expired' },
        { status: 401 }
      );
    }

    // Get user from database
    const userDoc = await adminDb.collection('users').doc(normalizedWallet).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found. Please register first.' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    
    // Check if message contains the correct wallet and role
    if (!message.includes(normalizedWallet) || !message.includes(userData?.role || '')) {
      return NextResponse.json(
        { error: 'Message content validation failed' },
        { status: 401 }
      );
    }

    // Update last login timestamp
    await adminDb.collection('users').doc(normalizedWallet).update({
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Create custom token with user's role
    const customToken = await createCustomToken(normalizedWallet, { 
      role: userData?.role || 'user' 
    });
    
    if (!customToken) {
      console.error('Failed to create custom token');
      return NextResponse.json(
        { error: 'Failed to create authentication token' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      customToken,
      role: userData?.role,
      user: {
        wallet: normalizedWallet,
        role: userData?.role,
        uid: normalizedWallet,
        lastLoginAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
