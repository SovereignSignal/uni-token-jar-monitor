"use client";

import { useState } from "react";
import type { TokenCategory, CategorizedToken } from "@/lib/profitability";

interface TokenTabsProps {
  categorizedTokens: {
    priced: TokenCategory;
    lp: TokenCategory;
    unknown: TokenCategory;
  };
  duneTokenCount?: number | null;
}

type TabKey = "priced" | "lp" | "unknown";

const TAB_CONFIG: Record<TabKey, { label: string; icon: string; emptyMessage: string; emptyIcon: string }> = {
  priced: { 
    label: "Priced", 
    icon: "💰", 
    emptyMessage: "No priced tokens found yet",
    emptyIcon: "🔍"
  },
  lp: { 
    label: "LP Tokens", 
    icon: "🔄", 
    emptyMessage: "No LP tokens in the jar",
    emptyIcon: "🌊"
  },
  unknown: { 
    label: "Unknown", 
    icon: "❓", 
    emptyMessage: "All tokens identified!",
    emptyIcon: "✨"
  },
};

function formatValue(value: number | null): string {
  if (value === null) return "—";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value >= 0.01) return `$${value.toFixed(4)}`;
  return `$${value.toFixed(6)}`;
}

function formatBalance(balance: string): string {
  const num = parseFloat(balance);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
  if (num >= 1) return num.toFixed(2);
  if (num >= 0.0001) return num.toFixed(4);
  return num.toExponential(2);
}

function getTokenColor(symbol: string): string {
  const colors: Record<string, string> = {
    WETH: "#627eea",
    ETH: "#627eea",
    USDC: "#2775ca",
    USDT: "#26a17b",
    WBTC: "#f7931a",
    DAI: "#f5ac37",
    UNI: "#ff007a",
    LINK: "#2a5ada",
    AAVE: "#b6509e",
    PAXG: "#e4ce4e",
    stETH: "#00a3ff",
    rETH: "#cc9b7a",
    FRAX: "#000000",
    MKR: "#1aab9b",
    CRV: "#ff5733",
    LDO: "#00a3ff",
    "1INCH": "#1c314e",
    RNDR: "#ff5733",
    APE: "#0052ff",
    SHIB: "#ffa409",
    PEPE: "#4a9d4a",
    "UNI-V2": "#ff007a",
    "UNI-V3": "#ff007a",
  };
  return colors[symbol] || "#FF007A";
}

function TokenRow({ token, showValue, rank }: { token: CategorizedToken; showValue: boolean; rank: number }) {
  const truncatedAddress = `${token.address.slice(0, 6)}...${token.address.slice(-4)}`;
  
  return (
    <div className="flex items-center justify-between py-2.5 px-3 hover:bg-[#FF007A]/5 rounded-lg transition-all duration-200 group">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Rank indicator */}
        <span className="text-[8px] text-gray-600 w-4 text-right font-mono">
          {rank}
        </span>
        
        {/* Token color dot */}
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-gray-800/50"
          style={{ 
            backgroundColor: getTokenColor(token.symbol),
            boxShadow: `0 0 6px ${getTokenColor(token.symbol)}40`
          }}
        />
        
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-100 font-semibold tracking-wide">
              {token.symbol}
            </span>
            <a
              href={`https://etherscan.io/token/${token.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[8px] text-gray-600 hover:text-[#FF007A] transition-colors font-mono opacity-0 group-hover:opacity-100"
            >
              {truncatedAddress} ↗
            </a>
          </div>
          <div className="text-[9px] text-gray-500 font-mono">
            {formatBalance(token.balanceFormatted)} tokens
          </div>
        </div>
      </div>
      
      <div className="text-right flex-shrink-0 ml-4">
        {showValue && token.valueUsd !== null ? (
          <>
            <div className="text-[11px] text-gray-100 font-semibold">
              {formatValue(token.valueUsd)}
            </div>
            {token.priceUsd !== null && (
              <div className="text-[8px] text-gray-500 font-mono">
                @{formatValue(token.priceUsd)}/ea
              </div>
            )}
          </>
        ) : (
          <div className="text-[9px] text-gray-600 italic">No price</div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ tab }: { tab: TabKey }) {
  const config = TAB_CONFIG[tab];
  
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <span className="text-3xl mb-3 opacity-50">{config.emptyIcon}</span>
      <span className="text-[10px] text-gray-500 text-center">
        {config.emptyMessage}
      </span>
      {tab === "priced" && (
        <span className="text-[8px] text-gray-600 mt-2 text-center">
          Token data is loading or being refreshed...
        </span>
      )}
    </div>
  );
}

export default function TokenTabs({ categorizedTokens, duneTokenCount }: TokenTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("priced");
  const [expanded, setExpanded] = useState(false);

  const activeCategory = categorizedTokens[activeTab];
  const displayLimit = expanded ? activeCategory.tokens.length : 8;
  const hasMore = activeCategory.tokens.length > 8;

  // Calculate total tokens across all categories (from Alchemy)
  const alchemyTokens = categorizedTokens.priced.count + categorizedTokens.lp.count + categorizedTokens.unknown.count;
  // Prefer Dune count if available (more accurate), otherwise show Alchemy count
  const totalTokens = duneTokenCount ?? alchemyTokens;

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[11px] text-[#FF007A] tracking-widest font-medium">
          TOKEN EXPLORER
        </h3>
        <div className="text-right">
          <span className="text-[9px] text-gray-500 font-mono">
            {totalTokens} tokens in jar
          </span>
          {duneTokenCount && duneTokenCount !== alchemyTokens && (
            <span className="text-[8px] text-gray-600 block">
              ({alchemyTokens} shown)
            </span>
          )}
        </div>
      </div>
      
      {/* Tab Headers */}
      <div className="flex gap-2 mb-4 p-1 bg-gray-900/70 rounded-lg border border-gray-800/60">
        {(Object.keys(TAB_CONFIG) as TabKey[]).map((key) => {
          const config = TAB_CONFIG[key];
          const category = categorizedTokens[key];
          const isActive = activeTab === key;
          
          return (
            <button
              key={key}
              onClick={() => {
                setActiveTab(key);
                setExpanded(false);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-md text-[9px] transition-all duration-200 ${
                isActive
                  ? "bg-[#FF007A]/20 text-[#FF007A] shadow-lg shadow-[#FF007A]/10 border border-[#FF007A]/20"
                  : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/60 border border-transparent"
              }`}
            >
              <span className="text-sm">{config.icon}</span>
              <span className="font-medium">{config.label}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-mono ${
                isActive 
                  ? "bg-[#FF007A]/30 text-[#FF007A]" 
                  : "bg-gray-800 text-gray-500"
              }`}>
                {category.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Category Summary Bar */}
      {activeCategory.count > 0 && (
        <div className="flex justify-between items-center mb-3 px-3 py-2 bg-gray-900/30 rounded-lg">
          <span className="text-[9px] text-gray-400">
            Showing {Math.min(displayLimit, activeCategory.count)} of {activeCategory.count}
          </span>
          {activeTab === "priced" && (
            <span className="text-[10px] text-green-400 font-semibold">
              Total: {formatValue(activeCategory.totalValueUsd)}
            </span>
          )}
          {activeTab === "lp" && activeCategory.totalValueUsd > 0 && (
            <span className="text-[10px] text-purple-400 font-semibold">
              Est: ~{formatValue(activeCategory.totalValueUsd)}
            </span>
          )}
        </div>
      )}

      {/* Token List */}
      <div className="space-y-1 max-h-96 overflow-y-auto custom-scrollbar rounded-lg bg-gray-900/20 border border-gray-800/30 p-1">
        {activeCategory.tokens.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          activeCategory.tokens.slice(0, displayLimit).map((token, i) => (
            <TokenRow
              key={`${token.address}-${i}`}
              token={token}
              showValue={activeTab !== "unknown"}
              rank={i + 1}
            />
          ))
        )}
      </div>

      {/* Show More/Less Button */}
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-4 py-2.5 text-[9px] font-medium text-[#FF007A] hover:text-white hover:bg-[#FF007A]/20 transition-all duration-200 rounded-lg border border-[#FF007A]/30"
        >
          {expanded
            ? "← Show Less"
            : `View All ${activeCategory.count} ${TAB_CONFIG[activeTab].label} →`}
        </button>
      )}

      {/* Contextual Notes */}
      {activeTab === "lp" && activeCategory.count > 0 && (
        <div className="mt-4 p-3 bg-purple-500/10 rounded-lg text-[9px] text-purple-300 border border-purple-500/20">
          <span className="font-medium">💡 LP Tokens:</span> These represent liquidity positions. Value depends on underlying token pair and pool reserves.
        </div>
      )}

      {activeTab === "unknown" && activeCategory.count > 0 && (
        <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg text-[9px] text-yellow-300 border border-yellow-500/20">
          <span className="font-medium">⚠️ Unknown Tokens:</span> These couldn't be priced. They may be new, low-liquidity, or have non-standard contracts.
        </div>
      )}
    </div>
  );
}
