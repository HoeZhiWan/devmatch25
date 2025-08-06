# Firebase Integration Guide

This guide explains how to use the Firebase integration system for wallet authentication and data storage in the DevMatch25 Web3 project.

## Overview

The Firebase integration provides:
- **User Session Management**: Track wallet-based user sessions
- **Student Management**: Store and retrieve student information
- **Authorization System**: Manage pickup authorizations with signature verification
- **QR Code Management**: Handle one-time QR codes for pickup verification
- **Pickup Logging**: Track all pickup activities for audit trails

## Quick Start

### 1. Environment Setup

Make sure your `.env.local` file contains all required Firebase configuration:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (Server-side)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----"
```

### 2. Basic Wallet Authentication

```typescript
'use client';

import { useWallet, useWalletAuth } from '@/hooks';

export function MyComponent() {
  const { connect, disconnect, address, isConnected } = useWallet();
  const { session, createSession, clearSession, isAuthenticated } = useWalletAuth();

  const handleLogin = async () => {
    if (!isConnected) {
      await connect();
    }
    await createSession('parent'); // 'parent' | 'pickup_person' | 'staff'
  };

  const handleLogout = async () => {
    await clearSession();
    await disconnect();
  };

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Welcome, {session?.role}!</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <button onClick={handleLogin}>Connect Wallet & Login</button>
      )}
    </div>
  );
}
```

### 3. Student Management

```typescript
import { createStudent, getStudentsByParent } from '@/lib/firebase/collections';

// Create a new student
const addStudent = async (parentWallet: string) => {
  const success = await createStudent({
    id: 'CH001',
    name: 'John Doe',
    parentWallet: parentWallet,
  });
  
  if (success) {
    console.log('Student created successfully');
  }
};

// Get students for a parent
const loadStudents = async (parentWallet: string) => {
  const students = await getStudentsByParent(parentWallet);
  console.log('Students:', students);
};
```

### 4. Authorization Management

```typescript
import { createAuthorization, getAuthorizationsByPickupWallet } from '@/lib/firebase/collections';

// Create pickup authorization
const createPickupAuth = async () => {
  const authId = await createAuthorization({
    studentId: 'CH001',
    parentWallet: '0x123...parent',
    pickupWallet: '0x456...pickup',
    signature: 'signature_data',
    message: 'Authorization message',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    isActive: true,
  });
  
  if (authId) {
    console.log('Authorization created:', authId);
  }
};

// Get authorizations for pickup person
const loadAuthorizations = async (pickupWallet: string) => {
  const auths = await getAuthorizationsByPickupWallet(pickupWallet);
  console.log('Authorizations:', auths);
};
```

## Database Schema

### Collections Structure

```
/students
  /{studentId}
    - id: string
    - name: string
    - parentWallet: string (lowercase)
    - createdAt: timestamp

/authorizations
  /{authId}
    - id: string
    - studentId: string
    - parentWallet: string (lowercase)
    - pickupWallet: string (lowercase)
    - signature: string
    - message: string
    - startDate: string
    - endDate: string
    - isActive: boolean
    - createdAt: timestamp

/user-sessions
  /{walletAddress}
    - wallet: string (lowercase)
    - role: 'parent' | 'pickup_person' | 'staff'
    - lastActive: timestamp

/qr-codes
  /{qrCodeId}
    - id: string
    - pickupWallet: string (lowercase)
    - studentId: string
    - authorizationId: string
    - generatedAt: timestamp
    - expiresAt: timestamp
    - isUsed: boolean

/pickup-logs
  /{logId}
    - id: string
    - studentId: string
    - pickupWallet: string (lowercase)
    - scannedBy: string
    - timestamp: timestamp
    - status: 'success' | 'failed' | 'expired'
    - qrCodeId: string
```

## Available Functions

### Student Operations
- `createStudent(student)`: Create a new student
- `getStudentsByParent(parentWallet)`: Get all students for a parent
- `getStudentById(studentId)`: Get student by ID

### Authorization Operations
- `createAuthorization(auth)`: Create pickup authorization
- `getAuthorizationsByPickupWallet(wallet)`: Get active authorizations
- `getAuthorizationsByParent(wallet)`: Get parent's authorizations
- `updateAuthorizationStatus(authId, isActive)`: Enable/disable authorization

### Session Operations
- `createUserSession(session)`: Create user session
- `getUserSession(wallet)`: Get user session
- `updateUserSession(wallet)`: Update session activity
- `deleteUserSession(wallet)`: Clear session

### QR Code Operations
- `createQRCode(qrData)`: Create QR code record
- `getQRCodeById(id)`: Get QR code data
- `markQRCodeAsUsed(id)`: Mark QR code as used

### Pickup Log Operations
- `createPickupLog(log)`: Log pickup activity
- `getPickupLogsByStudent(studentId)`: Get pickup history

## Security Considerations

### Wallet Address Handling
- All wallet addresses are stored in lowercase
- Always validate addresses using ethers.js utilities
- Never store private keys or sensitive wallet information

### Session Management
- Sessions automatically update every 5 minutes
- Sessions are cleared when wallet disconnects
- Role-based access control through session data

### Firebase Security Rules
Configure Firestore rules to restrict access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Students - only parents can access their students
    match /students/{studentId} {
      allow read, write: if request.auth != null && 
        resource.data.parentWallet == request.auth.token.wallet;
    }
    
    // Authorizations - parents can create, pickup persons can read
    match /authorizations/{authId} {
      allow read: if request.auth != null && 
        (resource.data.parentWallet == request.auth.token.wallet ||
         resource.data.pickupWallet == request.auth.token.wallet);
      allow create: if request.auth != null && 
        request.resource.data.parentWallet == request.auth.token.wallet;
    }
    
    // User sessions - users can only access their own
    match /user-sessions/{wallet} {
      allow read, write: if request.auth != null && 
        request.auth.token.wallet == wallet;
    }
  }
}
```

## Error Handling

All functions include proper error handling:

```typescript
try {
  const result = await createStudent(studentData);
  if (result) {
    // Success
  } else {
    // Handle failure
  }
} catch (error) {
  console.error('Operation failed:', error);
  // Handle error appropriately
}
```

## Migration from Legacy firebaseUtils

If you're using the legacy `firebaseUtils.ts`, consider migrating to the new system:

```typescript
// Old way
import { addUserToFirebase, getUserByWallet } from '@/lib/firebaseUtils';

// New way
import { createUserSession, getUserSession } from '@/lib/firebase/collections';
```

## Next Steps

1. Test the Firebase connection with your project
2. Create your first student and authorization records
3. Implement QR code generation and verification
4. Set up pickup logging and audit trails
5. Configure Firebase security rules for production

For more information, refer to the individual component and hook documentation.
