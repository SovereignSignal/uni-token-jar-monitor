"use client";

import { useEffect, useState, useCallback } from "react";
import { REFRESH_INTERVAL_MS, TOKENJAR_ADDRESS, FIREPIT_ADDRESS } from "@/lib/constants";
import type { TokenJarApiResponse } from "./api/tokenjar/route";
import type { ProfitabilityData } from "@/lib/profitability";
import JarVisualization from "@/components/PixelJar";
import ZeldaMessageBox from "@/components/ZeldaMessageBox";

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
  const configs = {
    loading: { color: "text-gray-400", bg: "bg-gray-400", label: "SEARCHING...", animate: true },
    fresh: { color: "text-green-400", bg: "bg-green-400", label: "LIVE", animate: false },
    stale: { color: "text-yellow-400", bg: "bg-yellow-400", label: "STALE", animate: true },
    error: { color: "text-red-400", bg: "bg-red-400", label: "DANGER!", animate: true },
  };

  const config = configs[status];

  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 ${config.bg} ${config.animate ? 'animate-pulse' : ''}`}
           style={{ boxShadow: `0 0 8px currentColor` }} />
      <span className={`text-[10px] ${config.color} ${config.animate ? 'animate-pulse' : ''}`}>
        {config.label}
      </span>
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

// Pixel skull for danger indicator
function PixelSkull() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" style={{ imageRendering: "pixelated" }}>
      <rect x="4" y="1" width="8" height="1" fill="#fff" />
      <rect x="2" y="2" width="12" height="1" fill="#fff" />
      <rect x="1" y="3" width="14" height="1" fill="#fff" />
      <rect x="1" y="4" width="3" height="3" fill="#fff" />
      <rect x="4" y="4" width="3" height="3" fill="#1a1a2e" />
      <rect x="7" y="4" width="2" height="3" fill="#fff" />
      <rect x="9" y="4" width="3" height="3" fill="#1a1a2e" />
      <rect x="12" y="4" width="3" height="3" fill="#fff" />
      <rect x="1" y="7" width="14" height="2" fill="#fff" />
      <rect x="2" y="9" width="12" height="1" fill="#fff" />
      <rect x="3" y="10" width="10" height="1" fill="#fff" />
      <rect x="4" y="11" width="2" height="2" fill="#fff" />
      <rect x="7" y="11" width="2" height="2" fill="#fff" />
      <rect x="10" y="11" width="2" height="2" fill="#fff" />
    </svg>
  );
}

// Pixel treasure chest
function PixelTreasure() {
  return (
    <svg viewBox="0 0 20 16" width="20" height="16" style={{ imageRendering: "pixelated" }}>
      <rect x="1" y="5" width="18" height="10" fill="#8b4513" />
      <rect x="0" y="6" width="20" height="2" fill="#daa520" />
      <rect x="8" y="4" width="4" height="4" fill="#f8d800" />
      <rect x="9" y="5" width="2" height="2" fill="#fff" />
      <rect x="2" y="8" width="16" height="1" fill="#6b3a1a" />
      <rect x="0" y="9" width="20" height="6" fill="#a0522d" />
      <rect x="8" y="9" width="4" height="3" fill="#daa520" />
    </svg>
  );
}

// Pixel heart - Uniswap pink
function PixelHeart({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 8 8" width="14" height="14" style={{ imageRendering: "pixelated" }}>
      <rect x="1" y="1" width="2" height="2" fill={filled ? "#FF007A" : "#40444F"} />
      <rect x="5" y="1" width="2" height="2" fill={filled ? "#FF007A" : "#40444F"} />
      <rect x="0" y="2" width="8" height="3" fill={filled ? "#FF007A" : "#40444F"} />
      <rect x="1" y="5" width="6" height="1" fill={filled ? "#c7005f" : "#2D2F36"} />
      <rect x="2" y="6" width="4" height="1" fill={filled ? "#c7005f" : "#2D2F36"} />
      <rect x="3" y="7" width="2" height="1" fill={filled ? "#c7005f" : "#2D2F36"} />
      {/* Highlight */}
      {filled && <rect x="1" y="2" width="1" height="1" fill="#ff5fa2" />}
    </svg>
  );
}

// Pixel Unicorn for header
function HeaderUnicorn() {
  return (
    <svg viewBox="0 0 20 20" width="28" height="28" style={{ imageRendering: "pixelated" }} className="unicorn-bounce">
      {/* Horn */}
      <rect x="14" y="1" width="1" height="1" fill="#FFD700" />
      <rect x="15" y="2" width="1" height="2" fill="#FFD700" />
      <rect x="16" y="3" width="1" height="2" fill="#FFD700" />
      {/* Head */}
      <rect x="10" y="4" width="6" height="5" fill="#FF007A" />
      <rect x="9" y="5" width="1" height="4" fill="#FF007A" />
      {/* Eye */}
      <rect x="12" y="5" width="3" height="2" fill="#fff" />
      <rect x="13" y="6" width="1" height="1" fill="#191B1F" />
      {/* Mane */}
      <rect x="7" y="4" width="3" height="1" fill="#7B61FF" />
      <rect x="6" y="5" width="3" height="1" fill="#7B61FF" />
      <rect x="5" y="6" width="3" height="1" fill="#7B61FF" />
      <rect x="4" y="7" width="3" height="2" fill="#7B61FF" />
      {/* Body */}
      <rect x="5" y="9" width="10" height="5" fill="#FF007A" />
      <rect x="4" y="10" width="1" height="4" fill="#FF007A" />
      {/* Legs */}
      <rect x="5" y="14" width="2" height="4" fill="#c7005f" />
      <rect x="11" y="14" width="2" height="4" fill="#c7005f" />
      {/* Hooves */}
      <rect x="5" y="18" width="2" height="1" fill="#FFD700" />
      <rect x="11" y="18" width="2" height="1" fill="#FFD700" />
      {/* Tail */}
      <rect x="3" y="10" width="1" height="2" fill="#7B61FF" />
      <rect x="2" y="11" width="1" height="2" fill="#7B61FF" />
      <rect x="1" y="12" width="1" height="2" fill="#7B61FF" />
    </svg>
  );
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

  // Calculate "health" based on profitability
  const healthPercent = data ? Math.max(0, Math.min(100, ((data.netProfitUsd + 30000) / 60000) * 100)) : 50;
  const hearts = [healthPercent > 66, healthPercent > 33, healthPercent > 0];

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto scanlines crt-effect">
      {/* Retro Header */}
      <header className="retro-panel p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <HeaderUnicorn />
            <div>
              <h1 className="text-lg md:text-xl text-glow-pink glow-pulse" style={{ color: '#FF007A' }}>
                UNI JAR
              </h1>
              <p className="text-[8px] text-gray-400 mt-1">
                UNISWAP FEE BURN MONITOR
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Health hearts */}
            <div className="flex gap-1">
              {hearts.map((filled, i) => (
                <PixelHeart key={i} filled={filled} />
              ))}
            </div>
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
              {isRefreshing ? "..." : "SCOUT"}
            </button>
          </div>
        </div>
      </header>

      {/* Error State */}
      {error && (
        <div className="retro-panel p-4 mb-6 border-red-600 danger-pulse">
          <div className="flex items-center gap-3">
            <PixelSkull />
            <div>
              <h2 className="text-red-400 text-xs mb-1">TRAP TRIGGERED!</h2>
              <p className="text-red-300 text-[10px]">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {!data && !error && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-xl text-[#FF007A] animate-pulse mb-4">
            LOADING JAR...
          </div>
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-4 h-4 bg-[#FF007A]"
                style={{
                  animation: `bounce 0.6s ease-in-out ${i * 0.15}s infinite`,
                }}
              />
            ))}
          </div>
          <p className="mt-4 text-[8px] text-gray-600">
            FETCHING TOKEN DATA...
          </p>
        </div>
      )}

      {/* Main Content */}
      {data && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column - Jar Visualization */}
          <div className="retro-panel p-4 relative overflow-hidden">
            <h2 className="text-xs text-center mb-2 text-[#FF007A] flex items-center justify-center gap-2">
              <span className="text-[10px]">~</span>
              BURN vs VAULT
              <span className="text-[10px]">~</span>
            </h2>

            {/* New Pixel Art Jar Visualization */}
            <JarVisualization
              tokens={data.displayTokens.map((t) => ({
                symbol: t.symbol,
                valueUsd: t.valueUsd,
              }))}
              totalValue={data.totalJarValueUsd}
              burnCost={data.burnCostUsd}
              isProfitable={data.isProfitable}
            />

            {/* Profitability Status */}
            <div className="text-center mt-4">
              <div className="text-[8px] text-gray-400 mb-1 flex items-center justify-center gap-2">
                {data.isProfitable ? <PixelTreasure /> : <PixelSkull />}
                <span>STATUS</span>
                {data.isProfitable ? <PixelTreasure /> : <PixelSkull />}
              </div>
              <div
                className={`inline-block mt-2 px-4 py-2 text-[10px] ${
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
              <h2 className="text-xs text-[#FF007A] mb-4 flex items-center gap-2">
                <span>BREAKDOWN</span>
              </h2>
              <div className="space-y-2 text-[10px]">
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <span className="text-gray-400">JAR VALUE</span>
                  <span className="text-yellow-400">
                    {formatUsd(data.totalJarValueUsd)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <span className="text-gray-400 flex items-center gap-1">
                    <PixelSkull />
                    BURN COST ({data.burnThreshold.toLocaleString()} UNI)
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
                <div className="flex justify-between items-center py-2 text-sm">
                  <span className="text-white font-bold">NET REWARD</span>
                  <span
                    className={`font-bold ${
                      data.isProfitable ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {formatUsd(data.netProfitUsd, true)}
                  </span>
                </div>
              </div>
            </div>

            {/* Token List Panel */}
            <div className="retro-panel p-4">
              <h2 className="text-xs text-[#FF007A] mb-4">
                TOKENS
                <span className="text-gray-500 text-[8px] ml-2">
                  (&gt;$1K value)
                </span>
              </h2>

              {data.displayTokens.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-[10px]">
                    NO LARGE HOLDINGS
                  </p>
                  <p className="text-gray-600 text-[8px] mt-1">
                    (only small balances detected)
                  </p>
                </div>
              ) : (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {data.displayTokens.map((token) => (
                    <div
                      key={token.address}
                      className="flex justify-between items-center py-1 px-2 hover:bg-white/5 text-[10px] border-l-2 border-transparent hover:border-[#FF007A]"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-sm"
                          style={{
                            background: getTokenColor(token.symbol),
                            boxShadow: `0 0 4px ${getTokenColor(token.symbol)}`,
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
                      <span>OTHER TOKENS x{data.otherTokensCount}</span>
                      <span className="text-yellow-600">{formatUsd(data.otherTokensValueUsd)}</span>
                    </div>
                  )}
                  {data.unpricedTokensCount > 0 && (
                    <div className="mt-1 text-gray-600">
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
                <span className="text-[#ff007a] font-bold">
                  ${data.uniPriceUsd.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Zelda-style Message Box */}
      {data && (
        <div className="mt-6">
          <ZeldaMessageBox 
            isProfitable={data.isProfitable} 
            netProfit={data.netProfitUsd} 
          />
        </div>
      )}

      {/* Contract Links */}
      {data && (
        <div className="retro-panel p-4 mt-6">
          <h2 className="text-xs text-[#FF007A] mb-3">CONTRACTS</h2>
          <div className="space-y-2 text-[8px]">
            <div className="flex flex-col md:flex-row md:items-center gap-1">
              <span className="text-gray-400 w-24">TOKENJAR:</span>
              <a
                href={`https://etherscan.io/address/${TOKENJAR_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#4a90d9] hover:text-[#6bb0ff] break-all hover:underline"
              >
                {TOKENJAR_ADDRESS}
              </a>
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-1">
              <span className="text-gray-400 w-24">FIREPIT:</span>
              <a
                href={`https://etherscan.io/address/${FIREPIT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#4a90d9] hover:text-[#6bb0ff] break-all hover:underline"
              >
                {FIREPIT_ADDRESS}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-6 text-center text-[8px] text-gray-600">
        <p>REFRESHES EVERY 30 SECONDS</p>
        <p className="mt-1">PRICES VIA COINGECKO - NOT FINANCIAL ADVICE</p>
        <p className="mt-3 text-[#FF007A] text-[10px]">
          - UNI JAR -
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
  return colors[symbol] || "#FF007A";
}
