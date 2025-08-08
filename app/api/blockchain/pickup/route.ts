import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import * as blockchain from '@/lib/blockchain';
import type { PickupEventData, MerkleProof } from '@/lib/blockchain/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, eventData, merkleProof } = body;

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
      case 'record':
        if (!eventData) {
          return NextResponse.json(
            { error: 'Pickup event data is required' },
            { status: 400 }
          );
        }

        // Validate pickup event data
        if (!eventData.studentHash || !eventData.pickupWallet || !eventData.staffWallet) {
          return NextResponse.json(
            { error: 'Invalid pickup event data' },
            { status: 400 }
          );
        }

        // Record pickup event on blockchain
        const recordResult = await blockchain.recordPickupEventOnChain(
          provider as any, // Type assertion for compatibility
          eventData as PickupEventData
        );

        return NextResponse.json(recordResult);

      case 'verify':
        if (!eventData || !merkleProof) {
          return NextResponse.json(
            { error: 'Pickup event data and Merkle proof are required' },
            { status: 400 }
          );
        }

        // Verify pickup event with Merkle proof
        const verifyResult = await blockchain.verifyPickupEventWithProof(
          eventData as PickupEventData,
          merkleProof as MerkleProof,
          provider
        );

        return NextResponse.json(verifyResult);

      case 'get':
        if (!eventData?.eventHash) {
          return NextResponse.json(
            { error: 'Event hash is required' },
            { status: 400 }
          );
        }

        // Get pickup event details
        const eventDetails = await blockchain.getPickupEventFromChain(
          provider,
          eventData.eventHash
        );

        return NextResponse.json({
          success: true,
          pickupEvent: eventDetails
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('Blockchain pickup error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const eventHash = searchParams.get('eventHash');

    if (!eventHash) {
      return NextResponse.json(
        { error: 'Event hash is required' },
        { status: 400 }
      );
    }

    // Create provider
    const provider = new ethers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC_URL || 'https://rpc-mumbai.maticvigil.com'
    );

    // Get pickup event details
    const eventDetails = await blockchain.getPickupEventFromChain(
      provider,
      eventHash
    );

    return NextResponse.json({
      success: true,
      pickupEvent: eventDetails
    });

  } catch (error: any) {
    console.error('Get pickup event error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
