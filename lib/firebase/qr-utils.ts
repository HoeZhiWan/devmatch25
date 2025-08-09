import crypto from 'crypto';
import type { QRCodeContent, AuthorizationRecord } from '@/types/database';

/**
 * Generates a secure hash for QR code verification
 */
export const generateQRHash = (
  studentId: string,
  pickupWallet: string,
  timestamp: number,
  secret?: string
): string => {
  const secretKey = secret || process.env.QR_SECRET_KEY || 'default-secret-key';
  const data = `${studentId}-${pickupWallet.toLowerCase()}-${timestamp}`;
  
  return crypto
    .createHmac('sha256', secretKey)
    .update(data)
    .digest('hex')
    .substring(0, 16); // Shorter hash for QR code
};

/**
 * Generates a unique QR code ID
 */
export const generateQRCodeId = (): string => {
  return crypto.randomBytes(8).toString('hex');
};

/**
 * Creates QR code content object for encoding
 */
export const createQRCodeContent = (authorizationId: string, hash: string): QRCodeContent => {
  return {
    id: authorizationId,
    hash: hash,
  };
};

/**
 * Converts QR code content to JSON string for encoding
 */
export const encodeQRContent = (content: QRCodeContent): string => {
  return JSON.stringify(content);
};

/**
 * Parses QR code string back to content object
 */
export const parseQRCodeContent = (qrData: string): QRCodeContent | null => {
  try {
    const parsed = JSON.parse(qrData);
    if (parsed.id && parsed.hash && typeof parsed.id === 'string' && typeof parsed.hash === 'string') {
      return {
        id: parsed.id,
        hash: parsed.hash,
      };
    }
    return null;
  } catch (error) {
    console.error('Error parsing QR code content:', error);
    return null;
  }
};

/**
 * Validates QR code format and structure
 */
export const validateQRCodeFormat = (qrData: string): boolean => {
  const content = parseQRCodeContent(qrData);
  return content !== null && content.id.length > 0 && content.hash.length > 0;
};

/**
 * Checks if authorization record is still valid for use
 */
export const isAuthorizationValid = (record: AuthorizationRecord): boolean => {
  const now = new Date();
  return (
    record.isActive &&
    !record.isUsed &&
    now < record.expiresAt
  );
};

/**
 * Calculates expiration time for QR codes (default 5 minutes)
 */
export const calculateExpirationTime = (minutesFromNow: number = 5): Date => {
  const expiration = new Date();
  expiration.setMinutes(expiration.getMinutes() + minutesFromNow);
  return expiration;
};

/**
 * Generates blockchain transaction hash placeholder
 */
export const generateBlockchainHash = (): string => {
  return '0x' + crypto.randomBytes(32).toString('hex');
};

/**
 * Generates contract transaction hash placeholder
 */
export const generateContractTxHash = (): string => {
  return '0x' + crypto.randomBytes(32).toString('hex');
};
