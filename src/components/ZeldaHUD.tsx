"use client";

// =============================================================================
// ZELDA NES-STYLE HUD - Top metrics bar (LARGER VERSION)
// Full-width layout with bigger elements
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

// Pixel heart component - LARGER with better visibility for empty hearts
function PixelHeart({ filled, color = "red" }: { filled: boolean; color?: "red" | "green" }) {
  const fillColor = color === "green" ? "#00FF00" : "#FF0000";
  // Empty hearts now have a visible outline/border style
  const emptyFill = "#1a1a1a";
  const outlineColor = "#666666";
  
  return (
    <svg viewBox="0 0 10 9" width="28" height="25" style={{ imageRendering: "pixelated" }}>
      {/* Outline for visibility */}
      <rect x="1" y="0" width="3" height="1" fill={filled ? fillColor : outlineColor} />
      <rect x="6" y="0" width="3" height="1" fill={filled ? fillColor : outlineColor} />
      <rect x="0" y="1" width="1" height="1" fill={filled ? fillColor : outlineColor} />
      <rect x="4" y="1" width="2" height="1" fill={filled ? fillColor : outlineColor} />
      <rect x="9" y="1" width="1" height="1" fill={filled ? fillColor : outlineColor} />
      <rect x="0" y="2" width="1" height="2" fill={filled ? fillColor : outlineColor} />
      <rect x="9" y="2" width="1" height="2" fill={filled ? fillColor : outlineColor} />
      <rect x="0" y="4" width="1" height="1" fill={filled ? fillColor : outlineColor} />
      <rect x="9" y="4" width="1" height="1" fill={filled ? fillColor : outlineColor} />
      <rect x="1" y="5" width="1" height="1" fill={filled ? fillColor : outlineColor} />
      <rect x="8" y="5" width="1" height="1" fill={filled ? fillColor : outlineColor} />
      <rect x="2" y="6" width="1" height="1" fill={filled ? fillColor : outlineColor} />
      <rect x="7" y="6" width="1" height="1" fill={filled ? fillColor : outlineColor} />
      <rect x="3" y="7" width="1" height="1" fill={filled ? fillColor : outlineColor} />
      <rect x="6" y="7" width="1" height="1" fill={filled ? fillColor : outlineColor} />
      <rect x="4" y="8" width="2" height="1" fill={filled ? fillColor : outlineColor} />
      
      {/* Inner fill */}
      <rect x="1" y="1" width="3" height="1" fill={filled ? fillColor : emptyFill} />
      <rect x="6" y="1" width="3" height="1" fill={filled ? fillColor : emptyFill} />
      <rect x="1" y="2" width="8" height="2" fill={filled ? fillColor : emptyFill} />
      <rect x="1" y="4" width="8" height="1" fill={filled ? fillColor : emptyFill} />
      <rect x="2" y="5" width="6" height="1" fill={filled ? fillColor : emptyFill} />
      <rect x="3" y="6" width="4" height="1" fill={filled ? fillColor : emptyFill} />
      <rect x="4" y="7" width="2" height="1" fill={filled ? fillColor : emptyFill} />
    </svg>
  );
}

// Mini map showing status - LARGER
function MiniMap({ isProfitable }: { isProfitable: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div 
        className="w-16 h-16 border-4 border-[#8B4513] bg-[#1a1a1a] flex items-center justify-center relative"
        style={{ 
          imageRendering: "pixelated",
          backgroundImage: "url('/assets/zelda/cave-wall.png')",
          backgroundSize: "32px 32px",
        }}
      >
        {/* Status indicator */}
        <div className={`w-5 h-5 ${isProfitable ? 'bg-[#00FF00]' : 'bg-[#FF0000]'} animate-pulse border-2 border-black`} />
      </div>
      <div className="text-[10px] text-[#8B4513] mt-1">MAP</div>
    </div>
  );
}

// Rupee icon - LARGER
function RupeeIcon() {
  return (
    <svg viewBox="0 0 6 10" width="18" height="30" style={{ imageRendering: "pixelated" }}>
      <rect x="2" y="0" width="2" height="1" fill="#00FF00" />
      <rect x="1" y="1" width="4" height="1" fill="#00FF00" />
      <rect x="0" y="2" width="6" height="2" fill="#00FF00" />
      <rect x="0" y="4" width="6" height="2" fill="#00AA00" />
      <rect x="1" y="6" width="4" height="2" fill="#00AA00" />
      <rect x="2" y="8" width="2" height="2" fill="#006600" />
    </svg>
  );
}

// Item slot - LARGER
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
      <div className="text-[12px] text-[#FCE4B8] mb-1">{label}</div>
      <div className="w-14 h-14 border-4 border-[#8B4513] bg-black flex items-center justify-center">
        {icon === "uni" ? (
          <svg viewBox="0 0 8 8" width="28" height="28" style={{ imageRendering: "pixelated" }}>
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
          <svg viewBox="0 0 8 10" width="28" height="35" style={{ imageRendering: "pixelated" }}>
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
      <div className="text-[11px] mt-1" style={{ color: valueColor }}>{value}</div>
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
      className="w-full px-6 py-4"
      style={{ 
        fontFamily: "'Press Start 2P', monospace",
        backgroundImage: "url('/assets/zelda/cave-wall.png')",
        backgroundSize: "64px 64px",
        borderBottom: "6px solid #8B4513",
      }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-6">
        
        {/* Section 1: Mini Map */}
        <MiniMap isProfitable={isProfitable} />
        
        {/* Section 2: Rupees/Jar Value */}
        <div className="flex flex-col bg-black/80 px-4 py-2 border-4 border-[#8B4513]">
          <div className="text-[10px] text-[#FCE4B8] mb-1">RUPEES</div>
          <div className="flex items-center gap-2">
            <RupeeIcon />
            <span className="text-[#00FF00] text-xl">
              {isLoading ? "---" : formatValue(jarValue)}
            </span>
          </div>
          <div className="text-[8px] text-[#666] mt-1">JAR VALUE</div>
        </div>
        
        {/* Section 3: Hearts/Life */}
        <div className="flex flex-col items-center bg-black/80 px-4 py-2 border-4 border-[#8B4513]">
          <div className="text-[10px] text-[#FF0000] mb-2">-LIFE-</div>
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <PixelHeart 
                key={i} 
                filled={i < heartCount} 
                color={isProfitable ? "green" : "red"}
              />
            ))}
          </div>
          <div className={`text-[8px] mt-2 ${isProfitable ? 'text-[#00FF00]' : 'text-[#FF0000]'}`}>
            {isProfitable ? "PROFITABLE" : "NOT PROFITABLE"}
          </div>
        </div>
        
        {/* Section 4: Item Slots */}
        <div className="flex gap-4 bg-black/80 px-4 py-2 border-4 border-[#8B4513]">
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
        <div className="flex flex-col items-end bg-black/80 px-6 py-2 border-4 border-[#8B4513] min-w-[140px]">
          <div className="text-[10px] text-[#FCE4B8]">NET</div>
          <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-[#00FF00]' : 'text-[#FF0000]'}`}>
            {isLoading ? "---" : (
              <>
                {netProfit >= 0 ? '+' : '-'}{formatValue(Math.abs(netProfit))}
              </>
            )}
          </div>
          <div className={`text-[8px] ${netProfit >= 0 ? 'text-[#00FF00]' : 'text-[#FF0000]'}`}>
            {netProfit >= 0 ? 'PROFIT' : 'WOULD LOSE'}
          </div>
        </div>
        
      </div>
    </div>
  );
}
