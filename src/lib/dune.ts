/**
 * Dune Analytics API integration for accurate fee monitoring data
 * Uses official Uniswap Foundation dashboards
 */

import { serverCache, CACHE_TTL } from "./cache";

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
  // Actual column names from Dune query 6432620
  symbol?: string; // Token symbol (may contain HTML link)
  protocol_fees_formatted?: number; // Unclaimed protocol fees
  token_jar_balance_formatted?: number; // TokenJar balance
  value_uni?: number; // Total value in UNI
  value_usd?: number; // Total value in USD - THIS IS THE KEY FIELD
  pool_count?: number; // Number of pools
  // Catch-all for unknown fields
  [key: string]: string | number | undefined;
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

  // Calculate totals using actual Dune column names
  // value_usd is the total value (TokenJar + unclaimed combined)
  // token_jar_balance_formatted is just the TokenJar portion
  // protocol_fees_formatted is the unclaimed fees portion
  let totalValueUsd = 0;

  for (const token of tokens) {
    // value_usd contains the total USD value for this token
    totalValueUsd += Number(token.value_usd) || 0;
  }

  console.log(`[Dune] Calculated total value: $${totalValueUsd.toFixed(2)} from ${tokens.length} tokens`);

  // The Dune query gives us value_usd which is the total collectible value
  // This represents what can be claimed from the TokenJar
  const summary: FeeSummary = {
    tokenJarBalanceUsd: totalValueUsd, // Total value in TokenJar
    unclaimedValueUsd: 0, // Not separated in this query
    collectibleUsd: totalValueUsd,
    tokenJarBalanceUni: 0, // Will be calculated from UNI price
    unclaimedValueUni: 0,
    collectibleUni: 0,
    tokens,
    lastUpdated: Date.now(),
  };

  // Cache for 4 hours per Uniswap Foundation request
  serverCache.set(cacheKey, summary, CACHE_TTL.DUNE_DATA);

  console.log(`[Dune] Fee summary: Total=$${totalValueUsd.toFixed(2)}`);

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
