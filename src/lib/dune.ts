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
  // Fee Monitoring - Summary (has Unclaimed vs TokenJar breakdown)
  SUMMARY: 6432715,
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

// Summary row from query 6432715
export interface SummaryRow {
  // These are the actual values from the Summary query
  // Column names might vary - we'll handle multiple variations
  unclaimed_usd?: number;
  tokenjar_usd?: number;
  releasable_usd?: number;
  unclaimed_uni?: number;
  tokenjar_uni?: number;
  releasable_uni?: number;
  threshold_uni?: number;
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
  // Threshold from Dune (UNI still needed to reach 4000 burn threshold)
  thresholdDeltaUni: number;
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

  // Fetch token breakdown, pool data, and summary in parallel
  const [tokenData, poolData, summaryData] = await Promise.all([
    fetchDuneQuery<FeeByTokenRow>(DUNE_QUERIES.FEES_BY_TOKEN),
    fetchDuneQuery<FeeByPoolRow>(DUNE_QUERIES.FEES_BY_POOL),
    fetchDuneQuery<SummaryRow>(DUNE_QUERIES.SUMMARY),
  ]);

  // Log summary data for debugging
  if (summaryData?.result?.rows?.[0]) {
    console.log(`[Dune] Summary columns: ${Object.keys(summaryData.result.rows[0]).join(", ")}`);
    console.log(`[Dune] Summary data:`, JSON.stringify(summaryData.result.rows[0]));
  }

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

    // Log first pool to see all column names and values
    if (pools[0]) {
      const firstPool = pools[0];
      console.log(`[Dune] Pool columns: ${Object.keys(firstPool).join(", ")}`);
      console.log(`[Dune] First pool data:`, JSON.stringify(firstPool));
    }

    // Helper to get value from pool with multiple possible column names
    const getPoolValue = (pool: FeeByPoolRow, ...keys: string[]): string | number | undefined => {
      for (const key of keys) {
        const value = pool[key];
        if (value !== undefined && value !== null && value !== "") {
          return value;
        }
      }
      return undefined;
    };

    // Sort by USD value (try multiple possible column names)
    const sortedPools = [...pools]
      .sort((a, b) => {
        const aVal = Number(getPoolValue(a, "fee_value_usd", "value_usd", "usd_value", "fee_usd")) || 0;
        const bVal = Number(getPoolValue(b, "fee_value_usd", "value_usd", "usd_value", "fee_usd")) || 0;
        return bVal - aVal;
      })
      .slice(0, 10);

    // Helper to extract address from HTML link or plain string
    const extractAddress = (value: string | number | undefined): string => {
      if (!value) return "";
      const str = String(value);
      // Check if it's HTML with an address link
      const addressMatch = str.match(/0x[a-fA-F0-9]{40}/);
      if (addressMatch) {
        return addressMatch[0];
      }
      return str;
    };

    for (const pool of sortedPools) {
      // Try multiple possible column name variations
      const tokenPair = getPoolValue(pool, "pair", "token_pair", "pool_name", "name") as string || "Unknown";
      // address_link contains HTML like <a href='https://etherscan.io/address/0x...'>
      const rawAddress = getPoolValue(pool, "address_link", "pool_address", "address", "pool", "contract_address") as string || "";
      const poolAddress = extractAddress(rawAddress);
      const token0Fees = getPoolValue(pool, "token0_fees", "token0_fees_formatted", "token_0_fees", "fees_token0") as string || "0";
      const token1Fees = getPoolValue(pool, "token1_fees", "token1_fees_formatted", "token_1_fees", "fees_token1") as string || "0";
      const valueUni = Number(getPoolValue(pool, "value_uni", "fee_value_uni", "uni_value", "fee_uni")) || 0;
      const valueUsd = Number(getPoolValue(pool, "value_usd", "fee_value_usd", "usd_value", "fee_usd")) || 0;

      topPools.push({
        tokenPair,
        poolAddress,
        token0Fees,
        token1Fees,
        valueUni,
        valueUsd,
      });

      // Log the first pool mapping for debugging
      if (topPools.length === 1) {
        console.log(`[Dune] First pool mapped:`, topPools[0]);
      }
    }
  } else {
    console.log(`[Dune] No pool data available`);
  }

  // Try to get breakdown from summary data if available
  let tokenJarBalanceUsd = totalValueUsd;
  let unclaimedValueUsd = 0;
  let tokenJarBalanceUni = totalValueUni;
  let unclaimedValueUni = 0;
  let thresholdDeltaUni = 0; // UNI still needed to reach 4000 threshold (from Dune)

  // Helper to extract summary values with multiple possible column names
  const getSummaryValue = (row: SummaryRow | undefined, ...keys: string[]): number => {
    if (!row) return 0;
    for (const key of keys) {
      const value = row[key];
      if (value !== undefined && value !== null) {
        return Number(value) || 0;
      }
    }
    return 0;
  };

  if (summaryData?.result?.rows?.[0]) {
    const summaryRow = summaryData.result.rows[0];

    // Actual column names from Dune query 6432715:
    // - total_collectible_usd/uni = Unclaimed fees still in pools
    // - total_token_jar_usd/uni = Fees already collected in TokenJar
    // - threshold_delta_uni = UNI still needed to reach 4000 threshold
    const summaryUnclaimedUsd = getSummaryValue(summaryRow, "total_collectible_usd", "unclaimed_usd", "unclaimed_value_usd");
    const summaryTokenJarUsd = getSummaryValue(summaryRow, "total_token_jar_usd", "tokenjar_usd", "token_jar_usd");
    const summaryUnclaimedUni = getSummaryValue(summaryRow, "total_collectible_uni", "unclaimed_uni", "unclaimed_value_uni");
    const summaryTokenJarUni = getSummaryValue(summaryRow, "total_token_jar_uni", "tokenjar_uni", "token_jar_uni");

    if (summaryUnclaimedUsd > 0 || summaryTokenJarUsd > 0) {
      unclaimedValueUsd = summaryUnclaimedUsd;
      tokenJarBalanceUsd = summaryTokenJarUsd;
      console.log(`[Dune] Using summary breakdown: Unclaimed=$${unclaimedValueUsd.toFixed(2)}, TokenJar=$${tokenJarBalanceUsd.toFixed(2)}`);
    }

    if (summaryUnclaimedUni > 0 || summaryTokenJarUni > 0) {
      unclaimedValueUni = summaryUnclaimedUni;
      tokenJarBalanceUni = summaryTokenJarUni;
    }

    // Get threshold from Dune (UNI still needed to reach 4000)
    thresholdDeltaUni = getSummaryValue(summaryRow, "threshold_delta_uni", "threshold_uni");
    console.log(`[Dune] Threshold from Dune: ${thresholdDeltaUni.toFixed(2)} UNI still needed`);
  }

  // Calculate collectible totals
  const collectibleUsd = unclaimedValueUsd > 0 ? unclaimedValueUsd + tokenJarBalanceUsd : totalValueUsd;
  const collectibleUni = unclaimedValueUni > 0 ? unclaimedValueUni + tokenJarBalanceUni : totalValueUni;

  const summary: FeeSummary = {
    tokenJarBalanceUsd,
    unclaimedValueUsd,
    collectibleUsd,
    tokenJarBalanceUni,
    unclaimedValueUni,
    collectibleUni,
    thresholdDeltaUni,
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

/**
 * Get raw pool data for debugging
 */
export async function getRawPoolData(): Promise<{
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
      `https://api.dune.com/api/v1/query/${DUNE_QUERIES.FEES_BY_POOL}/results?limit=5`,
      {
        headers: { "X-Dune-API-Key": apiKey },
      }
    );

    if (!response.ok) {
      console.error(`[Dune] Pool query HTTP error: ${response.status}`);
      return { columnNames: [], sampleRow: null, rowCount: 0 };
    }

    const data = await response.json();
    return {
      columnNames: data.result?.metadata?.column_names || [],
      sampleRow: data.result?.rows?.[0] || null,
      rowCount: data.result?.metadata?.total_row_count || 0,
    };
  } catch (error) {
    console.error("[Dune] Error fetching pool data:", error);
    return { columnNames: [], sampleRow: null, rowCount: 0 };
  }
}

/**
 * Get raw summary data for debugging
 */
export async function getRawSummaryData(): Promise<{
  columnNames: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
}> {
  const apiKey = process.env.DUNE_API_KEY;
  if (!apiKey) {
    return { columnNames: [], rows: [], rowCount: 0 };
  }

  try {
    const response = await fetch(
      `https://api.dune.com/api/v1/query/${DUNE_QUERIES.SUMMARY}/results`,
      {
        headers: { "X-Dune-API-Key": apiKey },
      }
    );

    if (!response.ok) {
      console.error(`[Dune] Summary query HTTP error: ${response.status}`);
      return { columnNames: [], rows: [], rowCount: 0 };
    }

    const data = await response.json();
    return {
      columnNames: data.result?.metadata?.column_names || [],
      rows: data.result?.rows || [],
      rowCount: data.result?.metadata?.total_row_count || 0,
    };
  } catch (error) {
    console.error("[Dune] Error fetching summary data:", error);
    return { columnNames: [], rows: [], rowCount: 0 };
  }
}
