"use client";

import { useMemo } from "react";
import Image from "next/image";

// =============================================================================
// PIXEL JAR COMPONENT - Uses pre-generated sprite images
// =============================================================================

interface PixelJarProps {
  jarValue: number;
  maxValue?: number;
  size?: "normal" | "large";
}

// Jar fill level thresholds (0-5 based on percentage)
function getJarFillLevel(jarValue: number, maxValue: number): number {
  const fillPercent = (jarValue / maxValue) * 100;
  
  if (fillPercent <= 0) return 0;
  if (fillPercent <= 20) return 1;
  if (fillPercent <= 40) return 2;
  if (fillPercent <= 60) return 3;
  if (fillPercent <= 80) return 4;
  return 5;
}

// Map fill level to sprite filename
function getJarSprite(fillLevel: number): string {
  if (fillLevel === 0) return "/assets/jar/jar-empty.png";
  return `/assets/jar/jar-fill-${fillLevel}.png`;
}

export function PixelJar({ jarValue, maxValue = 50000, size = "normal" }: PixelJarProps) {
  const fillLevel = useMemo(() => getJarFillLevel(jarValue, maxValue), [jarValue, maxValue]);
  const spritePath = useMemo(() => getJarSprite(fillLevel), [fillLevel]);
  
  // Larger sizes for better visual impact
  const dimensions = size === "large" 
    ? { width: 180, height: 360 }
    : { width: 140, height: 280 };

  return (
    <div className="pixel-jar-container relative flex flex-col items-center">
      {/* Glow effect behind jar - more visible */}
      <div 
        className="absolute blur-3xl opacity-60"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(255,0,122,0.8) 0%, rgba(255,95,162,0.5) 30%, rgba(255,0,122,0.2) 60%, transparent 80%)',
          width: '150%',
          height: '120%',
          top: '-10%',
          left: '-25%',
        }}
      />
      <Image
        src={spritePath}
        alt={`Jar ${fillLevel * 20}% full`}
        width={dimensions.width}
        height={dimensions.height}
        className="pixel-sprite relative z-10"
        style={{
          imageRendering: "pixelated",
          filter: 'drop-shadow(0 0 20px rgba(255,0,122,0.6)) drop-shadow(0 0 40px rgba(255,0,122,0.3))',
        }}
        priority
      />
    </div>
  );
}

// =============================================================================
// BURN PILE COMPONENT - Uses pre-generated sprite images
// =============================================================================

interface BurnPileProps {
  burnCost: number;
  jarValue: number;
  size?: "normal" | "large";
}

// Pile size based on burn cost to jar value ratio
function getPileSize(burnCost: number, jarValue: number): "small" | "medium" | "large" | "huge" {
  if (jarValue <= 0) return "huge";
  
  const ratio = burnCost / jarValue;
  
  if (ratio < 5) return "small";
  if (ratio < 15) return "medium";
  if (ratio < 30) return "large";
  return "huge";
}

// Map pile size to sprite filename and dimensions
function getPileSpriteInfo(size: "small" | "medium" | "large" | "huge", displaySize: "normal" | "large"): {
  path: string;
  width: number;
  height: number;
} {
  // Pile should be proportionate with jar (jar is 180x360 at large)
  // Pile height should be roughly 60-80% of jar height to look balanced
  // Jar is 360px tall, so pile should be ~220-280px
  const baseSize = displaySize === "large" ? 280 : 160;
  
  switch (size) {
    case "small":
      return { path: "/assets/pile/pile-small.png", width: Math.round(baseSize * 0.75), height: Math.round(baseSize * 0.75) };
    case "medium":
      return { path: "/assets/pile/pile-medium.png", width: Math.round(baseSize * 0.9), height: Math.round(baseSize * 0.9) };
    case "large":
      return { path: "/assets/pile/pile-large.png", width: baseSize, height: baseSize };
    case "huge":
      return { path: "/assets/pile/pile-huge.png", width: Math.round(baseSize * 1.15), height: Math.round(baseSize * 1.15) };
  }
}

export function BurnPile({ burnCost, jarValue, size = "normal" }: BurnPileProps) {
  const pileSize = useMemo(() => getPileSize(burnCost, jarValue), [burnCost, jarValue]);
  const spriteInfo = useMemo(() => getPileSpriteInfo(pileSize, size), [pileSize, size]);

  return (
    <div className="burn-pile-container relative flex flex-col items-center">
      <div className="relative fire-glow">
        <Image
          src={spriteInfo.path}
          alt={`${pileSize} burn pile`}
          width={spriteInfo.width}
          height={spriteInfo.height}
          className="pixel-sprite"
          style={{
            imageRendering: "pixelated",
          }}
          priority
        />
      </div>
    </div>
  );
}

// =============================================================================
// MAIN VISUALIZATION COMPONENT
// =============================================================================

interface TokenData {
  symbol: string;
  valueUsd: number | null;
}

interface JarVisualizationProps {
  tokens: TokenData[];
  totalValue: number;
  burnCost: number;
  isProfitable: boolean;
}

// Format currency for display
function formatCurrency(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toLocaleString()}`;
}

export default function JarVisualization({
  totalValue,
  burnCost,
  isProfitable,
}: JarVisualizationProps) {
  // Calculate percentages for comparison bar
  const total = burnCost + totalValue;
  const burnPercent = total > 0 ? (burnCost / total) * 100 : 97;
  const jarPercent = total > 0 ? (totalValue / total) * 100 : 3;

  return (
    <div className="jar-visualization w-full max-w-lg mx-auto">
      {/* Main visualization area - side by side, centered vertically */}
      <div className="flex items-center justify-center gap-6 md:gap-10 py-4">
        {/* Left side: Burn Pile - vertically centered with jar */}
        <div className="flex flex-col items-center justify-center flex-1 min-h-[320px]">
          <span className="text-[9px] text-red-400 mb-4 tracking-widest uppercase">Sacrifice</span>
          <BurnPile burnCost={burnCost} jarValue={totalValue} size="large" />
          <span className="text-base text-red-400 mt-4 font-bold">
            {formatCurrency(burnCost)}
          </span>
        </div>

        {/* Center: Arrow - vertically centered */}
        <div className="flex flex-col items-center justify-center gap-2">
          <Image
            src="/assets/ui/arrow-right.png"
            alt="Arrow"
            width={48}
            height={24}
            className="pixel-sprite opacity-70"
            style={{ imageRendering: "pixelated" }}
          />
          <span className="text-[9px] text-gray-400 text-center leading-tight font-medium tracking-wide">
            BURN<br />TO<br />CLAIM
          </span>
        </div>

        {/* Right side: Jar - vertically centered */}
        <div className="flex flex-col items-center justify-center flex-1 min-h-[320px]">
          <span className="text-[9px] text-green-400 mb-4 tracking-widest uppercase">Vault</span>
          <PixelJar jarValue={totalValue} maxValue={50000} size="large" />
          <span className={`text-base mt-4 font-bold ${isProfitable ? 'text-green-400' : 'text-yellow-400'}`}>
            {formatCurrency(totalValue)}
          </span>
        </div>
      </div>

      {/* Comparison bar - improved labels */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-red-400/90 font-medium">{burnPercent.toFixed(0)}% burn</span>
          <span className="text-[8px] text-gray-600/70 uppercase tracking-wider">Burn vs Reward</span>
          <span className={`text-[10px] font-medium ${isProfitable ? 'text-green-400/90' : 'text-yellow-400/90'}`}>
            {jarPercent.toFixed(0)}% reward
          </span>
        </div>
        <div className="h-2.5 flex rounded-sm overflow-hidden bg-gray-900">
          {/* Burn portion (red) */}
          <div
            className="bg-gradient-to-r from-red-600/70 to-red-500/70 transition-all duration-500"
            style={{ width: `${burnPercent}%` }}
          />
          {/* Jar portion (green/gold) */}
          <div
            className={`transition-all duration-500 ${
              isProfitable 
                ? 'bg-gradient-to-r from-green-500/70 to-green-400/70' 
                : 'bg-gradient-to-r from-yellow-600/70 to-yellow-500/70'
            }`}
            style={{ width: `${jarPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
