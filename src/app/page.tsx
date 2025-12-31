"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { REFRESH_INTERVAL_MS, TOKENJAR_ADDRESS, FIREPIT_ADDRESS } from "@/lib/constants";
import type { TokenJarApiResponse } from "./api/tokenjar/route";
import type { ProfitabilityData } from "@/lib/profitability";
import type { BurnHistory } from "@/lib/burnHistory";
import JarVisualization from "@/components/PixelJar";
import TokenTabs from "@/components/TokenTabs";

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

// Format timestamp to UTC time string
function formatUtcTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toISOString().slice(11, 19) + " UTC";
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
  const [burnHistory, setBurnHistory] = useState<BurnHistory | null>(null);
  const [dataSource, setDataSource] = useState<string>("");
  const [dataAge, setDataAge] = useState<number>(0);
  const [cacheStatus, setCacheStatus] = useState<string>("");

  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/tokenjar");
      const result: TokenJarApiResponse = await response.json();
      if (result.success && result.data) {
        setData(result.data);
        setError(null);
        setLastFetch(Date.now());
        // Extract cache metadata
        const extendedData = result.data as ProfitabilityData & { dataSource?: string; dataAge?: number; cacheStatus?: string };
        if (extendedData.dataSource) setDataSource(extendedData.dataSource);
        if (extendedData.dataAge !== undefined) setDataAge(extendedData.dataAge);
        if (extendedData.cacheStatus) setCacheStatus(extendedData.cacheStatus);
      } else {
        setError(result.error || "Failed to fetch data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Fetch burn history separately (less frequent)
  const fetchBurnHistory = useCallback(async () => {
    try {
      const response = await fetch("/api/burns");
      const result = await response.json();
      if (result.success && result.data) {
        setBurnHistory(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch burn history:", err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchBurnHistory();
    const interval = setInterval(fetchData, REFRESH_INTERVAL_MS);
    // Refresh burn history every 5 minutes
    const burnInterval = setInterval(fetchBurnHistory, 5 * 60 * 1000);
    return () => {
      clearInterval(interval);
      clearInterval(burnInterval);
    };
  }, [fetchData, fetchBurnHistory]);

  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const status = getDataStatus(lastFetch, !!error);

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header - Full Width Banner */}
      <header className="mb-6">
        <div className="card p-6 flex justify-center">
          <Image
            src="/assets/ui/header-banner.png"
            alt="UNI JAR - Uniswap Fee Burn Monitor"
            width={600}
            height={180}
            className="pixel-sprite w-full max-w-2xl"
            style={{ 
              imageRendering: 'pixelated',
              filter: 'drop-shadow(0 0 20px rgba(255,0,122,0.6))'
            }}
            priority
          />
        </div>
        
        {/* Explainer Section with Decorative Icons */}
        <div className="card p-5 mt-4">
          <div className="flex items-center justify-center gap-6">
            {/* Left decorative icons */}
            <div className="hidden md:flex items-center gap-3 opacity-60">
              <Image
                src="/assets/ui/icon-unicorn.png"
                alt=""
                width={40}
                height={40}
                className="pixel-sprite"
                style={{ imageRendering: 'pixelated' }}
              />
              <Image
                src="/assets/ui/icon-coin.png"
                alt=""
                width={32}
                height={32}
                className="pixel-sprite"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            
            {/* Explainer text */}
            <div className="text-center flex-1 max-w-xl">
              <p className="text-[11px] text-gray-400 leading-relaxed">
                <span className="text-[#FF007A] font-medium">Uniswap Fee Switch Monitor</span> — Track the TokenJar vault that collects protocol fees. 
                When the vault value exceeds the cost to burn <span className="text-yellow-400">4,000 UNI</span> tokens, anyone can trigger a burn and claim the rewards.
              </p>
            </div>
            
            {/* Right decorative icons */}
            <div className="hidden md:flex items-center gap-3 opacity-60">
              <Image
                src="/assets/ui/icon-coin.png"
                alt=""
                width={32}
                height={32}
                className="pixel-sprite"
                style={{ imageRendering: 'pixelated' }}
              />
              <Image
                src="/assets/ui/icon-flame.png"
                alt=""
                width={40}
                height={40}
                className="pixel-sprite"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
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

            {/* Contracts Card - Side by side with Breakdown */}
            <div className="card p-5 flex flex-col min-h-[200px]">
              <h2 className="text-[9px] text-[#FF007A] mb-4 tracking-widest">CONTRACTS</h2>
              <div className="space-y-4 flex-1">
                <div>
                  <span className="text-[9px] text-gray-500 font-medium block mb-1">TOKENJAR</span>
                  <a
                    href={`https://etherscan.io/address/${TOKENJAR_ADDRESS}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-blue-400 hover:text-blue-300 font-mono transition-colors break-all"
                  >
                    {TOKENJAR_ADDRESS}
                  </a>
                </div>
                <div>
                  <span className="text-[9px] text-gray-500 font-medium block mb-1">FIREPIT</span>
                  <a
                    href={`https://etherscan.io/address/${FIREPIT_ADDRESS}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-blue-400 hover:text-blue-300 font-mono transition-colors break-all"
                  >
                    {FIREPIT_ADDRESS}
                  </a>
                </div>
              </div>
              <div className="mt-auto pt-4 border-t border-gray-800/50">
                <a
                  href="https://etherscan.io/address/0xf38521f130fcCF29dB1961597bc5d2B60F995f85#tokentxns"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[9px] text-gray-500 hover:text-[#FF007A] transition-colors"
                >
                  View all transactions →
                </a>
              </div>
            </div>
          </div>

          {/* Full Token Explorer */}
          {data.categorizedTokens && (
            <TokenTabs categorizedTokens={data.categorizedTokens} />
          )}

          {/* Burn History Card */}
          <div className="card p-5">
            <h2 className="text-[9px] text-[#FF007A] mb-4 tracking-widest">BURN HISTORY</h2>
            {burnHistory && burnHistory.burns.length > 0 ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-gray-800/50">
                  <span className="text-[9px] text-gray-500">Total Burned</span>
                  <span className="text-[11px] text-orange-400 font-medium">
                    {parseFloat(burnHistory.totalBurned).toLocaleString(undefined, { maximumFractionDigits: 0 })} UNI
                  </span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {burnHistory.burns.slice(0, 10).map((burn, i) => (
                    <div key={i} className="flex justify-between items-center text-[9px]">
                      <div className="flex items-center gap-2">
                        <span className="text-orange-400">🔥</span>
                        <span className="text-gray-400">
                          {new Date(burn.timestamp * 1000).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-300">
                          {parseFloat(burn.uniAmount).toLocaleString(undefined, { maximumFractionDigits: 0 })} UNI
                        </span>
                        <a
                          href={`https://etherscan.io/tx/${burn.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          ↗
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-[9px] text-gray-500 text-center py-4">
                No burns recorded yet. The fee switch was recently activated.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Footer with Status Controls */}
      <footer className="mt-12 pt-6 border-t border-gray-800/30">
        {/* Status Bar */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <StatusIndicator status={status} />
            {lastFetch && (
              <span className="text-[9px] text-gray-500">
                {formatUtcTime(lastFetch)}
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

        <div className="text-center text-[8px] text-gray-600">
          <p>Auto-refreshes every 30 seconds • Prices via DeFiLlama</p>
          {dataSource && (
            <p className="mt-1 text-gray-500">
              Data: {dataSource}
            </p>
          )}
          <p className="mt-1 text-gray-700">Not financial advice</p>
        </div>
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
