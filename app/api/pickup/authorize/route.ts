import { NextRequest, NextResponse } from 'next/server';
import { 
  addPickupPersonToParent,
  removePickupPersonFromParent,
  getUserById
} from '@/lib/firebase/server-collections';
import { verifyIdToken } from '@/lib/firebase/auth';

/**
 * POST /api/pickup/authorize
 * Adds a pickup person authorization for a parent
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pickupWallet, relationship, startDate, endDate, idToken } = body;

    // Validate required fields
    if (!pickupWallet || !relationship || !startDate || !endDate || !idToken) {
      return NextResponse.json(
        { error: 'All fields are required: pickupWallet, relationship, startDate, endDate, idToken' },
        { status: 400 }
      );
    }

    // Verify the parent's Firebase ID token
    const decodedToken = await verifyIdToken(idToken);
    if (!decodedToken) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Check if user is a parent
    if (decodedToken.role !== 'parent') {
      return NextResponse.json(
        { error: 'Only parents can authorize pickup persons' },
        { status: 403 }
      );
    }

    const parentWallet = decodedToken.wallet;

    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start >= end) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      );
    }

    if (end <= now) {
      return NextResponse.json(
        { error: 'End date must be in the future' },
        { status: 400 }
      );
    }

    // Add pickup person to parent's authorized list
    const success = await addPickupPersonToParent(parentWallet, pickupWallet, {
      walletAddress: pickupWallet.toLowerCase(),
      relationship,
      startDate,
      endDate,
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to add pickup authorization' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Pickup person authorized successfully',
      data: {
        pickupWallet: pickupWallet.toLowerCase(),
        relationship,
        startDate,
        endDate,
      },
    });

  } catch (error) {
    console.error('Error authorizing pickup person:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/pickup/authorize
 * Removes a pickup person authorization for a parent
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pickupWallet = searchParams.get('pickupWallet');
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const idToken = authHeader.substring(7);

    // Validate required fields
    if (!pickupWallet || !idToken) {
      return NextResponse.json(
        { error: 'Pickup wallet and authorization token are required' },
        { status: 400 }
      );
    }

    // Verify the parent's Firebase ID token
    const decodedToken = await verifyIdToken(idToken);
    if (!decodedToken) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Check if user is a parent
    if (decodedToken.role !== 'parent') {
      return NextResponse.json(
        { error: 'Only parents can revoke pickup authorizations' },
        { status: 403 }
      );
    }

    const parentWallet = decodedToken.wallet;

    // Remove pickup person from parent's authorized list
    const success = await removePickupPersonFromParent(parentWallet, pickupWallet);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to remove pickup authorization' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Pickup authorization revoked successfully',
    });

  } catch (error) {
    console.error('Error revoking pickup authorization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/pickup/authorize
 * Gets authorized pickup persons for a parent
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const idToken = authHeader.substring(7);

    // Verify the parent's Firebase ID token
    const decodedToken = await verifyIdToken(idToken);
    if (!decodedToken) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const parentWallet = decodedToken.wallet;

    // Get parent's user data including pickup authorizations
    const parentUser = await getUserById(parentWallet);
    if (!parentUser) {
      return NextResponse.json(
        { error: 'Parent user not found' },
        { status: 404 }
      );
    }

    const pickupPersons = parentUser.pickup || {};
    
    // Convert to array format with validation for active authorizations
    const authorizations = Object.entries(pickupPersons).map(([wallet, person]) => {
      const now = new Date();
      const startDate = new Date(person.startDate);
      const endDate = new Date(person.endDate);
      const isActive = now >= startDate && now <= endDate;
      
      return {
        walletAddress: wallet,
        relationship: person.relationship,
        startDate: person.startDate,
        endDate: person.endDate,
        isActive,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        parentWallet,
        authorizations,
        totalAuthorizations: authorizations.length,
        activeAuthorizations: authorizations.filter(auth => auth.isActive).length,
      },
    });

  } catch (error) {
    console.error('Error getting pickup authorizations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
