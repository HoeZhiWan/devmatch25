import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import * as blockchain from '@/lib/blockchain';
import type { AuthorizationData } from '@/lib/blockchain/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, authData, authHash } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    // Create provider for blockchain operations
    const provider = new ethers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC_URL || 'https://rpc-mumbai.maticvigil.com'
    );

    switch (action) {
      case 'create':
        if (!authData) {
          return NextResponse.json(
            { error: 'Authorization data is required' },
            { status: 400 }
          );
        }

        // Validate authorization data
        if (!authData.parentWallet || !authData.pickupWallet || !authData.studentHash) {
          return NextResponse.json(
            { error: 'Invalid authorization data' },
            { status: 400 }
          );
        }

        // Create authorization on blockchain
        const createResult = await blockchain.createAuthorizationOnChain(
          provider as any, // Type assertion for compatibility
          authData as AuthorizationData
        );

        return NextResponse.json(createResult);

      case 'verify':
        if (!authData) {
          return NextResponse.json(
            { error: 'Authorization data is required' },
            { status: 400 }
          );
        }

        // Verify authorization
        const verifyResult = await blockchain.verifyAuthorizationWithTimestamp(
          authData as AuthorizationData,
          provider
        );

        return NextResponse.json(verifyResult);

      case 'revoke':
        if (!authHash) {
          return NextResponse.json(
            { error: 'Authorization hash is required' },
            { status: 400 }
          );
        }

        // Revoke authorization
        const revokeResult = await blockchain.revokeAuthorizationOnChain(
          provider as any, // Type assertion for compatibility
          authHash
        );

        return NextResponse.json(revokeResult);

      case 'get':
        if (!authHash) {
          return NextResponse.json(
            { error: 'Authorization hash is required' },
            { status: 400 }
          );
        }

        // Get authorization details
        const authDetails = await blockchain.getAuthorizationFromChain(
          provider,
          authHash
        );

        return NextResponse.json({
          success: true,
          authorization: authDetails
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('Blockchain authorization error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const authHash = searchParams.get('authHash');

    if (!authHash) {
      return NextResponse.json(
        { error: 'Authorization hash is required' },
        { status: 400 }
      );
    }

    // Create provider
    const provider = new ethers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC_URL || 'https://rpc-mumbai.maticvigil.com'
    );

    // Get authorization details
    const authDetails = await blockchain.getAuthorizationFromChain(
      provider,
      authHash
    );

    return NextResponse.json({
      success: true,
      authorization: authDetails
    });

  } catch (error: any) {
    console.error('Get authorization error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
