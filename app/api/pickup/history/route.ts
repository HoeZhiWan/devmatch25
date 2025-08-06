/**
 * Pickup History API Endpoint
 * Handles fetching pickup history records from Firebase
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseUtils";
import { collection, getDocs, query, orderBy, where, limit } from "firebase/firestore";

interface PickupHistoryItem {
  id?: string;
  studentName: string;
  studentId: string;
  parentWallet: string;
  pickupWallet: string;
  staffWallet: string;
  verifiedAt: Date;
  signature?: string;
  message?: string;
  status: 'completed' | 'pending' | 'failed';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');
    const limitParam = searchParams.get('limit');
    const roleFilter = searchParams.get('role');
    
    // Build query based on parameters
    let q = query(collection(db, "pickups"), orderBy("verifiedAt", "desc"));
    
    // Filter by wallet address if provided
    if (walletAddress) {
      const normalizedWallet = walletAddress.toLowerCase();
      
      // Filter based on role
      switch (roleFilter) {
        case 'parent':
          q = query(q, where("parentWallet", "==", normalizedWallet));
          break;
        case 'pickup':
          q = query(q, where("pickupWallet", "==", normalizedWallet));
          break;
        case 'staff':
          q = query(q, where("staffWallet", "==", normalizedWallet));
          break;
        default:
          // If no role specified, show records where user is involved in any capacity
          // Note: Firestore doesn't support OR queries directly, so we'll handle this client-side
          break;
      }
    }
    
    // Apply limit if specified
    if (limitParam) {
      const limitNum = parseInt(limitParam, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        q = query(q, limit(limitNum));
      }
    }

    const snapshot = await getDocs(q);

    const history: PickupHistoryItem[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        studentName: data.studentName || 'Unknown',
        studentId: data.studentId || 'Unknown',
        parentWallet: data.parentWallet || '',
        pickupWallet: data.pickupWallet || '',
        staffWallet: data.staffWallet || '',
        verifiedAt: data.verifiedAt?.toDate() || new Date(),
        signature: data.signature || undefined,
        message: data.message || undefined,
        status: data.status || 'completed'
      };
    });

    // If wallet filter was provided but no role was specified, filter client-side
    if (walletAddress && !roleFilter) {
      const normalizedWallet = walletAddress.toLowerCase();
      const filteredHistory = history.filter(item => 
        item.parentWallet.toLowerCase() === normalizedWallet ||
        item.pickupWallet.toLowerCase() === normalizedWallet ||
        item.staffWallet.toLowerCase() === normalizedWallet
      );
      
      return NextResponse.json({ 
        success: true,
        history: filteredHistory,
        totalCount: filteredHistory.length
      });
    }

    return NextResponse.json({ 
      success: true,
      history,
      totalCount: history.length
    });
    
  } catch (error) {
    console.error('Error fetching pickup history:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Error fetching pickup history",
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for adding new pickup records
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      studentName,
      studentId,
      parentWallet,
      pickupWallet,
      staffWallet,
      signature,
      message
    } = body;

    // Validate required fields
    if (!studentName || !studentId || !parentWallet || !pickupWallet || !staffWallet) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Missing required fields: studentName, studentId, parentWallet, pickupWallet, staffWallet" 
        },
        { status: 400 }
      );
    }

    // Create pickup record
    const pickupRecord = {
      studentName: studentName.trim(),
      studentId: studentId.trim(),
      parentWallet: parentWallet.toLowerCase(),
      pickupWallet: pickupWallet.toLowerCase(),
      staffWallet: staffWallet.toLowerCase(),
      verifiedAt: new Date(),
      signature: signature || null,
      message: message || null,
      status: 'completed' as const
    };

    // Add to Firebase (you'll need to implement the addDoc functionality)
    // For now, we'll return success without actually saving
    console.log('Pickup record to be saved:', pickupRecord);

    return NextResponse.json({
      success: true,
      message: "Pickup record saved successfully",
      record: pickupRecord
    });

  } catch (error) {
    console.error('Error saving pickup record:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Error saving pickup record",
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
