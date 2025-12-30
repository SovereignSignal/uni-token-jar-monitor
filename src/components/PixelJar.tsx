"use client";

import { useMemo, useEffect, useState } from "react";

// Uniswap-themed token colors
const TOKEN_COLORS: Record<string, { gold: string; dark: string; light: string }> = {
  WETH: { gold: "#627eea", dark: "#3850b8", light: "#98b8ff" },
  USDC: { gold: "#2775ca", dark: "#1a5090", light: "#5a9fea" },
  USDT: { gold: "#26a17b", dark: "#1a705a", light: "#5ad1ab" },
  WBTC: { gold: "#f7931a", dark: "#b86800", light: "#f8d878" },
  DAI: { gold: "#f5ac37", dark: "#b87800", light: "#f8d878" },
  UNI: { gold: "#FF007A", dark: "#c7005f", light: "#ff5fa2" },
  LINK: { gold: "#2a5ada", dark: "#1a3a9a", light: "#5a8afa" },
  DEFAULT: { gold: "#FF007A", dark: "#c7005f", light: "#ff5fa2" }, // Uniswap pink default
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

// Pixel Unicorn - Uniswap mascot
function PixelUnicorn({ size = 32 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      style={{ imageRendering: "pixelated" }}
      className="unicorn-bounce"
    >
      {/* Horn */}
      <rect x="11" y="0" width="1" height="1" fill="#FFD700" />
      <rect x="12" y="1" width="1" height="1" fill="#FFD700" />
      <rect x="13" y="2" width="1" height="2" fill="#FFD700" />
      {/* Head */}
      <rect x="8" y="3" width="5" height="4" fill="#FF007A" />
      <rect x="7" y="4" width="1" height="3" fill="#FF007A" />
      {/* Eye */}
      <rect x="10" y="4" width="2" height="2" fill="#fff" />
      <rect x="11" y="5" width="1" height="1" fill="#191B1F" />
      {/* Mane */}
      <rect x="6" y="3" width="2" height="1" fill="#7B61FF" />
      <rect x="5" y="4" width="2" height="1" fill="#7B61FF" />
      <rect x="4" y="5" width="2" height="1" fill="#7B61FF" />
      {/* Body */}
      <rect x="4" y="7" width="8" height="4" fill="#FF007A" />
      <rect x="3" y="8" width="1" height="3" fill="#FF007A" />
      {/* Legs */}
      <rect x="4" y="11" width="2" height="3" fill="#c7005f" />
      <rect x="9" y="11" width="2" height="3" fill="#c7005f" />
      {/* Hooves */}
      <rect x="4" y="14" width="2" height="1" fill="#FFD700" />
      <rect x="9" y="14" width="2" height="1" fill="#FFD700" />
      {/* Tail */}
      <rect x="2" y="8" width="1" height="2" fill="#7B61FF" />
      <rect x="1" y="9" width="1" height="2" fill="#7B61FF" />
      <rect x="0" y="10" width="1" height="2" fill="#7B61FF" />
    </svg>
  );
}

// UNI Token - Pink Uniswap token
function UniToken({ size, delay }: { size: number; delay: number }) {
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
        {/* Outer ring - dark pink */}
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
        {/* Main body - Uniswap pink */}
        <rect x="5" y="1" width="6" height="1" fill="#FF007A" />
        <rect x="3" y="2" width="10" height="1" fill="#FF007A" />
        <rect x="2" y="3" width="12" height="2" fill="#FF007A" />
        <rect x="1" y="5" width="14" height="6" fill="#FF007A" />
        <rect x="2" y="11" width="12" height="2" fill="#FF007A" />
        <rect x="3" y="13" width="10" height="1" fill="#FF007A" />
        <rect x="5" y="14" width="6" height="1" fill="#FF007A" />
        {/* Highlight - top left shine */}
        <rect x="5" y="2" width="3" height="1" fill="#ff5fa2" />
        <rect x="3" y="3" width="4" height="1" fill="#ff5fa2" />
        <rect x="2" y="4" width="3" height="1" fill="#ff5fa2" />
        <rect x="2" y="5" width="2" height="2" fill="#ff5fa2" />
        {/* Inner unicorn silhouette hint */}
        <rect x="6" y="6" width="1" height="1" fill="#fff" opacity="0.6" />
        <rect x="7" y="5" width="2" height="1" fill="#fff" opacity="0.4" />
        <rect x="8" y="6" width="1" height="3" fill="#fff" opacity="0.3" />
      </svg>
    </div>
  );
}

// Pink magic particle
function MagicParticle({ delay, x }: { delay: number; x: number }) {
  return (
    <div
      className="magic-particle"
      style={{
        position: "absolute",
        left: `${x}%`,
        bottom: "5%",
        animationDelay: `${delay}s`,
      }}
    >
      <div
        style={{
          width: 6,
          height: 6,
          background: "#FF007A",
          borderRadius: "50%",
          boxShadow: "0 0 10px #FF007A, 0 0 20px #FF007A",
        }}
      />
    </div>
  );
}

// Dungeon torch with pink flame
function DungeonTorch({ side }: { side: "left" | "right" }) {
  return (
    <div
      className={`absolute ${side === "left" ? "left-2" : "right-2"} top-1/4`}
    >
      <svg
        viewBox="0 0 12 24"
        width={18}
        height={36}
        style={{ imageRendering: "pixelated" }}
      >
        {/* Torch handle */}
        <rect x="4" y="12" width="4" height="10" fill="#8b4513" />
        <rect x="3" y="22" width="6" height="2" fill="#6b3a1a" />
        {/* Flame base */}
        <rect x="3" y="8" width="6" height="4" fill="#c7005f" className="torch-flame" />
        {/* Flame mid */}
        <rect x="4" y="4" width="4" height="4" fill="#FF007A" className="torch-flame" />
        {/* Flame tip */}
        <rect x="5" y="1" width="2" height="3" fill="#ff5fa2" className="torch-flame" />
        {/* Flame glow */}
        <rect x="5" y="0" width="2" height="1" fill="#fff" opacity="0.8" className="torch-flame" />
      </svg>
    </div>
  );
}

// Unicorn-themed treasure jar
function UnicornJar({ isProfitable, jarValue }: {
  isProfitable: boolean;
  jarValue: number;
}) {
  const [shimmer, setShimmer] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setShimmer(s => (s + 1) % 4);
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const coinsInside = Math.min(5, Math.max(0, Math.floor(jarValue / 150)));

  return (
    <div className="relative">
      <svg
        viewBox="0 0 80 100"
        className="w-full h-full"
        style={{
          imageRendering: "pixelated",
          filter: isProfitable
            ? "drop-shadow(0 0 25px #27AE60)"
            : "drop-shadow(0 0 15px #FF007A)"
        }}
      >
        {/* Jar shadow */}
        <ellipse cx="40" cy="96" rx="24" ry="4" fill="#0a0a0f" opacity="0.7" />

        {/* Jar body with Uniswap gradient colors */}
        {/* Bottom */}
        <rect x="20" y="85" width="40" height="6" fill="#7B61FF" />
        <rect x="18" y="80" width="44" height="5" fill="#9580FF" />

        {/* Lower body */}
        <rect x="14" y="65" width="52" height="15" fill="#9580FF" />

        {/* Middle bulge - widest part with pink gradient */}
        <rect x="10" y="45" width="60" height="20" fill="#FF007A" />
        <rect x="8" y="35" width="64" height="10" fill="#ff5fa2" />

        {/* Upper body */}
        <rect x="12" y="28" width="56" height="7" fill="#FF007A" />

        {/* Neck */}
        <rect x="20" y="18" width="40" height="10" fill="#c7005f" />
        <rect x="24" y="14" width="32" height="4" fill="#9580FF" />

        {/* Rim with gold accent */}
        <rect x="22" y="10" width="36" height="4" fill="#FFD700" />
        <rect x="20" y="7" width="40" height="3" fill="#fff" />

        {/* Left highlight */}
        <rect x="10" y="35" width="3" height="30" fill="#ff8fb3" />
        <rect x="13" y="30" width="3" height="5" fill="#ff8fb3" />
        <rect x="14" y="65" width="3" height="15" fill="#b366ff" />

        {/* Right shadow */}
        <rect x="67" y="35" width="3" height="30" fill="#c7005f" />
        <rect x="63" y="65" width="3" height="20" fill="#5a3d99" />

        {/* Unicorn decoration on jar */}
        <rect x="35" y="50" width="10" height="1" fill="#FFD700" />
        <rect x="38" y="48" width="4" height="2" fill="#FFD700" />
        <rect x="39" y="46" width="2" height="2" fill="#FFD700" />
        <rect x="39" y="44" width="2" height="2" fill="#fff" />

        {/* Inner opening */}
        <rect x="26" y="12" width="28" height="3" fill="#191B1F" />
        <rect x="24" y="15" width="32" height="3" fill="#0a0a0f" />

        {/* Coins/tokens inside */}
        {coinsInside > 0 && (
          <>
            <rect x="30" y="13" width="5" height="2" fill="#FF007A" />
            <rect x="37" y="12" width="4" height="2" fill="#FF007A" />
            {coinsInside > 1 && <rect x="43" y="13" width="4" height="2" fill="#ff5fa2" />}
            {coinsInside > 2 && <rect x="28" y="14" width="3" height="2" fill="#FF007A" />}
            {coinsInside > 3 && <rect x="45" y="12" width="3" height="2" fill="#FFD700" />}
          </>
        )}

        {/* Animated shimmer */}
        {shimmer === 0 && <rect x="12" y="38" width="2" height="5" fill="#fff" opacity="0.9" />}
        {shimmer === 1 && <rect x="14" y="48" width="2" height="5" fill="#fff" opacity="0.7" />}
        {shimmer === 2 && <rect x="11" y="55" width="2" height="4" fill="#fff" opacity="0.8" />}
        {shimmer === 3 && <rect x="13" y="42" width="2" height="4" fill="#fff" opacity="0.6" />}

        {/* Glow when profitable */}
        {isProfitable && (
          <>
            <rect x="32" y="10" width="3" height="2" fill="#27AE60" opacity="0.9">
              <animate attributeName="opacity" values="0.5;1;0.5" dur="0.6s" repeatCount="indefinite" />
            </rect>
            <rect x="42" y="9" width="3" height="2" fill="#27AE60" opacity="0.7">
              <animate attributeName="opacity" values="0.7;1;0.7" dur="0.8s" repeatCount="indefinite" />
            </rect>
          </>
        )}
      </svg>
    </div>
  );
}

// Background stars with pink tint
function PixelStars() {
  const stars = useMemo(() => {
    return Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() > 0.7 ? 3 : 2,
      delay: Math.random() * 3,
      isPink: Math.random() > 0.6,
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
            background: star.isPink ? "#FF007A" : "#fff",
            animationDelay: `${star.delay}s`,
            boxShadow: star.isPink ? "0 0 4px #FF007A" : "none",
          }}
        />
      ))}
    </div>
  );
}

// Bouncing UNI tokens
function BouncingTokens({ tokens, totalValue }: { tokens: TokenData[]; totalValue: number }) {
  const coins = useMemo(() => {
    const validTokens = tokens
      .filter(t => t.valueUsd && t.valueUsd > 0)
      .slice(0, 8);

    const minCoins = 4;
    const coinCount = Math.max(minCoins, validTokens.length);

    return Array.from({ length: coinCount }, (_, i) => {
      const token = validTokens[i % validTokens.length] || { symbol: "UNI", valueUsd: 100 };
      const angle = (i / coinCount) * Math.PI * 2;
      const radius = 32 + (i % 3) * 10;

      return {
        id: i,
        symbol: token.symbol || "UNI",
        x: 50 + Math.cos(angle) * radius,
        y: 25 + Math.sin(angle) * 12 + (i % 4) * 10,
        size: 18 + Math.min(12, ((token.valueUsd || 100) / Math.max(totalValue, 1)) * 25),
        delay: i * 0.12,
        bounceDelay: i * 0.25,
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
          <UniToken size={coin.size} delay={coin.delay} />
        </div>
      ))}
    </>
  );
}

// Wandering pixel unicorn
function WanderingUnicorn({ startX, startY }: { startX: number; startY: number }) {
  return (
    <div
      className="absolute unicorn-wander pointer-events-none"
      style={{
        left: `${startX}%`,
        top: `${startY}%`,
        zIndex: 5,
      }}
    >
      <PixelUnicorn size={24} />
    </div>
  );
}

export default function PixelJar({ tokens, totalValue, isProfitable }: PixelJarProps) {
  return (
    <div className="relative w-full h-80 mx-auto">
      {/* Background stars */}
      <PixelStars />

      {/* Dungeon torches */}
      <DungeonTorch side="left" />
      <DungeonTorch side="right" />

      {/* Pink magic particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <MagicParticle key={i} delay={i * 0.4} x={10 + i * 11} />
        ))}
      </div>

      {/* Wandering unicorns */}
      <WanderingUnicorn startX={10} startY={70} />
      <WanderingUnicorn startX={75} startY={65} />

      {/* Bouncing UNI tokens */}
      <BouncingTokens tokens={tokens} totalValue={totalValue} />

      {/* The Unicorn-themed jar - centered */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-44 z-20">
        <UnicornJar isProfitable={isProfitable} jarValue={totalValue} />
      </div>

      {/* Sparkle effects when profitable */}
      {isProfitable && (
        <div className="absolute inset-0 pointer-events-none z-30">
          <div className="sparkle sparkle-1" style={{ background: "radial-gradient(circle, #fff 0%, #27AE60 40%, transparent 70%)" }} />
          <div className="sparkle sparkle-2" style={{ background: "radial-gradient(circle, #fff 0%, #27AE60 40%, transparent 70%)" }} />
          <div className="sparkle sparkle-3" style={{ background: "radial-gradient(circle, #fff 0%, #FFD700 40%, transparent 70%)" }} />
          <div className="sparkle sparkle-4" style={{ background: "radial-gradient(circle, #fff 0%, #FFD700 40%, transparent 70%)" }} />
        </div>
      )}

      {/* Value indicator */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center z-30">
        <div className="text-[8px] text-gray-400">LIQUIDITY POOL</div>
        <div
          className={`text-sm font-bold ${isProfitable ? 'text-green-400' : 'text-[#FF007A]'}`}
          style={{ textShadow: isProfitable ? '0 0 10px #27AE60' : '0 0 10px #FF007A' }}
        >
          ${totalValue.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
