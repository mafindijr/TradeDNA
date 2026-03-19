import { NextResponse } from "next/server";
import { analyzeWallet } from "../../../lib/services/walletAnalysis";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const address = typeof body?.address === "string" ? body.address.trim() : "";

    if (!address) {
      return NextResponse.json(
        { error: "Wallet address is required." },
        { status: 400 }
      );
    }

    const result = await analyzeWallet(address);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to analyze wallet.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
