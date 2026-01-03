/**
 * Dune Analytics API integration for accurate fee monitoring data
 * Uses official Uniswap Foundation dashboards
 */

import { serverCache, CACHE_TTL } from "./cache";

// Dune query IDs from official Uniswap dashboards
const DUNE_QUERIES = {
  // Fee Monitoring - Unclaimed Fees and TokenJar per Token (ETH Mainnet)
  FEES_BY_TOKEN: 6432620,
  // Fee Monitoring - Fees by Pool (ETH Mainnet)
  FEES_BY_POOL: 6432870,
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
  // Actual column names from Dune query 6432620
  symbol?: string; // Token symbol (may contain HTML link)
  protocol_fees_formatted?: number; // Unclaimed protocol fees (raw token amount)
  token_jar_balance_formatted?: number; // TokenJar balance (raw token amount)
  value_uni?: number; // Total value in UNI
  value_usd?: number; // Total value in USD - THIS IS THE KEY FIELD
  pool_count?: number; // Number of pools
  // Catch-all for unknown fields
  [key: string]: string | number | undefined;
}

export interface FeeByPoolRow {
  // Actual column names from Dune query 6432870
  token_pair?: string; // e.g., "AAVE-WETH"
  pool_address?: string; // Pool contract address
  token0_fees?: string; // e.g., "2.194 AAVE"
  token1_fees?: string; // e.g., "0.236 WETH"
  fee_value_uni?: number; // Fee value in UNI
  fee_value_usd?: number; // Fee value in USD
  [key: string]: string | number | undefined;
}

export interface TopPool {
  tokenPair: string;
  poolAddress: string;
  token0Fees: string;
  token1Fees: string;
  valueUni: number;
  valueUsd: number;
}

export interface FeeSummary {
  // USD values
  tokenJarBalanceUsd: number;
  unclaimedValueUsd: number;
  collectibleUsd: number; // Total = tokenJar + unclaimed
  // UNI values
  tokenJarBalanceUni: number;
  unclaimedValueUni: number;
  collectibleUni: number;
  // Token breakdown
  tokens: FeeByTokenRow[];
  // Top pools by value
  topPools: TopPool[];
  // Metadata
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

    // Log column names to help debug field mapping
    if (data.result?.metadata?.column_names) {
      console.log(`[Dune] Column names: ${data.result.metadata.column_names.join(", ")}`);
    }

    // Log first row to see actual data structure
    if (data.result?.rows?.[0]) {
      console.log(`[Dune] First row keys: ${Object.keys(data.result.rows[0]).join(", ")}`);
      console.log(`[Dune] First row sample:`, JSON.stringify(data.result.rows[0]));
    }

    return data as DuneQueryResult<T>;
  } catch (error) {
    console.error(`[Dune] Error fetching query ${queryId}:`, error);
    return null;
  }
}

/**
 * Get fee monitoring data from Dune
 * Returns TokenJar balance, unclaimed fees, pool breakdown, and token breakdown
 */
export async function getDuneFeeSummary(forceRefresh = false): Promise<FeeSummary | null> {
  // Check cache first (unless force refresh requested)
  const cacheKey = "dune_fee_summary";
  if (!forceRefresh) {
    const cached = serverCache.get<FeeSummary>(cacheKey);
    if (cached && !serverCache.isExpired(cacheKey)) {
      console.log("[Dune] Returning cached fee summary");
      return cached.data;
    }
  } else {
    console.log("[Dune] Force refresh requested, bypassing cache");
  }

  // Fetch token breakdown and pool data in parallel
  const [tokenData, poolData] = await Promise.all([
    fetchDuneQuery<FeeByTokenRow>(DUNE_QUERIES.FEES_BY_TOKEN),
    fetchDuneQuery<FeeByPoolRow>(DUNE_QUERIES.FEES_BY_POOL),
  ]);

  if (!tokenData?.result?.rows) {
    console.error("[Dune] No token data returned");
    return null;
  }

  const tokens = tokenData.result.rows;

  // Calculate totals using actual Dune column names
  // value_usd is the total value (TokenJar + unclaimed combined)
  // value_uni is the total value in UNI
  let totalValueUsd = 0;
  let totalValueUni = 0;

  for (const token of tokens) {
    totalValueUsd += Number(token.value_usd) || 0;
    totalValueUni += Number(token.value_uni) || 0;
  }

  console.log(`[Dune] Calculated total value: $${totalValueUsd.toFixed(2)} (${totalValueUni.toFixed(2)} UNI) from ${tokens.length} tokens`);

  // Process top pools
  const topPools: TopPool[] = [];
  if (poolData?.result?.rows) {
    const pools = poolData.result.rows;
    console.log(`[Dune] Processing ${pools.length} pools`);

    // Log first pool to see column names
    if (pools[0]) {
      console.log(`[Dune] Pool columns: ${Object.keys(pools[0]).join(", ")}`);
    }

    // Sort by USD value and take top 10
    const sortedPools = [...pools]
      .sort((a, b) => (Number(b.fee_value_usd) || 0) - (Number(a.fee_value_usd) || 0))
      .slice(0, 10);

    for (const pool of sortedPools) {
      topPools.push({
        tokenPair: String(pool.token_pair || "Unknown"),
        poolAddress: String(pool.pool_address || ""),
        token0Fees: String(pool.token0_fees || "0"),
        token1Fees: String(pool.token1_fees || "0"),
        valueUni: Number(pool.fee_value_uni) || 0,
        valueUsd: Number(pool.fee_value_usd) || 0,
      });
    }
  }

  // The Dune query gives us value_usd which is the total collectible value
  // This represents the combined TokenJar balance + unclaimed fees
  const summary: FeeSummary = {
    // For now, we show the total as "collectible" since the query combines them
    // The breakdown would require the summary query (6432715) which has separate values
    tokenJarBalanceUsd: totalValueUsd,
    unclaimedValueUsd: 0,
    collectibleUsd: totalValueUsd,
    tokenJarBalanceUni: totalValueUni,
    unclaimedValueUni: 0,
    collectibleUni: totalValueUni,
    tokens,
    topPools,
    lastUpdated: Date.now(),
  };

  // Cache for 4 hours per Uniswap Foundation request
  serverCache.set(cacheKey, summary, CACHE_TTL.DUNE_DATA);

  console.log(`[Dune] Fee summary: Total=$${totalValueUsd.toFixed(2)}, Pools=${topPools.length}`);

  return summary;
}

/**
 * Check if Dune API is configured
 */
export function isDuneConfigured(): boolean {
  return !!process.env.DUNE_API_KEY;
}

/**
 * Get raw Dune data for debugging
 */
export async function getRawDuneData(): Promise<{
  columnNames: string[];
  sampleRow: Record<string, unknown> | null;
  rowCount: number;
}> {
  const apiKey = process.env.DUNE_API_KEY;
  if (!apiKey) {
    return { columnNames: [], sampleRow: null, rowCount: 0 };
  }

  try {
    const response = await fetch(
      `https://api.dune.com/api/v1/query/${DUNE_QUERIES.FEES_BY_TOKEN}/results?limit=5`,
      {
        headers: { "X-Dune-API-Key": apiKey },
      }
    );

    if (!response.ok) {
      return { columnNames: [], sampleRow: null, rowCount: 0 };
    }

    const data = await response.json();
    return {
      columnNames: data.result?.metadata?.column_names || [],
      sampleRow: data.result?.rows?.[0] || null,
      rowCount: data.result?.metadata?.total_row_count || 0,
    };
  } catch {
    return { columnNames: [], sampleRow: null, rowCount: 0 };
  }
}
