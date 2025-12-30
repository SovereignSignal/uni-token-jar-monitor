import { UNI_TOKEN_ADDRESS } from "./constants";
import type { TokenBalance } from "./ethereum";

// Price cache
interface PriceCache {
  prices: Record<string, { price: number; confidence: number }>;
  timestamp: number;
}

let priceCache: PriceCache | null = null;
const PRICE_CACHE_TTL_MS = 60_000; // 60 seconds

/**
 * Fetch prices from DeFiLlama for a list of Ethereum token addresses
 * DeFiLlama has much better coverage than CoinGecko for on-chain tokens
 * API: https://coins.llama.fi/prices/current/{coins}
 * Format: ethereum:0x... for each token
 */
async function fetchDeFiLlamaPrices(addresses: string[]): Promise<Record<string, { price: number; confidence: number }>> {
  if (addresses.length === 0) {
    return {};
  }

  // DeFiLlama expects format: ethereum:0x...
  // Batch in groups of 100 to avoid URL length limits
  const BATCH_SIZE = 100;
  const results: Record<string, { price: number; confidence: number }> = {};

  for (let i = 0; i < addresses.length; i += BATCH_SIZE) {
    const batch = addresses.slice(i, i + BATCH_SIZE);
    const coins = batch.map(addr => `ethereum:${addr.toLowerCase()}`).join(",");
    const url = `https://coins.llama.fi/prices/current/${coins}`;

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
        next: { revalidate: 60 },
      });

      if (!response.ok) {
        console.error(`DeFiLlama API error: ${response.status}`);
        continue;
      }

      const data = await response.json();

      // Extract prices from response
      if (data.coins) {
        for (const [key, priceData] of Object.entries(data.coins)) {
          // Key format is "ethereum:0x..."
          const address = key.replace("ethereum:", "").toLowerCase();
          const pd = priceData as { price?: number; confidence?: number };
          if (pd.price !== undefined) {
            results[address] = {
              price: pd.price,
              confidence: pd.confidence || 0.5,
            };
          }
        }
      }
    } catch (error) {
      console.error("DeFiLlama API error:", error);
    }
  }

  return results;
}

/**
 * Fallback to CoinGecko for UNI price if DeFiLlama fails
 */
async function fetchCoinGeckoUniPrice(): Promise<number | null> {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=uniswap&vs_currencies=usd",
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data.uniswap?.usd || null;
  } catch {
    return null;
  }
}

/**
 * Get all needed prices (with caching)
 */
async function getPrices(addresses: string[]): Promise<Record<string, { price: number; confidence: number }>> {
  const now = Date.now();

  // Return cached prices if still valid
  if (priceCache && now - priceCache.timestamp < PRICE_CACHE_TTL_MS) {
    // Check if we have all needed addresses
    const missingAddresses = addresses.filter((addr) => !(addr.toLowerCase() in priceCache!.prices));
    if (missingAddresses.length === 0) {
      return priceCache.prices;
    }

    // Fetch missing prices and merge
    try {
      const newPrices = await fetchDeFiLlamaPrices(missingAddresses);
      priceCache.prices = { ...priceCache.prices, ...newPrices };
      return priceCache.prices;
    } catch {
      // Return what we have on error
      return priceCache.prices;
    }
  }

  // Fetch all prices
  const prices = await fetchDeFiLlamaPrices(addresses);
  priceCache = { prices, timestamp: now };
  return prices;
}

// Serializable version of TokenBalance (no BigInt)
export interface TokenWithValue {
  address: string;
  symbol: string;
  decimals: number;
  balanceFormatted: string;
  priceUsd: number | null;
  valueUsd: number | null;
  confidence: number | null;
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
 * Uses DeFiLlama as primary price source for better coverage
 */
export async function priceTokenBalances(balances: TokenBalance[]): Promise<PricedBalances> {
  // Collect all token addresses we need prices for
  const addresses = new Set<string>();

  // Always need UNI price for burn cost calculation
  addresses.add(UNI_TOKEN_ADDRESS.toLowerCase());

  // Add all token addresses from balances
  for (const balance of balances) {
    addresses.add(balance.address.toLowerCase());
  }

  // Fetch prices from DeFiLlama
  let prices: Record<string, { price: number; confidence: number }> = {};
  try {
    prices = await getPrices(Array.from(addresses));
  } catch (error) {
    console.error("Failed to fetch prices:", error);
  }

  // Get UNI price (with CoinGecko fallback)
  let uniPriceUsd = prices[UNI_TOKEN_ADDRESS.toLowerCase()]?.price || 0;
  if (!uniPriceUsd) {
    const fallbackPrice = await fetchCoinGeckoUniPrice();
    if (fallbackPrice) {
      uniPriceUsd = fallbackPrice;
    }
  }

  // Add values to tokens
  let totalValueUsd = 0;
  let unpricedCount = 0;

  const tokensWithValue: TokenWithValue[] = balances.map((balance) => {
    const addrLower = balance.address.toLowerCase();
    const priceInfo = prices[addrLower];
    
    let priceUsd: number | null = null;
    let valueUsd: number | null = null;
    let confidence: number | null = null;

    if (priceInfo && priceInfo.price > 0) {
      priceUsd = priceInfo.price;
      confidence = priceInfo.confidence;
      valueUsd = priceUsd * parseFloat(balance.balanceFormatted);
      totalValueUsd += valueUsd;
    } else {
      unpricedCount++;
    }

    return {
      address: balance.address,
      symbol: balance.symbol,
      decimals: balance.decimals,
      balanceFormatted: balance.balanceFormatted,
      priceUsd,
      valueUsd,
      confidence,
    };
  });

  // Sort by value (descending), with unpriced at the end
  tokensWithValue.sort((a, b) => {
    if (a.valueUsd === null && b.valueUsd === null) return 0;
    if (a.valueUsd === null) return 1;
    if (b.valueUsd === null) return -1;
    return b.valueUsd - a.valueUsd;
  });

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
