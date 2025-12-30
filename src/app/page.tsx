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
    loading: { color: "text-gray-400", bg: "bg-gray-400", label: "LOADING", animate: true },
    fresh: { color: "text-green-400", bg: "bg-green-400", label: "LIVE", animate: false },
    stale: { color: "text-yellow-400", bg: "bg-yellow-400", label: "STALE", animate: true },
    error: { color: "text-red-400", bg: "bg-red-400", label: "ERROR", animate: true },
  };
  const config = configs[status];

  return (
    <div className="flex items-center gap-2">
      <div 
        className={`w-2 h-2 rounded-full ${config.bg} ${config.animate ? 'animate-pulse' : ''}`}
        style={{ boxShadow: `0 0 8px currentColor` }} 
      />
      <span className={`text-[10px] ${config.color}`}>{config.label}</span>
    </div>
  );
}

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
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#1a1c22] border border-[rgba(255,0,122,0.3)] rounded text-[8px] text-gray-300 whitespace-nowrap shadow-lg">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[rgba(255,0,122,0.3)]" />
        </div>
      )}
    </div>
  );
}

function formatUsd(value: number, showSign = false): string {
  const absValue = Math.abs(value);
  const sign = showSign ? (value >= 0 ? "+" : "-") : value < 0 ? "-" : "";
  if (absValue >= 1_000_000) return `${sign}$${(absValue / 1_000_000).toFixed(2)}M`;
  if (absValue >= 1_000) return `${sign}$${(absValue / 1_000).toFixed(1)}K`;
  return `${sign}$${absValue.toFixed(0)}`;
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h`;
}

// Truncate address for display
function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Pixel heart - Uniswap pink
function PixelHeart({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 8 8" width="12" height="12" style={{ imageRendering: "pixelated" }}>
      <rect x="1" y="1" width="2" height="2" fill={filled ? "#FF007A" : "#2D2F36"} />
      <rect x="5" y="1" width="2" height="2" fill={filled ? "#FF007A" : "#2D2F36"} />
      <rect x="0" y="2" width="8" height="3" fill={filled ? "#FF007A" : "#2D2F36"} />
      <rect x="1" y="5" width="6" height="1" fill={filled ? "#c7005f" : "#1a1c22"} />
      <rect x="2" y="6" width="4" height="1" fill={filled ? "#c7005f" : "#1a1c22"} />
      <rect x="3" y="7" width="2" height="1" fill={filled ? "#c7005f" : "#1a1c22"} />
      {filled && <rect x="1" y="2" width="1" height="1" fill="#ff5fa2" />}
    </svg>
  );
}

// Floating ember particles
function FloatingEmbers() {
  const embers = useMemo(() => 
    Array.from({ length: 6 }, (_, i) => ({
      id: i,
      left: 15 + Math.random() * 70,
      delay: Math.random() * 3,
      duration: 2.5 + Math.random() * 1.5,
      size: 2 + Math.random() * 2,
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

// Profit Threshold Gauge
function ProfitGauge({ currentValue, burnCost }: { currentValue: number; burnCost: number }) {
  const needed = burnCost - currentValue;
  const progress = Math.min(100, Math.max(0, (currentValue / burnCost) * 100));
  const isProfitable = progress >= 100;
  
  return (
    <div className="mt-6 pt-6 border-t border-gray-800/50">
      <div className="flex justify-between items-center mb-3">
        <span className="text-[9px] text-gray-500 uppercase tracking-wider">Profit Threshold</span>
        <span className={`text-[10px] font-bold ${isProfitable ? 'text-green-400' : 'text-pink'}`}>
          {progress.toFixed(1)}%
        </span>
      </div>
      
      <div className="h-3 bg-gray-900 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ 
            width: `${progress}%`,
            background: isProfitable 
              ? 'linear-gradient(90deg, #27AE60, #58d858)' 
              : 'linear-gradient(90deg, #FF007A, #ff5fa2)',
            boxShadow: isProfitable 
              ? '0 0 10px rgba(39, 174, 96, 0.5)' 
              : '0 0 10px rgba(255, 0, 122, 0.5)'
          }}
        />
      </div>
      
      <div className="flex justify-between mt-2 text-[8px]">
        <span className="text-gray-600">$0</span>
        <span className={isProfitable ? 'text-green-400' : 'text-yellow-400'}>
          {needed > 0 ? `${formatUsd(needed)} needed` : '✓ PROFITABLE'}
        </span>
        <span className="text-gray-600">{formatUsd(burnCost)}</span>
      </div>
    </div>
  );
}

// Status badge based on profitability
function StatusBadge({ netProfit, burnCost }: { netProfit: number; burnCost: number }) {
  const ratio = netProfit / burnCost;
  
  let message: string;
  let bgClass: string;
  let textClass: string;
  
  if (netProfit >= 0) {
    message = '✨ READY TO CLAIM';
    bgClass = 'bg-green-500/20 border-green-500/40';
    textClass = 'text-green-400';
  } else if (ratio > -0.1) {
    message = '🔥 ALMOST THERE';
    bgClass = 'bg-yellow-500/20 border-yellow-500/40';
    textClass = 'text-yellow-400';
  } else if (ratio > -0.5) {
    message = '⏳ ACCUMULATING';
    bgClass = 'bg-gray-500/20 border-gray-500/40';
    textClass = 'text-gray-400';
  } else {
    message = '💀 VERY UNPROFITABLE';
    bgClass = 'bg-red-500/20 border-red-500/40';
    textClass = 'text-red-400';
  }
  
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${bgClass}`}>
      <span className={`text-[10px] font-medium ${textClass}`}>{message}</span>
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
  const healthPercent = data ? Math.max(0, Math.min(100, ((data.netProfitUsd + 30000) / 60000) * 100)) : 50;
  const hearts = [healthPercent > 66, healthPercent > 33, healthPercent > 0];

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <header className="card mb-6 p-4 md:p-5">
        <div className="flex items-center justify-between w-full">
          {/* Logo & Title - larger logo with glow, tighter text stack */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {/* Logo glow */}
              <div 
                className="absolute inset-0 blur-xl opacity-50"
                style={{ background: 'radial-gradient(circle, rgba(255,0,122,0.6) 0%, transparent 70%)' }}
              />
              <Image
                src="/assets/logo-clean.png"
                alt="UNI JAR"
                width={56}
                height={56}
                className="pixel-sprite logo-bounce relative z-10"
                style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 0 8px rgba(255,0,122,0.5))' }}
                priority
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg md:text-xl font-bold text-[#FF007A] leading-tight" style={{ textShadow: '0 0 20px rgba(255,0,122,0.5)' }}>
                UNI JAR
              </h1>
              <p className="text-[9px] text-gray-400 tracking-wider">
                Uniswap Fee Burn Monitor
              </p>
            </div>
          </div>
          
          {/* Status & Controls */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex gap-1">
              {hearts.map((filled, i) => (
                <PixelHeart key={i} filled={filled} />
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              <StatusIndicator status={status} />
              {lastFetch && (
                <span className="text-[8px] text-gray-600">
                  {formatTimeAgo(lastFetch)}
                </span>
              )}
            </div>
            
            <button
              onClick={fetchData}
              disabled={isRefreshing}
              className="retro-btn text-[9px] px-3 py-2"
            >
              {isRefreshing ? "..." : "SCOUT"}
            </button>
          </div>
        </div>
      </header>

      {/* Error State */}
      {error && (
        <div className="card p-5 mb-6 border-red-500/30">
          <div className="flex items-center gap-4">
            <span className="text-2xl">💀</span>
            <div>
              <h2 className="text-red-400 text-[11px] mb-1">ERROR</h2>
              <p className="text-red-400/70 text-[10px]">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {!data && !error && (
        <div className="flex flex-col items-center justify-center py-24">
          <Image
            src="/assets/logo.png"
            alt="Loading..."
            width={80}
            height={80}
            className="pixel-sprite animate-bounce mb-6"
            style={{ imageRendering: 'pixelated' }}
          />
          <div className="text-[#FF007A] text-sm animate-pulse">
            LOADING JAR...
          </div>
        </div>
      )}

      {/* Main Content */}
      {data && (
        <div className="space-y-5">
          {/* Jar Visualization Card */}
          <div className="card p-6 md:p-8 relative overflow-hidden">
            <FloatingEmbers />
            
            <h2 className="text-[10px] text-center mb-4 text-[#FF007A] tracking-widest">
              BURN vs VAULT
            </h2>

            {/* Jar with glow effect */}
            <div className="flex justify-center relative">
              <div 
                className="absolute inset-0 flex justify-center items-center pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(255,0,122,0.15) 0%, transparent 60%)',
                }}
              />
              <JarVisualization
                tokens={data.displayTokens.map((t) => ({
                  symbol: t.symbol,
                  valueUsd: t.valueUsd,
                }))}
                totalValue={data.totalJarValueUsd}
                burnCost={data.burnCostUsd}
                isProfitable={data.isProfitable}
              />
            </div>
          </div>

          {/* Net Profit Card */}
          <div className="card p-6">
            <div className="text-center">
              <span className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Net Profit</span>
              <div 
                className={`text-3xl md:text-4xl font-bold mt-2 mb-4 ${
                  data.isProfitable ? 'text-green-400' : 'text-red-400'
                }`}
                style={{
                  textShadow: data.isProfitable 
                    ? '0 0 30px rgba(39,174,96,0.5)' 
                    : '0 0 30px rgba(253,64,64,0.5)'
                }}
              >
                {formatUsd(data.netProfitUsd, true)}
              </div>
              
              <StatusBadge netProfit={data.netProfitUsd} burnCost={data.burnCostUsd} />
            </div>
            
            {/* Profit Gauge */}
            <ProfitGauge currentValue={data.totalJarValueUsd} burnCost={data.burnCostUsd} />
          </div>

          {/* Stats Grid - Separate Cards */}
          <div className="grid md:grid-cols-2 gap-5">
            {/* Breakdown Card - matched height with tokens */}
            <div className="card p-5 flex flex-col min-h-[200px]">
              <h2 className="text-[9px] text-[#FF007A] mb-4 tracking-widest">BREAKDOWN</h2>
              <div className="space-y-3 flex-1">
                <div className="flex justify-between items-center">
                  <Tooltip text="Total value of tokens in the jar">
                    <span className="text-[10px] text-gray-400">JAR VALUE</span>
                  </Tooltip>
                  <span className="text-[11px] text-yellow-400 font-medium">
                    {formatUsd(data.totalJarValueUsd)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <Tooltip text="Cost to burn 4000 UNI tokens">
                    <span className="text-[10px] text-gray-400">
                      BURN COST <span className="text-gray-600">({data.burnThreshold.toLocaleString()} UNI)</span>
                    </span>
                  </Tooltip>
                  <span className="text-[11px] text-red-400 font-medium">
                    -{formatUsd(data.burnCostUsd)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <Tooltip text="Estimated gas for transaction">
                    <span className="text-[10px] text-gray-400">GAS EST.</span>
                  </Tooltip>
                  <span className="text-[11px] text-red-400 font-medium">
                    -{formatUsd(data.gasEstimateUsd)}
                  </span>
                </div>
              </div>
              
              {/* UNI Price - reference info with divider */}
              <div className="mt-auto pt-4 border-t border-gray-800/50 flex justify-between items-center">
                <Tooltip text="Current UNI token price">
                  <span className="text-[10px] text-gray-400">UNI PRICE</span>
                </Tooltip>
                <span className="text-[13px] text-[#FF007A] font-bold">
                  ${data.uniPriceUsd.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Tokens Card - matched height with breakdown */}
            <div className="card p-5 flex flex-col min-h-[200px]">
              <h2 className="text-[9px] text-[#FF007A] mb-4 tracking-widest">
                TOKENS <span className="text-gray-600">(&gt;$1K)</span>
              </h2>

              {data.displayTokens.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <p className="text-gray-500 text-[10px]">NO LARGE HOLDINGS</p>
                  <p className="text-gray-600 text-[8px] mt-1">(small balances only)</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-28 overflow-y-auto flex-1">
                  {data.displayTokens.map((token) => (
                    <div
                      key={token.address}
                      className="flex justify-between items-center py-1 text-[10px]"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-sm"
                          style={{ background: getTokenColor(token.symbol) }}
                        />
                        <span className="text-white">{token.symbol}</span>
                      </div>
                      <span className="text-green-400 text-[9px]">
                        {token.valueUsd ? formatUsd(token.valueUsd) : "-"}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {(data.otherTokensCount > 0 || data.unpricedTokensCount > 0) && (
                <div className="mt-auto pt-3 border-t border-gray-800/50 text-[9px] text-gray-400">
                  {data.otherTokensCount > 0 && (
                    <div className="flex justify-between">
                      <span>Other x{data.otherTokensCount}</span>
                      <span className="text-yellow-400/70">{formatUsd(data.otherTokensValueUsd)}</span>
                    </div>
                  )}
                  {data.unpricedTokensCount > 0 && (
                    <div className="mt-1 text-gray-500">Unpriced: {data.unpricedTokensCount}</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Contracts Card - Separate, cleaner */}
          <div className="card p-5">
            <h2 className="text-[9px] text-[#FF007A] mb-4 tracking-widest">CONTRACTS</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-gray-500 font-medium">TOKENJAR</span>
                <a
                  href={`https://etherscan.io/address/${TOKENJAR_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-blue-400 hover:text-blue-300 font-mono transition-colors"
                >
                  {truncateAddress(TOKENJAR_ADDRESS)}
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-gray-500 font-medium">FIREPIT</span>
                <a
                  href={`https://etherscan.io/address/${FIREPIT_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-blue-400 hover:text-blue-300 font-mono transition-colors"
                >
                  {truncateAddress(FIREPIT_ADDRESS)}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 text-center text-[8px] text-gray-600">
        <p>Auto-refreshes every 30 seconds • Prices via CoinGecko</p>
        <p className="mt-1 text-gray-700">Not financial advice</p>
      </footer>
    </main>
  );
}

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
