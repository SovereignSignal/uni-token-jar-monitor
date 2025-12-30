"use client";

import { useEffect, useState, useCallback } from "react";
import { REFRESH_INTERVAL_MS, TOKENJAR_ADDRESS, FIREPIT_ADDRESS } from "@/lib/constants";
import type { TokenJarApiResponse } from "./api/tokenjar/route";
import type { ProfitabilityData } from "@/lib/profitability";
import ZeldaHUD from "@/components/ZeldaHUD";

// =============================================================================
// ZELDA-STYLE TOKEN JAR MONITOR
// Complete NES Zelda cave scene UI - "It's dangerous to go alone!"
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

// Large animated torch component - bigger flames
function PixelTorch() {
  const [frame, setFrame] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % 4);
    }, 150);
    return () => clearInterval(interval);
  }, []);
  
  const flameHeights = [14, 18, 16, 15];
  const flameOffsets = [0, 1, -1, 0];
  const h = flameHeights[frame];
  const xOff = flameOffsets[frame];
  
  return (
    <svg viewBox="0 0 24 56" width="48" height="112" style={{ imageRendering: "pixelated" }}>
      {/* Torch mount/bracket */}
      <rect x="8" y="32" width="8" height="4" fill="#5c3317" />
      <rect x="10" y="36" width="4" height="18" fill="#8b4513" />
      <rect x="8" y="52" width="8" height="4" fill="#5c3317" />
      
      {/* Flame base glow */}
      <rect x="4" y="24" width="16" height="12" fill="#fc6c18" opacity="0.8" />
      
      {/* Flame base */}
      <rect x="6" y="26" width="12" height="8" fill="#fc6c18" />
      
      {/* Animated flame layers */}
      <rect x={7 + xOff} y={34 - h} width="10" height={h - 4} fill="#fcbc18" />
      <rect x={8 + xOff} y={32 - h} width="8" height={h - 6} fill="#fc9090" />
      <rect x={9 + xOff} y={30 - h} width="6" height={h - 8} fill="#fcfcfc" />
      <rect x={10 + xOff} y={28 - h} width="4" height={h - 10} fill="#fcfcfc" />
      
      {/* Sparks */}
      {frame % 2 === 0 && (
        <>
          <rect x={6 + xOff} y={20 - h} width="2" height="2" fill="#fcbc18" opacity="0.8" />
          <rect x={16 - xOff} y={18 - h} width="2" height="2" fill="#fc9090" opacity="0.6" />
        </>
      )}
    </svg>
  );
}

// Old man/sage character - larger
function PixelOldMan({ isProfitable }: { isProfitable: boolean }) {
  return (
    <svg viewBox="0 0 16 24" width="80" height="120" style={{ imageRendering: "pixelated" }}>
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
      
      {/* Arms extended outward */}
      <rect x="0" y="11" width="4" height="4" fill="#a0522d" />
      <rect x="12" y="11" width="4" height="4" fill="#a0522d" />
      {/* Hands */}
      <rect x="0" y="12" width="2" height="3" fill="#fcbcb0" />
      <rect x="14" y="12" width="2" height="3" fill="#fcbcb0" />
      
      {/* Feet */}
      <rect x="5" y="20" width="2" height="2" fill="#5c3317" />
      <rect x="9" y="20" width="2" height="2" fill="#5c3317" />
      
      {/* Glow if profitable */}
      {isProfitable && (
        <rect x="5" y="14" width="6" height="5" fill="#FFD700" opacity="0.5" />
      )}
    </svg>
  );
}

// Token Jar on pedestal - LARGER and more prominent
function PixelJarPedestal({ jarValue, isProfitable }: { jarValue: number; isProfitable: boolean }) {
  const fillLevel = Math.min(6, Math.max(1, Math.floor(jarValue / 150) + 1));
  
  return (
    <svg viewBox="0 0 32 40" width="96" height="120" style={{ imageRendering: "pixelated" }}>
      {/* Stone pedestal - more detailed */}
      <rect x="4" y="30" width="24" height="4" fill="#7c7c7c" />
      <rect x="2" y="34" width="28" height="6" fill="#5c5c5c" />
      <rect x="6" y="28" width="20" height="2" fill="#9c9c9c" />
      {/* Pedestal highlight */}
      <rect x="4" y="30" width="2" height="4" fill="#9c9c9c" />
      
      {/* Jar - larger and more detailed */}
      {/* Jar rim */}
      <rect x="9" y="4" width="14" height="3" fill="#fcbcb0" />
      <rect x="8" y="6" width="16" height="2" fill="#e0a090" />
      {/* Jar neck */}
      <rect x="10" y="8" width="12" height="3" fill="#fcbcb0" />
      {/* Jar body */}
      <rect x="7" y="11" width="18" height="17" fill="#fcbcb0" />
      
      {/* Jar contents - fill based on value */}
      <rect 
        x="8" 
        y={28 - fillLevel * 2.5} 
        width="16" 
        height={fillLevel * 2.5} 
        fill={isProfitable ? "#5ce65c" : "#e4464b"} 
      />
      
      {/* Jar shine/highlight */}
      <rect x="8" y="12" width="3" height="14" fill="#fff" opacity="0.35" />
      <rect x="9" y="5" width="2" height="2" fill="#fff" opacity="0.4" />
      
      {/* Jar shadow */}
      <rect x="22" y="12" width="2" height="14" fill="#000" opacity="0.2" />
      
      {/* Sparkles if profitable */}
      {isProfitable && (
        <>
          <rect x="2" y="2" width="3" height="3" fill="#FFD700" className="animate-pulse" />
          <rect x="27" y="6" width="3" height="3" fill="#FFD700" className="animate-pulse" />
          <rect x="0" y="14" width="2" height="2" fill="#fcfcfc" className="animate-pulse" />
          <rect x="30" y="18" width="2" height="2" fill="#fcfcfc" className="animate-pulse" />
        </>
      )}
    </svg>
  );
}

// Uniswap Unicorn - MUCH LARGER like Link in the original
function PixelUnicorn() {
  const [frame, setFrame] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % 2);
    }, 600);
    return () => clearInterval(interval);
  }, []);
  
  const yOffset = frame === 1 ? -2 : 0;
  
  return (
    <svg 
      viewBox="0 0 16 16" 
      width="64" 
      height="64" 
      style={{ imageRendering: "pixelated", transform: `translateY(${yOffset}px)` }}
    >
      {/* Back view - facing old man */}
      {/* Horn */}
      <rect x="7" y="0" width="2" height="3" fill="#FFD700" />
      <rect x="7" y="0" width="1" height="1" fill="#fff" opacity="0.5" />
      
      {/* Head/Mane from back */}
      <rect x="5" y="3" width="6" height="4" fill="#FF007A" />
      <rect x="4" y="4" width="2" height="3" fill="#7B61FF" />
      <rect x="10" y="4" width="2" height="3" fill="#7B61FF" />
      
      {/* Ears */}
      <rect x="4" y="2" width="2" height="2" fill="#FF007A" />
      <rect x="10" y="2" width="2" height="2" fill="#FF007A" />
      
      {/* Body */}
      <rect x="4" y="7" width="8" height="5" fill="#FF007A" />
      <rect x="3" y="8" width="10" height="3" fill="#c7005f" />
      
      {/* Legs */}
      <rect x="4" y="12" width="2" height="3" fill="#c7005f" />
      <rect x="10" y="12" width="2" height="3" fill="#c7005f" />
      
      {/* Hooves */}
      <rect x="4" y="15" width="2" height="1" fill="#FFD700" />
      <rect x="10" y="15" width="2" height="1" fill="#FFD700" />
      
      {/* Tail */}
      <rect x="2" y="8" width="2" height="2" fill="#7B61FF" />
      <rect x="1" y="9" width="2" height="2" fill="#7B61FF" />
      <rect x="0" y="10" width="2" height="2" fill="#7B61FF" />
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
      className="inline-block w-2 h-4 ml-1"
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
        <div className="zelda-game-screen w-full max-w-3xl aspect-[256/240] relative bg-[#0c0c0c] border-4 border-[#fcbcb0] overflow-hidden">
          
          {/* === CAVE WALLS === */}
          {/* Top wall - thicker */}
          <div 
            className="absolute top-0 left-0 right-0 h-16"
            style={{
              background: `
                repeating-linear-gradient(90deg, #5a4a3a 0px, #5a4a3a 30px, #3a2a1a 30px, #3a2a1a 32px),
                repeating-linear-gradient(0deg, #5a4a3a 0px, #5a4a3a 14px, #3a2a1a 14px, #3a2a1a 16px)
              `,
              backgroundSize: '64px 32px',
            }}
          />
          
          {/* Left wall */}
          <div 
            className="absolute top-16 left-0 w-16 bottom-20"
            style={{
              background: `
                repeating-linear-gradient(90deg, #5a4a3a 0px, #5a4a3a 14px, #3a2a1a 14px, #3a2a1a 16px),
                repeating-linear-gradient(0deg, #5a4a3a 0px, #5a4a3a 30px, #3a2a1a 30px, #3a2a1a 32px)
              `,
              backgroundSize: '32px 64px',
            }}
          />
          
          {/* Right wall */}
          <div 
            className="absolute top-16 right-0 w-16 bottom-20"
            style={{
              background: `
                repeating-linear-gradient(90deg, #5a4a3a 0px, #5a4a3a 14px, #3a2a1a 14px, #3a2a1a 16px),
                repeating-linear-gradient(0deg, #5a4a3a 0px, #5a4a3a 30px, #3a2a1a 30px, #3a2a1a 32px)
              `,
              backgroundSize: '32px 64px',
            }}
          />
          
          {/* Bottom wall with entrance opening */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-20"
            style={{
              background: `
                repeating-linear-gradient(90deg, #5a4a3a 0px, #5a4a3a 30px, #3a2a1a 30px, #3a2a1a 32px),
                repeating-linear-gradient(0deg, #5a4a3a 0px, #5a4a3a 14px, #3a2a1a 14px, #3a2a1a 16px)
              `,
              backgroundSize: '64px 32px',
            }}
          />
          
          {/* Cave entrance opening at bottom center */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-28 h-20 bg-[#0c0c0c]" />
          
          {/* Cave floor - brick pattern where unicorn stands */}
          <div 
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-28 h-8"
            style={{
              background: `
                repeating-linear-gradient(90deg, #4a3a2a 0px, #4a3a2a 12px, #2a1a0a 12px, #2a1a0a 14px),
                repeating-linear-gradient(0deg, #4a3a2a 0px, #4a3a2a 6px, #2a1a0a 6px, #2a1a0a 8px)
              `,
              backgroundSize: '28px 16px',
            }}
          />
          
          {/* Cave interior floor */}
          <div className="absolute top-16 left-16 right-16 bottom-20 bg-[#0c0c0c]" />
          
          {/* === TORCHES - positioned on walls === */}
          <div className="absolute left-20 top-16 z-10">
            <PixelTorch />
          </div>
          <div className="absolute right-20 top-16 z-10">
            <PixelTorch />
          </div>
          
          {/* === LOADING STATE === */}
          {!data && !error && (
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="text-[#fcfcfc] text-sm animate-pulse">LOADING...</div>
            </div>
          )}
          
          {/* === ERROR STATE === */}
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
          
          {/* === MAIN SCENE CONTENT === */}
          {data && (
            <>
              {/* Old Man - centered at top of cave interior */}
              <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10">
                <PixelOldMan isProfitable={data.isProfitable} />
              </div>
              
              {/* Token Jar on Pedestal - IN FRONT of old man, prominently displayed */}
              <div className="absolute top-36 left-1/2 -translate-x-1/2 z-10">
                <PixelJarPedestal jarValue={data.totalJarValueUsd} isProfitable={data.isProfitable} />
              </div>
              
              {/* Dialog box - between jar and unicorn */}
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-[75%] max-w-md z-20">
                <div className="bg-black border-2 border-[#fcfcfc] px-4 py-3">
                  <p className="text-[#fcfcfc] text-[11px] leading-relaxed text-center zelda-text">
                    {displayedText}
                    {isTyping && <BlinkingCursor />}
                  </p>
                </div>
              </div>
              
              {/* Unicorn player character - at cave entrance, LARGER */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10">
                <PixelUnicorn />
              </div>
              
              {/* Net profit indicator - top right corner */}
              <div className="absolute top-18 right-18 z-10 text-right">
                <div className={`text-xs font-bold ${data.isProfitable ? 'text-[#5ce65c]' : 'text-[#e4464b]'}`}>
                  {data.netProfitUsd >= 0 ? '+' : ''}${Math.abs(data.netProfitUsd).toLocaleString()}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Footer with contract links */}
      <footer className="bg-black border-t-2 border-[#fcbcb0] p-2">
        <div className="max-w-3xl mx-auto flex justify-between items-center text-[8px]">
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
