import { NextResponse } from "next/server";
import { getTokenJarBalances, getDataSource } from "@/lib/ethereum";
import { priceTokenBalances } from "@/lib/pricing";
import { calculateProfitability, type ProfitabilityData } from "@/lib/profitability";
import { serverCache, CACHE_KEYS, CACHE_TTL } from "@/lib/cache";
import { getDuneFeeSummary, isDuneConfigured, type TopPool } from "@/lib/dune";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export interface DuneDataResponse {
  // USD values
  tokenJarBalanceUsd: number;
  unclaimedValueUsd: number;
  collectibleUsd: number;
  // UNI values
  tokenJarBalanceUni: number;
  unclaimedValueUni: number;
  collectibleUni: number;
  // Threshold tracking
  uniToThreshold: number; // How many UNI until the 4000 burn threshold
  // Counts
  tokenCount: number;
  poolCount: number;
  // Top pools
  topPools: TopPool[];
}

export interface TokenJarApiResponse {
  success: boolean;
  data?: ProfitabilityData & {
    dataSource: string;
    dataSourceType?: "dune" | "alchemy" | "fallback";
    cacheStatus: "fresh" | "stale" | "miss";
    dataAge: number; // seconds since data was fetched
    duneData?: DuneDataResponse;
  };
  error?: string;
}

// Background refresh flag to prevent multiple simultaneous refreshes
let isRefreshing = false;

interface EnhancedProfitabilityData extends ProfitabilityData {
  duneData?: DuneDataResponse;
  dataSourceType: "dune" | "alchemy" | "fallback";
}

async function fetchFreshData(forceRefreshDune = false): Promise<EnhancedProfitabilityData> {
  // Fetch token balances from TokenJar (Alchemy or fallback)
  const balances = await getTokenJarBalances();

  // Price the tokens
  const pricedBalances = await priceTokenBalances(balances);

  // Calculate profitability from on-chain data
  const profitabilityData = calculateProfitability(pricedBalances);

  // Try to get accurate data from Dune Analytics
  let duneData: EnhancedProfitabilityData["duneData"] | undefined;
  let dataSourceType: EnhancedProfitabilityData["dataSourceType"] = "alchemy";

  if (isDuneConfigured()) {
    try {
      const duneFeeSummary = await getDuneFeeSummary(forceRefreshDune);
      if (duneFeeSummary) {
        // Use Dune's threshold calculation (more accurate than our own)
        // thresholdDeltaUni = UNI still needed to reach 4000 burn threshold
        const uniToThreshold = duneFeeSummary.thresholdDeltaUni;

        duneData = {
          // USD values
          tokenJarBalanceUsd: duneFeeSummary.tokenJarBalanceUsd,
          unclaimedValueUsd: duneFeeSummary.unclaimedValueUsd,
          collectibleUsd: duneFeeSummary.collectibleUsd,
          // UNI values
          tokenJarBalanceUni: duneFeeSummary.tokenJarBalanceUni,
          unclaimedValueUni: duneFeeSummary.unclaimedValueUni,
          collectibleUni: duneFeeSummary.collectibleUni,
          // Threshold
          uniToThreshold,
          // Counts
          tokenCount: duneFeeSummary.tokens.length,
          poolCount: duneFeeSummary.topPools.length > 0 ? duneFeeSummary.topPools.length : 0,
          // Top pools
          topPools: duneFeeSummary.topPools,
        };
        dataSourceType = "dune";
        console.log(`[Dune] Using Dune data: Total=$${duneData.collectibleUsd.toFixed(2)} (${duneData.collectibleUni.toFixed(2)} UNI), UNI to threshold=${uniToThreshold} (from Dune)`);

        // Override the totalJarValueUsd with Dune's more accurate data
        // Dune tracks all 520+ tokens while Alchemy may miss some
        const duneTotal = duneFeeSummary.collectibleUsd;
        const burnCostUsd = profitabilityData.burnCostUsd;
        const gasEstimateUsd = profitabilityData.gasEstimateUsd;
        const totalCostUsd = burnCostUsd + gasEstimateUsd;
        const netProfitUsd = duneTotal - totalCostUsd;

        return {
          ...profitabilityData,
          totalJarValueUsd: duneTotal,
          netProfitUsd,
          isProfitable: netProfitUsd > 0,
          duneData,
          dataSourceType,
        };
      }
    } catch (error) {
      console.error("[Dune] Failed to fetch Dune data, using Alchemy fallback:", error);
    }
  }

  // Return Alchemy-based data if Dune is not available
  return {
    ...profitabilityData,
    dataSourceType,
  };
}

async function refreshInBackground(): Promise<void> {
  if (isRefreshing) return;

  isRefreshing = true;
  try {
    const freshData = await fetchFreshData();
    serverCache.set(CACHE_KEYS.PROFITABILITY_DATA, freshData, CACHE_TTL.PROFITABILITY_DATA);
    console.log(`Cache refreshed successfully (source: ${freshData.dataSourceType})`);
  } catch (error) {
    console.error("Background refresh failed:", error);
  } finally {
    isRefreshing = false;
  }
}

function getDataSourceLabel(dataSourceType?: "dune" | "alchemy" | "fallback", cacheStatus?: string): string {
  const source = dataSourceType === "dune" ? "dune.com" : getDataSource();
  if (cacheStatus === "live") {
    return `${source} (live)`;
  }
  if (cacheStatus === "refreshing") {
    return `${source} (cached, refreshing...)`;
  }
  return `${source} (cached)`;
}

export async function GET(request: Request): Promise<NextResponse<TokenJarApiResponse>> {
  try {
    // Check for force refresh parameter
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get("refresh") === "true";

    // Check cache first (unless force refresh)
    const cached = serverCache.get<EnhancedProfitabilityData>(CACHE_KEYS.PROFITABILITY_DATA);
    const isExpired = serverCache.isExpired(CACHE_KEYS.PROFITABILITY_DATA);

    if (!forceRefresh && cached && !isExpired) {
      // Fresh cache hit - return immediately
      const dataAge = Math.floor((Date.now() - cached.timestamp) / 1000);
      return NextResponse.json({
        success: true,
        data: {
          ...cached.data,
          dataSource: getDataSourceLabel(cached.data.dataSourceType),
          dataSourceType: cached.data.dataSourceType,
          duneData: cached.data.duneData,
          cacheStatus: "fresh",
          dataAge,
        },
      });
    }

    if (!forceRefresh && cached && isExpired) {
      // Stale cache - return stale data but trigger background refresh
      const dataAge = Math.floor((Date.now() - cached.timestamp) / 1000);

      // Trigger background refresh (don't await)
      refreshInBackground();

      return NextResponse.json({
        success: true,
        data: {
          ...cached.data,
          dataSource: getDataSourceLabel(cached.data.dataSourceType, "refreshing"),
          dataSourceType: cached.data.dataSourceType,
          duneData: cached.data.duneData,
          cacheStatus: "stale",
          dataAge,
        },
      });
    }

    // Cache miss or force refresh - fetch fresh data
    const freshData = await fetchFreshData(forceRefresh);

    // Store in cache
    serverCache.set(CACHE_KEYS.PROFITABILITY_DATA, freshData, CACHE_TTL.PROFITABILITY_DATA);

    return NextResponse.json({
      success: true,
      data: {
        ...freshData,
        dataSource: getDataSourceLabel(freshData.dataSourceType, "live"),
        dataSourceType: freshData.dataSourceType,
        duneData: freshData.duneData,
        cacheStatus: "miss",
        dataAge: 0,
      },
    });
  } catch (error) {
    console.error("TokenJar API error:", error);

    // If we have stale cache, return it on error
    const cached = serverCache.get<EnhancedProfitabilityData>(CACHE_KEYS.PROFITABILITY_DATA);
    if (cached) {
      const dataAge = Math.floor((Date.now() - cached.timestamp) / 1000);
      return NextResponse.json({
        success: true,
        data: {
          ...cached.data,
          dataSource: "llamarpc.com (cached, error on refresh)",
          dataSourceType: cached.data.dataSourceType,
          duneData: cached.data.duneData,
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
