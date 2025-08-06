/**
 * Wallet Integration Index
 * Exports all wallet-related components, hooks, and utilities
 */

// Wallet Connection Utilities
export * from './connection';
export * from './signature';
export * from './backend-verification';

// Re-export ethers.js utilities that we commonly use
export { verifyMessage, BrowserProvider } from 'ethers';
