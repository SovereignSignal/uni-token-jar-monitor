import { KNOWN_TOKENS, UNI_TOKEN_ADDRESS } from "./constants";
import type { TokenBalance } from "./ethereum";

// Price cache
interface PriceCache {
  prices: Record<string, number>;
  timestamp: number;
}

let priceCache: PriceCache | null = null;
const PRICE_CACHE_TTL_MS = 60_000; // 60 seconds

/**
 * Fetch prices from CoinGecko for a list of token IDs
 */
async function fetchCoinGeckoPrices(coingeckoIds: string[]): Promise<Record<string, number>> {
  if (coingeckoIds.length === 0) {
    return {};
  }

  const idsParam = coingeckoIds.join(",");
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${idsParam}&vs_currencies=usd`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();

    // Convert to simple id -> price mapping
    const prices: Record<string, number> = {};
    for (const [id, priceData] of Object.entries(data)) {
      if (priceData && typeof priceData === "object" && "usd" in priceData) {
        prices[id] = (priceData as { usd: number }).usd;
      }
    }

    return prices;
  } catch (error) {
    console.error("CoinGecko API error:", error);
    throw error;
  }
}

/**
 * Get all needed prices (with caching)
 */
async function getPrices(coingeckoIds: string[]): Promise<Record<string, number>> {
  const now = Date.now();

  // Return cached prices if still valid
  if (priceCache && now - priceCache.timestamp < PRICE_CACHE_TTL_MS) {
    // Check if we have all needed IDs
    const missingIds = coingeckoIds.filter((id) => !(id in priceCache!.prices));
    if (missingIds.length === 0) {
      return priceCache.prices;
    }

    // Fetch missing prices and merge
    try {
      const newPrices = await fetchCoinGeckoPrices(missingIds);
      priceCache.prices = { ...priceCache.prices, ...newPrices };
      return priceCache.prices;
    } catch {
      // Return what we have on error
      return priceCache.prices;
    }
  }

  // Fetch all prices
  const prices = await fetchCoinGeckoPrices(coingeckoIds);
  priceCache = { prices, timestamp: now };
  return prices;
}

export interface TokenWithValue extends TokenBalance {
  priceUsd: number | null;
  valueUsd: number | null;
}

export interface PricedBalances {
  tokens: TokenWithValue[];
  totalValueUsd: number;
  unpricedCount: number;
  uniPriceUsd: number;
  timestamp: number;
}

/**
 * Add USD prices and values to token balances
 */
export async function priceTokenBalances(balances: TokenBalance[]): Promise<PricedBalances> {
  // Collect all coingecko IDs we need
  const coingeckoIds = new Set<string>();

  // Always need UNI price for burn cost calculation
  const uniKnown = KNOWN_TOKENS[UNI_TOKEN_ADDRESS];
  if (uniKnown?.coingeckoId) {
    coingeckoIds.add(uniKnown.coingeckoId);
  }

  // Add IDs for tokens we have balances of
  for (const balance of balances) {
    if (balance.coingeckoId) {
      coingeckoIds.add(balance.coingeckoId);
    }
  }

  // Fetch prices
  let prices: Record<string, number> = {};
  try {
    prices = await getPrices(Array.from(coingeckoIds));
  } catch (error) {
    console.error("Failed to fetch prices:", error);
  }

  // Add values to tokens
  let totalValueUsd = 0;
  let unpricedCount = 0;

  const tokensWithValue: TokenWithValue[] = balances.map((balance) => {
    let priceUsd: number | null = null;
    let valueUsd: number | null = null;

    if (balance.coingeckoId && balance.coingeckoId in prices) {
      priceUsd = prices[balance.coingeckoId];
      valueUsd = priceUsd * parseFloat(balance.balanceFormatted);
      totalValueUsd += valueUsd;
    } else {
      unpricedCount++;
    }

    return {
      ...balance,
      priceUsd,
      valueUsd,
    };
  });

  // Sort by value (descending), with unpriced at the end
  tokensWithValue.sort((a, b) => {
    if (a.valueUsd === null && b.valueUsd === null) return 0;
    if (a.valueUsd === null) return 1;
    if (b.valueUsd === null) return -1;
    return b.valueUsd - a.valueUsd;
  });

  // Get UNI price
  const uniPriceUsd = prices[uniKnown?.coingeckoId || "uniswap"] || 0;

  return {
    tokens: tokensWithValue,
    totalValueUsd,
    unpricedCount,
    uniPriceUsd,
    timestamp: Date.now(),
  };
}

/**
 * Force refresh the price cache
 */
export function invalidatePriceCache(): void {
  priceCache = null;
}
