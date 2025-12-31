import { NextResponse } from "next/server";
import { getTokenJarBalances } from "@/lib/ethereum";
import { priceTokenBalances } from "@/lib/pricing";
import { calculateProfitability, type ProfitabilityData } from "@/lib/profitability";
import { serverCache, CACHE_KEYS, CACHE_TTL } from "@/lib/cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export interface TokenJarApiResponse {
  success: boolean;
  data?: ProfitabilityData & {
    dataSource: string;
    cacheStatus: "fresh" | "stale" | "miss";
    dataAge: number; // seconds since data was fetched
  };
  error?: string;
}

// Background refresh flag to prevent multiple simultaneous refreshes
let isRefreshing = false;

async function fetchFreshData(): Promise<ProfitabilityData> {
  // Fetch token balances from TokenJar
  const balances = await getTokenJarBalances();

  // Price the tokens
  const pricedBalances = await priceTokenBalances(balances);

  // Calculate profitability
  const profitabilityData = calculateProfitability(pricedBalances);

  return profitabilityData;
}

async function refreshInBackground(): Promise<void> {
  if (isRefreshing) return;
  
  isRefreshing = true;
  try {
    const freshData = await fetchFreshData();
    serverCache.set(CACHE_KEYS.PROFITABILITY_DATA, freshData, CACHE_TTL.PROFITABILITY_DATA);
    console.log("Cache refreshed successfully");
  } catch (error) {
    console.error("Background refresh failed:", error);
  } finally {
    isRefreshing = false;
  }
}

export async function GET(): Promise<NextResponse<TokenJarApiResponse>> {
  try {
    // Check cache first
    const cached = serverCache.get<ProfitabilityData>(CACHE_KEYS.PROFITABILITY_DATA);
    const isExpired = serverCache.isExpired(CACHE_KEYS.PROFITABILITY_DATA);

    if (cached && !isExpired) {
      // Fresh cache hit - return immediately
      const dataAge = Math.floor((Date.now() - cached.timestamp) / 1000);
      return NextResponse.json({
        success: true,
        data: {
          ...cached.data,
          dataSource: "llamarpc.com (cached)",
          cacheStatus: "fresh",
          dataAge,
        },
      });
    }

    if (cached && isExpired) {
      // Stale cache - return stale data but trigger background refresh
      const dataAge = Math.floor((Date.now() - cached.timestamp) / 1000);
      
      // Trigger background refresh (don't await)
      refreshInBackground();

      return NextResponse.json({
        success: true,
        data: {
          ...cached.data,
          dataSource: "llamarpc.com (cached, refreshing...)",
          cacheStatus: "stale",
          dataAge,
        },
      });
    }

    // Cache miss - fetch fresh data
    const freshData = await fetchFreshData();
    
    // Store in cache
    serverCache.set(CACHE_KEYS.PROFITABILITY_DATA, freshData, CACHE_TTL.PROFITABILITY_DATA);

    return NextResponse.json({
      success: true,
      data: {
        ...freshData,
        dataSource: "llamarpc.com (live)",
        cacheStatus: "miss",
        dataAge: 0,
      },
    });
  } catch (error) {
    console.error("TokenJar API error:", error);

    // If we have stale cache, return it on error
    const cached = serverCache.get<ProfitabilityData>(CACHE_KEYS.PROFITABILITY_DATA);
    if (cached) {
      const dataAge = Math.floor((Date.now() - cached.timestamp) / 1000);
      return NextResponse.json({
        success: true,
        data: {
          ...cached.data,
          dataSource: "llamarpc.com (cached, error on refresh)",
          cacheStatus: "stale",
          dataAge,
        },
      });
    }

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
