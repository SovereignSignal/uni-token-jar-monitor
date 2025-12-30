"use client";

import { useEffect, useState, useCallback } from "react";
import { REFRESH_INTERVAL_MS, TOKENJAR_ADDRESS, FIREPIT_ADDRESS } from "@/lib/constants";
import type { TokenJarApiResponse } from "./api/tokenjar/route";
import type { ProfitabilityData } from "@/lib/profitability";

type DataStatus = "loading" | "fresh" | "stale" | "error";

function getDataStatus(timestamp: number | null, error: boolean): DataStatus {
  if (error) return "error";
  if (!timestamp) return "loading";

  const age = Date.now() - timestamp;
  if (age < 60_000) return "fresh"; // < 1 minute
  if (age < 300_000) return "stale"; // < 5 minutes
  return "error"; // > 5 minutes
}

function StatusIndicator({ status }: { status: DataStatus }) {
  const colors = {
    loading: "bg-gray-500",
    fresh: "bg-green-500",
    stale: "bg-yellow-500",
    error: "bg-red-500",
  };

  const labels = {
    loading: "Loading...",
    fresh: "Live",
    stale: "Stale",
    error: "Error",
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2.5 h-2.5 rounded-full ${colors[status]} animate-pulse`} />
      <span className="text-sm text-gray-400">{labels[status]}</span>
    </div>
  );
}

function formatUsd(value: number, showSign = false): string {
  const absValue = Math.abs(value);
  const sign = showSign ? (value >= 0 ? "+" : "-") : value < 0 ? "-" : "";

  if (absValue >= 1_000_000) {
    return `${sign}$${(absValue / 1_000_000).toFixed(2)}M`;
  }
  return `${sign}$${absValue.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatNumber(value: string | number, decimals = 4): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(2)}K`;
  }
  if (num < 0.0001) {
    return num.toExponential(2);
  }
  return num.toFixed(decimals);
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export default function Home() {
  const [data, setData] = useState<ProfitabilityData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/tokenjar");
      const result: TokenJarApiResponse = await response.json();

      if (result.success && result.data) {
        setData(result.data);
        setError(null);
        setLastFetch(Date.now());
      } else {
        setError(result.error || "Failed to fetch data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Initial fetch and polling
  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Update time display
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const status = getDataStatus(lastFetch, !!error);

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">TokenJar Monitor</h1>
          <p className="text-gray-400 text-sm mt-1">
            Uniswap Fee Burn Profitability Tracker
          </p>
        </div>
        <div className="flex items-center gap-4">
          <StatusIndicator status={status} />
          {lastFetch && (
            <span className="text-sm text-gray-500">
              Updated {formatTimeAgo(lastFetch)}
            </span>
          )}
          <button
            onClick={fetchData}
            disabled={isRefreshing}
            className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {isRefreshing ? "..." : "Refresh"}
          </button>
        </div>
      </header>

      {/* Error State */}
      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-xl p-6 mb-8">
          <h2 className="text-red-400 font-semibold mb-2">Error</h2>
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {!data && !error && (
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-400">Loading TokenJar data...</div>
        </div>
      )}

      {/* Main Content */}
      {data && (
        <>
          {/* Profitability Hero */}
          <section className="bg-gray-900 rounded-xl p-6 md:p-8 mb-6">
            <div className="text-center">
              <div className="text-sm text-gray-400 uppercase tracking-wide mb-2">
                Current Net Profit
              </div>
              <div
                className={`text-4xl md:text-6xl font-bold mb-4 ${
                  data.isProfitable ? "text-green-400" : "text-red-400"
                }`}
              >
                {formatUsd(data.netProfitUsd, true)}
              </div>
              <div
                className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                  data.isProfitable
                    ? "bg-green-900/50 text-green-300"
                    : "bg-red-900/50 text-red-300"
                }`}
              >
                {data.isProfitable ? "PROFITABLE TO CLAIM" : "NOT PROFITABLE"}
              </div>
            </div>
          </section>

          {/* Breakdown */}
          <section className="bg-gray-900 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Breakdown</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-400">Total Jar Value</span>
                <span className="font-mono text-lg">
                  {formatUsd(data.totalJarValueUsd)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-400">
                  Burn Cost ({data.burnThreshold.toLocaleString()} UNI @ $
                  {data.uniPriceUsd.toFixed(2)})
                </span>
                <span className="font-mono text-lg text-red-400">
                  -{formatUsd(data.burnCostUsd)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-400">Gas Estimate</span>
                <span className="font-mono text-lg text-red-400">
                  -{formatUsd(data.gasEstimateUsd)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-semibold">Net Profit/Loss</span>
                <span
                  className={`font-mono text-xl font-bold ${
                    data.isProfitable ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {formatUsd(data.netProfitUsd, true)}
                </span>
              </div>
            </div>
          </section>

          {/* Token Table */}
          <section className="bg-gray-900 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">
              Tokens in Jar
              {data.displayTokens.length > 0 && (
                <span className="text-gray-400 font-normal text-sm ml-2">
                  (showing tokens &gt; $1,000)
                </span>
              )}
            </h2>

            {data.displayTokens.length === 0 ? (
              <p className="text-gray-500 py-4">
                No tokens above $1,000 threshold
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-400 text-sm">
                      <th className="pb-3 font-medium">Token</th>
                      <th className="pb-3 font-medium text-right">Balance</th>
                      <th className="pb-3 font-medium text-right">Price</th>
                      <th className="pb-3 font-medium text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {data.displayTokens.map((token) => (
                      <tr key={token.address} className="hover:bg-gray-800/50">
                        <td className="py-3">
                          <span className="font-medium">{token.symbol}</span>
                        </td>
                        <td className="py-3 text-right font-mono text-gray-300">
                          {formatNumber(token.balanceFormatted)}
                        </td>
                        <td className="py-3 text-right font-mono text-gray-300">
                          {token.priceUsd
                            ? `$${token.priceUsd.toFixed(2)}`
                            : "-"}
                        </td>
                        <td className="py-3 text-right font-mono">
                          {token.valueUsd ? formatUsd(token.valueUsd) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Other tokens summary */}
            {(data.otherTokensCount > 0 || data.unpricedTokensCount > 0) && (
              <div className="mt-4 pt-4 border-t border-gray-800 text-sm text-gray-400">
                {data.otherTokensCount > 0 && (
                  <div className="flex justify-between">
                    <span>
                      Other tokens (&lt;$1,000): {data.otherTokensCount}
                    </span>
                    <span className="font-mono">
                      {formatUsd(data.otherTokensValueUsd)}
                    </span>
                  </div>
                )}
                {data.unpricedTokensCount > 0 && (
                  <div className="mt-1">
                    Unpriced tokens: {data.unpricedTokensCount}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Contract Links */}
          <section className="bg-gray-900 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Contract Addresses</h2>
            <div className="space-y-2 text-sm">
              <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                <span className="text-gray-400">TokenJar:</span>
                <a
                  href={`https://etherscan.io/address/${TOKENJAR_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-blue-400 hover:text-blue-300 break-all"
                >
                  {TOKENJAR_ADDRESS}
                </a>
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                <span className="text-gray-400">Firepit:</span>
                <a
                  href={`https://etherscan.io/address/${FIREPIT_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-blue-400 hover:text-blue-300 break-all"
                >
                  {FIREPIT_ADDRESS}
                </a>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="mt-8 text-center text-sm text-gray-500">
            <p>
              Data refreshes every 30 seconds. Prices from CoinGecko. Gas
              estimate is approximate.
            </p>
            <p className="mt-1">
              This is an informational tool only. DYOR before executing any
              transactions.
            </p>
          </footer>
        </>
      )}
    </main>
  );
}
