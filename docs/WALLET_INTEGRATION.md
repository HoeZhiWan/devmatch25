# Wallet Integration - KidGuard

This module provides comprehensive MetaMask wallet integration for the KidGuard application, including wallet connection, message signing, and signature verification functionality.

## 🚀 Features

- **MetaMask Integration**: Seamless wallet connection and management
- **Signature Authentication**: Sign and verify messages for secure authorization
- **Network Validation**: Support for multiple Ethereum networks
- **TypeScript Support**: Full type safety and IntelliSense
- **React Hooks**: Easy-to-use hooks for wallet state management
- **Server-side Verification**: Backend signature verification for security
- **Mobile Responsive**: Works across desktop and mobile devices
- **Error Handling**: Comprehensive error handling and user feedback

## 📦 Components

### WalletConnect
Handles MetaMask wallet connection UI and user interactions.

```tsx
import { WalletConnect } from './components/wallet';

<WalletConnect 
  onConnect={(address) => console.log('Connected:', address)}
  onDisconnect={() => console.log('Disconnected')}
  showNetworkInfo={true}
/>
```

### AuthorizationSigner
Creates and signs pickup authorization messages.

```tsx
import { AuthorizationSigner } from './components/wallet';

<AuthorizationSigner
  studentId="STD001"
  studentName="Emma Johnson"
  pickupWallet="0x742d35Cc6075C2532C2C43E1e7C5E62Ca28a79fd"
  onAuthorizationSigned={(signature, message) => {
    // Handle signed authorization
  }}
/>
```

## 🎣 Hooks

### useWallet()
Manages wallet connection state and operations.

```tsx
import { useWallet } from './hooks';

const {
  isConnected,
  address,
  provider,
  chainId,
  isLoading,
  error,
  connect,
  disconnect
} = useWallet();
```

### useSignature()
Handles message signing and verification operations.

```tsx
import { useSignature } from './hooks';

const {
  sign,
  signAuthorization,
  verify,
  isLoading,
  error,
  lastSignature
} = useSignature();
```

## 🔧 Utilities

### Connection Utilities
```tsx
import { 
  isMetaMaskInstalled,
  connectWallet,
  formatAddress,
  isValidAddress
} from './lib/wallet';
```

### Signature Utilities
```tsx
import {
  signMessage,
  verifySignature,
  createAuthorizationMessage
} from './lib/wallet';
```

## 🌐 API Endpoints

### POST /api/auth/connect-wallet
Verifies wallet connection and optional signature.

```typescript
// Request
{
  "address": "0x742d35Cc6075C2532C2C43E1e7C5E62Ca28a79fd",
  "signature": "0x...", // optional
  "message": "..." // optional
}

// Response
{
  "success": true,
  "address": "0x742d35cc6075c2532c2c43e1e7c5e62ca28a79fd",
  "timestamp": 1642781234567
}
```

### POST /api/auth/verify-signature
Server-side signature verification.

```typescript
// Request
{
  "message": "Authorization message...",
  "signature": "0x...",
  "expectedAddress": "0x742d35Cc6075C2532C2C43E1e7C5E62Ca28a79fd"
}

// Response
{
  "success": true,
  "isValid": true,
  "recoveredAddress": "0x742d35cc6075c2532c2c43e1e7c5e62ca28a79fd",
  "timestamp": 1642781234567
}
```

## 💼 Usage Examples

### Basic Wallet Connection
```tsx
'use client';

import { WalletConnect } from './components/wallet';
import { useWallet } from './hooks';

export default function MyComponent() {
  const { isConnected, address } = useWallet();

  return (
    <div>
      <WalletConnect />
      {isConnected && (
        <p>Connected: {address}</p>
      )}
    </div>
  );
}
```

### Authorization Workflow
```tsx
'use client';

import { AuthorizationSigner } from './components/wallet';
import { useSignature } from './hooks';

export default function AuthorizationPage() {
  const { signAuthorization } = useSignature();

  const handleCreateAuthorization = async () => {
    const result = await signAuthorization({
      pickupWallet: '0x742d35Cc6075C2532C2C43E1e7C5E62Ca28a79fd',
      studentId: 'STD001',
      studentName: 'Emma Johnson',
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    });

    if (result.success) {
      console.log('Authorization signed:', result.signature);
    }
  };

  return (
    <div>
      <AuthorizationSigner
        studentId="STD001"
        studentName="Emma Johnson" 
        pickupWallet="0x742d35Cc6075C2532C2C43E1e7C5E62Ca28a79fd"
        onAuthorizationSigned={(signature, message) => {
          // Send to backend for processing
          console.log('Signed authorization:', { signature, message });
        }}
      />
    </div>
  );
}
```

### Server-side Verification
```typescript
// In your API route
import { verifyMessage } from 'ethers';

export async function POST(request: Request) {
  const { message, signature, expectedAddress } = await request.json();
  
  try {
    const recoveredAddress = verifyMessage(message, signature);
    const isValid = recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
    
    return Response.json({ isValid, recoveredAddress });
  } catch (error) {
    return Response.json({ isValid: false, error: 'Invalid signature' });
  }
}
```

## 🔒 Security Considerations

1. **Always verify signatures server-side** - Never trust client-side verification alone
2. **Validate message format** - Ensure authorization messages follow the expected structure
3. **Check address format** - Validate Ethereum address format before processing
4. **Use lowercase addresses** - Normalize addresses for consistent comparison
5. **Implement rate limiting** - Prevent abuse of authentication endpoints
6. **Log authentication attempts** - Monitor for suspicious activity

## 🌍 Supported Networks

- Ethereum Mainnet (Chain ID: 1)
- Ethereum Sepolia Testnet (Chain ID: 11155111)
- Hardhat Local Network (Chain ID: 1337)

Additional networks can be configured in `types/wallet.ts`.

## 📱 Mobile Support

All components are fully responsive and work on mobile devices. The wallet connection flow is optimized for mobile MetaMask app integration.

## 🛠️ Development

### Prerequisites
- Node.js 18+
- MetaMask browser extension
- ethers.js v6+

### Installation
```bash
npm install ethers@^6.15.0
```

### Development Server
```bash
npm run dev
```

Visit `http://localhost:3000/wallet-demo` to see the integration in action.

## 📋 Type Definitions

All types are defined in `types/wallet.ts`:

- `WalletState` - Wallet connection state
- `SignatureResult` - Signature operation result  
- `AuthorizationMessage` - Authorization message structure
- `WalletError` - Error handling types

## 🤝 Contributing

1. Follow the existing code structure and patterns
2. Add proper TypeScript types for all new functionality
3. Include error handling for all wallet operations
4. Test on multiple browsers and devices
5. Update documentation for any API changes

## 📄 License

This wallet integration is part of the KidGuard project and follows the same licensing terms.

---

**Member 3 - Tony** - Wallet Integration & Signature Authentication
Tech Stack: React, Next.js, ethers.js, MetaMask, TypeScript
