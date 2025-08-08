const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = require('../firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function changeUserRole(walletAddress, newRole) {
  try {
    // Validate role
    const validRoles = ['parent', 'staff', 'pickup'];
    if (!validRoles.includes(newRole)) {
      console.error('❌ Invalid role. Must be one of:', validRoles);
      return;
    }

    // Check if user exists
    const userDoc = await db.collection('users').doc(walletAddress.toLowerCase()).get();
    
    if (!userDoc.exists) {
      console.error('❌ User not found with wallet address:', walletAddress);
      return;
    }

    // Update the role
    await db.collection('users').doc(walletAddress.toLowerCase()).update({
      role: newRole,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ Successfully changed role for wallet:', walletAddress);
    console.log('✅ New role:', newRole);
    
  } catch (error) {
    console.error('❌ Error changing role:', error);
  } finally {
    process.exit(0);
  }
}

// Get command line arguments
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.log('Usage: node change-role.js <wallet-address> <new-role>');
  console.log('Example: node change-role.js 0x1234...5678 staff');
  console.log('Valid roles: parent, staff, pickup');
  process.exit(1);
}

const [walletAddress, newRole] = args;
changeUserRole(walletAddress, newRole);

