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
// Available sprites: jar-fill-1.png (empty), jar-fill-2.png (quarter), jar-fill-3.png (half), jar-fill-5.png (full)
type FillLevel = "empty" | "quarter" | "half" | "full";

function getFillLevel(jarValue: number, burnCost: number): FillLevel {
  if (burnCost <= 0) return "empty";

  const fillRatio = jarValue / burnCost; // 0 to 1+ (1 = break even, >1 = profitable)

  if (fillRatio < 0.25) return "empty";     // < 25% - nearly empty (sprite 1)
  if (fillRatio < 0.50) return "quarter";   // 25-50% - quarter full (sprite 2)
  if (fillRatio < 0.75) return "half";      // 50-75% - half full (sprite 3)
  return "full";                             // 75%+ - full (sprite 5)
}

// Map fill level to sprite filename
function getJarSprite(fillLevel: FillLevel): string {
  switch (fillLevel) {
    case "empty":
      return "/assets/jar/jar-fill-1.png";
    case "quarter":
      return "/assets/jar/jar-fill-2.png";
    case "half":
      return "/assets/jar/jar-fill-3.png";
    case "full":
      return "/assets/jar/jar-fill-5.png";
  }
}

export function PixelJar({ jarValue, burnCost, size = "normal" }: PixelJarProps) {
  const fillLevel = useMemo(() => getFillLevel(jarValue, burnCost), [jarValue, burnCost]);
  const spritePath = useMemo(() => getJarSprite(fillLevel), [fillLevel]);
  const fillPercent = useMemo(() => {
    if (burnCost <= 0) return 0;
    return Math.min(100, Math.round((jarValue / burnCost) * 100));
  }, [jarValue, burnCost]);

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
        alt={`Unicorn Jar - ${fillPercent}% full`}
        width={dimensions.width}
        height={dimensions.height}
        className="pixel-sprite relative z-10"
        style={{
          imageRendering: "pixelated",
          filter: 'drop-shadow(0 0 15px rgba(255,0,122,0.5))',
        }}
        priority
      />
      {/* Fill percentage overlay */}
      <div
        className="absolute z-20 text-center"
        style={{
          bottom: size === "large" ? '15%' : '12%',
        }}
      >
        <span
          className={`text-${size === "large" ? "lg" : "sm"} font-bold ${
            fillPercent >= 100 ? 'text-green-400' : 'text-white'
          }`}
          style={{
            textShadow: fillPercent >= 100
              ? '0 0 10px rgba(39, 174, 96, 0.8), 0 2px 4px rgba(0,0,0,0.8)'
              : '0 0 10px rgba(255, 0, 122, 0.6), 0 2px 4px rgba(0,0,0,0.8)',
          }}
        >
          {fillPercent}%
        </span>
      </div>
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
function getFlameLevel(jarValue: number, burnCost: number): "none" | "small" | "medium" {
  if (burnCost <= 0) return "none";
  
  const profitRatio = jarValue / burnCost;
  
  if (profitRatio < 0.3) return "none";       // < 30% - no flames
  if (profitRatio < 0.6) return "small";      // 30-60% - small flames
  return "medium";                             // 60%+ - medium flames
}

// Map flame level to burn pile sprite filename
function getBurnPileSprite(flameLevel: "none" | "small" | "medium"): string {
  switch (flameLevel) {
    case "none":
      return "/assets/pile/burn-pile-no-flames.png";
    case "small":
      return "/assets/pile/burn-pile-small-flames.png";
    case "medium":
      return "/assets/pile/burn-pile-medium-flames.png";
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
  const glowColor = flameLevel === "medium"
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
          filter: `drop-shadow(0 0 ${flameLevel === "medium" ? "20px" : "10px"} ${glowColor})`,
        }}
        priority
      />
    </div>
  );
}

// =============================================================================
// MAIN VISUALIZATION COMPONENT
// =============================================================================

interface JarVisualizationProps {
  totalValue: number;
  burnCost: number;
  isProfitable: boolean;
}

export default function JarVisualization({
  totalValue,
  burnCost,
  isProfitable,
}: JarVisualizationProps) {
  // Calculate progress percentage (how close to break-even)
  const progressPercent = burnCost > 0 ? Math.min(100, (totalValue / burnCost) * 100) : 0;

  return (
    <div className="jar-visualization w-full max-w-3xl mx-auto">
      {/* Main visualization area - side by side, centered vertically */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-12 py-4 md:py-6">
        {/* Left side: Burn Pile */}
        <div className="flex flex-col items-center justify-center flex-1 scale-[0.85] md:scale-100">
          <BurnPile jarValue={totalValue} burnCost={burnCost} size="large" />
        </div>

        {/* Center: Arrow */}
        <div className="flex flex-col items-center justify-center gap-2 px-2">
          <Image
            src="/assets/ui/arrow-right.png"
            alt="Arrow"
            width={48}
            height={24}
            className="pixel-sprite opacity-70 rotate-90 md:rotate-0"
            style={{ imageRendering: "pixelated" }}
          />
          <span className="text-[9px] text-gray-400 text-center leading-tight font-medium tracking-wide">
            BURN<br />TO<br />CLAIM
          </span>
        </div>

        {/* Right side: Jar with fill level based on value */}
        <div className="flex flex-col items-center justify-center flex-1 scale-[0.85] md:scale-100">
          <PixelJar jarValue={totalValue} burnCost={burnCost} size="large" />
        </div>
      </div>

      {/* Simple progress bar - no text labels */}
      <div className="mt-4">
        <div className="h-2 rounded-full overflow-hidden bg-gray-900/80">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isProfitable
                ? 'bg-gradient-to-r from-green-600 to-green-400'
                : 'bg-gradient-to-r from-[#FF007A] to-[#ff5fa2]'
            }`}
            style={{
              width: `${progressPercent}%`,
              boxShadow: isProfitable
                ? '0 0 10px rgba(39, 174, 96, 0.5)'
                : '0 0 10px rgba(255, 0, 122, 0.5)'
            }}
          />
        </div>
      </div>
    </div>
  );
}
