"use client";

import { useEffect, useState, useCallback } from "react";
import { REFRESH_INTERVAL_MS, TOKENJAR_ADDRESS, FIREPIT_ADDRESS } from "@/lib/constants";
import type { TokenJarApiResponse } from "./api/tokenjar/route";
import type { ProfitabilityData } from "@/lib/profitability";
import PixelJar from "@/components/PixelJar";

type DataStatus = "loading" | "fresh" | "stale" | "error";

function getDataStatus(timestamp: number | null, error: boolean): DataStatus {
  if (error) return "error";
  if (!timestamp) return "loading";

  const age = Date.now() - timestamp;
  if (age < 60_000) return "fresh";
  if (age < 300_000) return "stale";
  return "error";
}

function StatusIndicator({ status }: { status: DataStatus }) {
  const colors = {
    loading: "text-gray-400",
    fresh: "text-green-400",
    stale: "text-yellow-400",
    error: "text-red-400",
  };

  const labels = {
    loading: "LOADING",
    fresh: "LIVE",
    stale: "STALE",
    error: "ERROR",
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`pixel-dot ${colors[status]}`} />
      <span className={`text-[10px] ${colors[status]}`}>{labels[status]}</span>
    </div>
  );
}

function formatUsd(value: number, showSign = false): string {
  const absValue = Math.abs(value);
  const sign = showSign ? (value >= 0 ? "+" : "-") : value < 0 ? "-" : "";

  if (absValue >= 1_000_000) {
    return `${sign}$${(absValue / 1_000_000).toFixed(2)}M`;
  }
  if (absValue >= 1_000) {
    return `${sign}$${(absValue / 1_000).toFixed(1)}K`;
  }
  return `${sign}$${absValue.toFixed(0)}`;
}

function formatNumber(value: string | number, decimals = 2): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(2)}K`;
  }
  if (num < 0.01) {
    return num.toExponential(1);
  }
  return num.toFixed(decimals);
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}S AGO`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}M AGO`;
  const hours = Math.floor(minutes / 60);
  return `${hours}H AGO`;
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

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const status = getDataStatus(lastFetch, !!error);

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto scanlines">
      {/* Retro Header */}
      <header className="retro-panel p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg md:text-xl text-glow-gold text-[#feb236]">
              TOKEN JAR
            </h1>
            <p className="text-[8px] text-gray-400 mt-2">
              UNISWAP FEE BURN MONITOR
            </p>
          </div>
          <div className="flex items-center gap-4">
            <StatusIndicator status={status} />
            {lastFetch && (
              <span className="text-[8px] text-gray-500">
                {formatTimeAgo(lastFetch)}
              </span>
            )}
            <button
              onClick={fetchData}
              disabled={isRefreshing}
              className="retro-btn px-4 py-2 text-[10px] disabled:opacity-50"
            >
              {isRefreshing ? "..." : "REFRESH"}
            </button>
          </div>
        </div>
      </header>

      {/* Error State */}
      {error && (
        <div className="retro-panel p-4 mb-6 border-red-600">
          <h2 className="text-red-400 text-xs mb-2">! ERROR !</h2>
          <p className="text-red-300 text-[10px]">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {!data && !error && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-[10px] text-gray-400 animate-pulse">
            LOADING TOKEN JAR DATA...
          </div>
          <div className="mt-4 text-[8px] text-gray-600">
            PLEASE WAIT
          </div>
        </div>
      )}

      {/* Main Content */}
      {data && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column - Jar Visualization */}
          <div className="retro-panel p-4">
            <h2 className="text-xs text-center mb-4 text-[#feb236]">
              JAR CONTENTS
            </h2>

            {/* Pixel Jar */}
            <PixelJar
              tokens={data.displayTokens.map((t) => ({
                symbol: t.symbol,
                valueUsd: t.valueUsd,
              }))}
              totalValue={data.totalJarValueUsd}
              isProfitable={data.isProfitable}
            />

            {/* Profit Display */}
            <div className="text-center mt-4">
              <div className="text-[8px] text-gray-400 mb-1">NET PROFIT</div>
              <div
                className={`text-2xl md:text-3xl ${
                  data.isProfitable
                    ? "text-green-400 text-glow-green"
                    : "text-red-400 text-glow-red"
                }`}
              >
                {formatUsd(data.netProfitUsd, true)}
              </div>
              <div
                className={`inline-block mt-3 px-3 py-1 text-[10px] ${
                  data.isProfitable
                    ? "bg-green-900/50 text-green-300 border-2 border-green-600"
                    : "bg-red-900/50 text-red-300 border-2 border-red-600"
                }`}
              >
                {data.isProfitable ? "PROFITABLE!" : "NOT PROFITABLE"}
              </div>
            </div>
          </div>

          {/* Right Column - Stats */}
          <div className="space-y-4">
            {/* Breakdown Panel */}
            <div className="retro-panel p-4">
              <h2 className="text-xs text-[#feb236] mb-4">BREAKDOWN</h2>
              <div className="space-y-2 text-[10px]">
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <span className="text-gray-400">JAR VALUE</span>
                  <span className="text-white">
                    {formatUsd(data.totalJarValueUsd)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <span className="text-gray-400">
                    BURN ({data.burnThreshold.toLocaleString()} UNI)
                  </span>
                  <span className="text-red-400">
                    -{formatUsd(data.burnCostUsd)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <span className="text-gray-400">GAS EST.</span>
                  <span className="text-red-400">
                    -{formatUsd(data.gasEstimateUsd)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-white">NET</span>
                  <span
                    className={
                      data.isProfitable ? "text-green-400" : "text-red-400"
                    }
                  >
                    {formatUsd(data.netProfitUsd, true)}
                  </span>
                </div>
              </div>
            </div>

            {/* Token List Panel */}
            <div className="retro-panel p-4">
              <h2 className="text-xs text-[#feb236] mb-4">
                COINS IN JAR
                <span className="text-gray-500 text-[8px] ml-2">
                  (&gt;$1K)
                </span>
              </h2>

              {data.displayTokens.length === 0 ? (
                <p className="text-gray-500 text-[10px] py-4 text-center">
                  NO TOKENS ABOVE $1,000
                </p>
              ) : (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {data.displayTokens.map((token) => (
                    <div
                      key={token.address}
                      className="flex justify-between items-center py-1 px-2 hover:bg-white/5 text-[10px]"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-sm"
                          style={{
                            background: getTokenColor(token.symbol),
                          }}
                        />
                        <span className="text-white">{token.symbol}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-300">
                          {formatNumber(token.balanceFormatted)}
                        </div>
                        <div className="text-green-400 text-[8px]">
                          {token.valueUsd ? formatUsd(token.valueUsd) : "-"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Other tokens summary */}
              {(data.otherTokensCount > 0 || data.unpricedTokensCount > 0) && (
                <div className="mt-3 pt-3 border-t border-gray-700 text-[8px] text-gray-500">
                  {data.otherTokensCount > 0 && (
                    <div className="flex justify-between">
                      <span>OTHER x{data.otherTokensCount}</span>
                      <span>{formatUsd(data.otherTokensValueUsd)}</span>
                    </div>
                  )}
                  {data.unpricedTokensCount > 0 && (
                    <div className="mt-1">
                      UNPRICED: {data.unpricedTokensCount}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* UNI Price */}
            <div className="retro-panel p-3">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-gray-400">UNI PRICE</span>
                <span className="text-[#ff007a]">
                  ${data.uniPriceUsd.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contract Links */}
      {data && (
        <div className="retro-panel p-4 mt-6">
          <h2 className="text-xs text-[#feb236] mb-3">CONTRACTS</h2>
          <div className="space-y-2 text-[8px]">
            <div className="flex flex-col md:flex-row md:items-center gap-1">
              <span className="text-gray-400 w-20">TOKENJAR:</span>
              <a
                href={`https://etherscan.io/address/${TOKENJAR_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#4a90d9] hover:text-[#6bb0ff] break-all"
              >
                {TOKENJAR_ADDRESS}
              </a>
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-1">
              <span className="text-gray-400 w-20">FIREPIT:</span>
              <a
                href={`https://etherscan.io/address/${FIREPIT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#4a90d9] hover:text-[#6bb0ff] break-all"
              >
                {FIREPIT_ADDRESS}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-6 text-center text-[8px] text-gray-600">
        <p>DATA REFRESHES EVERY 30 SEC</p>
        <p className="mt-1">PRICES VIA COINGECKO - DYOR</p>
        <p className="mt-2 text-gray-700">
          PRESS START TO PLAY
        </p>
      </footer>
    </main>
  );
}

// Helper to get token colors
function getTokenColor(symbol: string): string {
  const colors: Record<string, string> = {
    WETH: "#627eea",
    USDC: "#2775ca",
    USDT: "#26a17b",
    WBTC: "#f7931a",
    DAI: "#f5ac37",
    UNI: "#ff007a",
    LINK: "#2a5ada",
    AAVE: "#b6509e",
    PAXG: "#e4ce4e",
  };
  return colors[symbol] || "#feb236";
}
