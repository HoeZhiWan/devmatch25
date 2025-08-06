/**
 * Smart Contract integration utilities
 * Handles contract interactions for role management and authorization anchoring
 */

import { ethers, BrowserProvider } from "ethers";

// Contract configuration
export const CONTRACT_ADDRESS = "0x59c4f69453c63c7002d7c8f29b8c1e033bdda825"; 

// Contract ABI for role management
export const CONTRACT_ABI = [
  "function getRole(address user) view returns (uint8)",
  "function authorizePickup(bytes32 hash, address pickupPerson) external",
  "function verifyAuthorization(bytes32 hash, address pickupPerson) view returns (bool)",
  "function isAuthorized(address user, uint8 role) view returns (bool)"
];

// Role definitions to match smart contract
export enum ContractRole {
  NONE = 0,
  PARENT = 1,
  STAFF = 2,
  PICKUP = 3
}

/**
 * Gets contract instance with signer or provider
 */
export function getContract(signerOrProvider: ethers.Signer | ethers.Provider): ethers.Contract {
  if (!ethers.isAddress(CONTRACT_ADDRESS)) {
    throw new Error('Invalid contract address format');
  }
  
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerOrProvider);
}

/**
 * Gets user role from smart contract
 */
export async function getContractUserRole(
  provider: BrowserProvider, 
  userAddress: string
): Promise<ContractRole> {
  try {
    if (!ethers.isAddress(userAddress)) {
      throw new Error('Invalid user address format');
    }

    const contract = getContract(provider);
    const role = await contract.getRole(userAddress.toLowerCase());
    return Number(role) as ContractRole;
  } catch (error) {
    console.error('Error getting user role from contract:', error);
    return ContractRole.NONE;
  }
}

/**
 * Authorizes a pickup on the smart contract (parent action)
 */
export async function authorizePickupOnContract(
  signer: ethers.Signer,
  authorizationHash: string,
  pickupPersonAddress: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    if (!ethers.isAddress(pickupPersonAddress)) {
      throw new Error('Invalid pickup person address format');
    }

    const contract = getContract(signer);
    const tx = await contract.authorizePickup(
      ethers.keccak256(ethers.toUtf8Bytes(authorizationHash)),
      pickupPersonAddress.toLowerCase()
    );
    
    await tx.wait();
    
    return {
      success: true,
      txHash: tx.hash
    };
  } catch (error: any) {
    console.error('Error authorizing pickup on contract:', error);
    return {
      success: false,
      error: error.message || 'Failed to authorize pickup on contract'
    };
  }
}

/**
 * Verifies pickup authorization on smart contract
 */
export async function verifyPickupAuthorization(
  provider: BrowserProvider,
  authorizationHash: string,
  pickupPersonAddress: string
): Promise<boolean> {
  try {
    if (!ethers.isAddress(pickupPersonAddress)) {
      throw new Error('Invalid pickup person address format');
    }

    const contract = getContract(provider);
    const isValid = await contract.verifyAuthorization(
      ethers.keccak256(ethers.toUtf8Bytes(authorizationHash)),
      pickupPersonAddress.toLowerCase()
    );
    
    return Boolean(isValid);
  } catch (error) {
    console.error('Error verifying pickup authorization:', error);
    return false;
  }
}

/**
 * Checks if user is authorized for a specific role
 */
export async function isUserAuthorized(
  provider: BrowserProvider,
  userAddress: string,
  requiredRole: ContractRole
): Promise<boolean> {
  try {
    if (!ethers.isAddress(userAddress)) {
      throw new Error('Invalid user address format');
    }

    const contract = getContract(provider);
    const isAuthorized = await contract.isAuthorized(
      userAddress.toLowerCase(),
      requiredRole
    );
    
    return Boolean(isAuthorized);
  } catch (error) {
    console.error('Error checking user authorization:', error);
    return false;
  }
}

/**
 * Converts string role to contract role enum
 */
export function stringToContractRole(role: string): ContractRole {
  switch (role.toLowerCase()) {
    case 'parent':
      return ContractRole.PARENT;
    case 'staff':
      return ContractRole.STAFF;
    case 'pickup':
      return ContractRole.PICKUP;
    default:
      return ContractRole.NONE;
  }
}

/**
 * Converts contract role enum to string
 */
export function contractRoleToString(role: ContractRole): string {
  switch (role) {
    case ContractRole.PARENT:
      return 'parent';
    case ContractRole.STAFF:
      return 'staff';
    case ContractRole.PICKUP:
      return 'pickup';
    default:
      return 'none';
  }
}
