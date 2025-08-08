import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import * as blockchain from '@/lib/blockchain';
import type { MerkleBatchData, PickupEventData } from '@/lib/blockchain/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, batchData, events, batchNumber } = body;

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
      case 'anchor':
        if (!batchData) {
          return NextResponse.json(
            { error: 'Batch data is required' },
            { status: 400 }
          );
        }

        // Validate batch data
        if (!batchData.merkleRoot || !batchData.eventCount) {
          return NextResponse.json(
            { error: 'Invalid batch data' },
            { status: 400 }
          );
        }

        // Anchor Merkle batch on blockchain
        const anchorResult = await blockchain.anchorMerkleBatchOnChain(
          provider as any, // Type assertion for compatibility
          batchData as MerkleBatchData
        );

        return NextResponse.json(anchorResult);

      case 'create':
        if (!events || !Array.isArray(events)) {
          return NextResponse.json(
            { error: 'Events array is required' },
            { status: 400 }
          );
        }

        if (batchNumber === undefined || batchNumber === null) {
          return NextResponse.json(
            { error: 'Batch number is required' },
            { status: 400 }
          );
        }

        // Create batch from events
        const batch = blockchain.createBatch(
          events as PickupEventData[],
          batchNumber
        );

        return NextResponse.json({
          success: true,
          batch
        });

      case 'get':
        if (!batchData?.batchNumber) {
          return NextResponse.json(
            { error: 'Batch number is required' },
            { status: 400 }
          );
        }

        // Get Merkle batch details
        const batchDetails = await blockchain.getMerkleBatchFromChain(
          provider,
          batchData.batchNumber
        );

        return NextResponse.json({
          success: true,
          batch: batchDetails
        });

      case 'verify':
        if (!batchData?.eventHash || !batchData?.batchNumber || !batchData?.proof) {
          return NextResponse.json(
            { error: 'Event hash, batch number, and proof are required' },
            { status: 400 }
          );
        }

        // Verify pickup event proof
        const verifyResult = await blockchain.verifyPickupEventProof(
          provider,
          batchData.eventHash,
          batchData.batchNumber,
          batchData.proof
        );

        return NextResponse.json({
          success: true,
          isValid: verifyResult
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('Blockchain Merkle error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const batchNumber = searchParams.get('batchNumber');

    if (!batchNumber) {
      return NextResponse.json(
        { error: 'Batch number is required' },
        { status: 400 }
      );
    }

    // Create provider
    const provider = new ethers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC_URL || 'https://rpc-mumbai.maticvigil.com'
    );

    // Get Merkle batch details
    const batchDetails = await blockchain.getMerkleBatchFromChain(
      provider,
      parseInt(batchNumber)
    );

    return NextResponse.json({
      success: true,
      batch: batchDetails
    });

  } catch (error: any) {
    console.error('Get Merkle batch error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
