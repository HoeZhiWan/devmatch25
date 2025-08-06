import { NextRequest, NextResponse } from "next/server";
import { verifySignature } from "@/lib/metamask";

export async function POST(req: NextRequest) {
  const { message, signature } = await req.json();

  const walletAddress = await verifySignature(message, signature);
  if (!walletAddress) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  return NextResponse.json({ walletAddress });
}
