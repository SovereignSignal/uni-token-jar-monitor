import { BURN_THRESHOLD, GAS_ESTIMATE_USD, MIN_VALUE_DISPLAY_USD } from "./constants";
import type { PricedBalances, TokenWithValue } from "./pricing";

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

  // Tokens (filtered by MIN_VALUE_DISPLAY_USD)
  displayTokens: TokenWithValue[];
  otherTokensCount: number;
  otherTokensValueUsd: number;

  // Unpriced tokens
  unpricedTokensCount: number;

  // Metadata
  timestamp: number;
  lastUpdated: string;
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

  // Filter tokens for display (> $1000 value)
  const displayTokens: TokenWithValue[] = [];
  let otherTokensCount = 0;
  let otherTokensValueUsd = 0;

  for (const token of tokens) {
    if (token.valueUsd !== null && token.valueUsd >= MIN_VALUE_DISPLAY_USD) {
      displayTokens.push(token);
    } else if (token.valueUsd !== null) {
      otherTokensCount++;
      otherTokensValueUsd += token.valueUsd;
    } else {
      // Unpriced tokens counted separately
    }
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
    unpricedTokensCount: unpricedCount,
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
