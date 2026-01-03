import { NextRequest, NextResponse } from "next/server";
import { getDuneFeeSummary, isDuneConfigured, getRawDuneData, getRawPoolData, getRawSummaryData } from "@/lib/dune";

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

export async function GET(request: NextRequest): Promise<NextResponse<DuneApiResponse | { debug: unknown } | { debug_pools: unknown } | { debug_summary: unknown }>> {
  if (!isDuneConfigured()) {
    return NextResponse.json({
      success: false,
      configured: false,
      error: "DUNE_API_KEY not configured",
    });
  }

  // Debug mode - return raw data structure
  const debug = request.nextUrl.searchParams.get("debug");
  if (debug === "true") {
    const rawData = await getRawDuneData();
    return NextResponse.json({ debug: rawData });
  }

  // Pool debug mode
  const poolDebug = request.nextUrl.searchParams.get("debug_pools");
  if (poolDebug === "true") {
    const poolData = await getRawPoolData();
    return NextResponse.json({ debug_pools: poolData });
  }

  // Summary debug mode
  const summaryDebug = request.nextUrl.searchParams.get("debug_summary");
  if (summaryDebug === "true") {
    const summaryData = await getRawSummaryData();
    return NextResponse.json({ debug_summary: summaryData });
  }

  // Force refresh parameter to bypass cache
  const forceRefresh = request.nextUrl.searchParams.get("refresh") === "true";

  try {
    const feeSummary = await getDuneFeeSummary(forceRefresh);

    if (!feeSummary) {
      return NextResponse.json({
        success: false,
        configured: true,
        error: "Failed to fetch Dune data",
      });
    }

    // Get top 10 tokens by total value
    const topTokens = feeSummary.tokens
      .map((t) => {
        // Extract symbol from HTML if needed (e.g., "<a href='...'>USDT</a>" -> "USDT")
        let symbol = t.symbol || "Unknown";
        const match = symbol.match(/>([^<]+)</);
        if (match) {
          symbol = match[1];
        }
        return {
          symbol,
          tokenjarUsd: Number(t.value_usd) || 0,
          unclaimedUsd: 0, // Not separated in this query
        };
      })
      .sort((a, b) => b.tokenjarUsd - a.tokenjarUsd)
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
