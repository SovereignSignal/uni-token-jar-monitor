"use client";

import { useMemo } from "react";

interface TokenData {
  symbol: string;
  valueUsd: number | null;
}

interface PixelJarProps {
  tokens: TokenData[];
  totalValue: number;
  burnCost: number;
  isProfitable: boolean;
}

// =============================================================================
// COIN SPRITES - Larger, more detailed
// =============================================================================

// Gold Coin with $ symbol (20x20 for visibility)
function GoldCoin({ size = 20, delay = 0, rotation = 0 }: { size?: number; delay?: number; rotation?: number }) {
  return (
    <div
      className="coin-spin"
      style={{
        animationDelay: `${delay}s`,
        width: size,
        height: size,
        transform: `rotate(${rotation}deg)`,
        filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.4))",
      }}
    >
      <svg
        viewBox="0 0 20 20"
        width={size}
        height={size}
        style={{ imageRendering: "pixelated" }}
      >
        {/* Outer dark ring */}
        <circle cx="10" cy="10" r="9" fill="#8B6914" />
        {/* Main gold body */}
        <circle cx="10" cy="10" r="8" fill="#FFD700" />
        {/* Highlight gradient */}
        <ellipse cx="7" cy="7" rx="4" ry="3" fill="#FFEC8B" opacity="0.6" />
        {/* Inner shadow */}
        <ellipse cx="12" cy="13" rx="4" ry="3" fill="#B8860B" opacity="0.4" />
        {/* $ symbol */}
        <rect x="9" y="5" width="2" height="1" fill="#8B6914" />
        <rect x="8" y="6" width="4" height="1" fill="#8B6914" />
        <rect x="8" y="7" width="2" height="1" fill="#8B6914" />
        <rect x="9" y="8" width="2" height="1" fill="#8B6914" />
        <rect x="10" y="9" width="2" height="1" fill="#8B6914" />
        <rect x="8" y="10" width="4" height="1" fill="#8B6914" />
        <rect x="10" y="11" width="2" height="1" fill="#8B6914" />
        <rect x="8" y="12" width="4" height="1" fill="#8B6914" />
        <rect x="9" y="13" width="2" height="1" fill="#8B6914" />
        {/* Center line of $ */}
        <rect x="9" y="4" width="2" height="11" fill="#8B6914" opacity="0.3" />
      </svg>
    </div>
  );
}

// UNI Token Coin - Pink (20x20)
function UniCoin({ size = 20, delay = 0, rotation = 0 }: { size?: number; delay?: number; rotation?: number }) {
  return (
    <div
      className="coin-spin"
      style={{
        animationDelay: `${delay}s`,
        width: size,
        height: size,
        transform: `rotate(${rotation}deg)`,
        filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.4))",
      }}
    >
      <svg
        viewBox="0 0 20 20"
        width={size}
        height={size}
        style={{ imageRendering: "pixelated" }}
      >
        {/* Outer dark ring */}
        <circle cx="10" cy="10" r="9" fill="#9E0059" />
        {/* Main pink body */}
        <circle cx="10" cy="10" r="8" fill="#FF007A" />
        {/* Highlight */}
        <ellipse cx="7" cy="7" rx="4" ry="3" fill="#FF5FA2" opacity="0.6" />
        {/* Inner shadow */}
        <ellipse cx="12" cy="13" rx="4" ry="3" fill="#C7005F" opacity="0.4" />
        {/* U symbol for UNI */}
        <rect x="7" y="6" width="2" height="6" fill="#fff" opacity="0.8" />
        <rect x="11" y="6" width="2" height="6" fill="#fff" opacity="0.8" />
        <rect x="7" y="11" width="6" height="2" fill="#fff" opacity="0.8" />
      </svg>
    </div>
  );
}

// Skull Coin for burn pile (20x20) - Red/danger themed
function SkullCoin({ size = 20, delay = 0, rotation = 0, scale = 1 }: {
  size?: number;
  delay?: number;
  rotation?: number;
  scale?: number;
}) {
  return (
    <div
      className="coin-spin"
      style={{
        animationDelay: `${delay}s`,
        width: size * scale,
        height: size * scale,
        transform: `rotate(${rotation}deg)`,
        filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.5))",
      }}
    >
      <svg
        viewBox="0 0 20 20"
        width={size * scale}
        height={size * scale}
        style={{ imageRendering: "pixelated" }}
      >
        {/* Outer dark ring */}
        <circle cx="10" cy="10" r="9" fill="#4A0000" />
        {/* Main red body */}
        <circle cx="10" cy="10" r="8" fill="#DC143C" />
        {/* Highlight */}
        <ellipse cx="7" cy="7" rx="4" ry="3" fill="#FF6B6B" opacity="0.5" />
        {/* Inner shadow */}
        <ellipse cx="12" cy="13" rx="4" ry="3" fill="#8B0000" opacity="0.4" />
        {/* Skull face */}
        {/* Eye sockets */}
        <rect x="5" y="6" width="3" height="3" fill="#fff" />
        <rect x="12" y="6" width="3" height="3" fill="#fff" />
        <rect x="6" y="7" width="1" height="1" fill="#000" />
        <rect x="13" y="7" width="1" height="1" fill="#000" />
        {/* Nose */}
        <rect x="9" y="9" width="2" height="2" fill="#4A0000" />
        {/* Teeth */}
        <rect x="6" y="12" width="8" height="2" fill="#fff" />
        <rect x="7" y="12" width="1" height="2" fill="#8B0000" />
        <rect x="9" y="12" width="1" height="2" fill="#8B0000" />
        <rect x="11" y="12" width="1" height="2" fill="#8B0000" />
      </svg>
    </div>
  );
}

// =============================================================================
// FIRE PARTICLES - Enhanced
// =============================================================================

function FireParticle({ delay, x, size = 8 }: { delay: number; x: number; size?: number }) {
  // Randomize color between orange, yellow, and red
  const colors = ["#FF4500", "#FFA500", "#FFD700", "#FF6347"];
  const color = colors[Math.floor(Math.random() * colors.length)];

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${x}%`,
        bottom: "10%",
        animation: `fireRise ${1.2 + Math.random() * 0.8}s ease-out ${delay}s infinite`,
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle, ${color} 0%, #FF0000 100%)`,
          borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
          boxShadow: `0 0 ${size}px ${color}`,
        }}
      />
    </div>
  );
}

// =============================================================================
// GLASS JAR - Complete redesign with proper mason jar shape
// =============================================================================

function GlassJar({
  fillPercent,
  isProfitable,
  coinCount,
  jarValue,
}: {
  fillPercent: number;
  isProfitable: boolean;
  coinCount: number;
  jarValue: number;
}) {
  // Generate coins inside jar - organic pile at bottom
  const coinsInJar = useMemo(() => {
    const coins: Array<{
      x: number;
      y: number;
      type: "uni" | "gold";
      delay: number;
      rotation: number;
      scale: number;
    }> = [];

    // Create organic pile from bottom
    let placed = 0;
    let row = 0;
    const maxCoins = Math.min(coinCount, 30);

    while (placed < maxCoins) {
      // Each row has fewer coins as we go up (pyramid)
      const coinsInRow = Math.max(5 - row, 1);

      for (let i = 0; i < coinsInRow && placed < maxCoins; i++) {
        const baseX = 50 - (coinsInRow * 12) / 2;
        coins.push({
          x: baseX + i * 12 + (Math.random() * 8 - 4), // Random offset ±4
          y: 85 - row * 10 - (Math.random() * 4), // Stack upward with jitter
          type: Math.random() > 0.4 ? "gold" : "uni",
          delay: placed * 0.08,
          rotation: Math.random() * 20 - 10, // ±10 degrees
          scale: 0.85 + Math.random() * 0.3,
        });
        placed++;
      }
      row++;
    }

    return coins;
  }, [coinCount]);

  return (
    <div className="relative" style={{ width: 160, height: 240 }}>
      {/* SVG Jar Shape */}
      <svg
        viewBox="0 0 160 240"
        className="w-full h-full absolute top-0 left-0"
        style={{
          filter: isProfitable
            ? "drop-shadow(0 0 25px rgba(39, 174, 96, 0.6))"
            : "drop-shadow(0 0 15px rgba(255, 0, 122, 0.3))",
        }}
      >
        {/* Glass interior fill (shows depth) */}
        <path
          d="M 40 50
             Q 35 70, 30 100
             Q 25 150, 28 190
             Q 30 210, 50 220
             L 110 220
             Q 130 210, 132 190
             Q 135 150, 130 100
             Q 125 70, 120 50
             Z"
          fill="rgba(255, 0, 122, 0.08)"
        />

        {/* Fill level based on value */}
        {fillPercent > 0 && (
          <path
            d={`M 30 ${220 - fillPercent * 1.2}
               Q 25 ${220 - fillPercent * 0.6}, 28 190
               Q 30 210, 50 220
               L 110 220
               Q 130 210, 132 190
               Q 135 ${220 - fillPercent * 0.6}, 130 ${220 - fillPercent * 1.2}
               Z`}
            fill={isProfitable ? "rgba(39, 174, 96, 0.2)" : "rgba(255, 215, 0, 0.15)"}
          />
        )}

        {/* Jar body outline - thick pixel border */}
        {/* Left side */}
        <path
          d="M 45 45 Q 35 65, 28 100 Q 22 150, 25 195 Q 28 215, 45 225"
          stroke="#FF007A"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />
        {/* Right side */}
        <path
          d="M 115 45 Q 125 65, 132 100 Q 138 150, 135 195 Q 132 215, 115 225"
          stroke="#FF007A"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />
        {/* Bottom */}
        <path
          d="M 45 225 Q 80 235, 115 225"
          stroke="#FF007A"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Neck */}
        <rect x="50" y="35" width="60" height="3" fill="#FF007A" />
        <path d="M 45 45 L 50 38 L 50 35" stroke="#FF007A" strokeWidth="4" fill="none" />
        <path d="M 115 45 L 110 38 L 110 35" stroke="#FF007A" strokeWidth="4" fill="none" />

        {/* Cork */}
        <rect x="48" y="8" width="64" height="28" rx="4" fill="#8B4513" />
        <rect x="50" y="10" width="60" height="8" fill="#A0522D" />
        <rect x="50" y="28" width="60" height="6" fill="#6B3A1A" />
        {/* Cork texture lines */}
        <line x1="55" y1="10" x2="55" y2="34" stroke="rgba(0,0,0,0.1)" strokeWidth="2" />
        <line x1="70" y1="10" x2="70" y2="34" stroke="rgba(0,0,0,0.1)" strokeWidth="2" />
        <line x1="85" y1="10" x2="85" y2="34" stroke="rgba(0,0,0,0.1)" strokeWidth="2" />
        <line x1="100" y1="10" x2="100" y2="34" stroke="rgba(0,0,0,0.1)" strokeWidth="2" />

        {/* Glass shine/highlight */}
        <rect x="32" y="70" width="4" height="50" rx="2" fill="rgba(255,255,255,0.4)" />
        <rect x="34" y="130" width="3" height="30" rx="1" fill="rgba(255,255,255,0.3)" />
        <rect x="35" y="170" width="2" height="20" rx="1" fill="rgba(255,255,255,0.2)" />

        {/* Small shine on right */}
        <rect x="125" y="90" width="3" height="20" rx="1" fill="rgba(255,255,255,0.2)" />

        {/* Sparkles when profitable */}
        {isProfitable && (
          <>
            <circle cx="55" cy="60" r="3" fill="#fff">
              <animate attributeName="opacity" values="0;1;0" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="r" values="2;4;2" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="105" cy="80" r="2" fill="#fff">
              <animate attributeName="opacity" values="0;1;0" dur="2s" begin="0.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="70" cy="180" r="2" fill="#FFD700">
              <animate attributeName="opacity" values="0;1;0" dur="1.8s" begin="0.3s" repeatCount="indefinite" />
            </circle>
          </>
        )}
      </svg>

      {/* Coins inside the jar - positioned over SVG */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: "18%",
          right: "18%",
          bottom: "8%",
          top: "20%",
          overflow: "hidden",
        }}
      >
        {coinsInJar.map((coin, i) => (
          <div
            key={i}
            className="absolute coin-bob"
            style={{
              left: `${coin.x}%`,
              top: `${coin.y}%`,
              animationDelay: `${coin.delay}s`,
              zIndex: Math.floor(coin.y),
            }}
          >
            {coin.type === "uni" ? (
              <UniCoin size={18} delay={coin.delay} rotation={coin.rotation} />
            ) : (
              <GoldCoin size={18} delay={coin.delay + 0.3} rotation={coin.rotation} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// BURN PILE - Organic pyramid heap
// =============================================================================

function BurnPile({
  burnCost,
  jarValue,
}: {
  burnCost: number;
  jarValue: number;
}) {
  // Scale pile based on burn/jar ratio
  const ratio = jarValue > 0 ? burnCost / jarValue : 50;
  const baseRows = Math.min(8, Math.max(4, Math.ceil(Math.sqrt(ratio) * 2.5)));

  // Generate pyramid heap with organic randomness
  const pileCoins = useMemo(() => {
    const coins: Array<{
      x: number;
      y: number;
      rotation: number;
      scale: number;
      delay: number;
      zIndex: number;
    }> = [];

    // Build pyramid from bottom up
    for (let row = 0; row < baseRows; row++) {
      const coinsInRow = baseRows - row;
      const rowWidth = coinsInRow * 18;
      const startX = 50 - rowWidth / 2;

      for (let i = 0; i < coinsInRow; i++) {
        coins.push({
          x: startX + i * 18 + (Math.random() * 6 - 3), // ±3px offset
          y: 100 - row * 16 - (Math.random() * 4 - 2), // ±2px vertical jitter
          rotation: Math.random() * 20 - 10, // ±10 degrees
          scale: 0.85 + Math.random() * 0.3,
          delay: (row * coinsInRow + i) * 0.03,
          zIndex: row,
        });
      }
    }

    // Add fallen coins around base
    const fallenCount = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < fallenCount; i++) {
      const side = Math.random() > 0.5 ? 1 : -1;
      coins.push({
        x: 50 + side * (45 + Math.random() * 15),
        y: 95 + Math.random() * 5,
        rotation: Math.random() * 360,
        scale: 0.7 + Math.random() * 0.2,
        delay: Math.random(),
        zIndex: 0,
      });
    }

    return coins;
  }, [baseRows]);

  // Fire particles - more of them
  const fireParticles = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      x: 15 + (i / 12) * 70 + Math.random() * 10 - 5,
      delay: i * 0.15 + Math.random() * 0.2,
      size: 6 + Math.random() * 6,
    }));
  }, []);

  return (
    <div className="relative flex flex-col items-center" style={{ minHeight: 260 }}>
      {/* Label */}
      <div className="text-center mb-2">
        <div className="text-[10px] text-red-400 flex items-center justify-center gap-2 font-bold">
          <svg viewBox="0 0 16 16" width="14" height="14" style={{ imageRendering: "pixelated" }}>
            <rect x="4" y="1" width="8" height="1" fill="#DC143C" />
            <rect x="2" y="2" width="12" height="1" fill="#DC143C" />
            <rect x="1" y="3" width="14" height="5" fill="#DC143C" />
            <rect x="3" y="4" width="3" height="2" fill="#191B1F" />
            <rect x="10" y="4" width="3" height="2" fill="#191B1F" />
            <rect x="2" y="8" width="12" height="2" fill="#DC143C" />
            <rect x="4" y="10" width="2" height="3" fill="#DC143C" />
            <rect x="7" y="10" width="2" height="3" fill="#DC143C" />
            <rect x="10" y="10" width="2" height="3" fill="#DC143C" />
          </svg>
          SACRIFICE
        </div>
        <div className="text-[10px] text-gray-400">4,000 UNI</div>
      </div>

      {/* Pile container */}
      <div className="relative" style={{ width: 160, height: 180 }}>
        {/* Fire glow base */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2"
          style={{
            width: "90%",
            height: 20,
            background: "radial-gradient(ellipse at center, rgba(255,69,0,0.4) 0%, transparent 70%)",
            animation: "fireGlow 0.5s ease-in-out infinite alternate",
          }}
        />

        {/* Fire particles */}
        {fireParticles.map((p, i) => (
          <FireParticle key={i} x={p.x} delay={p.delay} size={p.size} />
        ))}

        {/* Skull coin pile */}
        <div className="absolute inset-0">
          {pileCoins.map((coin, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${coin.x}%`,
                top: `${coin.y}%`,
                transform: "translate(-50%, -50%)",
                zIndex: coin.zIndex,
              }}
            >
              <SkullCoin
                size={20}
                delay={coin.delay}
                rotation={coin.rotation}
                scale={coin.scale}
              />
            </div>
          ))}
        </div>

        {/* Platform/base under pile */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2"
          style={{
            width: "80%",
            height: 8,
            background: "linear-gradient(180deg, #4A4A4A 0%, #2A2A2A 100%)",
            borderRadius: "2px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.5)",
          }}
        />
      </div>

      {/* Value */}
      <div className="text-red-400 text-sm font-bold mt-1">
        ${burnCost.toLocaleString()}
      </div>
    </div>
  );
}

// =============================================================================
// COMPARISON BAR - Enhanced with animated stripes
// =============================================================================

function ComparisonBar({
  burnCost,
  jarValue,
}: {
  burnCost: number;
  jarValue: number;
}) {
  const total = burnCost + jarValue;
  const burnPercent = total > 0 ? (burnCost / total) * 100 : 50;
  const jarPercent = total > 0 ? (jarValue / total) * 100 : 50;
  const isProfitable = jarValue > burnCost;

  return (
    <div className="w-full mt-4">
      <div
        className="flex h-8 overflow-hidden border-2 border-gray-600"
        style={{ borderRadius: 4 }}
      >
        {/* Burn segment with animated stripes */}
        <div
          className="flex items-center justify-center text-[9px] text-white font-bold relative overflow-hidden"
          style={{
            width: `${burnPercent}%`,
            background: "linear-gradient(180deg, #FF4444 0%, #8B0000 100%)",
            minWidth: burnPercent > 3 ? "auto" : "24px",
          }}
        >
          {/* Animated danger stripes */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 8px,
                rgba(0,0,0,0.3) 8px,
                rgba(0,0,0,0.3) 16px
              )`,
              backgroundSize: "22px 22px",
              animation: "stripesMove 1s linear infinite",
            }}
          />
          <span className="relative z-10 drop-shadow-lg">
            {burnPercent > 12 ? `${burnPercent.toFixed(0)}%` : ""}
          </span>
        </div>

        {/* Jar segment */}
        <div
          className="flex items-center justify-center text-[9px] text-white font-bold"
          style={{
            width: `${jarPercent}%`,
            background: isProfitable
              ? "linear-gradient(180deg, #27AE60 0%, #1a7a42 100%)"
              : "linear-gradient(180deg, #FFD700 0%, #B8860B 100%)",
            minWidth: jarPercent > 3 ? "auto" : "24px",
          }}
        >
          {jarPercent > 12 ? `${jarPercent.toFixed(0)}%` : ""}
        </div>
      </div>

      {/* Labels */}
      <div className="flex justify-between text-[9px] mt-1 px-1">
        <span className="text-red-400 font-bold">BURN COST</span>
        <span className={isProfitable ? "text-green-400 font-bold" : "text-yellow-400 font-bold"}>
          JAR VALUE
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// ARROW INDICATOR - Pulsing animation
// =============================================================================

function BurnArrow() {
  return (
    <div
      className="flex flex-col items-center justify-center px-3"
      style={{ animation: "arrowPulse 1.5s ease-in-out infinite" }}
    >
      <div className="text-[8px] text-gray-500 mb-2 tracking-wider">BURN</div>

      {/* Pixel arrow */}
      <svg
        viewBox="0 0 50 24"
        width="60"
        height="30"
        style={{ imageRendering: "pixelated" }}
      >
        {/* Arrow glow */}
        <defs>
          <filter id="arrowGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Arrow shaft with gradient */}
        <rect x="0" y="10" width="35" height="4" fill="url(#arrowGradient)" filter="url(#arrowGlow)" />

        {/* Arrow head */}
        <polygon
          points="35,6 35,18 50,12"
          fill="#FF007A"
          filter="url(#arrowGlow)"
        />

        {/* Gradient definition */}
        <defs>
          <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF007A" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#FF007A" />
          </linearGradient>
        </defs>
      </svg>

      <div className="text-[8px] text-gray-500 mt-2 tracking-wider">TO CLAIM</div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function PixelJar({
  totalValue,
  burnCost,
  isProfitable,
}: PixelJarProps) {
  // Calculate fill level (0-100)
  const maxDisplayValue = 50000; // $50K = 100% full
  const fillPercent = Math.min((totalValue / maxDisplayValue) * 100, 100);

  // Calculate how many coins to show in jar based on value
  const coinCount = Math.max(1, Math.min(30, Math.floor(totalValue / 500)));

  return (
    <div className="w-full">
      {/* Main visualization - Side by side */}
      <div className="flex items-end justify-center gap-1 md:gap-3 mb-2">
        {/* Burn pile (left) */}
        <div className="flex-shrink-0">
          <BurnPile burnCost={burnCost} jarValue={totalValue} />
        </div>

        {/* Arrow */}
        <BurnArrow />

        {/* Glass jar (right) */}
        <div className="flex flex-col items-center flex-shrink-0">
          <div className="text-[10px] text-gray-400 mb-1 flex items-center gap-2 font-bold">
            <span className="text-[8px]">~</span>
            VAULT
            <span className="text-[8px]">~</span>
          </div>
          <GlassJar
            fillPercent={fillPercent}
            isProfitable={isProfitable}
            coinCount={coinCount}
            jarValue={totalValue}
          />
          <div
            className={`text-sm font-bold mt-1 ${
              isProfitable ? "text-green-400 treasure-glow" : "text-yellow-400"
            }`}
          >
            ${totalValue.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Comparison bar */}
      <ComparisonBar burnCost={burnCost} jarValue={totalValue} />
    </div>
  );
}
