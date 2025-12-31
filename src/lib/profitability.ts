import { BURN_THRESHOLD, GAS_ESTIMATE_USD, MIN_VALUE_DISPLAY_USD } from "./constants";
import type { PricedBalances, TokenWithValue } from "./pricing";

// Token categories
export interface CategorizedToken {
  address: string;
  symbol: string;
  decimals: number;
  balanceFormatted: string;
  priceUsd: number | null;
  valueUsd: number | null;
  confidence: number | null;
  category: "priced" | "lp" | "unknown";
}

export interface TokenCategory {
  tokens: CategorizedToken[];
  count: number;
  totalValueUsd: number;
}

export interface ProfitabilityData {
  // Summary
  isProfitable: boolean;
  netProfitUsd: number;

  // Breakdown
  totalJarValueUsd: number;
  burnCostUsd: number;
  gasEstimateUsd: number;

  // Details
  uniPriceUsd: number;
  burnThreshold: number;

  // Tokens (filtered by MIN_VALUE_DISPLAY_USD) - for backward compatibility
  displayTokens: TokenWithValue[];
  otherTokensCount: number;
  otherTokensValueUsd: number;

  // Categorized tokens - new structure
  categorizedTokens: {
    priced: TokenCategory;
    lp: TokenCategory;
    unknown: TokenCategory;
  };

  // Unpriced tokens - for backward compatibility
  unpricedTokensCount: number;
  unpricedTokens: { address: string; symbol: string; balanceFormatted: string }[];

  // Metadata
  timestamp: number;
  lastUpdated: string;
}

/**
 * Detect if a token is a Uniswap LP token
 */
function isLPToken(symbol: string, address: string): boolean {
  const lpSymbols = ["UNI-V2", "UNI-V3", "SLP", "BPT", "CAKE-LP", "PGL", "JLP", "SPIRIT-LP"];
  const symbolUpper = symbol.toUpperCase();
  
  // Check for common LP token symbols
  if (lpSymbols.some(lp => symbolUpper.includes(lp))) {
    return true;
  }
  
  // Check for LP-like patterns
  if (symbolUpper.includes("-LP") || symbolUpper.includes("LP-")) {
    return true;
  }
  
  // Check for pair patterns like "TOKEN/TOKEN" or "TOKEN-TOKEN"
  if (symbolUpper.includes("/") && symbolUpper.split("/").length === 2) {
    return true;
  }
  
  return false;
}

/**
 * Categorize a token
 */
function categorizeToken(token: TokenWithValue): CategorizedToken {
  let category: "priced" | "lp" | "unknown";
  
  if (isLPToken(token.symbol, token.address)) {
    category = "lp";
  } else if (token.priceUsd !== null && token.valueUsd !== null) {
    category = "priced";
  } else {
    category = "unknown";
  }
  
  return {
    ...token,
    category,
  };
}

/**
 * Calculate profitability of claiming TokenJar fees
 */
export function calculateProfitability(pricedBalances: PricedBalances): ProfitabilityData {
  const { tokens, totalValueUsd, unpricedCount, uniPriceUsd, timestamp } = pricedBalances;

  // Calculate costs
  const burnCostUsd = Number(BURN_THRESHOLD) * uniPriceUsd;
  const gasEstimateUsd = GAS_ESTIMATE_USD;
  const totalCostUsd = burnCostUsd + gasEstimateUsd;

  // Calculate profit
  const netProfitUsd = totalValueUsd - totalCostUsd;
  const isProfitable = netProfitUsd > 0;

  // Categorize all tokens
  const categorizedTokens: {
    priced: TokenCategory;
    lp: TokenCategory;
    unknown: TokenCategory;
  } = {
    priced: { tokens: [], count: 0, totalValueUsd: 0 },
    lp: { tokens: [], count: 0, totalValueUsd: 0 },
    unknown: { tokens: [], count: 0, totalValueUsd: 0 },
  };

  // Legacy structures for backward compatibility
  const displayTokens: TokenWithValue[] = [];
  const unpricedTokens: { address: string; symbol: string; balanceFormatted: string }[] = [];
  let otherTokensCount = 0;
  let otherTokensValueUsd = 0;

  for (const token of tokens) {
    const categorized = categorizeToken(token);
    const category = categorized.category;
    
    // Add to categorized structure
    categorizedTokens[category].tokens.push(categorized);
    categorizedTokens[category].count++;
    if (categorized.valueUsd !== null) {
      categorizedTokens[category].totalValueUsd += categorized.valueUsd;
    }

    // Legacy handling for backward compatibility
    if (token.valueUsd !== null && token.valueUsd >= MIN_VALUE_DISPLAY_USD) {
      displayTokens.push(token);
    } else if (token.valueUsd !== null) {
      otherTokensCount++;
      otherTokensValueUsd += token.valueUsd;
    } else {
      unpricedTokens.push({
        address: token.address,
        symbol: token.symbol,
        balanceFormatted: token.balanceFormatted,
      });
    }
  }

  // Sort each category by value (descending)
  for (const category of Object.values(categorizedTokens)) {
    category.tokens.sort((a, b) => {
      if (a.valueUsd === null && b.valueUsd === null) return 0;
      if (a.valueUsd === null) return 1;
      if (b.valueUsd === null) return -1;
      return b.valueUsd - a.valueUsd;
    });
  }

  return {
    isProfitable,
    netProfitUsd,
    totalJarValueUsd: totalValueUsd,
    burnCostUsd,
    gasEstimateUsd,
    uniPriceUsd,
    burnThreshold: Number(BURN_THRESHOLD),
    displayTokens,
    otherTokensCount,
    otherTokensValueUsd,
    categorizedTokens,
    unpricedTokensCount: unpricedCount,
    unpricedTokens: unpricedTokens.slice(0, 100),
    timestamp,
    lastUpdated: new Date(timestamp).toISOString(),
  };
}

/**
 * Format USD value for display
 */
export function formatUsd(value: number): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? "-" : value > 0 ? "+" : "";

  if (absValue >= 1_000_000) {
    return `${sign}$${(absValue / 1_000_000).toFixed(2)}M`;
  }
  if (absValue >= 1_000) {
    return `${sign}$${(absValue / 1_000).toFixed(2)}K`;
  }
  return `${sign}$${absValue.toFixed(2)}`;
}

/**
 * Format USD value without sign
 */
export function formatUsdNoSign(value: number): string {
  const absValue = Math.abs(value);

  if (absValue >= 1_000_000) {
    return `$${(absValue / 1_000_000).toFixed(2)}M`;
  }
  if (absValue >= 1_000) {
    return `$${absValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `$${absValue.toFixed(2)}`;
}
