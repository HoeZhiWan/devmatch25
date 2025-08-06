import { NextRequest, NextResponse } from "next/server";
import { verifySignature } from "@/lib/wallet/signature";
import { getUserByWallet } from "@/lib/firebaseUtils";

export async function POST(req: NextRequest) {
  try {
    const { message, signature, expectedAddress } = await req.json();

    if (!message || !signature || !expectedAddress) {
      return NextResponse.json(
        { error: "Missing required parameters: message, signature, and expectedAddress" },
        { status: 400 }
      );
    }

    // Verify the signature using your wallet integration
    const verificationResult = verifySignature({
      message,
      signature,
      expectedAddress: expectedAddress.toLowerCase()
    });

    if (!verificationResult.isValid) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // Get user from Firebase
    const user = await getUserByWallet(expectedAddress);
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found. Please complete registration first." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      walletAddress: verificationResult.recoveredAddress,
      user: {
        walletAddress: user.walletAddress,
        role: user.role,
        name: user.name
      }
    });

  } catch (error) {
    console.error('Login verification error:', error);
    return NextResponse.json(
      { error: "Internal server error during authentication" },
      { status: 500 }
    );
  }
}
