import { ethers } from "ethers";

export async function verifySignature(message: string, signature: string) {
  try {
    const signerAddr = ethers.verifyMessage(message, signature);
    return signerAddr;
  } catch (err) {
    console.error("Signature verification failed:", err);
    return null;
  }
}
