import { ethers } from 'ethers';

// Contract address
const PICKUP_ANCHOR_ADDRESS = "0x59c4f69453c63c7002d7c8f29b8c1e033bdda825";

// Check if we're in demo mode (no deployed contract)
const isDemoMode = true; // Temporarily force demo mode for testing

// Mock storage for demo mode
const mockStorage = {
  authorizations: new Map<string, number>(),
  pickups: new Map<string, number>()
};

// Get contract instance (read or write) - only called when needed
async function getPickupAnchorContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  if (isDemoMode) {
    throw new Error('Contract not deployed - using demo mode');
  }
  
  // Dynamic import to avoid loading during initial render
  const { default: PickupAnchorABI } = await import('./PickupAnchorABI.json');
  
  // Validate contract address format
  if (!ethers.isAddress(PICKUP_ANCHOR_ADDRESS)) {
    throw new Error('Invalid contract address format');
  }
  
  return new ethers.Contract(PICKUP_ANCHOR_ADDRESS, PickupAnchorABI, signerOrProvider);
}

// Anchor a hash as an authorization (parent signs)
export async function logAuthorization(hash: string) {
  // Always use mock mode for testing
  console.log('Demo Mode: Logging authorization hash:', hash);
  mockStorage.authorizations.set(hash, Math.floor(Date.now() / 1000));
  return `0x${Math.random().toString(16).substr(2, 64)}`; // Mock transaction hash
}

// Anchor a hash as a pickup (staff signs)
export async function logPickup(hash: string) {
  // Always use mock mode for testing
  console.log('Demo Mode: Logging pickup hash:', hash);
  mockStorage.pickups.set(hash, Math.floor(Date.now() / 1000));
  return `0x${Math.random().toString(16).substr(2, 64)}`; // Mock transaction hash
}

// Verify a hash (returns timestamp if anchored, 0 if not)
export async function verifyHash(hash: string) {
  // Always use mock mode for testing
  const authTimestamp = mockStorage.authorizations.get(hash);
  const pickupTimestamp = mockStorage.pickups.get(hash);
  return authTimestamp || pickupTimestamp || 0;
}

// Demo mode helper function - made safer for initial render
export function isInDemoMode() {
  try {
    return isDemoMode;
  } catch (error) {
    console.error('Error checking demo mode:', error);
    return true; // Default to demo mode if there's an error
  }
}

// Network validation helper
export async function validateNetwork() {
  // Mock network validation for testing
  console.log('Demo Mode: Network validation skipped');
  return { name: 'Demo Network', chainId: BigInt(1) };
}