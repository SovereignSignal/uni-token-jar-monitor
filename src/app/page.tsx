"use client";

import { useEffect, useState, useCallback } from "react";
import { REFRESH_INTERVAL_MS, TOKENJAR_ADDRESS, FIREPIT_ADDRESS } from "@/lib/constants";
import type { TokenJarApiResponse } from "./api/tokenjar/route";
import type { ProfitabilityData } from "@/lib/profitability";
import ZeldaHUD from "@/components/ZeldaHUD";
import ZeldaUnicorn from "@/components/ZeldaUnicorn";

// =============================================================================
// ZELDA-STYLE TOKEN JAR MONITOR
// Complete NES Zelda cave scene UI
// =============================================================================

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}S AGO`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}M AGO`;
  const hours = Math.floor(minutes / 60);
  return `${hours}H AGO`;
}

// Whimsical cryptic messages
const PROFITABLE_MESSAGES = [
  "THE STARS ALIGN! THE JAR YIELDS ITS SECRETS TO THOSE WHO DARE.",
  "FORTUNE FAVORS YOU! THE UNICORN SMILES UPON YOUR QUEST.",
  "THE PROPHECY UNFOLDS! THE CYCLE REWARDS THE PATIENT.",
  "DESTINY AWAITS! ITS TREASURES CALL TO WORTHY HANDS.",
  "THE MOON IS RIGHT! THE FIRE'S GIFT AWAITS ITS HEIR.",
];

const NOT_PROFITABLE_MESSAGES = [
  "IT'S DANGEROUS TO BURN ALONE! WAIT FOR BETTER CONDITIONS.",
  "PATIENCE, WANDERER... THE FLAMES HUNGER STILL.",
  "THE SHADOWS WARN! DARK OMENS CLOUD THE JAR.",
  "HEED THE OLD WAYS! THE FIRE DEMANDS MORE.",
  "BEWARE THE VOID! YOUR TOKENS WOULD VANISH.",
];

// Animated torch component
function PixelTorch() {
  const [frame, setFrame] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % 3);
    }, 200);
    return () => clearInterval(interval);
  }, []);
  
  const flameHeights = [10, 12, 11];
  const flameOffsets = [0, 1, -1];
  const h = flameHeights[frame];
  const xOff = flameOffsets[frame];
  
  return (
    <svg viewBox="0 0 16 40" width="32" height="80" style={{ imageRendering: "pixelated" }}>
      {/* Torch handle */}
      <rect x="6" y="24" width="4" height="14" fill="#8b4513" />
      <rect x="5" y="36" width="6" height="4" fill="#5c3317" />
      
      {/* Flame base */}
      <rect x="4" y="18" width="8" height="8" fill="#fc6c18" />
      
      {/* Animated flame core */}
      <rect x={5 + xOff} y={26 - h} width="6" height={h - 2} fill="#fcbc18" />
      <rect x={6 + xOff} y={24 - h} width="4" height={h - 4} fill="#fc9090" />
      <rect x={7 + xOff} y={22 - h} width="2" height={h - 6} fill="#fcfcfc" />
    </svg>
  );
}

// Old man/sage character
function PixelOldMan({ isProfitable }: { isProfitable: boolean }) {
  return (
    <svg viewBox="0 0 16 24" width="64" height="96" style={{ imageRendering: "pixelated" }}>
      {/* Robe - brown like original Zelda */}
      <rect x="4" y="8" width="8" height="12" fill="#8b4513" />
      <rect x="3" y="10" width="10" height="10" fill="#a0522d" />
      <rect x="2" y="12" width="12" height="8" fill="#8b4513" />
      
      {/* Hood */}
      <rect x="5" y="2" width="6" height="2" fill="#8b4513" />
      <rect x="4" y="4" width="8" height="4" fill="#a0522d" />
      
      {/* Face */}
      <rect x="5" y="5" width="6" height="4" fill="#fcbcb0" />
      {/* Eyes */}
      <rect x="6" y="6" width="1" height="1" fill="#000" />
      <rect x="9" y="6" width="1" height="1" fill="#000" />
      {/* Beard */}
      <rect x="6" y="8" width="4" height="2" fill="#e0e0e0" />
      <rect x="7" y="10" width="2" height="1" fill="#c0c0c0" />
      
      {/* Arms extended */}
      <rect x="0" y="12" width="4" height="3" fill="#a0522d" />
      <rect x="12" y="12" width="4" height="3" fill="#a0522d" />
      {/* Hands */}
      <rect x="0" y="13" width="2" height="2" fill="#fcbcb0" />
      <rect x="14" y="13" width="2" height="2" fill="#fcbcb0" />
      
      {/* Feet */}
      <rect x="5" y="20" width="2" height="2" fill="#5c3317" />
      <rect x="9" y="20" width="2" height="2" fill="#5c3317" />
      
      {/* Glow if profitable */}
      {isProfitable && (
        <rect x="6" y="14" width="4" height="4" fill="#FFD700" opacity="0.6" />
      )}
    </svg>
  );
}

// Token Jar on pedestal
function PixelJarPedestal({ jarValue, isProfitable }: { jarValue: number; isProfitable: boolean }) {
  const fillLevel = Math.min(5, Math.max(1, Math.floor(jarValue / 200) + 1));
  
  return (
    <svg viewBox="0 0 24 32" width="72" height="96" style={{ imageRendering: "pixelated" }}>
      {/* Pedestal */}
      <rect x="4" y="24" width="16" height="4" fill="#5c5c5c" />
      <rect x="2" y="28" width="20" height="4" fill="#3c3c3c" />
      <rect x="6" y="22" width="12" height="2" fill="#7c7c7c" />
      
      {/* Jar */}
      <rect x="7" y="6" width="10" height="2" fill="#fcbcb0" />
      <rect x="8" y="8" width="8" height="2" fill="#fcbcb0" />
      <rect x="6" y="10" width="12" height="12" fill="#fcbcb0" />
      
      {/* Jar contents */}
      <rect 
        x="7" 
        y={22 - fillLevel * 2} 
        width="10" 
        height={fillLevel * 2} 
        fill={isProfitable ? "#5ce65c" : "#e4464b"} 
      />
      
      {/* Jar shine */}
      <rect x="7" y="11" width="2" height="8" fill="#fff" opacity="0.3" />
      
      {/* Sparkle if profitable */}
      {isProfitable && (
        <>
          <rect x="4" y="4" width="2" height="2" fill="#FFD700" className="animate-pulse" />
          <rect x="18" y="8" width="2" height="2" fill="#FFD700" className="animate-pulse" />
        </>
      )}
    </svg>
  );
}

// Blinking cursor
function BlinkingCursor() {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    const interval = setInterval(() => setVisible(v => !v), 500);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <span 
      className="inline-block w-2 h-3 ml-1"
      style={{ backgroundColor: visible ? '#fcfcfc' : 'transparent' }}
    />
  );
}

export default function Home() {
  const [data, setData] = useState<ProfitabilityData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/tokenjar");
      const result: TokenJarApiResponse = await response.json();

      if (result.success && result.data) {
        setData(result.data);
        setError(null);
        setLastFetch(Date.now());
      } else {
        setError(result.error || "Failed to fetch data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Update time display
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Get message based on profitability
  const messages = data?.isProfitable ? PROFITABLE_MESSAGES : NOT_PROFITABLE_MESSAGES;
  const messageIndex = data ? Math.floor(Math.abs(data.netProfitUsd) % messages.length) : 0;
  const message = messages[messageIndex];

  // Typewriter effect
  useEffect(() => {
    if (!data) return;
    
    setDisplayedText("");
    setIsTyping(true);
    let index = 0;
    
    const typeInterval = setInterval(() => {
      if (index < message.length) {
        setDisplayedText(message.slice(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(typeInterval);
      }
    }, 50);
    
    return () => clearInterval(typeInterval);
  }, [message, data]);

  return (
    <main className="min-h-screen bg-black flex flex-col">
      {/* Zelda HUD */}
      <ZeldaHUD
        jarValue={data?.totalJarValueUsd ?? 0}
        burnCost={data?.burnCostUsd ?? 0}
        netProfit={data?.netProfitUsd ?? 0}
        uniPrice={data?.uniPriceUsd ?? 0}
        isProfitable={data?.isProfitable ?? false}
        isLoading={!data && !error}
        lastUpdate={lastFetch ? formatTimeAgo(lastFetch) : ""}
      />
      
      {/* Main Game Screen */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="zelda-game-screen w-full max-w-2xl aspect-[256/224] relative bg-[#1c1c1c] border-4 border-[#fcbcb0] overflow-hidden">
          
          {/* Cave brick walls */}
          {/* Top wall */}
          <div 
            className="absolute top-0 left-0 right-0 h-12"
            style={{
              background: `
                repeating-linear-gradient(90deg, #4a3c2c 0px, #4a3c2c 28px, #2c2418 28px, #2c2418 32px),
                repeating-linear-gradient(0deg, #4a3c2c 0px, #4a3c2c 12px, #2c2418 12px, #2c2418 16px)
              `,
              backgroundSize: '64px 32px',
            }}
          />
          
          {/* Left wall */}
          <div 
            className="absolute top-12 left-0 w-12 bottom-12"
            style={{
              background: `
                repeating-linear-gradient(90deg, #4a3c2c 0px, #4a3c2c 12px, #2c2418 12px, #2c2418 16px),
                repeating-linear-gradient(0deg, #4a3c2c 0px, #4a3c2c 28px, #2c2418 28px, #2c2418 32px)
              `,
              backgroundSize: '32px 64px',
            }}
          />
          
          {/* Right wall */}
          <div 
            className="absolute top-12 right-0 w-12 bottom-12"
            style={{
              background: `
                repeating-linear-gradient(90deg, #4a3c2c 0px, #4a3c2c 12px, #2c2418 12px, #2c2418 16px),
                repeating-linear-gradient(0deg, #4a3c2c 0px, #4a3c2c 28px, #2c2418 28px, #2c2418 32px)
              `,
              backgroundSize: '32px 64px',
            }}
          />
          
          {/* Bottom wall */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-12"
            style={{
              background: `
                repeating-linear-gradient(90deg, #4a3c2c 0px, #4a3c2c 28px, #2c2418 28px, #2c2418 32px),
                repeating-linear-gradient(0deg, #4a3c2c 0px, #4a3c2c 12px, #2c2418 12px, #2c2418 16px)
              `,
              backgroundSize: '64px 32px',
            }}
          />
          
          {/* Cave floor */}
          <div className="absolute inset-12 bg-[#0c0c0c]" />
          
          {/* Torches */}
          <div className="absolute left-16 top-14 z-10">
            <PixelTorch />
          </div>
          <div className="absolute right-16 top-14 z-10">
            <PixelTorch />
          </div>
          
          {/* Loading state */}
          {!data && !error && (
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="text-[#fcfcfc] text-sm animate-pulse">LOADING...</div>
            </div>
          )}
          
          {/* Error state */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="bg-black border-2 border-red-500 p-4 text-center">
                <div className="text-red-500 text-xs mb-2">GAME OVER</div>
                <div className="text-[#fcfcfc] text-[10px]">{error}</div>
                <button 
                  onClick={fetchData}
                  className="mt-2 px-4 py-1 bg-red-900 text-white text-[10px] border border-red-500 hover:bg-red-800"
                >
                  CONTINUE?
                </button>
              </div>
            </div>
          )}
          
          {/* Main scene content */}
          {data && (
            <>
              {/* Old Man */}
              <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10">
                <PixelOldMan isProfitable={data.isProfitable} />
              </div>
              
              {/* Token Jar on Pedestal */}
              <div className="absolute top-32 left-1/2 -translate-x-1/2 z-10">
                <PixelJarPedestal jarValue={data.totalJarValueUsd} isProfitable={data.isProfitable} />
              </div>
              
              {/* Unicorn player character */}
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10">
                <ZeldaUnicorn facing="up" animate={true} />
              </div>
              
              {/* Dialog box */}
              <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-[85%] z-20">
                <div className="bg-black border-2 border-[#fcfcfc] px-3 py-2">
                  <p className="text-[#fcfcfc] text-[10px] leading-relaxed text-center zelda-text">
                    {displayedText}
                    {isTyping && <BlinkingCursor />}
                  </p>
                </div>
              </div>
              
              {/* Net profit indicator */}
              <div className="absolute top-14 right-14 z-10 text-right">
                <div className={`text-[10px] ${data.isProfitable ? 'text-[#5ce65c]' : 'text-[#e4464b]'}`}>
                  {data.netProfitUsd >= 0 ? '+' : ''}${Math.abs(data.netProfitUsd).toLocaleString()}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Footer with contract links */}
      <footer className="bg-black border-t-2 border-[#fcbcb0] p-2">
        <div className="max-w-2xl mx-auto flex justify-between items-center text-[8px]">
          <div className="text-[#5c5c5c]">
            REFRESHES EVERY 30S • PRICES VIA COINGECKO
          </div>
          <div className="flex gap-4">
            <a 
              href={`https://etherscan.io/address/${TOKENJAR_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#fcbcb0] hover:text-[#fcfcfc]"
            >
              JAR CONTRACT
            </a>
            <a 
              href={`https://etherscan.io/address/${FIREPIT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#fcbcb0] hover:text-[#fcfcfc]"
            >
              FIREPIT
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
