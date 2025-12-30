"use client";

// =============================================================================
// ZELDA-STYLE HUD COMPONENT
// Replicates the classic NES Zelda inventory/stats bar
// =============================================================================

interface ZeldaHUDProps {
  jarValue: number;
  burnCost: number;
  netProfit: number;
  uniPrice: number;
  isProfitable: boolean;
  isLoading: boolean;
  lastUpdate: string;
}

// Pixel Heart - shows health/profitability status
function PixelHeart({ filled, half }: { filled: boolean; half?: boolean }) {
  return (
    <svg viewBox="0 0 8 8" width="16" height="16" style={{ imageRendering: "pixelated" }}>
      {filled ? (
        <>
          {/* Full red heart */}
          <rect x="1" y="1" width="2" height="1" fill="#e4464b" />
          <rect x="5" y="1" width="2" height="1" fill="#e4464b" />
          <rect x="0" y="2" width="8" height="2" fill="#e4464b" />
          <rect x="1" y="4" width="6" height="1" fill="#e4464b" />
          <rect x="2" y="5" width="4" height="1" fill="#e4464b" />
          <rect x="3" y="6" width="2" height="1" fill="#e4464b" />
          {/* Highlight */}
          <rect x="1" y="2" width="1" height="1" fill="#fc9090" />
        </>
      ) : half ? (
        <>
          {/* Half heart - left filled, right empty */}
          <rect x="1" y="1" width="2" height="1" fill="#e4464b" />
          <rect x="5" y="1" width="2" height="1" fill="#1a1a2e" />
          <rect x="0" y="2" width="4" height="2" fill="#e4464b" />
          <rect x="4" y="2" width="4" height="2" fill="#1a1a2e" />
          <rect x="1" y="4" width="3" height="1" fill="#e4464b" />
          <rect x="4" y="4" width="3" height="1" fill="#1a1a2e" />
          <rect x="2" y="5" width="2" height="1" fill="#e4464b" />
          <rect x="4" y="5" width="2" height="1" fill="#1a1a2e" />
          <rect x="3" y="6" width="1" height="1" fill="#e4464b" />
          <rect x="4" y="6" width="1" height="1" fill="#1a1a2e" />
          <rect x="1" y="2" width="1" height="1" fill="#fc9090" />
        </>
      ) : (
        <>
          {/* Empty heart outline */}
          <rect x="1" y="1" width="2" height="1" fill="#1a1a2e" />
          <rect x="5" y="1" width="2" height="1" fill="#1a1a2e" />
          <rect x="0" y="2" width="8" height="2" fill="#1a1a2e" />
          <rect x="1" y="4" width="6" height="1" fill="#1a1a2e" />
          <rect x="2" y="5" width="4" height="1" fill="#1a1a2e" />
          <rect x="3" y="6" width="2" height="1" fill="#1a1a2e" />
        </>
      )}
    </svg>
  );
}

// Pixel Rupee (jar icon for value)
function PixelRupee() {
  return (
    <svg viewBox="0 0 8 16" width="12" height="24" style={{ imageRendering: "pixelated" }}>
      {/* Green rupee shape */}
      <rect x="3" y="0" width="2" height="1" fill="#5ce65c" />
      <rect x="2" y="1" width="4" height="1" fill="#5ce65c" />
      <rect x="1" y="2" width="6" height="2" fill="#5ce65c" />
      <rect x="0" y="4" width="8" height="4" fill="#5ce65c" />
      <rect x="1" y="8" width="6" height="2" fill="#5ce65c" />
      <rect x="2" y="10" width="4" height="2" fill="#5ce65c" />
      <rect x="3" y="12" width="2" height="2" fill="#5ce65c" />
      {/* Highlight */}
      <rect x="2" y="2" width="1" height="6" fill="#a8ffa8" />
      <rect x="3" y="1" width="1" height="1" fill="#a8ffa8" />
      {/* Shadow */}
      <rect x="5" y="3" width="1" height="5" fill="#2d8c2d" />
    </svg>
  );
}

// Item slot B (UNI token)
function ItemSlotUNI({ price }: { price: number }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-[8px] text-white mb-1">B</div>
      <div className="w-8 h-8 bg-black border border-[#fcbcb0] flex items-center justify-center">
        <svg viewBox="0 0 16 16" width="20" height="20" style={{ imageRendering: "pixelated" }}>
          {/* UNI token - pink unicorn simplified */}
          <rect x="6" y="2" width="4" height="2" fill="#FF007A" />
          <rect x="4" y="4" width="8" height="4" fill="#FF007A" />
          <rect x="3" y="8" width="10" height="4" fill="#FF007A" />
          <rect x="5" y="12" width="2" height="2" fill="#c7005f" />
          <rect x="9" y="12" width="2" height="2" fill="#c7005f" />
          {/* Horn */}
          <rect x="10" y="1" width="1" height="2" fill="#FFD700" />
        </svg>
      </div>
      <div className="text-[8px] text-white mt-1">${price.toFixed(2)}</div>
    </div>
  );
}

// Item slot A (Fire/Burn)
function ItemSlotFire({ cost }: { cost: number }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-[8px] text-white mb-1">A</div>
      <div className="w-8 h-8 bg-black border border-[#fcbcb0] flex items-center justify-center">
        <svg viewBox="0 0 16 16" width="20" height="20" style={{ imageRendering: "pixelated" }}>
          {/* Fire icon */}
          <rect x="7" y="2" width="2" height="2" fill="#fc9090" />
          <rect x="6" y="4" width="4" height="2" fill="#e4464b" />
          <rect x="5" y="6" width="6" height="3" fill="#fc6c18" />
          <rect x="4" y="9" width="8" height="3" fill="#fcbc18" />
          <rect x="5" y="12" width="6" height="2" fill="#fc6c18" />
        </svg>
      </div>
      <div className="text-[8px] text-red-400 mt-1">-${(cost/1000).toFixed(0)}K</div>
    </div>
  );
}

// Mini map showing jar status
function MiniMap({ isProfitable }: { isProfitable: boolean }) {
  return (
    <div className="flex flex-col">
      <div className="w-16 h-16 bg-[#5c5c5c] border-2 border-[#fcbcb0] relative overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 grid grid-cols-4 grid-rows-4">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="border border-[#3c3c3c]" />
          ))}
        </div>
        {/* Current room indicator */}
        <div 
          className={`absolute w-3 h-3 ${isProfitable ? 'bg-green-500' : 'bg-red-500'}`}
          style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
        />
        {/* Jar icon in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 12 16" width="18" height="24" style={{ imageRendering: "pixelated" }}>
            <rect x="2" y="0" width="8" height="2" fill="#fcbcb0" />
            <rect x="1" y="2" width="10" height="2" fill="#fcbcb0" />
            <rect x="0" y="4" width="12" height="10" fill="#fcbcb0" />
            <rect x="2" y="14" width="8" height="2" fill="#fcbcb0" />
            {/* Jar contents */}
            <rect x="2" y="8" width="8" height="5" fill={isProfitable ? "#5ce65c" : "#e4464b"} />
          </svg>
        </div>
      </div>
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
  lastUpdate 
}: ZeldaHUDProps) {
  // Calculate hearts based on profitability ratio
  // Full hearts = profitable, empty = not profitable
  const profitRatio = jarValue / burnCost;
  const heartCount = 3;
  const filledHearts = isProfitable ? heartCount : Math.max(0, Math.floor(profitRatio * heartCount));
  
  return (
    <div className="zelda-hud bg-black p-2 border-b-4 border-[#fcbcb0]">
      <div className="flex justify-between items-start max-w-4xl mx-auto">
        {/* Left: Mini Map */}
        <div className="flex gap-4">
          <MiniMap isProfitable={isProfitable} />
          
          {/* Inventory info */}
          <div className="flex flex-col justify-center">
            <div className="text-[8px] text-[#fcbcb0] mb-1">-INVENTORY-</div>
            <div className="flex gap-2">
              <ItemSlotUNI price={uniPrice} />
              <ItemSlotFire cost={burnCost} />
            </div>
          </div>
        </div>
        
        {/* Center: Life/Hearts */}
        <div className="flex flex-col items-center">
          <div className="text-[8px] text-[#e4464b] mb-1">-LIFE-</div>
          <div className="flex gap-1">
            {Array.from({ length: heartCount }).map((_, i) => (
              <PixelHeart 
                key={i} 
                filled={i < filledHearts} 
                half={i === filledHearts && !isProfitable && profitRatio > 0}
              />
            ))}
          </div>
          <div className={`text-[8px] mt-1 ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
            {isProfitable ? 'PROFITABLE' : 'DANGER'}
          </div>
        </div>
        
        {/* Right: Rupee Counter (Jar Value) */}
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2 mb-2">
            <PixelRupee />
            <div className="text-[12px] text-white font-bold">
              {jarValue >= 1000 ? `${(jarValue/1000).toFixed(1)}K` : jarValue.toFixed(0)}
            </div>
          </div>
          <div className="text-[8px] text-[#fcbcb0]">JAR VALUE</div>
          
          {/* Net profit/loss */}
          <div className={`text-[10px] mt-2 ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            NET: {netProfit >= 0 ? '+' : ''}{netProfit >= 1000 || netProfit <= -1000 
              ? `${(netProfit/1000).toFixed(1)}K` 
              : netProfit.toFixed(0)}
          </div>
          
          {/* Status */}
          <div className="text-[6px] text-gray-500 mt-1">
            {isLoading ? 'LOADING...' : lastUpdate}
          </div>
        </div>
      </div>
    </div>
  );
}
