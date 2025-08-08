import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

interface ParentInfo {
  parentName: string;
  childrenNames: string;
  walletAddress: string;
  status: 'valid' | 'invalid_address' | 'no_wallet';
}

export async function GET(request: NextRequest) {
  try {
    const parents: ParentInfo[] = [];
    const parentMap = new Map<string, ParentInfo>();

    // Get all students to map children to parents
    const studentsSnapshot = await adminDb.collection('students').get();
    const students = studentsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        parentWallet: data.parentWallet,
      };
    });

    // Group children by parent wallet
    const childrenByParent = new Map<string, string[]>();
    students.forEach(student => {
      if (student.parentWallet) {
        const wallet = student.parentWallet.toLowerCase();
        if (!childrenByParent.has(wallet)) {
          childrenByParent.set(wallet, []);
        }
        childrenByParent.get(wallet)!.push(student.name);
      }
    });

    // Get parents from "parents" collection
    const parentsSnapshot = await adminDb.collection('parents').get();
    parentsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const wallet = data.wallet?.toLowerCase() || '';
      const parentName = data.name || 'Unknown Parent';
      
      // Determine status based on wallet validity
      let status: 'valid' | 'invalid_address' | 'no_wallet' = 'valid';
      if (!wallet || wallet === '') {
        status = 'no_wallet';
      } else if (!isValidWalletAddress(wallet)) {
        status = 'invalid_address';
      }

      const childrenNames = childrenByParent.get(wallet)?.join(', ') || 'No children assigned';
      
      parentMap.set(wallet, {
        parentName,
        childrenNames,
        walletAddress: wallet || 'No wallet',
        status
      });
    });

    // Get users with role "parent" from "users" collection
    const usersSnapshot = await adminDb.collection('users').where('role', '==', 'parent').get();
    usersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const wallet = data.wallet?.toLowerCase() || '';
      const parentName = data.name || 'Unknown Parent';
      
      // Determine status based on wallet validity
      let status: 'valid' | 'invalid_address' | 'no_wallet' = 'valid';
      if (!wallet || wallet === '') {
        status = 'no_wallet';
      } else if (!isValidWalletAddress(wallet)) {
        status = 'invalid_address';
      }

      const childrenNames = childrenByParent.get(wallet)?.join(', ') || 'No children assigned';
      
      // If parent already exists in map, update with user data (users collection takes precedence)
      if (parentMap.has(wallet)) {
        parentMap.set(wallet, {
          parentName,
          childrenNames,
          walletAddress: wallet || 'No wallet',
          status
        });
      } else {
        parentMap.set(wallet, {
          parentName,
          childrenNames,
          walletAddress: wallet || 'No wallet',
          status
        });
      }
    });

    // Convert map to array
    const parentsList = Array.from(parentMap.values());

    // Sort by parent name
    parentsList.sort((a, b) => a.parentName.localeCompare(b.parentName));

    return NextResponse.json({
      success: true,
      parents: parentsList,
      stats: {
        total: parentsList.length,
        valid: parentsList.filter(p => p.status === 'valid').length,
        invalid_address: parentsList.filter(p => p.status === 'invalid_address').length,
        no_wallet: parentsList.filter(p => p.status === 'no_wallet').length
      }
    });

  } catch (error) {
    console.error('Error fetching parents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to validate wallet address format
function isValidWalletAddress(address: string): boolean {
  // Basic Ethereum address validation
  const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  return ethereumAddressRegex.test(address);
}
