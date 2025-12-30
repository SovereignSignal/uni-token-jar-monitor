"use client";

// =============================================================================
// ZELDA STATS BAR - Bottom metrics display
// Shows: Gas estimate, Token count, UNI price, detailed profit/loss
// =============================================================================

interface ZeldaStatsBarProps {
  gasEstimate: number;
  tokenCount: number;
  tokenValue: number;
  uniPrice: number;
  netProfit: number;
  isProfitable: boolean;
  isLoading: boolean;
  lastUpdate: string;
}

export default function ZeldaStatsBar({
  gasEstimate,
  tokenCount,
  tokenValue,
  uniPrice,
  netProfit,
  isProfitable,
  isLoading,
  lastUpdate,
}: ZeldaStatsBarProps) {
  const formatValue = (val: number) => {
    if (Math.abs(val) >= 1000) {
      return `$${(val / 1000).toFixed(1)}K`;
    }
    return `$${val.toFixed(0)}`;
  };

  return (
    <div 
      className="bg-black border-t-4 border-[#8B4513] px-3 py-2"
      style={{ fontFamily: "'Press Start 2P', monospace" }}
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 text-[8px]">
        
        {/* Gas Estimate */}
        <div className="flex flex-col">
          <span className="text-[#666]">GAS</span>
          <span className="text-[#FCE4B8]">
            {isLoading ? "---" : `~${formatValue(gasEstimate)}`}
          </span>
        </div>
        
        {/* Divider */}
        <div className="h-6 w-px bg-[#654321]" />
        
        {/* Token Count */}
        <div className="flex flex-col">
          <span className="text-[#666]">TOKENS</span>
          <span className="text-[#FCE4B8]">
            {isLoading ? "---" : `${tokenCount} (${formatValue(tokenValue)})`}
          </span>
        </div>
        
        {/* Divider */}
        <div className="h-6 w-px bg-[#654321]" />
        
        {/* UNI Price */}
        <div className="flex flex-col">
          <span className="text-[#666]">UNI PRICE</span>
          <span className="text-[#FF007A]">
            {isLoading ? "---" : `$${uniPrice.toFixed(2)}`}
          </span>
        </div>
        
        {/* Divider */}
        <div className="h-6 w-px bg-[#654321]" />
        
        {/* Profit/Loss Summary - Most important */}
        <div className="flex flex-col items-end flex-1">
          <span className="text-[#666]">
            {isProfitable ? "WOULD GAIN" : "WOULD LOSE"}
          </span>
          <span className={`text-[10px] font-bold ${isProfitable ? 'text-[#00FF00]' : 'text-[#FF0000]'}`}>
            {isLoading ? "---" : (
              <>
                {isProfitable ? '+' : '-'}{formatValue(Math.abs(netProfit))}
              </>
            )}
          </span>
        </div>
        
        {/* Divider */}
        <div className="h-6 w-px bg-[#654321]" />
        
        {/* Last Update */}
        <div className="flex flex-col items-end">
          <span className="text-[#666]">UPDATED</span>
          <span className="text-[#555]">
            {isLoading ? "..." : lastUpdate}
          </span>
        </div>
        
      </div>
    </div>
  );
}
