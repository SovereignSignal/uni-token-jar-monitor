"use client";

// =============================================================================
// ZELDA NES-STYLE HUD - Top metrics bar
// Layout: [MAP] | RUPEES (JAR) | -LIFE- | B[UNI] A[FIRE] | NET PROFIT
// =============================================================================

interface ZeldaHUDProps {
  jarValue: number;
  burnCost: number;
  netProfit: number;
  uniPrice: number;
  isProfitable: boolean;
  isLoading: boolean;
  tokenCount?: number;
}

// Pixel heart component - clean NES style
function PixelHeart({ filled, color = "red" }: { filled: boolean; color?: "red" | "green" }) {
  const fillColor = color === "green" ? "#00FF00" : "#FF0000";
  const emptyColor = "#333333";
  
  return (
    <svg viewBox="0 0 8 7" width="14" height="12" style={{ imageRendering: "pixelated" }}>
      <rect x="1" y="0" width="2" height="1" fill={filled ? fillColor : emptyColor} />
      <rect x="5" y="0" width="2" height="1" fill={filled ? fillColor : emptyColor} />
      <rect x="0" y="1" width="4" height="1" fill={filled ? fillColor : emptyColor} />
      <rect x="4" y="1" width="4" height="1" fill={filled ? fillColor : emptyColor} />
      <rect x="0" y="2" width="8" height="1" fill={filled ? fillColor : emptyColor} />
      <rect x="0" y="3" width="8" height="1" fill={filled ? fillColor : emptyColor} />
      <rect x="1" y="4" width="6" height="1" fill={filled ? fillColor : emptyColor} />
      <rect x="2" y="5" width="4" height="1" fill={filled ? fillColor : emptyColor} />
      <rect x="3" y="6" width="2" height="1" fill={filled ? fillColor : emptyColor} />
    </svg>
  );
}

// Mini map showing status
function MiniMap({ isProfitable }: { isProfitable: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div 
        className="w-10 h-10 border-2 border-[#FCE4B8] bg-[#1a1a1a] flex items-center justify-center relative"
        style={{ imageRendering: "pixelated" }}
      >
        {/* Grid lines */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-30">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="border border-[#333]" />
          ))}
        </div>
        {/* Status indicator */}
        <div className={`w-3 h-3 ${isProfitable ? 'bg-[#00FF00]' : 'bg-[#FF0000]'} animate-pulse`} />
      </div>
      <div className="text-[6px] text-[#666] mt-0.5">MAP</div>
    </div>
  );
}

// Rupee icon
function RupeeIcon() {
  return (
    <svg viewBox="0 0 6 10" width="10" height="16" style={{ imageRendering: "pixelated" }}>
      <rect x="2" y="0" width="2" height="1" fill="#00FF00" />
      <rect x="1" y="1" width="4" height="1" fill="#00FF00" />
      <rect x="0" y="2" width="6" height="2" fill="#00FF00" />
      <rect x="0" y="4" width="6" height="2" fill="#00AA00" />
      <rect x="1" y="6" width="4" height="2" fill="#00AA00" />
      <rect x="2" y="8" width="2" height="2" fill="#006600" />
    </svg>
  );
}

// Item slot
function ItemSlot({ 
  label, 
  value, 
  icon,
  valueColor = "#FCE4B8"
}: { 
  label: string; 
  value: string;
  icon: "uni" | "fire";
  valueColor?: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-[8px] text-[#FCE4B8]">{label}</div>
      <div className="w-8 h-8 border border-[#FCE4B8] bg-black flex items-center justify-center">
        {icon === "uni" ? (
          <svg viewBox="0 0 8 8" width="14" height="14" style={{ imageRendering: "pixelated" }}>
            <rect x="2" y="0" width="4" height="1" fill="#FF007A" />
            <rect x="1" y="1" width="6" height="1" fill="#FF007A" />
            <rect x="0" y="2" width="8" height="4" fill="#FF007A" />
            <rect x="1" y="6" width="6" height="1" fill="#FF007A" />
            <rect x="2" y="7" width="4" height="1" fill="#FF007A" />
            <rect x="2" y="3" width="1" height="2" fill="#FFF" />
            <rect x="5" y="3" width="1" height="2" fill="#FFF" />
            <rect x="3" y="5" width="2" height="1" fill="#FFF" />
          </svg>
        ) : (
          <svg viewBox="0 0 8 10" width="14" height="18" style={{ imageRendering: "pixelated" }}>
            <rect x="3" y="0" width="2" height="1" fill="#FFCC00" />
            <rect x="2" y="1" width="4" height="1" fill="#FFCC00" />
            <rect x="2" y="2" width="4" height="2" fill="#FF6600" />
            <rect x="1" y="4" width="6" height="2" fill="#FF6600" />
            <rect x="1" y="6" width="6" height="2" fill="#FF6600" />
            <rect x="2" y="8" width="4" height="1" fill="#FF0000" />
            <rect x="3" y="9" width="2" height="1" fill="#FF0000" />
          </svg>
        )}
      </div>
      <div className="text-[7px] mt-0.5" style={{ color: valueColor }}>{value}</div>
    </div>
  );
}

export default function ZeldaHUD({
  jarValue,
  burnCost,
  netProfit,
  uniPrice,
  isProfitable,
  isLoading,
  tokenCount = 0,
}: ZeldaHUDProps) {
  // Calculate hearts: 5 max, based on how close to profitability
  const profitRatio = burnCost > 0 ? jarValue / burnCost : 0;
  const heartCount = isProfitable ? 5 : Math.min(4, Math.max(0, Math.floor(profitRatio * 5)));
  
  const formatValue = (val: number) => {
    if (Math.abs(val) >= 1000) {
      return `$${(val / 1000).toFixed(1)}K`;
    }
    return `$${val.toFixed(0)}`;
  };
  
  return (
    <div 
      className="bg-black border-b-4 border-[#8B4513] px-3 py-2"
      style={{ fontFamily: "'Press Start 2P', monospace" }}
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        
        {/* Section 1: Mini Map */}
        <MiniMap isProfitable={isProfitable} />
        
        {/* Section 2: Rupees/Jar Value */}
        <div className="flex flex-col">
          <div className="text-[7px] text-[#FCE4B8] mb-0.5">RUPEES</div>
          <div className="flex items-center gap-1">
            <RupeeIcon />
            <span className="text-[#00FF00] text-[11px]">
              {isLoading ? "---" : formatValue(jarValue)}
            </span>
          </div>
          <div className="text-[5px] text-[#666]">JAR VALUE</div>
        </div>
        
        {/* Section 3: Hearts/Life */}
        <div className="flex flex-col items-center">
          <div className="text-[7px] text-[#FF0000] mb-0.5">-LIFE-</div>
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <PixelHeart 
                key={i} 
                filled={i < heartCount} 
                color={isProfitable ? "green" : "red"}
              />
            ))}
          </div>
          <div className={`text-[5px] mt-0.5 ${isProfitable ? 'text-[#00FF00]' : 'text-[#FF0000]'}`}>
            {isProfitable ? "PROFITABLE" : "NOT PROFITABLE"}
          </div>
        </div>
        
        {/* Section 4: Item Slots */}
        <div className="flex gap-2">
          <ItemSlot 
            label="B" 
            value={isLoading ? "---" : `$${uniPrice.toFixed(2)}`}
            icon="uni"
          />
          <ItemSlot 
            label="A" 
            value={isLoading ? "---" : formatValue(burnCost)}
            icon="fire"
            valueColor="#FF6600"
          />
        </div>
        
        {/* Section 5: Net Profit/Loss - THE MOST IMPORTANT */}
        <div className="flex flex-col items-end min-w-[80px]">
          <div className="text-[7px] text-[#FCE4B8]">NET</div>
          <div className={`text-[14px] font-bold ${netProfit >= 0 ? 'text-[#00FF00]' : 'text-[#FF0000]'}`}>
            {isLoading ? "---" : (
              <>
                {netProfit >= 0 ? '+' : '-'}{formatValue(Math.abs(netProfit))}
              </>
            )}
          </div>
          <div className={`text-[5px] ${netProfit >= 0 ? 'text-[#00FF00]' : 'text-[#FF0000]'}`}>
            {netProfit >= 0 ? 'PROFIT' : 'WOULD LOSE'}
          </div>
        </div>
        
      </div>
    </div>
  );
}
