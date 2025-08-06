/**
 * Connect Wallet API Endpoint
 * Handles wallet connection verification and initial authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyMessage } from 'ethers';
import { isValidAddress } from '../../../../lib/wallet/connection';

interface ConnectWalletRequest {
  address: string;
  signature?: string;
  message?: string;
}

interface ConnectWalletResponse {
  success: boolean;
  address?: string;
  error?: string;
  timestamp?: number;
}

export async function POST(request: NextRequest): Promise<NextResponse<ConnectWalletResponse>> {
  try {
    const body = await request.json() as ConnectWalletRequest;
    const { address, signature, message } = body;

    // Validate address format
    if (!address || !isValidAddress(address)) {
      return NextResponse.json(
        { success: false, error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    const normalizedAddress = address.toLowerCase();

    // If signature and message are provided, verify them
    if (signature && message) {
      try {
        const recoveredAddress = verifyMessage(message, signature);
        
        if (recoveredAddress.toLowerCase() !== normalizedAddress) {
          return NextResponse.json(
            { success: false, error: 'Signature verification failed' },
            { status: 401 }
          );
        }
      } catch (error) {
        console.error('Signature verification error:', error);
        return NextResponse.json(
          { success: false, error: 'Invalid signature format' },
          { status: 400 }
        );
      }
    }

    // Log successful wallet connection
    console.log(`Wallet connected: ${normalizedAddress} at ${new Date().toISOString()}`);

    return NextResponse.json({
      success: true,
      address: normalizedAddress,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Connect wallet API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
