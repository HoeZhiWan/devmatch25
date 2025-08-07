# Authentication System Refactor

## Overview

The authentication system has been completely refactored to provide:

1. **Automatic sign-in** when wallet is connected
2. **Modular components** for easier debugging and maintenance
3. **Better error handling** and user feedback
4. **Comprehensive debugging tools**

## New Components

### 1. WalletConnection (`/components/WalletConnection.tsx`)

A reusable component for MetaMask wallet connection with:
- Connection status display
- Auto-connect functionality
- Error handling and user feedback
- Network validation

**Props:**
```typescript
interface WalletConnectionProps {
  onConnectionChange?: (isConnected: boolean, address?: string) => void;
  showStatus?: boolean;
  autoConnect?: boolean;
}
```

**Usage:**
```tsx
<WalletConnection
  onConnectionChange={(isConnected, address) => {
    console.log('Wallet connection changed:', { isConnected, address });
  }}
  showStatus={true}
  autoConnect={false}
/>
```

### 2. RoleSelection (`/components/RoleSelection.tsx`)

A component for user role selection during registration:
- Visual role cards with icons and descriptions
- Loading states
- Error display
- Customizable title and description

**Props:**
```typescript
interface RoleSelectionProps {
  onRoleSelect: (role: UserRole) => void;
  isLoading?: boolean;
  error?: string | null;
  title?: string;
  description?: string;
}
```

**Usage:**
```tsx
<RoleSelection
  onRoleSelect={(role) => console.log('Selected role:', role)}
  isLoading={false}
  error={null}
  title="Select Your Role"
  description="Choose your role in the system"
/>
```

### 3. AuthenticationWrapper (`/components/AuthenticationWrapper.tsx`)

The main authentication flow component that:
- Automatically attempts sign-in when wallet connects
- Handles new user registration with role selection
- Manages authentication states
- Provides comprehensive error handling

**Props:**
```typescript
interface AuthenticationWrapperProps {
  onAuthenticated?: (user: any) => void;
  autoSignIn?: boolean;
  redirectOnSuccess?: string;
  showDebugInfo?: boolean;
}
```

**Usage:**
```tsx
<AuthenticationWrapper
  autoSignIn={true}
  redirectOnSuccess="/dashboard"
  showDebugInfo={process.env.NODE_ENV === 'development'}
  onAuthenticated={(user) => {
    console.log('User authenticated:', user);
  }}
/>
```

## Updated Login Page

The login page (`/app/login/page.tsx`) is now much simpler and uses the `AuthenticationWrapper` component:

```tsx
export default function LoginPage() {
  return (
    <AuthenticationWrapper
      autoSignIn={true}
      redirectOnSuccess="/dashboard"
      showDebugInfo={process.env.NODE_ENV === 'development'}
      onAuthenticated={(user) => {
        console.log('User authenticated in login page:', user);
      }}
    />
  );
}
```

## Debug Page

A comprehensive debug page (`/app/auth-debug/page.tsx`) provides:

### Debug Views:
1. **Wallet Connection** - Test wallet connection functionality
2. **Authentication** - Test login/logout with different roles
3. **Components** - Test individual components in isolation
4. **Full Flow** - Test the complete authentication flow

### Features:
- Real-time state monitoring
- Quick action buttons
- Browser environment information
- Error clearing and state reset

### Access:
Visit `http://localhost:3000/auth-debug` during development

## Automatic Sign-In Flow

The new system automatically attempts to sign in users when their wallet is connected:

1. **Wallet Detection**: Checks if MetaMask is installed and connected
2. **Auto Sign-In**: Attempts to authenticate existing users automatically
3. **New User Handling**: Shows role selection for users not found in the database
4. **Error Recovery**: Provides clear error messages and retry options

## Key Features

### Automatic Authentication
- When a wallet connects, the system automatically tries to sign in the user
- If the user exists in Firebase, they're logged in immediately
- If the user doesn't exist, they're prompted to select a role

### Enhanced Error Handling
- Clear, user-friendly error messages
- Automatic retry mechanisms
- Network validation warnings
- MetaMask installation detection

### Debugging Capabilities
- Comprehensive debug page with multiple views
- Real-time state monitoring
- Component isolation testing
- Browser environment diagnostics

### Modular Architecture
- Reusable components for different use cases
- Clean separation of concerns
- Easy to test and maintain
- Configurable behavior through props

## Testing the Implementation

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test automatic sign-in:**
   - Go to `/login`
   - Connect your MetaMask wallet
   - If you're an existing user, you'll be signed in automatically
   - If you're a new user, you'll see role selection

3. **Use the debug page:**
   - Go to `/auth-debug`
   - Test individual components
   - Monitor real-time state changes
   - Use quick actions for testing scenarios

4. **Test different scenarios:**
   - Connect/disconnect wallet
   - Switch MetaMask accounts
   - Change networks
   - Clear browser storage

## Security Considerations

- All wallet addresses are stored in lowercase for consistency
- Signature verification happens on both client and server
- One-time nonces prevent replay attacks
- Network validation ensures supported chains
- No private keys or sensitive data stored client-side

## Development Workflow

1. Use the debug page for component testing
2. Check browser console for detailed logging
3. Monitor real-time state changes
4. Test edge cases like network switches and account changes
5. Verify error handling and recovery mechanisms
