/**
 * Verify Signature API Endpoint
 * Handles server-side signature verification for authorization messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySignature, validateAuthorizationMessage } from '../../../../lib/wallet/signature';
import { isValidAddress } from '../../../../lib/wallet/connection';

interface VerifySignatureRequest {
  message: string;
  signature: string;
  expectedAddress: string;
}

interface VerifySignatureResponse {
  success: boolean;
  isValid?: boolean;
  recoveredAddress?: string;
  error?: string;
  timestamp?: number;
}

export async function POST(request: NextRequest): Promise<NextResponse<VerifySignatureResponse>> {
  try {
    const body = await request.json() as VerifySignatureRequest;
    const { message, signature, expectedAddress } = body;

    // Validate input parameters
    if (!message || !signature || !expectedAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: message, signature, or expectedAddress' },
        { status: 400 }
      );
    }

    if (!isValidAddress(expectedAddress)) {
      return NextResponse.json(
        { success: false, error: 'Invalid expected address format' },
        { status: 400 }
      );
    }

    const normalizedExpectedAddress = expectedAddress.toLowerCase();

    // Validate authorization message format if applicable
    if (message.includes('DevMatch25 - Child Pickup Authorization')) {
      if (!validateAuthorizationMessage(message)) {
        return NextResponse.json(
          { success: false, error: 'Invalid authorization message format' },
          { status: 400 }
        );
      }
    }

    try {
      // Use wallet integration signature verification
      const verificationResult = verifySignature({
        message,
        signature,
        expectedAddress: normalizedExpectedAddress
      });

      if (!verificationResult.isValid) {
        console.log(`Signature verification failed: ${verificationResult.error || 'Unknown error'}`);
        
        return NextResponse.json({
          success: true,
          isValid: false,
          error: verificationResult.error || 'Invalid signature',
          timestamp: Date.now()
        });
      }

      const recoveredAddress = verificationResult.recoveredAddress!;

      // Log verification attempt
      console.log(`Signature verification: Expected=${normalizedExpectedAddress}, Recovered=${recoveredAddress}, Valid=true`);

      return NextResponse.json({
        success: true,
        isValid: true,
        recoveredAddress,
        timestamp: Date.now()
      });

    } catch (verificationError: any) {
      console.error('Signature verification failed:', verificationError);
      
      return NextResponse.json({
        success: true,
        isValid: false,
        error: 'Invalid signature format or corrupted data',
        timestamp: Date.now()
      });
    }

  } catch (error) {
    console.error('Verify signature API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for checking API status
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    endpoint: 'verify-signature',
    status: 'active',
    methods: ['POST'],
    description: 'Verifies wallet signatures server-side'
  });
}
