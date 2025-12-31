import { NextResponse } from "next/server";
import { getDuneFeeSummary, isDuneConfigured } from "@/lib/dune";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export interface DuneApiResponse {
  success: boolean;
  configured: boolean;
  data?: {
    tokenJarBalanceUsd: number;
    unclaimedValueUsd: number;
    collectibleUsd: number;
    tokenCount: number;
    topTokens: Array<{
      symbol: string;
      tokenjarUsd: number;
      unclaimedUsd: number;
    }>;
    lastUpdated: number;
  };
  error?: string;
}

export async function GET(): Promise<NextResponse<DuneApiResponse>> {
  if (!isDuneConfigured()) {
    return NextResponse.json({
      success: false,
      configured: false,
      error: "DUNE_API_KEY not configured",
    });
  }

  try {
    const feeSummary = await getDuneFeeSummary();

    if (!feeSummary) {
      return NextResponse.json({
        success: false,
        configured: true,
        error: "Failed to fetch Dune data",
      });
    }

    // Get top 10 tokens by total value
    const topTokens = feeSummary.tokens
      .map((t) => ({
        symbol: t.token_symbol,
        tokenjarUsd: t.tokenjar_balance_usd || 0,
        unclaimedUsd: t.unclaimed_balance_usd || 0,
      }))
      .sort((a, b) => (b.tokenjarUsd + b.unclaimedUsd) - (a.tokenjarUsd + a.unclaimedUsd))
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      configured: true,
      data: {
        tokenJarBalanceUsd: feeSummary.tokenJarBalanceUsd,
        unclaimedValueUsd: feeSummary.unclaimedValueUsd,
        collectibleUsd: feeSummary.collectibleUsd,
        tokenCount: feeSummary.tokens.length,
        topTokens,
        lastUpdated: feeSummary.lastUpdated,
      },
    });
  } catch (error) {
    console.error("Dune API error:", error);
    return NextResponse.json(
      {
        success: false,
        configured: true,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
