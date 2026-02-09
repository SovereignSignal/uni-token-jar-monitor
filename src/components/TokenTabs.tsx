"use client";

import { useState, useCallback, useId } from "react";
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

const TAB_KEYS: TabKey[] = ["priced", "lp", "unknown"];

const TAB_CONFIG: Record<TabKey, { label: string; shortLabel: string; icon: string; emptyMessage: string; emptyIcon: string }> = {
  priced: {
    label: "Priced",
    shortLabel: "Pri",
    icon: "$",
    emptyMessage: "No priced tokens found yet",
    emptyIcon: ">"
  },
  lp: {
    label: "LP Tokens",
    shortLabel: "LP",
    icon: "<>",
    emptyMessage: "No LP tokens in the jar",
    emptyIcon: "~"
  },
  unknown: {
    label: "Unknown",
    shortLabel: "Unk",
    icon: "?",
    emptyMessage: "All tokens identified!",
    emptyIcon: ">>"
  },
};

function formatValue(value: number | null): string {
  if (value === null) return "--";
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

function TokenRow({ token, showValue, rank, alwaysShowAddress }: { token: CategorizedToken; showValue: boolean; rank: number; alwaysShowAddress?: boolean }) {
  const truncatedAddress = `${token.address.slice(0, 6)}...${token.address.slice(-4)}`;

  // Display name fallback: use symbol, or name if symbol is UNKNOWN, or truncated address as last resort
  const displayName = token.symbol !== "UNKNOWN"
    ? token.symbol
    : token.name || truncatedAddress;
  const isAddressDisplay = displayName === truncatedAddress;
  const tokenColor = getTokenColor(token.symbol);

  return (
    <div className="token-row-item flex items-center justify-between py-2 xs:py-2.5 px-2 xs:px-3 hover:bg-[#FF007A]/5 rounded-lg transition-all duration-200 group">
      <div className="flex items-center gap-2 xs:gap-3 min-w-0 flex-1">
        {/* Rank indicator */}
        <span className="text-[7px] xs:text-[8px] text-gray-600 w-3 xs:w-4 text-right font-mono">
          {rank}
        </span>

        {/* Token color dot */}
        <div
          className="w-2 xs:w-2.5 h-2 xs:h-2.5 rounded-full flex-shrink-0 ring-2 ring-gray-800/50"
          style={{
            backgroundColor: tokenColor,
            boxShadow: `0 0 6px ${tokenColor}40`
          }}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 xs:gap-2 flex-wrap">
            <span className={`text-[10px] xs:text-[11px] font-semibold tracking-wide ${isAddressDisplay ? 'text-gray-400 font-mono' : 'text-gray-100'}`}>
              {displayName}
            </span>
            <a
              href={`https://etherscan.io/token/${token.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-[7px] xs:text-[8px] text-gray-600 hover:text-[#FF007A] transition-colors font-mono ${
                alwaysShowAddress ? 'opacity-70' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'
              }`}
              aria-label={`View ${displayName} on Etherscan (opens in new tab)`}
            >
              {truncatedAddress} &gt;
            </a>
          </div>
          <div className="text-[8px] xs:text-[9px] text-gray-500 font-mono">
            {formatBalance(token.balanceFormatted)} tokens
          </div>
        </div>
      </div>

      <div className="text-right flex-shrink-0 ml-2 xs:ml-4">
        {showValue && token.valueUsd !== null ? (
          <>
            <div className="text-[10px] xs:text-[11px] text-gray-100 font-semibold">
              {formatValue(token.valueUsd)}
            </div>
            {token.priceUsd !== null && (
              <div className="text-[7px] xs:text-[8px] text-gray-500 font-mono">
                @{formatValue(token.priceUsd)}/ea
              </div>
            )}
          </>
        ) : (
          <div className="text-[8px] xs:text-[9px] text-gray-600 italic">No price</div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ tab }: { tab: TabKey }) {
  const config = TAB_CONFIG[tab];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <span className="text-xl mb-3 opacity-50 text-gray-500">{config.emptyIcon}</span>
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
  const tabsId = useId();

  const activeCategory = categorizedTokens[activeTab];
  const displayLimit = expanded ? activeCategory.tokens.length : 8;
  const hasMore = activeCategory.tokens.length > 8;

  // Calculate total tokens across all categories (from Alchemy)
  const alchemyTokens = categorizedTokens.priced.count + categorizedTokens.lp.count + categorizedTokens.unknown.count;
  // Prefer Dune count if available (more accurate), otherwise show Alchemy count
  const totalTokens = duneTokenCount ?? alchemyTokens;

  // Keyboard navigation for tabs
  const handleKeyDown = useCallback((e: React.KeyboardEvent, currentIndex: number) => {
    let newIndex: number | null = null;

    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      newIndex = (currentIndex + 1) % TAB_KEYS.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      newIndex = (currentIndex - 1 + TAB_KEYS.length) % TAB_KEYS.length;
    } else if (e.key === "Home") {
      e.preventDefault();
      newIndex = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      newIndex = TAB_KEYS.length - 1;
    }

    if (newIndex !== null) {
      setActiveTab(TAB_KEYS[newIndex]);
      setExpanded(false);
      // Focus the new tab button
      const newTabButton = document.getElementById(`${tabsId}-tab-${TAB_KEYS[newIndex]}`);
      newTabButton?.focus();
    }
  }, [tabsId]);

  return (
    <div className="card p-3 xs:p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 xs:mb-4">
        <h3 className="text-[10px] xs:text-[11px] text-[#FF007A] tracking-widest font-medium">
          TOKEN EXPLORER
        </h3>
        <div className="text-right">
          <span className="text-[8px] xs:text-[9px] text-gray-500 font-mono">
            {totalTokens} tokens in jar
          </span>
          {duneTokenCount != null && duneTokenCount !== alchemyTokens ? (
            <span className="text-[7px] xs:text-[8px] text-gray-600 block">
              ({alchemyTokens} shown)
            </span>
          ) : null}
        </div>
      </div>

      {/* Tab Headers */}
      <div
        role="tablist"
        aria-label="Token categories"
        className="flex gap-1 xs:gap-2 mb-3 xs:mb-4 p-1 bg-gray-900/70 rounded-lg border border-gray-800/60"
      >
        {TAB_KEYS.map((key, index) => {
          const config = TAB_CONFIG[key];
          const category = categorizedTokens[key];
          const isActive = activeTab === key;

          return (
            <button
              key={key}
              id={`${tabsId}-tab-${key}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`${tabsId}-panel-${key}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => {
                setActiveTab(key);
                setExpanded(false);
              }}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`flex-1 flex items-center justify-center gap-1 xs:gap-1.5 px-2 xs:px-3 py-2 xs:py-2.5 rounded-md text-[8px] xs:text-[9px] transition-all duration-200 ${
                isActive
                  ? "bg-[#FF007A]/20 text-[#FF007A] shadow-lg shadow-[#FF007A]/10 border border-[#FF007A]/20"
                  : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/60 border border-transparent"
              }`}
            >
              <span className="text-xs xs:text-sm">{config.icon}</span>
              <span className="font-medium hidden xs:inline">{config.label}</span>
              <span className="font-medium xs:hidden">{config.shortLabel}</span>
              <span className={`px-1 xs:px-1.5 py-0.5 rounded-full text-[7px] xs:text-[8px] font-mono ${
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
        <div className="flex justify-between items-center mb-2 xs:mb-3 px-2 xs:px-3 py-1.5 xs:py-2 bg-gray-900/30 rounded-lg">
          <span className="text-[8px] xs:text-[9px] text-gray-400">
            Showing {Math.min(displayLimit, activeCategory.count)} of {activeCategory.count}
          </span>
          {activeTab === "priced" && (
            <span className="text-[9px] xs:text-[10px] text-green-400 font-semibold">
              Total: {formatValue(activeCategory.totalValueUsd)}
            </span>
          )}
          {activeTab === "lp" && activeCategory.totalValueUsd > 0 && (
            <span className="text-[9px] xs:text-[10px] text-purple-400 font-semibold">
              Est: ~{formatValue(activeCategory.totalValueUsd)}
            </span>
          )}
        </div>
      )}

      {/* Token List */}
      <div
        id={`${tabsId}-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`${tabsId}-tab-${activeTab}`}
        className="space-y-1 max-h-80 xs:max-h-96 overflow-y-auto custom-scrollbar rounded-lg bg-gray-900/20 border border-gray-800/30 p-1"
      >
        {activeCategory.tokens.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          activeCategory.tokens.slice(0, displayLimit).map((token, i) => (
            <TokenRow
              key={`${token.address}-${i}`}
              token={token}
              showValue={activeTab !== "unknown"}
              rank={i + 1}
              alwaysShowAddress={activeTab === "lp"}
            />
          ))
        )}
      </div>

      {/* Show More/Less Button */}
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          className="w-full mt-3 xs:mt-4 py-2 xs:py-2.5 text-[8px] xs:text-[9px] font-medium text-[#FF007A] hover:text-white hover:bg-[#FF007A]/20 transition-all duration-200 rounded-lg border border-[#FF007A]/30"
        >
          {expanded
            ? "<< Show Less"
            : `View All ${activeCategory.count} ${TAB_CONFIG[activeTab].label} >>`}
        </button>
      )}

      {/* Contextual Notes */}
      {activeTab === "lp" && activeCategory.count > 0 && (
        <div className="mt-3 xs:mt-4 p-2 xs:p-3 bg-purple-500/10 rounded-lg text-[8px] xs:text-[9px] text-purple-300 border border-purple-500/20">
          <span className="font-medium">[i] LP Tokens:</span> These represent liquidity positions. Value depends on underlying token pair and pool reserves.
        </div>
      )}

      {activeTab === "unknown" && activeCategory.count > 0 && (
        <div className="mt-3 xs:mt-4 p-2 xs:p-3 bg-yellow-500/10 rounded-lg text-[8px] xs:text-[9px] text-yellow-300 border border-yellow-500/20">
          <span className="font-medium">[!] Unknown Tokens:</span> These couldn&apos;t be priced. They may be new, low-liquidity, or have non-standard contracts.
        </div>
      )}
    </div>
  );
}
