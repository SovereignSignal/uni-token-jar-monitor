"use client";

import { useMemo } from "react";
import Image from "next/image";

// =============================================================================
// PIXEL JAR COMPONENT - Jar fill level based on value vs burn cost
// =============================================================================

interface PixelJarProps {
  jarValue: number;
  burnCost: number;
  size?: "normal" | "large";
}

// Fill level based on jar value vs burn cost ratio
// The jar fills up as it gets closer to being profitable
function getFillLevel(jarValue: number, burnCost: number): "empty" | "quarter" | "half" | "threequarter" | "full" {
  if (burnCost <= 0) return "empty";
  
  const fillRatio = jarValue / burnCost; // 0 to 1+ (1 = break even, >1 = profitable)
  
  if (fillRatio < 0.2) return "empty";           // < 20% - nearly empty
  if (fillRatio < 0.4) return "quarter";         // 20-40% - quarter full
  if (fillRatio < 0.6) return "half";            // 40-60% - half full
  if (fillRatio < 0.8) return "threequarter";    // 60-80% - three quarters
  return "full";                                  // 80%+ - full (close to/at profitability!)
}

// Map fill level to sprite filename
function getJarSprite(fillLevel: "empty" | "quarter" | "half" | "threequarter" | "full"): string {
  switch (fillLevel) {
    case "empty":
      return "/assets/jar/jar-empty.png";
    case "quarter":
      return "/assets/jar/jar-quarter.png";
    case "half":
      return "/assets/jar/jar-half.png";
    case "threequarter":
      return "/assets/jar/jar-threequarter.png";
    case "full":
      return "/assets/jar/jar-full.png";
  }
}

export function PixelJar({ jarValue, burnCost, size = "normal" }: PixelJarProps) {
  const fillLevel = useMemo(() => getFillLevel(jarValue, burnCost), [jarValue, burnCost]);
  const spritePath = useMemo(() => getJarSprite(fillLevel), [fillLevel]);
  
  // Larger sizes for better visual impact
  const dimensions = size === "large" 
    ? { width: 320, height: 480 }
    : { width: 200, height: 300 };

  return (
    <div className="pixel-jar-container relative flex flex-col items-center">
      {/* Glow effect behind jar */}
      <div 
        className="absolute blur-3xl opacity-50"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(255,0,122,0.7) 0%, rgba(255,95,162,0.4) 30%, rgba(255,0,122,0.15) 60%, transparent 80%)',
          width: '140%',
          height: '110%',
          top: '0%',
          left: '-20%',
        }}
      />
      <Image
        src={spritePath}
        alt={`Unicorn Jar - ${fillLevel}`}
        width={dimensions.width}
        height={dimensions.height}
        className="pixel-sprite relative z-10"
        style={{
          imageRendering: "pixelated",
          filter: 'drop-shadow(0 0 15px rgba(255,0,122,0.5))',
        }}
        priority
      />
    </div>
  );
}

// =============================================================================
// BURN PILE COMPONENT - Pile grows and flames intensify as profitability increases
// =============================================================================

interface BurnPileProps {
  jarValue: number;
  burnCost: number;
  size?: "normal" | "large";
}

// Flame level based on how close to profitability
function getFlameLevel(jarValue: number, burnCost: number): "none" | "small" | "medium" | "large" {
  if (burnCost <= 0) return "none";
  
  const profitRatio = jarValue / burnCost;
  
  if (profitRatio < 0.3) return "none";       // < 30% - no flames
  if (profitRatio < 0.6) return "small";      // 30-60% - small flames
  if (profitRatio < 0.85) return "medium";    // 60-85% - medium flames
  return "large";                              // 85%+ - large flames
}

// Map flame level to burn pile sprite filename
function getBurnPileSprite(flameLevel: "none" | "small" | "medium" | "large"): string {
  switch (flameLevel) {
    case "none":
      return "/assets/pile/burn-pile-no-flames.png";
    case "small":
      return "/assets/pile/burn-pile-small-flames.png";
    case "medium":
      return "/assets/pile/burn-pile-medium-flames.png";
    case "large":
      return "/assets/pile/burn-pile-large-flames.png";
  }
}

export function BurnPile({ jarValue, burnCost, size = "normal" }: BurnPileProps) {
  const flameLevel = useMemo(() => getFlameLevel(jarValue, burnCost), [jarValue, burnCost]);
  const spritePath = useMemo(() => getBurnPileSprite(flameLevel), [flameLevel]);
  
  // Match jar proportions
  const dimensions = size === "large" 
    ? { width: 280, height: 280 }
    : { width: 180, height: 180 };

  // Glow color changes based on flame level
  const glowColor = flameLevel === "large" 
    ? 'rgba(255,50,0,0.6)' 
    : flameLevel === "medium"
    ? 'rgba(255,100,0,0.5)'
    : flameLevel === "small"
    ? 'rgba(255,150,50,0.4)'
    : 'rgba(255,180,100,0.3)';

  return (
    <div className="burn-pile-container relative flex flex-col items-center justify-center">
      {/* Glow effect behind pile */}
      <div 
        className="absolute blur-3xl"
        style={{
          background: `radial-gradient(ellipse at center, ${glowColor} 0%, transparent 70%)`,
          width: '160%',
          height: '140%',
          top: '-20%',
          left: '-30%',
          opacity: flameLevel === "none" ? 0.3 : flameLevel === "small" ? 0.5 : flameLevel === "medium" ? 0.7 : 0.9,
        }}
      />
      <Image
        src={spritePath}
        alt={`Burn pile - ${flameLevel} flames`}
        width={dimensions.width}
        height={dimensions.height}
        className="pixel-sprite relative z-10"
        style={{
          imageRendering: "pixelated",
          filter: `drop-shadow(0 0 ${flameLevel === "large" ? "20px" : "10px"} ${glowColor})`,
        }}
        priority
      />
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
    <div className="jar-visualization w-full max-w-3xl mx-auto">
      {/* Main visualization area - side by side, centered vertically */}
      <div className="flex items-center justify-center gap-6 md:gap-12 py-6">
        {/* Left side: Burn Pile */}
        <div className="flex flex-col items-center justify-center flex-1">
          <span className="text-[10px] text-red-400 mb-4 tracking-widest uppercase font-medium">Burn</span>
          <BurnPile jarValue={totalValue} burnCost={burnCost} size="large" />
        </div>

        {/* Center: Arrow */}
        <div className="flex flex-col items-center justify-center gap-2 px-2">
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

        {/* Right side: Jar with fill level based on value */}
        <div className="flex flex-col items-center justify-center flex-1">
          <span className="text-[10px] text-green-400 mb-4 tracking-widest uppercase font-medium">Vault</span>
          <PixelJar jarValue={totalValue} burnCost={burnCost} size="large" />
        </div>
      </div>

      {/* Comparison bar */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-red-400/90 font-medium">{burnPercent.toFixed(0)}% burn</span>
          <span className="text-[8px] text-gray-600/70 uppercase tracking-wider">Burn vs Reward</span>
          <span className={`text-[10px] font-medium ${isProfitable ? 'text-green-400/90' : 'text-yellow-400/90'}`}>
            {jarPercent.toFixed(0)}% reward
          </span>
        </div>
        <div className="h-3 flex rounded-sm overflow-hidden bg-gray-900">
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
