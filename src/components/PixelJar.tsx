"use client";

import { useMemo, useEffect, useState } from "react";

// Token color mapping - using classic 16-bit palette colors
const TOKEN_COLORS: Record<string, { gold: string; dark: string; light: string }> = {
  WETH: { gold: "#6888ff", dark: "#3850b8", light: "#98b8ff" },
  USDC: { gold: "#58d858", dark: "#208020", light: "#98f898" },
  USDT: { gold: "#58d858", dark: "#208020", light: "#98f898" },
  WBTC: { gold: "#f8a800", dark: "#b86800", light: "#f8d878" },
  DAI: { gold: "#f8d800", dark: "#b89800", light: "#f8f878" },
  UNI: { gold: "#f858a8", dark: "#b82068", light: "#f8a8d8" },
  LINK: { gold: "#5878d8", dark: "#2040a0", light: "#98b8f8" },
  DEFAULT: { gold: "#f8d800", dark: "#b89800", light: "#f8f878" },
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

// Zelda-style Rupee gem
function PixelRupee({ color, size, style, className }: {
  color: { fill: string; dark: string; light: string };
  size: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 8 16"
      width={size}
      height={size * 2}
      style={{ imageRendering: "pixelated", ...style }}
      className={className}
    >
      {/* Diamond/rupee shape */}
      <rect x="3" y="0" width="2" height="1" fill={color.light} />
      <rect x="2" y="1" width="4" height="1" fill={color.light} />
      <rect x="1" y="2" width="2" height="1" fill={color.light} />
      <rect x="3" y="2" width="3" height="1" fill={color.fill} />
      <rect x="0" y="3" width="2" height="1" fill={color.light} />
      <rect x="2" y="3" width="4" height="1" fill={color.fill} />
      <rect x="6" y="3" width="2" height="1" fill={color.dark} />
      <rect x="0" y="4" width="1" height="4" fill={color.light} />
      <rect x="1" y="4" width="2" height="4" fill={color.fill} />
      <rect x="3" y="4" width="2" height="4" fill={color.fill} />
      <rect x="5" y="4" width="2" height="4" fill={color.dark} />
      <rect x="7" y="4" width="1" height="4" fill={color.dark} />
      <rect x="0" y="8" width="2" height="1" fill={color.fill} />
      <rect x="2" y="8" width="4" height="1" fill={color.fill} />
      <rect x="6" y="8" width="2" height="1" fill={color.dark} />
      <rect x="1" y="9" width="2" height="1" fill={color.fill} />
      <rect x="3" y="9" width="3" height="1" fill={color.dark} />
      <rect x="2" y="10" width="4" height="1" fill={color.dark} />
      <rect x="3" y="11" width="2" height="1" fill={color.dark} />
    </svg>
  );
}

// Classic Mario spinning coin
function SpinningCoin({ symbol, size, delay }: { symbol: string; size: number; delay: number }) {
  const colors = TOKEN_COLORS[symbol] || TOKEN_COLORS.DEFAULT;

  return (
    <div
      className="coin-spin"
      style={{
        animationDelay: `${delay}s`,
        width: size,
        height: size,
      }}
    >
      <svg
        viewBox="0 0 16 16"
        width={size}
        height={size}
        style={{ imageRendering: "pixelated" }}
      >
        <rect x="5" y="0" width="6" height="1" fill={colors.dark} />
        <rect x="3" y="1" width="2" height="1" fill={colors.dark} />
        <rect x="5" y="1" width="6" height="1" fill={colors.gold} />
        <rect x="11" y="1" width="2" height="1" fill={colors.dark} />
        <rect x="2" y="2" width="1" height="1" fill={colors.dark} />
        <rect x="3" y="2" width="10" height="1" fill={colors.gold} />
        <rect x="13" y="2" width="1" height="1" fill={colors.dark} />
        <rect x="1" y="3" width="1" height="2" fill={colors.dark} />
        <rect x="2" y="3" width="3" height="2" fill={colors.light} />
        <rect x="5" y="3" width="7" height="2" fill={colors.gold} />
        <rect x="12" y="3" width="2" height="2" fill={colors.dark} />
        <rect x="14" y="3" width="1" height="2" fill={colors.dark} />
        <rect x="0" y="5" width="1" height="6" fill={colors.dark} />
        <rect x="1" y="5" width="2" height="6" fill={colors.light} />
        <rect x="3" y="5" width="10" height="6" fill={colors.gold} />
        <rect x="13" y="5" width="2" height="6" fill={colors.dark} />
        <rect x="15" y="5" width="1" height="6" fill={colors.dark} />
        <rect x="1" y="11" width="1" height="2" fill={colors.dark} />
        <rect x="2" y="11" width="12" height="2" fill={colors.gold} />
        <rect x="14" y="11" width="1" height="2" fill={colors.dark} />
        <rect x="2" y="13" width="1" height="1" fill={colors.dark} />
        <rect x="3" y="13" width="10" height="1" fill={colors.gold} />
        <rect x="13" y="13" width="1" height="1" fill={colors.dark} />
        <rect x="3" y="14" width="2" height="1" fill={colors.dark} />
        <rect x="5" y="14" width="6" height="1" fill={colors.gold} />
        <rect x="11" y="14" width="2" height="1" fill={colors.dark} />
        <rect x="5" y="15" width="6" height="1" fill={colors.dark} />
      </svg>
    </div>
  );
}

// Floating particle
function FloatingParticle({ delay, x }: { delay: number; x: number }) {
  return (
    <div
      className="particle-float"
      style={{
        position: "absolute",
        left: `${x}%`,
        bottom: "10%",
        animationDelay: `${delay}s`,
      }}
    >
      <div
        style={{
          width: 4,
          height: 4,
          background: "#f8d800",
          boxShadow: "0 0 8px #f8d800",
        }}
      />
    </div>
  );
}

// Zelda-style detailed pottery jar
function ZeldaJar({ isProfitable, fillPercent, jarValue }: {
  isProfitable: boolean;
  fillPercent: number;
  jarValue: number;
}) {
  const [shimmer, setShimmer] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setShimmer(s => (s + 1) % 3);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Calculate how many coins to show inside based on value
  const coinsInside = Math.min(5, Math.max(0, Math.floor(jarValue / 200)));

  return (
    <div className="relative">
      <svg
        viewBox="0 0 80 100"
        className="w-full h-full drop-shadow-lg"
        style={{ imageRendering: "pixelated", filter: isProfitable ? "drop-shadow(0 0 20px #58d858)" : "drop-shadow(0 0 10px #f8a800)" }}
      >
        {/* Jar base shadow */}
        <ellipse cx="40" cy="96" rx="24" ry="4" fill="#0a0a15" opacity="0.6" />

        {/* Main jar body */}
        {/* Bottom base */}
        <rect x="20" y="85" width="40" height="6" fill="#8b5a2b" />
        <rect x="18" y="80" width="44" height="5" fill="#a0522d" />

        {/* Lower body */}
        <rect x="14" y="65" width="52" height="15" fill="#a0522d" />

        {/* Middle bulge - widest part */}
        <rect x="10" y="45" width="60" height="20" fill="#cd853f" />
        <rect x="8" y="35" width="64" height="10" fill="#daa520" />

        {/* Upper body */}
        <rect x="12" y="28" width="56" height="7" fill="#cd853f" />

        {/* Neck */}
        <rect x="20" y="18" width="40" height="10" fill="#a0522d" />
        <rect x="24" y="14" width="32" height="4" fill="#8b5a2b" />

        {/* Rim/lip */}
        <rect x="22" y="10" width="36" height="4" fill="#daa520" />
        <rect x="20" y="7" width="40" height="3" fill="#f4a460" />

        {/* Left highlight */}
        <rect x="10" y="35" width="3" height="30" fill="#f4a460" />
        <rect x="13" y="30" width="3" height="5" fill="#f4a460" />
        <rect x="15" y="25" width="3" height="5" fill="#f4a460" />
        <rect x="14" y="65" width="3" height="15" fill="#cd853f" />

        {/* Right shadow */}
        <rect x="67" y="35" width="3" height="30" fill="#8b4513" />
        <rect x="64" y="30" width="3" height="5" fill="#8b4513" />
        <rect x="62" y="25" width="3" height="5" fill="#8b4513" />
        <rect x="63" y="65" width="3" height="20" fill="#6b3a1a" />

        {/* Decorative bands */}
        <rect x="10" y="52" width="60" height="3" fill="#f4a460" />
        <rect x="10" y="56" width="60" height="2" fill="#8b4513" />

        {/* Zelda triforce-style decoration */}
        <rect x="36" y="40" width="8" height="8" fill="#8b4513" />
        <rect x="38" y="42" width="4" height="4" fill="#daa520" />
        <rect x="39" y="43" width="2" height="2" fill="#f4a460" />

        {/* Inner opening (dark) */}
        <rect x="26" y="12" width="28" height="3" fill="#1a0a00" />
        <rect x="24" y="15" width="32" height="3" fill="#0a0500" />

        {/* Coins inside jar */}
        {coinsInside > 0 && (
          <>
            <rect x="30" y="13" width="6" height="3" fill="#f8d800" />
            <rect x="38" y="12" width="5" height="3" fill="#f8d800" />
            {coinsInside > 1 && <rect x="44" y="13" width="5" height="2" fill="#f8a800" />}
            {coinsInside > 2 && <rect x="28" y="14" width="4" height="2" fill="#f8d800" />}
            {coinsInside > 3 && <rect x="46" y="12" width="4" height="2" fill="#daa520" />}
          </>
        )}

        {/* Animated shine/glint */}
        {shimmer === 0 && (
          <rect x="14" y="38" width="2" height="4" fill="#fff" opacity="0.8" />
        )}
        {shimmer === 1 && (
          <rect x="16" y="45" width="2" height="4" fill="#fff" opacity="0.6" />
        )}
        {shimmer === 2 && (
          <rect x="12" y="50" width="2" height="3" fill="#fff" opacity="0.7" />
        )}

        {/* Glow effect when profitable */}
        {isProfitable && (
          <>
            <rect x="32" y="10" width="3" height="2" fill="#fff" opacity="0.9">
              <animate attributeName="opacity" values="0.5;1;0.5" dur="0.8s" repeatCount="indefinite" />
            </rect>
            <rect x="42" y="9" width="3" height="2" fill="#fff" opacity="0.7">
              <animate attributeName="opacity" values="0.7;1;0.7" dur="1s" repeatCount="indefinite" />
            </rect>
            <rect x="37" y="8" width="2" height="2" fill="#58d858" opacity="0.8">
              <animate attributeName="opacity" values="0.4;1;0.4" dur="0.6s" repeatCount="indefinite" />
            </rect>
          </>
        )}
      </svg>
    </div>
  );
}

// Background stars
function PixelStars() {
  const stars = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() > 0.7 ? 3 : 2,
      delay: Math.random() * 3,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map(star => (
        <div
          key={star.id}
          className="star-twinkle absolute"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            background: "#fff",
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

// Bouncing coins around the jar
function BouncingCoins({ tokens, totalValue }: { tokens: TokenData[]; totalValue: number }) {
  const coins = useMemo(() => {
    const validTokens = tokens
      .filter(t => t.valueUsd && t.valueUsd > 0)
      .slice(0, 8);

    // Always show some coins for visual interest
    const minCoins = 3;
    const coinCount = Math.max(minCoins, validTokens.length);

    return Array.from({ length: coinCount }, (_, i) => {
      const token = validTokens[i % validTokens.length] || { symbol: "DEFAULT", valueUsd: 100 };
      const angle = (i / coinCount) * Math.PI * 2;
      const radius = 35 + (i % 3) * 8;

      return {
        id: i,
        symbol: token.symbol || "DEFAULT",
        x: 50 + Math.cos(angle) * radius,
        y: 30 + Math.sin(angle) * 15 + (i % 4) * 8,
        size: 20 + Math.min(10, ((token.valueUsd || 100) / totalValue) * 30),
        delay: i * 0.15,
        bounceDelay: i * 0.3,
      };
    });
  }, [tokens, totalValue]);

  return (
    <>
      {coins.map(coin => (
        <div
          key={coin.id}
          className="absolute coin-bounce"
          style={{
            left: `${coin.x}%`,
            top: `${coin.y}%`,
            transform: "translate(-50%, -50%)",
            animationDelay: `${coin.bounceDelay}s`,
            zIndex: 10,
          }}
        >
          <SpinningCoin symbol={coin.symbol} size={coin.size} delay={coin.delay} />
        </div>
      ))}
    </>
  );
}

// Rupees falling animation
function FallingRupees() {
  const [rupees, setRupees] = useState<Array<{ id: number; x: number; color: number; delay: number }>>([]);

  useEffect(() => {
    setRupees(
      Array.from({ length: 6 }, (_, i) => ({
        id: i,
        x: 15 + Math.random() * 70,
        color: Math.floor(Math.random() * 5),
        delay: i * 0.8,
      }))
    );
  }, []);

  const colors = [
    { fill: "#58d858", dark: "#208020", light: "#98f898" },
    { fill: "#5878d8", dark: "#2040a0", light: "#98b8f8" },
    { fill: "#d85858", dark: "#a02020", light: "#f89898" },
    { fill: "#d858d8", dark: "#a020a0", light: "#f898f8" },
    { fill: "#f8d800", dark: "#b89800", light: "#f8f878" },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {rupees.map(rupee => (
        <div
          key={rupee.id}
          className="rupee-fall absolute"
          style={{
            left: `${rupee.x}%`,
            top: "-20px",
            animationDelay: `${rupee.delay}s`,
          }}
        >
          <PixelRupee color={colors[rupee.color]} size={10} />
        </div>
      ))}
    </div>
  );
}

export default function PixelJar({ tokens, totalValue, isProfitable }: PixelJarProps) {
  const fillPercent = Math.min(100, Math.max(0, (totalValue / 30000) * 100));

  return (
    <div className="relative w-full h-80 mx-auto">
      {/* Background stars */}
      <PixelStars />

      {/* Falling rupees */}
      <FallingRupees />

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <FloatingParticle key={i} delay={i * 0.6} x={20 + i * 15} />
        ))}
      </div>

      {/* Bouncing coins */}
      <BouncingCoins tokens={tokens} totalValue={totalValue} />

      {/* The Zelda-style jar - centered */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-44 z-20">
        <ZeldaJar isProfitable={isProfitable} fillPercent={fillPercent} jarValue={totalValue} />
      </div>

      {/* Sparkle effects when profitable */}
      {isProfitable && (
        <div className="absolute inset-0 pointer-events-none z-30">
          <div className="sparkle sparkle-1" />
          <div className="sparkle sparkle-2" />
          <div className="sparkle sparkle-3" />
          <div className="sparkle sparkle-4" />
        </div>
      )}

      {/* Value indicator */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center z-30">
        <div className="text-[8px] text-gray-500 pixel-text">JAR TOTAL</div>
        <div
          className={`text-sm font-bold ${isProfitable ? 'text-green-400' : 'text-yellow-400'}`}
          style={{ textShadow: isProfitable ? '0 0 10px #58d858' : '0 0 10px #f8a800' }}
        >
          ${totalValue.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
