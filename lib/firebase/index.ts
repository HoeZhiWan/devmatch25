/**
 * Firebase Integration Index
 * Exports Firebase configuration and utilities
 */

// Firebase configuration
export { default as firebaseApp, db, auth } from './client-config';
export { adminDb } from './admin';

// Authentication utilities
export * from './auth';
export * from './client-auth';

// Collection operations
export * from './collections';

// QR Code utilities
export * from './qr-utils';

// Legacy user utilities (consider migrating to new collections)
export * from '../firebaseUtils';
