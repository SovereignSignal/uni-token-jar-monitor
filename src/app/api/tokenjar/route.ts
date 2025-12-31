import { NextResponse } from "next/server";
import { getTokenJarBalances } from "@/lib/ethereum";
import { priceTokenBalances } from "@/lib/pricing";
import { calculateProfitability, type ProfitabilityData } from "@/lib/profitability";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export interface TokenJarApiResponse {
  success: boolean;
  data?: ProfitabilityData;
  error?: string;
}

export async function GET(): Promise<NextResponse<TokenJarApiResponse>> {
  try {
    // Fetch token balances from TokenJar (using free RPC providers)
    const balances = await getTokenJarBalances();

    // Price the tokens
    const pricedBalances = await priceTokenBalances(balances);

    // Calculate profitability
    const profitabilityData = calculateProfitability(pricedBalances);

    return NextResponse.json({
      success: true,
      data: profitabilityData,
    });
  } catch (error) {
    console.error("TokenJar API error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
