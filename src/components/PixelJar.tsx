"use client";

import { useMemo } from "react";

// Token color mapping - using classic 16-bit palette colors
const TOKEN_COLORS: Record<string, { gold: string; dark: string; light: string }> = {
  WETH: { gold: "#6888ff", dark: "#3850b8", light: "#98b8ff" },    // Blue rupee style
  USDC: { gold: "#58d858", dark: "#208020", light: "#98f898" },    // Green rupee style
  USDT: { gold: "#58d858", dark: "#208020", light: "#98f898" },    // Green rupee style
  WBTC: { gold: "#f8a800", dark: "#b86800", light: "#f8d878" },    // Orange/gold
  DAI: { gold: "#f8d800", dark: "#b89800", light: "#f8f878" },     // Yellow
  UNI: { gold: "#f858a8", dark: "#b82068", light: "#f8a8d8" },     // Pink
  LINK: { gold: "#5878d8", dark: "#2040a0", light: "#98b8f8" },    // Blue
  DEFAULT: { gold: "#f8d800", dark: "#b89800", light: "#f8f878" }, // Classic gold coin
};

interface TokenData {
  symbol: string;
  valueUsd: number | null;
}

interface PixelJarProps {
  tokens: TokenData[];
  totalValue: number;
  isProfitable: boolean;
}

interface CoinProps {
  symbol: string;
  size: number;
  x: number;
  y: number;
  delay: number;
  spinSpeed: number;
}

// Classic Mario/Zelda style spinning coin
function PixelCoin({ symbol, size, x, y, delay, spinSpeed }: CoinProps) {
  const colors = TOKEN_COLORS[symbol] || TOKEN_COLORS.DEFAULT;
  const coinSize = Math.max(20, Math.min(40, size));

  return (
    <div
      className="absolute"
      style={{
        left: `${x}%`,
        bottom: `${y}%`,
        width: coinSize,
        height: coinSize,
        animationDelay: `${delay}s`,
      }}
    >
      <div
        className="coin-spin"
        style={{
          width: "100%",
          height: "100%",
          animationDuration: `${spinSpeed}s`,
        }}
      >
        {/* 16-bit style coin - like Mario/Zelda gold coin */}
        <svg
          viewBox="0 0 16 16"
          width={coinSize}
          height={coinSize}
          style={{ imageRendering: "pixelated" }}
        >
          {/* Outer edge - dark */}
          <rect x="5" y="0" width="6" height="1" fill={colors.dark} />
          <rect x="3" y="1" width="2" height="1" fill={colors.dark} />
          <rect x="11" y="1" width="2" height="1" fill={colors.dark} />
          <rect x="2" y="2" width="1" height="1" fill={colors.dark} />
          <rect x="13" y="2" width="1" height="1" fill={colors.dark} />
          <rect x="1" y="3" width="1" height="2" fill={colors.dark} />
          <rect x="14" y="3" width="1" height="2" fill={colors.dark} />
          <rect x="0" y="5" width="1" height="6" fill={colors.dark} />
          <rect x="15" y="5" width="1" height="6" fill={colors.dark} />
          <rect x="1" y="11" width="1" height="2" fill={colors.dark} />
          <rect x="14" y="11" width="1" height="2" fill={colors.dark} />
          <rect x="2" y="13" width="1" height="1" fill={colors.dark} />
          <rect x="13" y="13" width="1" height="1" fill={colors.dark} />
          <rect x="3" y="14" width="2" height="1" fill={colors.dark} />
          <rect x="11" y="14" width="2" height="1" fill={colors.dark} />
          <rect x="5" y="15" width="6" height="1" fill={colors.dark} />

          {/* Main coin body - gold */}
          <rect x="5" y="1" width="6" height="1" fill={colors.gold} />
          <rect x="3" y="2" width="10" height="1" fill={colors.gold} />
          <rect x="2" y="3" width="12" height="2" fill={colors.gold} />
          <rect x="1" y="5" width="14" height="6" fill={colors.gold} />
          <rect x="2" y="11" width="12" height="2" fill={colors.gold} />
          <rect x="3" y="13" width="10" height="1" fill={colors.gold} />
          <rect x="5" y="14" width="6" height="1" fill={colors.gold} />

          {/* Highlight - top left shine */}
          <rect x="5" y="2" width="3" height="1" fill={colors.light} />
          <rect x="3" y="3" width="2" height="1" fill={colors.light} />
          <rect x="4" y="3" width="4" height="1" fill={colors.light} />
          <rect x="2" y="4" width="2" height="1" fill={colors.light} />
          <rect x="2" y="5" width="1" height="2" fill={colors.light} />
          <rect x="3" y="5" width="1" height="1" fill={colors.light} />

          {/* Inner shadow - bottom right */}
          <rect x="12" y="10" width="2" height="1" fill={colors.dark} opacity="0.4" />
          <rect x="13" y="9" width="1" height="1" fill={colors.dark} opacity="0.3" />
          <rect x="11" y="11" width="2" height="1" fill={colors.dark} opacity="0.4" />
          <rect x="9" y="12" width="3" height="1" fill={colors.dark} opacity="0.3" />
        </svg>
      </div>
    </div>
  );
}

// Zelda-style pottery jar - the classic breakable pot
function ZeldaJar({ isProfitable, fillPercent }: { isProfitable: boolean; fillPercent: number }) {
  return (
    <svg
      viewBox="0 0 64 80"
      className="w-full h-full"
      style={{ imageRendering: "pixelated" }}
    >
      {/* Jar base shadow */}
      <ellipse cx="32" cy="76" rx="20" ry="4" fill="#1a1a2e" opacity="0.5" />

      {/* Main jar body - classic Zelda pot colors */}
      {/* Bottom */}
      <rect x="16" y="68" width="32" height="4" fill="#8b5a2b" />
      <rect x="14" y="64" width="36" height="4" fill="#a0522d" />
      <rect x="12" y="56" width="40" height="8" fill="#a0522d" />

      {/* Middle bulge */}
      <rect x="10" y="40" width="44" height="16" fill="#cd853f" />
      <rect x="8" y="32" width="48" height="8" fill="#daa520" />
      <rect x="10" y="24" width="44" height="8" fill="#cd853f" />

      {/* Neck */}
      <rect x="16" y="16" width="32" height="8" fill="#a0522d" />
      <rect x="20" y="12" width="24" height="4" fill="#8b5a2b" />

      {/* Rim */}
      <rect x="18" y="8" width="28" height="4" fill="#daa520" />
      <rect x="16" y="6" width="32" height="2" fill="#f4a460" />

      {/* Left side highlight */}
      <rect x="10" y="32" width="2" height="24" fill="#f4a460" />
      <rect x="12" y="28" width="2" height="4" fill="#f4a460" />
      <rect x="14" y="24" width="2" height="4" fill="#f4a460" />
      <rect x="12" y="56" width="2" height="8" fill="#cd853f" />

      {/* Right side shadow */}
      <rect x="52" y="32" width="2" height="24" fill="#8b4513" />
      <rect x="50" y="28" width="2" height="4" fill="#8b4513" />
      <rect x="48" y="24" width="2" height="4" fill="#8b4513" />
      <rect x="50" y="56" width="2" height="12" fill="#6b3a1a" />

      {/* Decorative band */}
      <rect x="10" y="44" width="44" height="2" fill="#f4a460" />
      <rect x="10" y="48" width="44" height="2" fill="#8b4513" />

      {/* Inner opening (dark) */}
      <rect x="22" y="10" width="20" height="2" fill="#2a1a0a" />
      <rect x="20" y="12" width="24" height="2" fill="#1a0a00" />

      {/* Coins peeking out when filled */}
      {fillPercent > 30 && (
        <>
          <rect x="24" y="11" width="4" height="2" fill="#f8d800" />
          <rect x="30" y="10" width="3" height="2" fill="#f8d800" />
          <rect x="35" y="11" width="4" height="2" fill="#f8d800" />
        </>
      )}

      {/* Glow effect when profitable */}
      {isProfitable && (
        <>
          <rect x="26" y="9" width="2" height="1" fill="#fff" opacity="0.8">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="1s" repeatCount="indefinite" />
          </rect>
          <rect x="36" y="9" width="2" height="1" fill="#fff" opacity="0.6">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="1.2s" repeatCount="indefinite" />
          </rect>
        </>
      )}

      {/* Zelda-style pattern/symbol on jar */}
      <rect x="28" y="36" width="8" height="8" fill="#8b4513" />
      <rect x="30" y="38" width="4" height="4" fill="#daa520" />
      <rect x="31" y="39" width="2" height="2" fill="#f4a460" />
    </svg>
  );
}

export default function PixelJar({ tokens, totalValue, isProfitable }: PixelJarProps) {
  // Calculate coin positions and sizes based on token values
  const coins = useMemo(() => {
    if (!tokens || tokens.length === 0 || totalValue === 0) return [];

    const validTokens = tokens
      .filter((t) => t.valueUsd && t.valueUsd > 0)
      .sort((a, b) => (b.valueUsd || 0) - (a.valueUsd || 0))
      .slice(0, 15);

    const coinData: CoinProps[] = [];

    validTokens.forEach((token, index) => {
      const proportion = (token.valueUsd || 0) / totalValue;
      const size = 20 + proportion * 40;

      // Scatter coins around the jar area
      const angle = (index / validTokens.length) * Math.PI * 2;
      const radius = 25 + (index % 3) * 10;
      const xBase = 50 + Math.cos(angle) * radius * 0.6;
      const yBase = 20 + (index % 4) * 15 + Math.sin(angle) * 5;

      coinData.push({
        symbol: token.symbol,
        size,
        x: xBase + (Math.random() - 0.5) * 15,
        y: yBase + (Math.random() - 0.5) * 8,
        delay: index * 0.2,
        spinSpeed: 0.8 + Math.random() * 0.4,
      });
    });

    return coinData;
  }, [tokens, totalValue]);

  const fillPercent = Math.min(100, Math.max(0, (totalValue / 30000) * 100));

  return (
    <div className="relative w-48 h-64 mx-auto">
      {/* Floating coins around the jar */}
      <div className="absolute inset-0 z-10">
        {coins.map((coin, index) => (
          <PixelCoin key={`${coin.symbol}-${index}`} {...coin} />
        ))}
      </div>

      {/* The Zelda-style jar */}
      <div className="absolute inset-0 flex items-center justify-center z-0">
        <div className="w-32 h-48">
          <ZeldaJar isProfitable={isProfitable} fillPercent={fillPercent} />
        </div>
      </div>

      {/* Sparkle effects when profitable */}
      {isProfitable && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="sparkle sparkle-1" />
          <div className="sparkle sparkle-2" />
          <div className="sparkle sparkle-3" />
          <div className="sparkle sparkle-4" />
        </div>
      )}
    </div>
  );
}
