"use client";

import { useState } from "react";
import type { TokenCategory, CategorizedToken } from "@/lib/profitability";

interface TokenTabsProps {
  categorizedTokens: {
    priced: TokenCategory;
    lp: TokenCategory;
    unknown: TokenCategory;
  };
}

type TabKey = "priced" | "lp" | "unknown";

const TAB_CONFIG: Record<TabKey, { label: string; icon: string; color: string }> = {
  priced: { label: "Priced", icon: "💰", color: "text-green-400" },
  lp: { label: "LP Tokens", icon: "🔄", color: "text-purple-400" },
  unknown: { label: "Unknown", icon: "❓", color: "text-gray-400" },
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
    "UNI-V2": "#ff007a",
    "UNI-V3": "#ff007a",
  };
  return colors[symbol] || "#FF007A";
}

function TokenRow({ token, showValue }: { token: CategorizedToken; showValue: boolean }) {
  const truncatedAddress = `${token.address.slice(0, 6)}...${token.address.slice(-4)}`;
  
  return (
    <div className="flex items-center justify-between py-2 px-2 hover:bg-gray-800/30 rounded transition-colors">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: getTokenColor(token.symbol) }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-200 font-medium truncate">
              {token.symbol}
            </span>
            <a
              href={`https://etherscan.io/token/${token.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[8px] text-gray-500 hover:text-blue-400 transition-colors"
            >
              {truncatedAddress}
            </a>
          </div>
          <div className="text-[8px] text-gray-500">
            {formatBalance(token.balanceFormatted)} tokens
          </div>
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-2">
        {showValue && token.valueUsd !== null ? (
          <>
            <div className="text-[10px] text-gray-200 font-medium">
              {formatValue(token.valueUsd)}
            </div>
            {token.priceUsd !== null && (
              <div className="text-[8px] text-gray-500">
                @{formatValue(token.priceUsd)}
              </div>
            )}
          </>
        ) : (
          <div className="text-[9px] text-gray-500">No price</div>
        )}
      </div>
    </div>
  );
}

export default function TokenTabs({ categorizedTokens }: TokenTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("priced");
  const [expanded, setExpanded] = useState(false);
  
  const activeCategory = categorizedTokens[activeTab];
  const displayLimit = expanded ? activeCategory.tokens.length : 10;
  const hasMore = activeCategory.tokens.length > 10;

  return (
    <div className="card p-5">
      {/* Tab Headers */}
      <div className="flex gap-1 mb-4 border-b border-gray-800/50 pb-3">
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
              className={`flex items-center gap-2 px-3 py-2 rounded-t text-[9px] transition-all ${
                isActive
                  ? "bg-gray-800/50 text-white border-b-2 border-[#FF007A]"
                  : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/30"
              }`}
            >
              <span>{config.icon}</span>
              <span>{config.label}</span>
              <span className={`px-1.5 py-0.5 rounded text-[8px] ${
                isActive ? "bg-[#FF007A]/20 text-[#FF007A]" : "bg-gray-700/50"
              }`}>
                {category.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Category Summary */}
      <div className="flex justify-between items-center mb-3 px-2">
        <span className="text-[9px] text-gray-500">
          {activeCategory.count} {TAB_CONFIG[activeTab].label.toLowerCase()}
        </span>
        {activeTab === "priced" && (
          <span className="text-[10px] text-green-400 font-medium">
            {formatValue(activeCategory.totalValueUsd)}
          </span>
        )}
        {activeTab === "lp" && activeCategory.totalValueUsd > 0 && (
          <span className="text-[10px] text-purple-400 font-medium">
            ~{formatValue(activeCategory.totalValueUsd)} (partial)
          </span>
        )}
      </div>

      {/* Token List */}
      <div className="space-y-0.5 max-h-80 overflow-y-auto custom-scrollbar">
        {activeCategory.tokens.length === 0 ? (
          <div className="text-center py-8 text-[9px] text-gray-500">
            No {TAB_CONFIG[activeTab].label.toLowerCase()} found
          </div>
        ) : (
          <>
            {activeCategory.tokens.slice(0, displayLimit).map((token, i) => (
              <TokenRow
                key={`${token.address}-${i}`}
                token={token}
                showValue={activeTab !== "unknown"}
              />
            ))}
          </>
        )}
      </div>

      {/* Show More/Less Button */}
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-3 py-2 text-[9px] text-[#FF007A] hover:text-[#ff5fa2] transition-colors border-t border-gray-800/50"
        >
          {expanded
            ? "Show Less ↑"
            : `Show All ${activeCategory.count} ${TAB_CONFIG[activeTab].label} ↓`}
        </button>
      )}

      {/* LP Token Note */}
      {activeTab === "lp" && activeCategory.count > 0 && (
        <div className="mt-3 p-2 bg-purple-500/10 rounded text-[8px] text-purple-300 border border-purple-500/20">
          💡 LP tokens represent liquidity positions. Their value depends on the underlying token pair and pool reserves.
        </div>
      )}

      {/* Unknown Token Note */}
      {activeTab === "unknown" && activeCategory.count > 0 && (
        <div className="mt-3 p-2 bg-gray-500/10 rounded text-[8px] text-gray-400 border border-gray-500/20">
          ❓ Unknown tokens couldn't be priced. They may be new, low-liquidity, or have non-standard contracts.
        </div>
      )}
    </div>
  );
}
