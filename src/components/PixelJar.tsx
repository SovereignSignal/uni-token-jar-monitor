"use client";

import { useMemo } from "react";

// Token color mapping for pixel coins
const TOKEN_COLORS: Record<string, { primary: string; secondary: string; symbol: string }> = {
  WETH: { primary: "#627eea", secondary: "#3c3c3d", symbol: "E" },
  USDC: { primary: "#2775ca", secondary: "#1a5298", symbol: "$" },
  USDT: { primary: "#26a17b", secondary: "#1a7a5a", symbol: "T" },
  WBTC: { primary: "#f7931a", secondary: "#c77a14", symbol: "B" },
  DAI: { primary: "#f5ac37", secondary: "#c78a2a", symbol: "D" },
  UNI: { primary: "#ff007a", secondary: "#cc0062", symbol: "U" },
  LINK: { primary: "#2a5ada", secondary: "#1e4299", symbol: "L" },
  AAVE: { primary: "#b6509e", secondary: "#8a3d77", symbol: "A" },
  DEFAULT: { primary: "#feb236", secondary: "#cc8f2b", symbol: "?" },
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
}

function PixelCoin({ symbol, size, x, y, delay }: CoinProps) {
  const colors = TOKEN_COLORS[symbol] || TOKEN_COLORS.DEFAULT;
  const coinSize = Math.max(16, Math.min(48, size));

  return (
    <div
      className="absolute coin-float"
      style={{
        left: `${x}%`,
        bottom: `${y}%`,
        animationDelay: `${delay}s`,
        width: coinSize,
        height: coinSize,
      }}
    >
      {/* Pixel coin SVG */}
      <svg
        viewBox="0 0 16 16"
        width={coinSize}
        height={coinSize}
        style={{ imageRendering: "pixelated" }}
      >
        {/* Coin body */}
        <rect x="4" y="1" width="8" height="1" fill={colors.primary} />
        <rect x="2" y="2" width="12" height="1" fill={colors.primary} />
        <rect x="1" y="3" width="14" height="1" fill={colors.primary} />
        <rect x="1" y="4" width="14" height="8" fill={colors.primary} />
        <rect x="1" y="12" width="14" height="1" fill={colors.secondary} />
        <rect x="2" y="13" width="12" height="1" fill={colors.secondary} />
        <rect x="4" y="14" width="8" height="1" fill={colors.secondary} />

        {/* Shine effect */}
        <rect x="3" y="4" width="2" height="1" fill="rgba(255,255,255,0.5)" />
        <rect x="2" y="5" width="1" height="2" fill="rgba(255,255,255,0.3)" />

        {/* Symbol */}
        <text
          x="8"
          y="10"
          textAnchor="middle"
          fontSize="6"
          fontFamily="'Press Start 2P', monospace"
          fill="#fff"
          style={{ textShadow: "1px 1px 0 rgba(0,0,0,0.5)" }}
        >
          {colors.symbol}
        </text>
      </svg>
    </div>
  );
}

export default function PixelJar({ tokens, totalValue, isProfitable }: PixelJarProps) {
  // Calculate coin positions and sizes based on token values
  const coins = useMemo(() => {
    if (!tokens || tokens.length === 0 || totalValue === 0) return [];

    // Filter tokens with value and sort by value
    const validTokens = tokens
      .filter((t) => t.valueUsd && t.valueUsd > 0)
      .sort((a, b) => (b.valueUsd || 0) - (a.valueUsd || 0))
      .slice(0, 12); // Max 12 coins for performance

    // Generate coin positions - stack them like real coins in a jar
    const coinData: CoinProps[] = [];
    let currentY = 5;
    let row = 0;

    validTokens.forEach((token, index) => {
      const proportion = (token.valueUsd || 0) / totalValue;
      // Size: 16-48px based on proportion
      const size = 16 + proportion * 80;

      // Position coins in a stacked pattern
      const coinsPerRow = 3;
      const col = index % coinsPerRow;

      if (index > 0 && col === 0) {
        row++;
        currentY += 12;
      }

      // Add some randomness for natural look
      const xBase = 20 + col * 25;
      const xOffset = (Math.random() - 0.5) * 10;
      const yOffset = (Math.random() - 0.5) * 5;

      coinData.push({
        symbol: token.symbol,
        size,
        x: xBase + xOffset,
        y: currentY + yOffset + row * 2,
        delay: index * 0.15,
      });
    });

    return coinData;
  }, [tokens, totalValue]);

  // Calculate fill level based on profitability
  const fillLevel = Math.min(85, Math.max(15, (totalValue / 50000) * 100));

  return (
    <div className="relative w-64 h-80 mx-auto">
      {/* Jar SVG */}
      <svg
        viewBox="0 0 200 260"
        className="w-full h-full"
        style={{ imageRendering: "pixelated" }}
      >
        {/* Jar lid */}
        <rect x="50" y="5" width="100" height="8" fill="#8b7355" />
        <rect x="45" y="13" width="110" height="4" fill="#a08060" />
        <rect x="50" y="5" width="100" height="2" fill="#c0a080" />

        {/* Lid shine */}
        <rect x="55" y="7" width="30" height="2" fill="rgba(255,255,255,0.3)" />

        {/* Jar neck */}
        <rect x="55" y="17" width="90" height="15" fill="rgba(135,206,235,0.25)" />
        <rect x="55" y="17" width="4" height="15" fill="rgba(255,255,255,0.2)" />

        {/* Jar body */}
        <path
          d="M 45 32
             Q 30 50 25 100
             Q 20 180 35 220
             Q 50 245 100 250
             Q 150 245 165 220
             Q 180 180 175 100
             Q 170 50 155 32
             Z"
          fill="rgba(135,206,235,0.2)"
          stroke="rgba(135,206,235,0.4)"
          strokeWidth="3"
        />

        {/* Glass shine effect */}
        <path
          d="M 50 40
             Q 40 60 38 100
             Q 35 150 40 180"
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Inner liquid/coins background */}
        <path
          d={`M 45 ${250 - fillLevel * 2}
              Q 35 ${250 - fillLevel * 1.5} 40 230
              Q 50 245 100 248
              Q 150 245 160 230
              Q 165 ${250 - fillLevel * 1.5} 155 ${250 - fillLevel * 2}
              Q 130 ${245 - fillLevel * 2} 100 ${245 - fillLevel * 2}
              Q 70 ${245 - fillLevel * 2} 45 ${250 - fillLevel * 2}
              Z`}
          fill={isProfitable ? "rgba(136,212,152,0.3)" : "rgba(233,79,55,0.3)"}
        />

        {/* Sparkles when profitable */}
        {isProfitable && (
          <>
            <circle cx="60" cy="100" r="3" fill="#fff" opacity="0.8">
              <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="140" cy="80" r="2" fill="#fff" opacity="0.6">
              <animate attributeName="opacity" values="0;1;0" dur="1.5s" repeatCount="indefinite" begin="0.5s" />
            </circle>
            <circle cx="100" cy="60" r="2" fill="#fff" opacity="0.7">
              <animate attributeName="opacity" values="0;1;0" dur="1.8s" repeatCount="indefinite" begin="0.3s" />
            </circle>
          </>
        )}
      </svg>

      {/* Coins container - positioned inside the jar */}
      <div
        className="absolute"
        style={{
          left: "15%",
          right: "15%",
          bottom: "8%",
          height: "65%",
          overflow: "hidden",
        }}
      >
        {coins.map((coin, index) => (
          <PixelCoin key={`${coin.symbol}-${index}`} {...coin} />
        ))}
      </div>

      {/* Label on jar */}
      <div
        className="absolute left-1/2 -translate-x-1/2 text-center"
        style={{ bottom: "3%" }}
      >
        <div
          className="px-2 py-1 text-[8px] tracking-wider"
          style={{
            background: "rgba(139,115,85,0.9)",
            border: "2px solid #6b5540",
            color: "#fff",
            textShadow: "1px 1px 0 #000",
          }}
        >
          TOKEN JAR
        </div>
      </div>
    </div>
  );
}
