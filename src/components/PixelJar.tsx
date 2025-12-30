"use client";

import { useMemo } from "react";
import Image from "next/image";

// =============================================================================
// PIXEL JAR COMPONENT - Uses pre-generated sprite images
// =============================================================================

interface PixelJarProps {
  jarValue: number;
  maxValue?: number;
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

export function PixelJar({ jarValue, maxValue = 50000 }: PixelJarProps) {
  const fillLevel = useMemo(() => getJarFillLevel(jarValue, maxValue), [jarValue, maxValue]);
  const spritePath = useMemo(() => getJarSprite(fillLevel), [fillLevel]);

  return (
    <div className="pixel-jar-container relative flex flex-col items-center">
      <Image
        src={spritePath}
        alt={`Jar ${fillLevel * 20}% full`}
        width={128}
        height={256}
        className="pixel-sprite"
        style={{
          imageRendering: "pixelated",
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
function getPileSpriteInfo(size: "small" | "medium" | "large" | "huge"): {
  path: string;
  width: number;
  height: number;
} {
  switch (size) {
    case "small":
      return { path: "/assets/pile/pile-small.png", width: 96, height: 64 };
    case "medium":
      return { path: "/assets/pile/pile-medium.png", width: 160, height: 96 };
    case "large":
      return { path: "/assets/pile/pile-large.png", width: 224, height: 128 };
    case "huge":
      return { path: "/assets/pile/pile-huge.png", width: 288, height: 160 };
  }
}

export function BurnPile({ burnCost, jarValue }: BurnPileProps) {
  const pileSize = useMemo(() => getPileSize(burnCost, jarValue), [burnCost, jarValue]);
  const spriteInfo = useMemo(() => getPileSpriteInfo(pileSize), [pileSize]);

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

export default function JarVisualization({
  totalValue,
  burnCost,
  isProfitable,
}: JarVisualizationProps) {
  // Calculate percentages for comparison bar
  const total = burnCost + totalValue;
  const burnPercent = total > 0 ? (burnCost / total) * 100 : 97;
  const jarPercent = total > 0 ? (totalValue / total) * 100 : 3;
  
  // Net profit calculation
  const netProfit = totalValue - burnCost;

  return (
    <div className="jar-visualization w-full">
      {/* Main visualization area */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 py-6">
        {/* Left side: Burn Pile */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-red-400 mb-2 tracking-wider">SACRIFICE</span>
          <BurnPile burnCost={burnCost} jarValue={totalValue} />
          <span className="text-sm text-red-400 mt-2 font-bold danger-pulse">
            ${burnCost.toLocaleString()}
          </span>
        </div>

        {/* Center: Arrow */}
        <div className="flex flex-col items-center gap-2 px-4">
          <Image
            src="/assets/ui/arrow-right.png"
            alt="Arrow"
            width={64}
            height={32}
            className="pixel-sprite arrow-pulse"
            style={{ imageRendering: "pixelated" }}
          />
          <span className="text-[8px] text-gray-400 text-center">
            BURN TO<br />CLAIM
          </span>
        </div>

        {/* Right side: Jar */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-green-400 mb-2 tracking-wider">VAULT</span>
          <PixelJar jarValue={totalValue} maxValue={50000} />
          <span className={`text-sm mt-2 font-bold ${isProfitable ? 'text-green-400 treasure-glow' : 'text-yellow-400'}`}>
            ${totalValue.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Comparison bar */}
      <div className="mt-6 px-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[8px] text-gray-500">BURN vs REWARD</span>
        </div>
        <div className="h-6 flex rounded overflow-hidden border-2 border-gray-700">
          {/* Burn portion (red) */}
          <div
            className="bg-gradient-to-r from-red-700 to-red-500 flex items-center justify-center transition-all duration-500 danger-stripes"
            style={{ width: `${burnPercent}%` }}
          >
            <span className="text-[8px] text-white font-bold drop-shadow-lg">
              {burnPercent.toFixed(0)}%
            </span>
          </div>
          {/* Jar portion (green/gold) */}
          <div
            className={`flex items-center justify-center transition-all duration-500 ${
              isProfitable 
                ? 'bg-gradient-to-r from-green-600 to-green-400' 
                : 'bg-gradient-to-r from-yellow-700 to-yellow-500'
            }`}
            style={{ width: `${jarPercent}%` }}
          >
            {jarPercent >= 5 && (
              <span className="text-[8px] text-white font-bold drop-shadow-lg">
                {jarPercent.toFixed(0)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Net profit display */}
      <div className="mt-6 text-center">
        <span className="text-[10px] text-gray-500 block mb-1">NET PROFIT</span>
        <span
          className={`text-2xl font-bold ${
            netProfit >= 0 
              ? 'text-green-400 treasure-glow' 
              : 'text-red-400 danger-pulse'
          }`}
        >
          {netProfit >= 0 ? '+' : ''}{netProfit < 0 ? '-' : ''}${Math.abs(netProfit).toLocaleString()}
        </span>
      </div>
    </div>
  );
}
