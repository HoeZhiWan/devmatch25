// Server-side Firebase configuration for API routes
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin (for server-side usage)
const firebaseAdminConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // Add other admin-specific configuration if needed
};

// Validate required configuration
if (!firebaseAdminConfig.projectId) {
  console.error('Firebase Admin configuration is missing projectId');
  throw new Error('Firebase Admin configuration is incomplete. Check your .env.local file.');
}

// Initialize Firebase Admin (prevent multiple initialization)
let adminApp;
if (getApps().length === 0) {
  // In development or when no service account key is provided,
  // we can initialize with just the project ID for Firestore
  adminApp = initializeApp(firebaseAdminConfig);
} else {
  adminApp = getApps()[0];
}

// Initialize Firestore
export const adminDb = getFirestore(adminApp);

export default adminApp;
