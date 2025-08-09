# Updated Firebase Collections Structure

This document describes the new Firebase collections structure for the DevMatch25 pickup authorization system.

## Collections Overview

### 1. `users` Collection
- **Document ID**: Wallet address (lowercase hex)
- **Purpose**: Stores user information including role and pickup authorizations

```typescript
interface User {
  id: string; // Wallet address (lowercase hex)
  walletAddress: string; // Wallet address (lowercase hex)
  name: string;
  contactNumber?: string;
  role: 'parent' | 'pickup_person' | 'staff';
  createdAt: Date;
  lastLoginAt: Date;
  // Pickup collection exists only when role is 'parent'
  pickup?: Record<string, PickupPerson>; // Key is pickup person's wallet address
}
```

### 2. `students` Collection
- **Document ID**: Student ID (e.g., "CH001")
- **Purpose**: Stores student information

```typescript
interface Student {
  id: string; // Format: "CH001"
  name: string;
  grade: string;
  parentId: string; // Parent wallet address (lowercase hex)
  createdAt: Date;
}
```

### 3. `pickupHistory` Collection
- **Document ID**: Auto-generated random ID
- **Purpose**: Records completed pickup transactions

```typescript
interface PickupHistory {
  id: string; // Random ID
  blockchainHash: string;
  contractTxHash: string;
  pickupBy: string; // Pickup person wallet address
  staffId: string; // Staff wallet address
  studentId: string; // Student ID
  time: Date;
}
```

### 4. `authorizationRecords` Collection
- **Document ID**: Auto-generated authorization ID
- **Purpose**: Stores QR code authorization records for verification

```typescript
interface AuthorizationRecord {
  id: string;
  qrCodeId: string;
  hash: string; // Hash for verification
  studentId: string;
  pickupWallet: string; // Pickup person's wallet
  parentWallet: string; // Parent's wallet
  generatedAt: Date;
  expiresAt: Date;
  isUsed: boolean;
  isActive: boolean;
}
```

## QR Code Structure

QR codes contain minimal data for fast scanning:

```typescript
interface QRCodeContent {
  id: string; // Authorization record ID
  hash: string; // Verification hash
}
```

### Example QR Code Data:
```json
{
  "id": "auth123abc",
  "hash": "a1b2c3d4e5f6g7h8"
}
```

## API Endpoints

### QR Code Management
- `POST /api/qr/generate` - Generate QR code for pickup
- `POST /api/qr/verify` - Verify scanned QR code

### Pickup Authorization Management
- `POST /api/pickup/authorize` - Add pickup person authorization
- `DELETE /api/pickup/authorize` - Remove pickup person authorization
- `GET /api/pickup/authorize` - Get parent's pickup authorizations

### Testing
- `GET /api/test/firebase-new` - Test new Firebase collections

## Key Features

### 1. Simplified QR Codes
- QR codes only contain ID and hash
- Minimal data for fast scanning
- Server-side verification for security

### 2. Nested Pickup Authorizations
- Pickup persons stored within parent user document
- Date-based authorization validity
- Relationship tracking

### 3. Audit Trail
- Complete pickup history with blockchain hashes
- Staff accountability
- Timestamp tracking

### 4. Secure Verification
- HMAC-based hash generation
- One-time use QR codes
- Expiration handling

## Security Considerations

1. **Hash Generation**: Uses HMAC-SHA256 with secret key
2. **One-time Use**: QR codes marked as used after scanning
3. **Expiration**: Default 5-minute expiration for QR codes
4. **Authorization Validation**: Server-side verification of all permissions
5. **Audit Trail**: Complete history of all pickup activities

## Migration Notes

The new structure maintains backward compatibility with existing collections:
- Legacy `authorizations` collection still supported
- Legacy `pickup-logs` collection still supported
- Legacy `user-sessions` collection still supported

## Environment Variables

Add to your `.env.local`:
```bash
# QR Code Security
QR_SECRET_KEY=your-secret-key-for-qr-hashing

# Firebase Configuration (existing)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
# ... other Firebase config
```

## Usage Examples

### Generate QR Code
```typescript
// Frontend - Pickup person generates QR code
const response = await fetch('/api/qr/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    studentId: 'CH001',
    idToken: userIdToken,
  }),
});
```

### Verify QR Code
```typescript
// Frontend - Staff scans and verifies QR code
const response = await fetch('/api/qr/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    qrCodeData: scannedQRData,
    idToken: staffIdToken,
  }),
});
```

### Add Pickup Authorization
```typescript
// Frontend - Parent authorizes pickup person
const response = await fetch('/api/pickup/authorize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    pickupWallet: '0x123...abc',
    relationship: 'Uncle',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    idToken: parentIdToken,
  }),
});
```
