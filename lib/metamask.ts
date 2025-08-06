/**
 * MetaMask integration utilities
 * Re-exports wallet functionality for backward compatibility
 */

// Re-export ethers utilities
export { verifyMessage } from 'ethers';

/**
 * Legacy function for backward compatibility
 * @deprecated Use verifySignature from wallet/signature instead
 */
export async function verifySignature(message: string, signature: string) {
  try {
    const { verifyMessage } = await import('ethers');
    const signerAddr = verifyMessage(message, signature);
    return signerAddr;
  } catch (err) {
    console.error("Signature verification failed:", err);
    return null;
  }
}
