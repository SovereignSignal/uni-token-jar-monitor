"use client";

// =============================================================================
// ZELDA STATS BAR - Bottom metrics display (LARGER VERSION)
// Full-width with sprite background
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
      className="w-full px-6 py-4"
      style={{ 
        fontFamily: "'Press Start 2P', monospace",
        backgroundImage: "url('/assets/zelda/cave-wall.png')",
        backgroundSize: "64px 64px",
        borderTop: "6px solid #8B4513",
      }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        
        {/* Gas Estimate */}
        <div className="bg-black/80 px-4 py-3 border-4 border-[#8B4513] flex flex-col items-center min-w-[100px]">
          <div className="text-[10px] text-[#FF6600] mb-1">GAS</div>
          <div className="text-[#FCE4B8] text-lg">
            {isLoading ? "---" : `~$${gasEstimate}`}
          </div>
        </div>
        
        {/* Token Count */}
        <div className="bg-black/80 px-4 py-3 border-4 border-[#8B4513] flex flex-col items-center min-w-[140px]">
          <div className="text-[10px] text-[#FF007A] mb-1">TOKENS</div>
          <div className="text-[#FCE4B8] text-lg">
            {isLoading ? "---" : (
              <>
                {tokenCount} <span className="text-[#00FF00] text-sm">({formatValue(tokenValue)})</span>
              </>
            )}
          </div>
        </div>
        
        {/* UNI Price */}
        <div className="bg-black/80 px-4 py-3 border-4 border-[#8B4513] flex flex-col items-center min-w-[120px]">
          <div className="text-[10px] text-[#FF007A] mb-1">UNI PRICE</div>
          <div className="text-[#FCE4B8] text-lg">
            {isLoading ? "---" : `$${uniPrice.toFixed(2)}`}
          </div>
        </div>
        
        {/* Spacer */}
        <div className="flex-1" />
        
        {/* Would Gain/Lose - THE IMPORTANT ONE */}
        <div className={`bg-black/80 px-6 py-3 border-4 ${isProfitable ? 'border-[#00FF00]' : 'border-[#FF0000]'} flex flex-col items-center min-w-[180px]`}>
          <div className={`text-[10px] ${isProfitable ? 'text-[#00FF00]' : 'text-[#FF0000]'} mb-1`}>
            {isProfitable ? "WOULD GAIN" : "WOULD LOSE"}
          </div>
          <div className={`text-2xl font-bold ${isProfitable ? 'text-[#00FF00]' : 'text-[#FF0000]'}`}>
            {isLoading ? "---" : (
              <>
                {isProfitable ? '+' : '-'}{formatValue(Math.abs(netProfit))}
              </>
            )}
          </div>
        </div>
        
        {/* Last Update */}
        <div className="bg-black/80 px-4 py-3 border-4 border-[#8B4513] flex flex-col items-center min-w-[100px]">
          <div className="text-[10px] text-[#666] mb-1">UPDATED</div>
          <div className="text-[#FCE4B8] text-sm">
            {isLoading ? "---" : lastUpdate}
          </div>
        </div>
        
      </div>
    </div>
  );
}
