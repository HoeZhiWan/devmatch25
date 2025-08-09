import { NextRequest, NextResponse } from 'next/server';
import { 
  createUser,
  getUserById,
  updateUserLastLogin,
  getAllUsers,
  getUsersByRole
} from '@/lib/firebase/server-collections';
import { verifyIdToken } from '@/lib/firebase/auth';

/**
 * GET /api/users
 * Get user information or list of users
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');
    const role = searchParams.get('role');
    const includeUnregistered = searchParams.get('includeUnregistered') === 'true';
    
    // If wallet is specified, get specific user
    if (wallet) {
      const user = await getUserById(wallet);
      
      if (!user && includeUnregistered) {
        // Return placeholder data for unregistered pickup persons
        return NextResponse.json({
          success: true,
          user: {
            id: wallet.toLowerCase(),
            walletAddress: wallet.toLowerCase(),
            name: `Unregistered User (${wallet.slice(0, 6)}...${wallet.slice(-4)})`,
            role: 'pickup',
            isRegistered: false,
            createdAt: new Date(),
            lastLoginAt: new Date(),
          },
        });
      }
      
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        user: { ...user, isRegistered: true },
      });
    }
    
    // Get all users (for staff dashboard)
    let users: any[] = [];
    
    if (role) {
      users = await getUsersByRole(role);
    } else {
      users = await getAllUsers();
    }
    
    return NextResponse.json({
      success: true,
      users: users.map(user => ({ ...user, isRegistered: true })),
      total: users.length,
    });
    
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users
 * Create a new user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, name, contactNumber, role, idToken } = body;
    
    // Validate required fields
    if (!walletAddress || !name || !role) {
      return NextResponse.json(
        { error: 'Wallet address, name, and role are required' },
        { status: 400 }
      );
    }
    
    // Validate role
    if (!['parent', 'pickup_person', 'staff'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be parent, pickup_person, or staff' },
        { status: 400 }
      );
    }
    
    // If idToken is provided, verify it matches the wallet address
    if (idToken) {
      const decodedToken = await verifyIdToken(idToken);
      if (!decodedToken || decodedToken.wallet !== walletAddress.toLowerCase()) {
        return NextResponse.json(
          { error: 'Invalid token or wallet address mismatch' },
          { status: 401 }
        );
      }
    }
    
    // Check if user already exists
    const existingUser = await getUserById(walletAddress);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }
    
    // Create new user
    const success = await createUser({
      id: walletAddress.toLowerCase(),
      walletAddress: walletAddress.toLowerCase(),
      name,
      contactNumber,
      role,
    });
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }
    
    // Get the created user
    const newUser = await getUserById(walletAddress);
    
    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: newUser,
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users
 * Update user last login time
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, idToken } = body;
    
    if (!walletAddress || !idToken) {
      return NextResponse.json(
        { error: 'Wallet address and ID token are required' },
        { status: 400 }
      );
    }
    
    // Verify token
    const decodedToken = await verifyIdToken(idToken);
    if (!decodedToken || decodedToken.wallet !== walletAddress.toLowerCase()) {
      return NextResponse.json(
        { error: 'Invalid token or wallet address mismatch' },
        { status: 401 }
      );
    }
    
    // Update last login
    const success = await updateUserLastLogin(walletAddress);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
    });
    
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
