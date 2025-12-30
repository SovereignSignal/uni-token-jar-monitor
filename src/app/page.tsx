"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { REFRESH_INTERVAL_MS, TOKENJAR_ADDRESS, FIREPIT_ADDRESS } from "@/lib/constants";
import type { TokenJarApiResponse } from "./api/tokenjar/route";
import type { ProfitabilityData } from "@/lib/profitability";
import JarVisualization from "@/components/PixelJar";

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

// Tooltip component
function Tooltip({ children, text }: { children: React.ReactNode; text: string }) {
  const [show, setShow] = useState(false);
  
  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="cursor-help"
      >
        {children}
      </div>
      {show && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#2D2F36] border-2 border-[#FF007A] text-[8px] text-gray-300 whitespace-nowrap">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#FF007A]" />
        </div>
      )}
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

// Floating ember particle component
function FloatingEmbers() {
  const embers = useMemo(() => 
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      left: 10 + Math.random() * 80,
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 2,
      size: 2 + Math.random() * 3,
    })), []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {embers.map((ember) => (
        <div
          key={ember.id}
          className="absolute bottom-0 rounded-full ember-float"
          style={{
            left: `${ember.left}%`,
            width: ember.size,
            height: ember.size,
            background: `radial-gradient(circle, #ff6b35 0%, #ff4500 50%, transparent 100%)`,
            animationDelay: `${ember.delay}s`,
            animationDuration: `${ember.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

// Profit threshold indicator
function ProfitThreshold({ currentValue, burnCost }: { currentValue: number; burnCost: number }) {
  const needed = burnCost - currentValue;
  const progress = Math.min(100, (currentValue / burnCost) * 100);
  
  return (
    <div className="mt-4 p-3 bg-[#191B1F] border border-[#40444F]">
      <div className="flex justify-between items-center mb-2">
        <Tooltip text="Amount needed in jar to break even on burn">
          <span className="text-[8px] text-gray-400 flex items-center gap-1">
            <span className="text-yellow-400">⚡</span> PROFIT THRESHOLD
          </span>
        </Tooltip>
        <span className="text-[8px] text-gray-500">{progress.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-[#2D2F36] rounded overflow-hidden">
        <div 
          className="h-full transition-all duration-500"
          style={{ 
            width: `${progress}%`,
            background: progress >= 100 
              ? 'linear-gradient(90deg, #27AE60, #58d858)' 
              : 'linear-gradient(90deg, #FF007A, #ff5fa2)'
          }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[8px] text-gray-500">$0</span>
        <span className="text-[8px] text-yellow-400">
          {needed > 0 ? `${formatUsd(needed)} more needed` : 'PROFITABLE!'}
        </span>
        <span className="text-[8px] text-gray-500">{formatUsd(burnCost)}</span>
      </div>
    </div>
  );
}

// Jar state indicator (cracked, normal, glowing)
function JarStateIndicator({ netProfit, burnCost }: { netProfit: number; burnCost: number }) {
  const ratio = netProfit / burnCost;
  
  let state: 'cracked' | 'normal' | 'close' | 'profitable';
  let message: string;
  let color: string;
  
  if (netProfit >= 0) {
    state = 'profitable';
    message = '✨ READY TO CLAIM!';
    color = 'text-green-400';
  } else if (ratio > -0.1) {
    state = 'close';
    message = '🔥 ALMOST THERE!';
    color = 'text-yellow-400';
  } else if (ratio > -0.5) {
    state = 'normal';
    message = '⏳ ACCUMULATING...';
    color = 'text-gray-400';
  } else {
    state = 'cracked';
    message = '💀 VERY UNPROFITABLE';
    color = 'text-red-400';
  }
  
  return (
    <div className={`text-[8px] ${color} text-center mt-2 ${state === 'profitable' ? 'animate-pulse' : ''}`}>
      {message}
    </div>
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
      {/* Retro Header with Logo */}
      <header className="retro-panel p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Image
              src="/assets/logo.png"
              alt="UNI JAR Logo"
              width={64}
              height={64}
              className="pixel-sprite logo-bounce"
              style={{ imageRendering: 'pixelated' }}
              priority
            />
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
            {/* Health hearts with tooltip */}
            <Tooltip text="Profitability health indicator">
              <div className="flex gap-1">
                {hearts.map((filled, i) => (
                  <PixelHeart key={i} filled={filled} />
                ))}
              </div>
            </Tooltip>
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
          <Image
            src="/assets/logo.png"
            alt="Loading..."
            width={96}
            height={96}
            className="pixel-sprite animate-bounce"
            style={{ imageRendering: 'pixelated' }}
          />
          <div className="text-xl text-[#FF007A] animate-pulse mb-4 mt-4">
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
            {/* Floating embers effect */}
            <FloatingEmbers />
            
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

            {/* Jar State Indicator */}
            <JarStateIndicator netProfit={data.netProfitUsd} burnCost={data.burnCostUsd} />

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
                    ? "bg-green-900/50 text-green-300 border-2 border-green-600 treasure-glow"
                    : "bg-red-900/50 text-red-300 border-2 border-red-600"
                }`}
              >
                {data.isProfitable ? "✨ PROFITABLE! ✨" : "NOT PROFITABLE"}
              </div>
            </div>

            {/* Profit Threshold Indicator */}
            <ProfitThreshold currentValue={data.totalJarValueUsd} burnCost={data.burnCostUsd} />
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
                  <Tooltip text="Total value of tokens in the jar">
                    <span className="text-gray-400 cursor-help">JAR VALUE</span>
                  </Tooltip>
                  <span className="text-yellow-400">
                    {formatUsd(data.totalJarValueUsd)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <Tooltip text="Cost to burn 4000 UNI tokens to claim the jar">
                    <span className="text-gray-400 flex items-center gap-1 cursor-help">
                      <PixelSkull />
                      BURN COST ({data.burnThreshold.toLocaleString()} UNI)
                    </span>
                  </Tooltip>
                  <span className="text-red-400">
                    -{formatUsd(data.burnCostUsd)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <Tooltip text="Estimated gas cost for the burn transaction">
                    <span className="text-gray-400 cursor-help">GAS EST.</span>
                  </Tooltip>
                  <span className="text-red-400">
                    -{formatUsd(data.gasEstimateUsd)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 text-sm">
                  <Tooltip text="Net profit/loss if you burn now">
                    <span className="text-white font-bold cursor-help">NET REWARD</span>
                  </Tooltip>
                  <span
                    className={`font-bold ${
                      data.isProfitable ? "text-green-400 treasure-glow" : "text-red-400 danger-pulse"
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
                      className="flex justify-between items-center py-1 px-2 hover:bg-white/5 text-[10px] border-l-2 border-transparent hover:border-[#FF007A] transition-all"
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
                    <Tooltip text="Tokens without price data from CoinGecko">
                      <div className="mt-1 text-gray-600 cursor-help">
                        UNPRICED: {data.unpricedTokensCount}
                      </div>
                    </Tooltip>
                  )}
                </div>
              )}
            </div>

            {/* UNI Price */}
            <div className="retro-panel p-3">
              <div className="flex justify-between items-center text-[10px]">
                <Tooltip text="Current UNI token price from CoinGecko">
                  <span className="text-gray-400 cursor-help">UNI PRICE</span>
                </Tooltip>
                <span className="text-[#ff007a] font-bold">
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
