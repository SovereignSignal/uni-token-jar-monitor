"use client";

import { useEffect, useState, useMemo, startTransition } from "react";
import useSWR from "swr";
import Image from "next/image";
import { REFRESH_INTERVAL_MS, TOKENJAR_ADDRESS, FIREPIT_ADDRESS } from "@/lib/constants";
import type { TokenJarApiResponse } from "./api/tokenjar/route";
import type { BurnHistory } from "@/lib/burnHistory";
import JarVisualization from "@/components/PixelJar";
import TokenTabs from "@/components/TokenTabs";

type DataStatus = "loading" | "fresh" | "stale" | "error";

const FOUR_K_UNI_WEI = 4000n * 10n ** 18n;

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });

function getDataStatus(timestamp: number | null, error: boolean): DataStatus {
  if (error) return "error";
  if (!timestamp) return "loading";
  const age = Date.now() - timestamp;
  if (age < 120_000) return "fresh";     // 2 minutes
  if (age < 600_000) return "stale";     // 10 minutes
  return "error";
}

// Color hex values for StatusIndicator glow
const STATUS_COLORS: Record<DataStatus, string> = {
  loading: "#9ca3af",
  fresh: "#4ade80",
  stale: "#facc15",
  error: "#f87171",
};

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
        style={{ boxShadow: `0 0 8px ${STATUS_COLORS[status]}` }}
      />
      <span className={`text-[10px] ${config.color}`}>{config.label}</span>
    </div>
  );
}

function Tooltip({ children, text, id }: { children: React.ReactNode; text: string; id?: string }) {
  const [show, setShow] = useState(false);
  const tooltipId = id || `tooltip-${text.slice(0, 10).replace(/\s/g, '-')}`;

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="cursor-help"
        tabIndex={0}
        aria-describedby={show ? tooltipId : undefined}
      >
        {children}
      </div>
      {show && (
        <div
          id={tooltipId}
          role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#1a1c22] border border-[rgba(255,0,122,0.3)] rounded text-[8px] text-gray-300 whitespace-nowrap shadow-lg"
        >
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

function formatDurationSeconds(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
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
            width: `max(${progress > 0 ? '6px' : '0px'}, ${progress}%)`,
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
          {needed > 0 ? `${formatUsd(needed)} needed` : 'PROFITABLE'}
        </span>
        <span className="text-gray-600">{formatUsd(burnCost)}</span>
      </div>
    </div>
  );
}

// Status badge based on profitability
function StatusBadge({ netProfit, burnCost }: { netProfit: number; burnCost: number }) {
  const ratio = burnCost > 0 ? netProfit / burnCost : 0;

  let message: string;
  let bgClass: string;
  let textClass: string;

  if (netProfit >= 0) {
    message = '>> READY TO CLAIM';
    bgClass = 'bg-green-500/20 border-green-500/40';
    textClass = 'text-green-400';
  } else if (ratio > -0.1) {
    message = '** ALMOST THERE';
    bgClass = 'bg-yellow-500/20 border-yellow-500/40';
    textClass = 'text-yellow-400';
  } else if (ratio > -0.5) {
    message = '.. ACCUMULATING';
    bgClass = 'bg-gray-500/20 border-gray-500/40';
    textClass = 'text-gray-400';
  } else {
    message = '!! VERY UNPROFITABLE';
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
  // SWR for main profitability data
  const { data: apiResponse, error: apiError, isLoading, mutate } = useSWR<TokenJarApiResponse>(
    '/api/tokenjar',
    fetcher,
    {
      refreshInterval: REFRESH_INTERVAL_MS,
      revalidateOnFocus: true,
    }
  );

  // SWR for burn history (less frequent)
  const { data: burnResponse } = useSWR<{ success: boolean; data: BurnHistory }>(
    '/api/burns',
    fetcher,
    {
      refreshInterval: 5 * 60 * 1000,
    }
  );

  const [burnFilter, setBurnFilter] = useState<"all" | "exact4000">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastFetch, setLastFetch] = useState<number | null>(null);

  // Track lastFetch time when data arrives
  useEffect(() => {
    if (apiResponse?.success && apiResponse.data) {
      setLastFetch(Date.now());
    }
  }, [apiResponse]);

  // 1-second tick for live timers (wrapped in startTransition for non-urgent updates)
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      startTransition(() => setTick((t) => t + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Derive all values from SWR response
  const data = apiResponse?.success ? apiResponse.data : null;
  const error = apiError ? "Network error" : (apiResponse && !apiResponse.success ? apiResponse.error || "Failed to fetch data" : null);
  const burnHistory = burnResponse?.success ? burnResponse.data : null;

  // Dune-derived values
  const dataSource = data?.dataSource ?? "";
  const duneTokenCount = data?.duneData?.tokenCount ?? null;
  const collectibleUsd = data?.duneData?.collectibleUsd ?? null;
  const collectibleUni = data?.duneData?.collectibleUni ?? null;
  const tokenJarBalanceUsd = data?.duneData?.tokenJarBalanceUsd ?? null;
  const unclaimedValueUsd = data?.duneData?.unclaimedValueUsd ?? null;
  const uniToThreshold = data?.duneData?.uniToThreshold ?? null;
  const topPools = data?.duneData?.topPools ?? [];

  const status = getDataStatus(lastFetch, !!error);

  // Manual refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await mutate();
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredBurns = useMemo(() => {
    const burns = burnHistory?.burns ?? [];
    if (burnFilter === "all") return burns;
    return burns.filter((b) => {
      try {
        return BigInt(b.uniAmountRaw) === FOUR_K_UNI_WEI;
      } catch {
        return false;
      }
    });
  }, [burnHistory, burnFilter]);

  const burnStats = useMemo(() => {
    if (!burnHistory || filteredBurns.length === 0) return null;

    const mostRecent = filteredBurns[0];

    const timestamps = filteredBurns
      .map((b) => b.timestamp)
      .filter((t): t is number => typeof t === "number" && Number.isFinite(t))
      .sort((a, b) => b - a);

    const deltas: number[] = [];
    for (let i = 0; i < Math.min(timestamps.length - 1, 30); i++) {
      deltas.push(timestamps[i] - timestamps[i + 1]);
    }
    const avgDeltaSec = deltas.length > 0 ? deltas.reduce((a, b) => a + b, 0) / deltas.length : null;

    const counts = new Map<string, number>();
    for (const burn of filteredBurns) {
      const key = burn.initiator ?? burn.burner;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const topInitiators = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([address, count]) => ({ address, count }));

    return {
      mostRecent,
      avgDeltaSec,
      totalTransactions: filteredBurns.length,
      totalInitiators: counts.size,
      topInitiators,
    };
  }, [burnHistory, filteredBurns]);

  // Compute timeSinceMostRecentSec outside useMemo so it updates with tick
  const timeSinceMostRecentSec = burnStats?.mostRecent
    ? Math.floor(Date.now() / 1000) - burnStats.mostRecent.timestamp
    : null;

  // Pre-compute net profit card values (extracted from JSX IIFE)
  const jarValue = data ? (collectibleUsd ?? data.totalJarValueUsd) : 0;
  const totalCost = data ? (data.burnCostUsd + data.gasEstimateUsd) : 0;
  const netProfit = jarValue - totalCost;
  const isProfitableNet = netProfit > 0;

  return (
    <main id="main-content" className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto">
      {/* Visually hidden h1 for screen readers */}
      <h1 className="sr-only">UNI Jar Monitor - Uniswap Fee Burn Tracker</h1>

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
        <div className="card p-4 xs:p-5 mt-4">
          <div className="flex items-center justify-center gap-4 xs:gap-6">
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
              <p className="text-[10px] xs:text-[11px] text-gray-400 leading-relaxed">
                <span className="text-[#FF007A] font-medium">Uniswap Fee Switch Monitor</span> -- Track the TokenJar vault that collects protocol fees.
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

          {/* How It Works - Collapsible */}
          <details className="mt-4 pt-4 border-t border-gray-800/50">
            <summary className="text-[9px] xs:text-[10px] text-[#FF007A] cursor-pointer hover:text-[#ff5fa2] transition-colors">
              How It Works &gt;
            </summary>
            <div className="mt-3 grid gap-2 xs:gap-3 text-[8px] xs:text-[9px] text-gray-400">
              <div className="flex gap-2 xs:gap-3 items-start">
                <span className="text-yellow-400 font-bold shrink-0">1.</span>
                <div>
                  <span className="text-gray-300 font-medium">Fees Accumulate</span>
                  <span className="hidden xs:inline"> --</span>
                  <span className="block xs:inline"> Uniswap V3 pools collect protocol fees in the TokenJar contract.</span>
                </div>
              </div>
              <div className="flex gap-2 xs:gap-3 items-start">
                <span className="text-yellow-400 font-bold shrink-0">2.</span>
                <div>
                  <span className="text-gray-300 font-medium">Burn Requirement</span>
                  <span className="hidden xs:inline"> --</span>
                  <span className="block xs:inline"> To claim fees, 4,000 UNI must be burned (sent to the Firepit).</span>
                </div>
              </div>
              <div className="flex gap-2 xs:gap-3 items-start">
                <span className="text-yellow-400 font-bold shrink-0">3.</span>
                <div>
                  <span className="text-gray-300 font-medium">Profitability Check</span>
                  <span className="hidden xs:inline"> --</span>
                  <span className="block xs:inline"> If jar value &gt; burn cost + gas, claiming is profitable.</span>
                </div>
              </div>
              <div className="flex gap-2 xs:gap-3 items-start">
                <span className="text-green-400 font-bold shrink-0">4.</span>
                <div>
                  <span className="text-gray-300 font-medium">Claim &amp; Profit</span>
                  <span className="hidden xs:inline"> --</span>
                  <span className="block xs:inline"> Anyone can trigger the burn and receive the jar contents.</span>
                </div>
              </div>
            </div>
          </details>
        </div>
      </header>

      {/* Status HUD */}
      <div className="card p-3 xs:p-4 mb-4 xs:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 xs:gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-3 xs:gap-4">
            <div className="flex items-center gap-2">
              <StatusIndicator status={status} />
              {lastFetch && (
                <span className="text-[8px] xs:text-[9px] text-gray-500 whitespace-nowrap">
                  {formatUtcTime(lastFetch)}
                </span>
              )}
            </div>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              aria-label={isRefreshing ? "Refreshing data" : "Refresh data"}
              aria-busy={isRefreshing}
              title="Refresh jar data"
              className="retro-btn text-[8px] xs:text-[9px] px-2 xs:px-3 py-1.5 xs:py-2 flex items-center gap-1.5"
            >
              {isRefreshing ? (
                <>
                  <div className="animate-spin h-3 w-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <span className="hidden xs:inline">...</span>
                </>
              ) : (
                "REFRESH"
              )}
            </button>
          </div>

          <div className="text-center sm:text-right text-[7px] xs:text-[8px] text-gray-600">
            <p>Auto-refreshes every 30 seconds | Prices via DeFiLlama</p>
            {dataSource && (
              <p className="mt-1 text-gray-500">
                Data: {dataSource}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="card p-4 xs:p-5 mb-6 border-red-500/30">
          <div className="flex items-start gap-3 xs:gap-4">
            <span className="text-xl xs:text-2xl text-red-400">!!</span>
            <div className="flex-1">
              <h2 className="text-red-400 text-[10px] xs:text-[11px] mb-1">UNABLE TO LOAD DATA</h2>
              <p className="text-red-400/70 text-[9px] xs:text-[10px] mb-3">
                {error.includes("fetch") || error.includes("Network")
                  ? "Network connection failed. Please check your internet connection and try again."
                  : error}
              </p>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="retro-btn text-[8px] xs:text-[9px] px-3 py-1.5"
              >
                {isRefreshing ? "Retrying..." : "Try Again"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && !data && !error && (
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
                totalValue={collectibleUsd ?? data.totalJarValueUsd}
                burnCost={data.burnCostUsd}
                isProfitable={(collectibleUsd ?? data.totalJarValueUsd) > data.burnCostUsd + data.gasEstimateUsd}
              />
            </div>
          </div>

          {/* Net Profit Card */}
          <div className="card p-6">
            <div className="text-center">
              <span className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Net Profit</span>
              <div
                className={`text-3xl md:text-4xl font-bold mt-2 mb-4 ${
                  isProfitableNet ? 'text-green-400' : 'text-red-400'
                }`}
                style={{
                  textShadow: isProfitableNet
                    ? '0 0 30px rgba(39,174,96,0.5)'
                    : '0 0 30px rgba(253,64,64,0.5)'
                }}
              >
                {formatUsd(netProfit, true)}
              </div>

              <StatusBadge netProfit={netProfit} burnCost={data.burnCostUsd + data.gasEstimateUsd} />
            </div>

            {/* Profit Gauge */}
            <ProfitGauge currentValue={jarValue} burnCost={data.burnCostUsd + data.gasEstimateUsd} />
          </div>

          {/* Stats Grid - Separate Cards */}
          <div className="grid md:grid-cols-2 gap-5">
            {/* Breakdown Card - matched height with tokens */}
            <div className="card p-5 flex flex-col min-h-[200px]">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-[9px] text-[#FF007A] tracking-widest">BREAKDOWN</h2>
                {collectibleUsd !== null && (
                  <span className="text-[7px] text-gray-600 bg-gray-800/50 px-2 py-0.5 rounded">
                    via dune.com
                  </span>
                )}
              </div>
              <div className="space-y-3 flex-1">
                <div className="flex justify-between items-center">
                  <Tooltip text="Total collectible value (TokenJar + unclaimed fees)">
                    <span className="text-[10px] text-gray-400">COLLECTIBLE VALUE</span>
                  </Tooltip>
                  <div className="text-right">
                    <span className="text-[12px] text-green-400 font-bold">
                      {formatUsd(collectibleUsd ?? data.totalJarValueUsd)}
                    </span>
                    {collectibleUni !== null && (
                      <span className="text-[9px] text-gray-500 block">
                        {collectibleUni.toLocaleString(undefined, { maximumFractionDigits: 0 })} UNI
                      </span>
                    )}
                  </div>
                </div>

                {/* Show Unclaimed vs TokenJar breakdown if available */}
                {unclaimedValueUsd !== null && unclaimedValueUsd > 0 && (
                  <div className="pl-3 space-y-1.5 border-l-2 border-gray-800/50">
                    <div className="flex justify-between items-center">
                      <Tooltip text="Fees still in pools, not yet collected">
                        <span className="text-[9px] text-gray-500">↳ Unclaimed</span>
                      </Tooltip>
                      <span className="text-[10px] text-gray-400">
                        {formatUsd(unclaimedValueUsd)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Tooltip text="Already collected in TokenJar">
                        <span className="text-[9px] text-gray-500">↳ In TokenJar</span>
                      </Tooltip>
                      <span className="text-[10px] text-gray-400">
                        {formatUsd(tokenJarBalanceUsd ?? 0)}
                      </span>
                    </div>
                  </div>
                )}

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

                {/* UNI to Threshold */}
                {uniToThreshold !== null && (
                  <div className="flex justify-between items-center pt-2 border-t border-gray-800/30">
                    <Tooltip text="UNI value needed to reach the 4000 UNI burn threshold">
                      <span className="text-[10px] text-gray-400">UNI TO THRESHOLD</span>
                    </Tooltip>
                    <span className={`text-[11px] font-medium ${uniToThreshold <= 0 ? 'text-green-400' : 'text-orange-400'}`}>
                      {uniToThreshold <= 0 ? 'Ready' : `${uniToThreshold.toLocaleString(undefined, { maximumFractionDigits: 0 })} UNI`}
                    </span>
                  </div>
                )}
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
                    aria-label="View TokenJar contract on Etherscan (opens in new tab)"
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
                    aria-label="View Firepit contract on Etherscan (opens in new tab)"
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
                  aria-label="View all TokenJar transactions on Etherscan (opens in new tab)"
                  className="text-[9px] text-gray-500 hover:text-[#FF007A] transition-colors"
                >
                  View all transactions &gt;
                </a>
              </div>
            </div>
          </div>

          {/* Full Token Explorer */}
          {data.categorizedTokens && (
            <TokenTabs categorizedTokens={data.categorizedTokens} duneTokenCount={duneTokenCount} />
          )}

          {/* Top Pools Section */}
          {topPools.length > 0 && (
            <div className="card p-3 xs:p-4 sm:p-5">
              <div className="flex justify-between items-center mb-3 xs:mb-4">
                <h2 className="text-[8px] xs:text-[9px] text-[#FF007A] tracking-widest">TOP POOLS BY FEES</h2>
                <span className="text-[7px] xs:text-[8px] text-gray-500">{topPools.length} pools</span>
              </div>

              {/* Desktop Table Header - hidden on mobile */}
              <div className="hidden sm:grid grid-cols-12 gap-2 text-[8px] text-gray-600 uppercase tracking-wider pb-2 border-b border-gray-800/30 mb-2">
                <div className="col-span-3">Pair</div>
                <div className="col-span-3">Token0 Fees</div>
                <div className="col-span-3">Token1 Fees</div>
                <div className="col-span-3 text-right">Value</div>
              </div>

              {/* Pool Rows - Desktop Table / Mobile Cards */}
              <div className="space-y-2 sm:space-y-1 max-h-64 overflow-y-auto">
                {topPools.map((pool, i) => (
                  <div key={`${pool.poolAddress}-${i}`}>
                    {/* Mobile Card View */}
                    <div className="sm:hidden bg-gray-900/30 rounded-lg p-3 border border-gray-800/30">
                      <div className="flex justify-between items-start mb-2">
                        <a
                          href={`https://etherscan.io/address/${pool.poolAddress}#readContract`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`View ${pool.tokenPair} pool on Etherscan (opens in new tab)`}
                          className="text-[10px] text-gray-200 hover:text-[#FF007A] font-medium transition-colors"
                        >
                          {pool.tokenPair}
                        </a>
                        <div className="text-right">
                          <span className="text-[10px] text-green-400 font-medium">
                            ${pool.valueUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                          <span className="text-[7px] text-gray-600 block">
                            {pool.valueUni.toFixed(1)} UNI
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[8px]">
                        <div>
                          <span className="text-gray-600 block">Token0</span>
                          <span className="text-gray-400 font-mono">{pool.token0Fees}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 block">Token1</span>
                          <span className="text-gray-400 font-mono">{pool.token1Fees}</span>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Table Row */}
                    <div className="hidden sm:grid grid-cols-12 gap-2 items-center text-[9px] py-2 hover:bg-[#FF007A]/5 rounded transition-colors group">
                      <div className="col-span-3">
                        <a
                          href={`https://etherscan.io/address/${pool.poolAddress}#readContract`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`View ${pool.tokenPair} pool on Etherscan (opens in new tab)`}
                          className="text-gray-200 hover:text-[#FF007A] font-medium transition-colors"
                        >
                          {pool.tokenPair}
                        </a>
                        <span className="text-[7px] text-gray-600 block font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                          {pool.poolAddress.slice(0, 8)}...
                        </span>
                      </div>
                      <div className="col-span-3 text-gray-400 font-mono text-[8px]">
                        {pool.token0Fees}
                      </div>
                      <div className="col-span-3 text-gray-400 font-mono text-[8px]">
                        {pool.token1Fees}
                      </div>
                      <div className="col-span-3 text-right">
                        <span className="text-green-400 font-medium">
                          ${pool.valueUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                        <span className="text-[7px] text-gray-600 block">
                          {pool.valueUni.toFixed(1)} UNI
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-800/30 text-[7px] xs:text-[8px] text-gray-600">
                Click pool pair to view on Etherscan for manual claiming
              </div>
            </div>
          )}

          {/* Burn History Card */}
          <div className="card p-3 xs:p-4 sm:p-5">
            <div className="flex justify-between items-center mb-3 xs:mb-4">
              <h2 className="text-[8px] xs:text-[9px] text-[#FF007A] tracking-widest">BURN HISTORY</h2>
              <a
                href={`https://etherscan.io/token/0x1f9840a85d5af5bf1d1762f925bdaddc4201f984?a=0x000000000000000000000000000000000000dead`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View all burns on Etherscan (opens in new tab)"
                className="text-[8px] text-blue-400 hover:text-blue-300 transition-colors"
              >
                View all on Etherscan &gt;
              </a>
            </div>
            {burnHistory && burnHistory.burns.length > 0 ? (
              <div className="space-y-3">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 pb-3 border-b border-gray-800/50">
                  <div className="flex items-center justify-between md:justify-start gap-3">
                    <span className="text-[9px] text-gray-500">Total Burned</span>
                    <span className="text-[11px] text-orange-400 font-medium">
                      {parseFloat(burnHistory.totalBurned).toLocaleString(undefined, { maximumFractionDigits: 0 })} UNI
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setBurnFilter("all")}
                      aria-pressed={burnFilter === "all"}
                      className={`text-[8px] px-2 py-1 rounded border transition-colors ${
                        burnFilter === "all"
                          ? "bg-[#FF007A]/15 border-[#FF007A]/30 text-[#FF007A]"
                          : "bg-gray-900/40 border-gray-800/50 text-gray-500 hover:text-gray-300"
                      }`}
                    >
                      ALL
                    </button>
                    <button
                      onClick={() => setBurnFilter("exact4000")}
                      aria-pressed={burnFilter === "exact4000"}
                      className={`text-[8px] px-2 py-1 rounded border transition-colors ${
                        burnFilter === "exact4000"
                          ? "bg-[#FF007A]/15 border-[#FF007A]/30 text-[#FF007A]"
                          : "bg-gray-900/40 border-gray-800/50 text-gray-500 hover:text-gray-300"
                      }`}
                    >
                      4,000 UNI
                    </button>
                    <span className="text-[8px] text-gray-600">
                      {filteredBurns.length} tx
                    </span>
                  </div>
                </div>

                {burnStats && (
                  <div className="grid md:grid-cols-2 gap-3 pb-3 border-b border-gray-800/30">
                    <div className="bg-gray-900/20 border border-gray-800/30 rounded p-3">
                      <div className="text-[8px] text-gray-600 uppercase tracking-wider mb-2">Most Recent Transaction</div>
                      <div className="grid grid-cols-12 gap-2 text-[9px]">
                        <div className="col-span-4 text-gray-500">Initiator</div>
                        <div className="col-span-8">
                          {burnStats.mostRecent.initiator ? (
                            <a
                              href={`https://etherscan.io/address/${burnStats.mostRecent.initiator}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`View initiator address on Etherscan (opens in new tab)`}
                              className="text-gray-300 hover:text-blue-400 font-mono transition-colors break-all"
                            >
                              {truncateAddress(burnStats.mostRecent.initiator)}
                            </a>
                          ) : (
                            <span className="text-gray-600">--</span>
                          )}
                        </div>
                        <div className="col-span-4 text-gray-500">Tx</div>
                        <div className="col-span-8">
                          <a
                            href={`https://etherscan.io/tx/${burnStats.mostRecent.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`View transaction on Etherscan (opens in new tab)`}
                            className="text-blue-400 hover:text-blue-300 font-mono transition-colors"
                          >
                            {burnStats.mostRecent.txHash.slice(0, 10)}...
                          </a>
                        </div>
                        <div className="col-span-4 text-gray-500">Since last</div>
                        <div className="col-span-8 text-gray-300">
                          {timeSinceMostRecentSec !== null ? formatDurationSeconds(timeSinceMostRecentSec) : '--'}
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-900/20 border border-gray-800/30 rounded p-3">
                      <div className="text-[8px] text-gray-600 uppercase tracking-wider mb-2">Aggregate Stats</div>
                      <div className="grid grid-cols-12 gap-2 text-[9px]">
                        <div className="col-span-6 text-gray-500">Total Tx</div>
                        <div className="col-span-6 text-right text-gray-300">{burnStats.totalTransactions}</div>
                        <div className="col-span-6 text-gray-500">Avg Time Between</div>
                        <div className="col-span-6 text-right text-gray-300">
                          {burnStats.avgDeltaSec === null ? "--" : formatDurationSeconds(burnStats.avgDeltaSec)}
                        </div>
                        <div className="col-span-6 text-gray-500">Total Initiators</div>
                        <div className="col-span-6 text-right text-gray-300">{burnStats.totalInitiators}</div>
                      </div>

                      {burnStats.topInitiators.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-800/30">
                          <div className="text-[8px] text-gray-600 uppercase tracking-wider mb-2">Top Initiators</div>
                          <div className="space-y-1">
                            {burnStats.topInitiators.map((t, idx) => (
                              <div key={t.address} className="flex items-center justify-between text-[9px]">
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-600">{idx + 1}</span>
                                  <a
                                    href={`https://etherscan.io/address/${t.address}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`View address on Etherscan (opens in new tab)`}
                                    className="text-gray-300 hover:text-blue-400 font-mono transition-colors"
                                  >
                                    {truncateAddress(t.address)}
                                  </a>
                                </div>
                                <span className="text-gray-500">{t.count} tx</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Desktop Table Header - hidden on mobile */}
                <div className="hidden sm:grid grid-cols-12 gap-2 text-[8px] text-gray-600 uppercase tracking-wider pb-2 border-b border-gray-800/30">
                  <div className="col-span-3">Date</div>
                  <div className="col-span-3 text-right">Amount</div>
                  <div className="col-span-4">Initiator</div>
                  <div className="col-span-2 text-right">Tx</div>
                </div>

                {/* Burn entries - Desktop Table / Mobile Cards */}
                <div className="space-y-2 sm:space-y-2 max-h-64 overflow-y-auto">
                  {filteredBurns.slice(0, 15).map((burn) => {
                    const amount = parseFloat(burn.uniAmount);
                    const isSignificant = amount >= 1000;
                    const isTreasuryBurn = amount >= 1000000;
                    const isExact4000 = (() => {
                      try {
                        return BigInt(burn.uniAmountRaw) === FOUR_K_UNI_WEI;
                      } catch {
                        return false;
                      }
                    })();
                    const initiator = burn.initiator ?? burn.burner;
                    const formattedAmount = amount >= 1000000
                      ? `${(amount / 1000000).toFixed(0)}M`
                      : amount >= 1000
                        ? `${(amount / 1000).toFixed(0)}K`
                        : amount.toLocaleString(undefined, { maximumFractionDigits: 0 });

                    return (
                      <div key={burn.txHash} className="burn-row-item">
                        {/* Mobile Card View */}
                        <div className={`sm:hidden bg-gray-900/30 rounded-lg p-2.5 border border-gray-800/30 ${
                          isTreasuryBurn ? 'border-orange-500/30 bg-orange-500/5' : ''
                        }`}>
                          <div className="flex justify-between items-start mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className={isTreasuryBurn ? 'text-orange-400' : 'text-gray-500'}>
                                {isTreasuryBurn ? '*' : '-'}
                              </span>
                              <span className="text-[9px] text-gray-400">
                                {new Date(burn.timestamp * 1000).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                            <div className={`text-[10px] font-medium ${
                              isTreasuryBurn ? 'text-orange-400' : isSignificant ? 'text-gray-300' : 'text-gray-500'
                            }`}>
                              {formattedAmount} UNI
                              {isExact4000 && <span className="text-[7px] text-[#FF007A] ml-1">4K</span>}
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-[8px]">
                            <a
                              href={`https://etherscan.io/address/${initiator}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`View address on Etherscan (opens in new tab)`}
                              className="text-gray-500 hover:text-blue-400 font-mono transition-colors"
                            >
                              {truncateAddress(initiator)}
                            </a>
                            <a
                              href={`https://etherscan.io/tx/${burn.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`View transaction on Etherscan (opens in new tab)`}
                              className="text-blue-400 hover:text-blue-300 font-mono transition-colors"
                            >
                              tx &gt;
                            </a>
                          </div>
                        </div>

                        {/* Desktop Table Row */}
                        <div className={`hidden sm:grid grid-cols-12 gap-2 items-center text-[9px] py-1 ${
                          isTreasuryBurn ? 'bg-orange-500/10 -mx-2 px-2 rounded' : ''
                        }`}>
                          <div className="col-span-3 flex items-center gap-1">
                            <span className={isTreasuryBurn ? 'text-orange-400' : 'text-gray-500'}>
                              {isTreasuryBurn ? '*' : '-'}
                            </span>
                            <span className="text-gray-400">
                              {new Date(burn.timestamp * 1000).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                          <div className={`col-span-3 text-right font-medium ${
                            isTreasuryBurn ? 'text-orange-400' : isSignificant ? 'text-gray-300' : 'text-gray-500'
                          }`}>
                            {formattedAmount} UNI
                            {isExact4000 && (
                              <span className="text-[7px] text-[#FF007A] block">4K</span>
                            )}
                          </div>
                          <div className="col-span-4">
                            <a
                              href={`https://etherscan.io/address/${initiator}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`View address on Etherscan (opens in new tab)`}
                              className="text-gray-500 hover:text-blue-400 font-mono transition-colors"
                            >
                              {truncateAddress(initiator)}
                            </a>
                            {burn.destinations && burn.destinations.length > 0 && (
                              <div className="text-[7px] text-gray-700 mt-0.5">
                                {burn.destinations.join("+")}
                              </div>
                            )}
                          </div>
                          <div className="col-span-2 text-right">
                            <a
                              href={`https://etherscan.io/tx/${burn.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`View transaction on Etherscan (opens in new tab)`}
                              className="text-blue-400 hover:text-blue-300 font-mono transition-colors"
                            >
                              {burn.txHash.slice(0, 6)}...
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="pt-3 border-t border-gray-800/30 text-[8px] text-gray-600">
                  <p>Note: Small burns (&lt;4K UNI) may be test transactions or direct transfers to 0xdead.</p>
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

      {/* Footer with Links and Disclaimer */}
      <footer className="mt-8 xs:mt-12 pt-6 border-t border-gray-800/30">
        <div className="flex flex-col items-center gap-4">
          {/* Links */}
          <div className="flex flex-wrap justify-center gap-3 xs:gap-4 text-[8px] xs:text-[9px]">
            <a
              href="https://github.com/SovereignSignal/uni-token-jar-monitor"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View source code on GitHub (opens in new tab)"
              className="text-gray-500 hover:text-[#FF007A] transition-colors"
            >
              GitHub
            </a>
            <span className="text-gray-700 hidden xs:inline">|</span>
            <a
              href="https://app.uniswap.org"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit Uniswap (opens in new tab)"
              className="text-gray-500 hover:text-[#FF007A] transition-colors"
            >
              Uniswap
            </a>
            <span className="text-gray-700 hidden xs:inline">|</span>
            <a
              href={`https://etherscan.io/address/${TOKENJAR_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View TokenJar contract on Etherscan (opens in new tab)"
              className="text-gray-500 hover:text-[#FF007A] transition-colors"
            >
              TokenJar Contract
            </a>
            <span className="text-gray-700 hidden xs:inline">|</span>
            <a
              href={`https://etherscan.io/address/${FIREPIT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View Firepit contract on Etherscan (opens in new tab)"
              className="text-gray-500 hover:text-[#FF007A] transition-colors"
            >
              Firepit Contract
            </a>
          </div>

          {/* Disclaimer */}
          <div className="text-center text-[7px] xs:text-[8px] text-gray-600 max-w-md">
            <p className="text-gray-700 mb-1">Not financial advice. Use at your own risk.</p>
            <p>
              Data from{" "}
              <a href="https://defillama.com" target="_blank" rel="noopener noreferrer" aria-label="DeFiLlama (opens in new tab)" className="hover:text-gray-400 transition-colors">
                DeFiLlama
              </a>
              {" "}&amp;{" "}
              <a href="https://dune.com" target="_blank" rel="noopener noreferrer" aria-label="Dune Analytics (opens in new tab)" className="hover:text-gray-400 transition-colors">
                Dune Analytics
              </a>
              . Prices update every 30 seconds.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
