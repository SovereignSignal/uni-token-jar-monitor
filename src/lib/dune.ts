/**
 * Dune Analytics API integration for accurate fee monitoring data
 * Uses official Uniswap Foundation dashboards
 */

import { serverCache, CACHE_KEYS, CACHE_TTL } from "./cache";

// Dune query IDs from official Uniswap dashboards
const DUNE_QUERIES = {
  // Fee Monitoring - Unclaimed Fees and TokenJar per Token (ETH Mainnet)
  FEES_BY_TOKEN: 6432620,
  // Second fee monitoring query (ETH Mainnet)
  FEE_MONITORING_SUMMARY: 6432870,
};

interface DuneQueryResult<T> {
  execution_id: string;
  query_id: number;
  state: string;
  result: {
    rows: T[];
    metadata: {
      column_names: string[];
      column_types: string[];
      row_count: number;
      result_set_bytes: number;
      total_row_count: number;
    };
  };
}

export interface FeeByTokenRow {
  token_address: string;
  token_symbol: string;
  token_name?: string;
  tokenjar_balance: number;
  tokenjar_balance_usd: number;
  unclaimed_balance?: number;
  unclaimed_balance_usd?: number;
  total_balance_usd?: number;
}

export interface FeeSummary {
  tokenJarBalanceUsd: number;
  unclaimedValueUsd: number;
  collectibleUsd: number;
  tokenJarBalanceUni: number;
  unclaimedValueUni: number;
  collectibleUni: number;
  tokens: FeeByTokenRow[];
  lastUpdated: number;
}

/**
 * Fetch data from Dune API
 */
async function fetchDuneQuery<T>(queryId: number): Promise<DuneQueryResult<T> | null> {
  const apiKey = process.env.DUNE_API_KEY;
  if (!apiKey) {
    console.warn("[Dune] No DUNE_API_KEY environment variable set");
    return null;
  }

  try {
    console.log(`[Dune] Fetching query ${queryId}...`);

    const response = await fetch(
      `https://api.dune.com/api/v1/query/${queryId}/results`,
      {
        headers: {
          "X-Dune-API-Key": apiKey,
        },
      }
    );

    if (!response.ok) {
      console.error(`[Dune] HTTP error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    console.log(`[Dune] Query ${queryId} returned ${data.result?.rows?.length || 0} rows`);

    return data as DuneQueryResult<T>;
  } catch (error) {
    console.error(`[Dune] Error fetching query ${queryId}:`, error);
    return null;
  }
}

/**
 * Get fee monitoring data from Dune
 * Returns TokenJar balance, unclaimed fees, and token breakdown
 */
export async function getDuneFeeSummary(): Promise<FeeSummary | null> {
  // Check cache first
  const cacheKey = "dune_fee_summary";
  const cached = serverCache.get<FeeSummary>(cacheKey);
  if (cached && !serverCache.isExpired(cacheKey)) {
    console.log("[Dune] Returning cached fee summary");
    return cached.data;
  }

  // Fetch token breakdown
  const tokenData = await fetchDuneQuery<FeeByTokenRow>(DUNE_QUERIES.FEES_BY_TOKEN);

  if (!tokenData?.result?.rows) {
    console.error("[Dune] No token data returned");
    return null;
  }

  const tokens = tokenData.result.rows;

  // Calculate totals
  let tokenJarBalanceUsd = 0;
  let unclaimedValueUsd = 0;

  for (const token of tokens) {
    tokenJarBalanceUsd += token.tokenjar_balance_usd || 0;
    unclaimedValueUsd += token.unclaimed_balance_usd || 0;
  }

  const summary: FeeSummary = {
    tokenJarBalanceUsd,
    unclaimedValueUsd,
    collectibleUsd: tokenJarBalanceUsd + unclaimedValueUsd,
    tokenJarBalanceUni: 0, // Will be calculated from UNI price
    unclaimedValueUni: 0,
    collectibleUni: 0,
    tokens,
    lastUpdated: Date.now(),
  };

  // Cache for 5 minutes (Dune data refreshes ~30min)
  serverCache.set(cacheKey, summary, 5 * 60 * 1000);

  console.log(`[Dune] Fee summary: TokenJar=$${tokenJarBalanceUsd.toFixed(2)}, Unclaimed=$${unclaimedValueUsd.toFixed(2)}`);

  return summary;
}

/**
 * Check if Dune API is configured
 */
export function isDuneConfigured(): boolean {
  return !!process.env.DUNE_API_KEY;
}
