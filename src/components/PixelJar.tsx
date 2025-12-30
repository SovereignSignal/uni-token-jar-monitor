"use client";

import { useMemo, useEffect, useState } from "react";

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
// COIN SPRITES
// =============================================================================

// UNI Token Coin - Pink with unicorn hint (16x16)
function UniCoin({ size = 16, delay = 0 }: { size?: number; delay?: number }) {
  return (
    <div
      className="coin-spin"
      style={{ animationDelay: `${delay}s`, width: size, height: size }}
    >
      <svg
        viewBox="0 0 16 16"
        width={size}
        height={size}
        style={{ imageRendering: "pixelated" }}
      >
        {/* Outer ring */}
        <rect x="5" y="0" width="6" height="1" fill="#c7005f" />
        <rect x="3" y="1" width="2" height="1" fill="#c7005f" />
        <rect x="11" y="1" width="2" height="1" fill="#c7005f" />
        <rect x="2" y="2" width="1" height="1" fill="#c7005f" />
        <rect x="13" y="2" width="1" height="1" fill="#c7005f" />
        <rect x="1" y="3" width="1" height="2" fill="#c7005f" />
        <rect x="14" y="3" width="1" height="2" fill="#c7005f" />
        <rect x="0" y="5" width="1" height="6" fill="#c7005f" />
        <rect x="15" y="5" width="1" height="6" fill="#c7005f" />
        <rect x="1" y="11" width="1" height="2" fill="#c7005f" />
        <rect x="14" y="11" width="1" height="2" fill="#c7005f" />
        <rect x="2" y="13" width="1" height="1" fill="#c7005f" />
        <rect x="13" y="13" width="1" height="1" fill="#c7005f" />
        <rect x="3" y="14" width="2" height="1" fill="#c7005f" />
        <rect x="11" y="14" width="2" height="1" fill="#c7005f" />
        <rect x="5" y="15" width="6" height="1" fill="#c7005f" />
        {/* Main body */}
        <rect x="5" y="1" width="6" height="1" fill="#FF007A" />
        <rect x="3" y="2" width="10" height="1" fill="#FF007A" />
        <rect x="2" y="3" width="12" height="2" fill="#FF007A" />
        <rect x="1" y="5" width="14" height="6" fill="#FF007A" />
        <rect x="2" y="11" width="12" height="2" fill="#FF007A" />
        <rect x="3" y="13" width="10" height="1" fill="#FF007A" />
        <rect x="5" y="14" width="6" height="1" fill="#FF007A" />
        {/* Highlight */}
        <rect x="5" y="2" width="3" height="1" fill="#ff5fa2" />
        <rect x="3" y="3" width="4" height="1" fill="#ff5fa2" />
        <rect x="2" y="4" width="3" height="1" fill="#ff5fa2" />
        <rect x="2" y="5" width="2" height="2" fill="#ff5fa2" />
        {/* Unicorn hint */}
        <rect x="7" y="6" width="2" height="1" fill="#fff" opacity="0.5" />
        <rect x="8" y="7" width="1" height="2" fill="#fff" opacity="0.3" />
      </svg>
    </div>
  );
}

// Gold Coin (16x16)
function GoldCoin({ size = 16, delay = 0 }: { size?: number; delay?: number }) {
  return (
    <div
      className="coin-spin"
      style={{ animationDelay: `${delay}s`, width: size, height: size }}
    >
      <svg
        viewBox="0 0 16 16"
        width={size}
        height={size}
        style={{ imageRendering: "pixelated" }}
      >
        {/* Outer ring */}
        <rect x="5" y="0" width="6" height="1" fill="#b8860b" />
        <rect x="3" y="1" width="2" height="1" fill="#b8860b" />
        <rect x="11" y="1" width="2" height="1" fill="#b8860b" />
        <rect x="2" y="2" width="1" height="1" fill="#b8860b" />
        <rect x="13" y="2" width="1" height="1" fill="#b8860b" />
        <rect x="1" y="3" width="1" height="2" fill="#b8860b" />
        <rect x="14" y="3" width="1" height="2" fill="#b8860b" />
        <rect x="0" y="5" width="1" height="6" fill="#b8860b" />
        <rect x="15" y="5" width="1" height="6" fill="#b8860b" />
        <rect x="1" y="11" width="1" height="2" fill="#b8860b" />
        <rect x="14" y="11" width="1" height="2" fill="#b8860b" />
        <rect x="2" y="13" width="1" height="1" fill="#b8860b" />
        <rect x="13" y="13" width="1" height="1" fill="#b8860b" />
        <rect x="3" y="14" width="2" height="1" fill="#b8860b" />
        <rect x="11" y="14" width="2" height="1" fill="#b8860b" />
        <rect x="5" y="15" width="6" height="1" fill="#b8860b" />
        {/* Main body */}
        <rect x="5" y="1" width="6" height="1" fill="#FFD700" />
        <rect x="3" y="2" width="10" height="1" fill="#FFD700" />
        <rect x="2" y="3" width="12" height="2" fill="#FFD700" />
        <rect x="1" y="5" width="14" height="6" fill="#FFD700" />
        <rect x="2" y="11" width="12" height="2" fill="#FFD700" />
        <rect x="3" y="13" width="10" height="1" fill="#FFD700" />
        <rect x="5" y="14" width="6" height="1" fill="#FFD700" />
        {/* Highlight */}
        <rect x="5" y="2" width="3" height="1" fill="#FFEC8B" />
        <rect x="3" y="3" width="4" height="1" fill="#FFEC8B" />
        <rect x="2" y="4" width="3" height="1" fill="#FFEC8B" />
        <rect x="2" y="5" width="2" height="2" fill="#FFEC8B" />
        {/* $ symbol */}
        <rect x="7" y="5" width="2" height="1" fill="#b8860b" />
        <rect x="6" y="6" width="1" height="1" fill="#b8860b" />
        <rect x="7" y="7" width="2" height="1" fill="#b8860b" />
        <rect x="9" y="8" width="1" height="1" fill="#b8860b" />
        <rect x="7" y="9" width="2" height="1" fill="#b8860b" />
        <rect x="8" y="4" width="1" height="7" fill="#b8860b" opacity="0.4" />
      </svg>
    </div>
  );
}

// Skull Coin for burn pile (16x16) - Red tinted
function SkullCoin({ size = 16, delay = 0 }: { size?: number; delay?: number }) {
  return (
    <div
      className="coin-spin"
      style={{ animationDelay: `${delay}s`, width: size, height: size }}
    >
      <svg
        viewBox="0 0 16 16"
        width={size}
        height={size}
        style={{ imageRendering: "pixelated" }}
      >
        {/* Outer ring */}
        <rect x="5" y="0" width="6" height="1" fill="#8B0000" />
        <rect x="3" y="1" width="2" height="1" fill="#8B0000" />
        <rect x="11" y="1" width="2" height="1" fill="#8B0000" />
        <rect x="2" y="2" width="1" height="1" fill="#8B0000" />
        <rect x="13" y="2" width="1" height="1" fill="#8B0000" />
        <rect x="1" y="3" width="1" height="2" fill="#8B0000" />
        <rect x="14" y="3" width="1" height="2" fill="#8B0000" />
        <rect x="0" y="5" width="1" height="6" fill="#8B0000" />
        <rect x="15" y="5" width="1" height="6" fill="#8B0000" />
        <rect x="1" y="11" width="1" height="2" fill="#8B0000" />
        <rect x="14" y="11" width="1" height="2" fill="#8B0000" />
        <rect x="2" y="13" width="1" height="1" fill="#8B0000" />
        <rect x="13" y="13" width="1" height="1" fill="#8B0000" />
        <rect x="3" y="14" width="2" height="1" fill="#8B0000" />
        <rect x="11" y="14" width="2" height="1" fill="#8B0000" />
        <rect x="5" y="15" width="6" height="1" fill="#8B0000" />
        {/* Main body */}
        <rect x="5" y="1" width="6" height="1" fill="#DC143C" />
        <rect x="3" y="2" width="10" height="1" fill="#DC143C" />
        <rect x="2" y="3" width="12" height="2" fill="#DC143C" />
        <rect x="1" y="5" width="14" height="6" fill="#DC143C" />
        <rect x="2" y="11" width="12" height="2" fill="#DC143C" />
        <rect x="3" y="13" width="10" height="1" fill="#DC143C" />
        <rect x="5" y="14" width="6" height="1" fill="#DC143C" />
        {/* Highlight */}
        <rect x="5" y="2" width="3" height="1" fill="#FF6B6B" />
        <rect x="3" y="3" width="4" height="1" fill="#FF6B6B" />
        <rect x="2" y="4" width="3" height="1" fill="#FF6B6B" />
        {/* Skull face */}
        <rect x="5" y="5" width="2" height="2" fill="#fff" />
        <rect x="9" y="5" width="2" height="2" fill="#fff" />
        <rect x="6" y="6" width="1" height="1" fill="#000" />
        <rect x="9" y="6" width="1" height="1" fill="#000" />
        <rect x="7" y="8" width="2" height="1" fill="#fff" />
        <rect x="6" y="9" width="1" height="2" fill="#fff" />
        <rect x="8" y="9" width="1" height="2" fill="#fff" />
        <rect x="10" y="9" width="1" height="2" fill="#fff" />
      </svg>
    </div>
  );
}

// =============================================================================
// FIRE PARTICLE
// =============================================================================

function FireParticle({ delay, x }: { delay: number; x: number }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${x}%`,
        bottom: 0,
        animation: `fireRise 1.5s ease-out ${delay}s infinite`,
      }}
    >
      <div
        style={{
          width: 4,
          height: 4,
          background: Math.random() > 0.5 ? "#FF4500" : "#FFA500",
          borderRadius: "50%",
          boxShadow: "0 0 4px #FF4500",
        }}
      />
    </div>
  );
}

// =============================================================================
// TRANSPARENT GLASS JAR
// =============================================================================

function GlassJar({
  fillPercent,
  isProfitable,
  coinCount,
}: {
  fillPercent: number;
  isProfitable: boolean;
  coinCount: number;
}) {
  // Generate coins inside jar based on fill
  const coinsInJar = useMemo(() => {
    const coins: Array<{ x: number; y: number; type: "uni" | "gold"; delay: number }> = [];
    const baseY = 85 - fillPercent * 0.6; // Bottom starts at 85%, fills up

    for (let i = 0; i < coinCount; i++) {
      const row = Math.floor(i / 4);
      const col = i % 4;
      coins.push({
        x: 25 + col * 14 + (row % 2) * 7, // Staggered
        y: baseY - row * 8,
        type: i % 3 === 0 ? "gold" : "uni",
        delay: i * 0.1,
      });
    }
    return coins;
  }, [fillPercent, coinCount]);

  return (
    <div className="relative w-48 h-64">
      <svg
        viewBox="0 0 100 140"
        className="w-full h-full"
        style={{
          imageRendering: "pixelated",
          filter: isProfitable
            ? "drop-shadow(0 0 20px rgba(39, 174, 96, 0.5))"
            : "drop-shadow(0 0 10px rgba(255, 0, 122, 0.3))",
        }}
      >
        {/* Back glass layer (slightly darker for depth) */}
        <rect x="18" y="95" width="64" height="8" fill="rgba(255, 0, 122, 0.15)" />
        <rect x="14" y="55" width="72" height="40" fill="rgba(255, 0, 122, 0.1)" />
        <rect x="12" y="35" width="76" height="20" fill="rgba(255, 0, 122, 0.08)" />
        <rect x="20" y="20" width="60" height="15" fill="rgba(255, 0, 122, 0.06)" />

        {/* Jar outline - Uniswap pink */}
        {/* Bottom */}
        <rect x="22" y="120" width="56" height="3" fill="#FF007A" />
        <rect x="18" y="117" width="64" height="3" fill="#FF007A" />

        {/* Left side */}
        <rect x="12" y="55" width="3" height="62" fill="#FF007A" />
        <rect x="15" y="35" width="3" height="20" fill="#FF007A" />
        <rect x="18" y="25" width="3" height="10" fill="#FF007A" />
        <rect x="25" y="18" width="3" height="7" fill="#FF007A" />

        {/* Right side */}
        <rect x="85" y="55" width="3" height="62" fill="#FF007A" />
        <rect x="82" y="35" width="3" height="20" fill="#FF007A" />
        <rect x="79" y="25" width="3" height="10" fill="#FF007A" />
        <rect x="72" y="18" width="3" height="7" fill="#FF007A" />

        {/* Neck */}
        <rect x="28" y="12" width="44" height="3" fill="#FF007A" />
        <rect x="25" y="15" width="3" height="3" fill="#FF007A" />
        <rect x="72" y="15" width="3" height="3" fill="#FF007A" />

        {/* Rim / Cork */}
        <rect x="30" y="5" width="40" height="4" fill="#8B4513" />
        <rect x="32" y="2" width="36" height="3" fill="#A0522D" />
        <rect x="34" y="9" width="32" height="3" fill="#6B3A1A" />

        {/* Glass shine marks */}
        <rect x="16" y="40" width="2" height="20" fill="#fff" opacity="0.4" />
        <rect x="18" y="60" width="2" height="15" fill="#fff" opacity="0.3" />
        <rect x="20" y="80" width="2" height="10" fill="#fff" opacity="0.2" />

        {/* Fill level indicator line */}
        {fillPercent > 0 && (
          <rect
            x="15"
            y={120 - fillPercent * 0.85}
            width="70"
            height="1"
            fill={isProfitable ? "#27AE60" : "#FF007A"}
            opacity="0.5"
          />
        )}

        {/* Glow effect when profitable */}
        {isProfitable && (
          <>
            <rect x="40" y="8" width="4" height="2" fill="#27AE60" opacity="0.8">
              <animate attributeName="opacity" values="0.4;1;0.4" dur="1s" repeatCount="indefinite" />
            </rect>
            <rect x="55" y="9" width="3" height="2" fill="#27AE60" opacity="0.6">
              <animate attributeName="opacity" values="0.6;1;0.6" dur="1.2s" repeatCount="indefinite" />
            </rect>
          </>
        )}
      </svg>

      {/* Coins INSIDE the jar */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: "12%",
          right: "12%",
          bottom: "12%",
          top: "15%",
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
            }}
          >
            {coin.type === "uni" ? (
              <UniCoin size={12} delay={coin.delay} />
            ) : (
              <GoldCoin size={12} delay={coin.delay + 0.5} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// BURN PILE (Sacrifice visualization)
// =============================================================================

function BurnPile({
  burnCost,
  jarValue,
}: {
  burnCost: number;
  jarValue: number;
}) {
  // Calculate how imposing the pile should be
  const ratio = jarValue > 0 ? burnCost / jarValue : 100;
  const pileHeight = Math.min(200, Math.max(60, ratio * 15)); // Cap at 200px
  const coinRows = Math.min(10, Math.max(3, Math.floor(ratio / 3)));

  // Generate pyramid of skull coins
  const pileCoins = useMemo(() => {
    const coins: Array<{ x: number; y: number; delay: number }> = [];
    let coinIndex = 0;

    for (let row = 0; row < coinRows; row++) {
      const coinsInRow = coinRows - row + 2;
      const startX = 50 - (coinsInRow * 8);

      for (let col = 0; col < coinsInRow; col++) {
        coins.push({
          x: startX + col * 16,
          y: 100 - row * 14,
          delay: coinIndex * 0.05,
        });
        coinIndex++;
      }
    }
    return coins;
  }, [coinRows]);

  // Fire particles
  const fireParticles = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      x: 20 + Math.random() * 60,
      delay: i * 0.2,
    }));
  }, []);

  return (
    <div
      className="relative flex flex-col items-center"
      style={{ height: pileHeight + 40 }}
    >
      {/* Label */}
      <div className="text-center mb-2">
        <div className="text-[8px] text-red-400 flex items-center justify-center gap-1">
          <svg viewBox="0 0 16 16" width="12" height="12" style={{ imageRendering: "pixelated" }}>
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
      <div
        className="relative"
        style={{
          width: Math.min(160, coinRows * 20 + 40),
          height: pileHeight,
        }}
      >
        {/* Fire particles rising */}
        {fireParticles.map((p, i) => (
          <FireParticle key={i} x={p.x} delay={p.delay} />
        ))}

        {/* Coin pile */}
        <svg
          viewBox="0 0 100 120"
          className="w-full h-full"
          style={{ imageRendering: "pixelated" }}
        >
          {/* Fire glow underneath */}
          <ellipse
            cx="50"
            cy="115"
            rx="45"
            ry="8"
            fill="#FF4500"
            opacity="0.3"
          >
            <animate
              attributeName="opacity"
              values="0.2;0.4;0.2"
              dur="0.5s"
              repeatCount="indefinite"
            />
          </ellipse>
        </svg>

        {/* Skull coins */}
        <div className="absolute inset-0">
          {pileCoins.map((coin, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${coin.x}%`,
                top: `${coin.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <SkullCoin size={14} delay={coin.delay} />
            </div>
          ))}
        </div>
      </div>

      {/* Value */}
      <div className="text-red-400 text-sm font-bold mt-2">
        ${burnCost.toLocaleString()}
      </div>
    </div>
  );
}

// =============================================================================
// COMPARISON BAR
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

  return (
    <div className="w-full">
      <div className="flex h-6 rounded overflow-hidden border-2 border-gray-700">
        {/* Burn segment */}
        <div
          className="flex items-center justify-center text-[8px] text-white font-bold"
          style={{
            width: `${burnPercent}%`,
            background: "linear-gradient(180deg, #DC143C 0%, #8B0000 100%)",
            minWidth: burnPercent > 5 ? "auto" : "20px",
          }}
        >
          {burnPercent > 15 && `${burnPercent.toFixed(0)}%`}
        </div>
        {/* Jar segment */}
        <div
          className="flex items-center justify-center text-[8px] text-white font-bold"
          style={{
            width: `${jarPercent}%`,
            background: jarPercent > burnPercent
              ? "linear-gradient(180deg, #27AE60 0%, #1a7a42 100%)"
              : "linear-gradient(180deg, #FFD700 0%, #b8860b 100%)",
            minWidth: jarPercent > 5 ? "auto" : "20px",
          }}
        >
          {jarPercent > 15 && `${jarPercent.toFixed(0)}%`}
        </div>
      </div>
      <div className="flex justify-between text-[8px] mt-1">
        <span className="text-red-400">BURN COST</span>
        <span className="text-yellow-400">JAR VALUE</span>
      </div>
    </div>
  );
}

// =============================================================================
// ARROW INDICATOR
// =============================================================================

function BurnArrow() {
  return (
    <div className="flex flex-col items-center justify-center px-2">
      <div className="text-[8px] text-gray-500 mb-1">BURN TO</div>
      <svg
        viewBox="0 0 40 20"
        width="50"
        height="25"
        style={{ imageRendering: "pixelated" }}
      >
        {/* Arrow shaft */}
        <rect x="0" y="8" width="28" height="4" fill="#FF007A" />
        {/* Arrow head */}
        <rect x="28" y="4" width="4" height="12" fill="#FF007A" />
        <rect x="32" y="6" width="4" height="8" fill="#FF007A" />
        <rect x="36" y="8" width="4" height="4" fill="#FF007A" />
      </svg>
      <div className="text-[8px] text-gray-500 mt-1">CLAIM</div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function PixelJar({
  tokens,
  totalValue,
  burnCost,
  isProfitable,
}: PixelJarProps) {
  // Calculate fill level (0-100)
  const maxDisplayValue = 50000; // $50K = 100% full
  const fillPercent = Math.min((totalValue / maxDisplayValue) * 100, 100);

  // Calculate how many coins to show in jar
  const coinCount = Math.min(20, Math.max(1, Math.floor(totalValue / 100)));

  return (
    <div className="w-full">
      {/* Main visualization - Side by side */}
      <div className="flex items-end justify-center gap-2 md:gap-4 mb-4">
        {/* Burn pile (left) */}
        <div className="flex-shrink-0">
          <BurnPile burnCost={burnCost} jarValue={totalValue} />
        </div>

        {/* Arrow */}
        <BurnArrow />

        {/* Glass jar (right) */}
        <div className="flex flex-col items-center flex-shrink-0">
          <div className="text-[8px] text-gray-400 mb-1 flex items-center gap-1">
            <span>~</span>
            <span>VAULT</span>
            <span>~</span>
          </div>
          <GlassJar
            fillPercent={fillPercent}
            isProfitable={isProfitable}
            coinCount={coinCount}
          />
          <div
            className={`text-sm font-bold mt-1 ${
              isProfitable ? "text-green-400" : "text-yellow-400"
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
