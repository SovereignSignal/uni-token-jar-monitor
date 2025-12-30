"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
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

// Blinking cursor for typewriter effect
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

// Animated torch component using PNG sprite
function AnimatedTorch({ flipped = false }: { flipped?: boolean }) {
  const [frame, setFrame] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % 4);
    }, 150);
    return () => clearInterval(interval);
  }, []);
  
  // Subtle animation by changing scale/position
  const transforms = [
    'scale(1) translateY(0)',
    'scale(1.02) translateY(-2px)',
    'scale(0.98) translateY(1px)',
    'scale(1.01) translateY(-1px)',
  ];
  
  return (
    <div 
      className="relative"
      style={{ 
        transform: `${transforms[frame]} ${flipped ? 'scaleX(-1)' : ''}`,
        transition: 'transform 0.1s ease-out',
        imageRendering: 'pixelated',
      }}
    >
      <Image
        src="/assets/zelda/torch.png"
        alt="Torch"
        width={80}
        height={160}
        className="drop-shadow-[0_0_20px_rgba(252,188,24,0.6)]"
        style={{ imageRendering: 'pixelated' }}
        priority
      />
    </div>
  );
}

// Animated unicorn with idle bounce
function AnimatedUnicorn() {
  const [frame, setFrame] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % 2);
    }, 600);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div 
      style={{ 
        transform: `translateY(${frame === 1 ? -4 : 0}px)`,
        transition: 'transform 0.3s ease-out',
        imageRendering: 'pixelated',
      }}
    >
      <Image
        src="/assets/zelda/unicorn.png"
        alt="Uniswap Unicorn"
        width={80}
        height={80}
        style={{ imageRendering: 'pixelated' }}
        priority
      />
    </div>
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
          {/* Top wall */}
          <div 
            className="absolute top-0 left-0 right-0 h-20"
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
            className="absolute top-20 left-0 w-20 bottom-24"
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
            className="absolute top-20 right-0 w-20 bottom-24"
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
            className="absolute bottom-0 left-0 right-0 h-24"
            style={{
              background: `
                repeating-linear-gradient(90deg, #5a4a3a 0px, #5a4a3a 30px, #3a2a1a 30px, #3a2a1a 32px),
                repeating-linear-gradient(0deg, #5a4a3a 0px, #5a4a3a 14px, #3a2a1a 14px, #3a2a1a 16px)
              `,
              backgroundSize: '64px 32px',
            }}
          />
          
          {/* Cave entrance opening at bottom center */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-24 bg-[#0c0c0c]" />
          
          {/* Cave floor - brick pattern where unicorn stands */}
          <div 
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-10"
            style={{
              background: `
                repeating-linear-gradient(90deg, #4a3a2a 0px, #4a3a2a 14px, #2a1a0a 14px, #2a1a0a 16px),
                repeating-linear-gradient(0deg, #4a3a2a 0px, #4a3a2a 8px, #2a1a0a 8px, #2a1a0a 10px)
              `,
              backgroundSize: '32px 20px',
            }}
          />
          
          {/* Cave interior floor */}
          <div className="absolute top-20 left-20 right-20 bottom-24 bg-[#0c0c0c]" />
          
          {/* === TORCHES - positioned on walls === */}
          <div className="absolute left-24 top-20 z-10">
            <AnimatedTorch />
          </div>
          <div className="absolute right-24 top-20 z-10">
            <AnimatedTorch flipped />
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
              <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10">
                <Image
                  src="/assets/zelda/old-man.png"
                  alt="Old Man Sage"
                  width={120}
                  height={180}
                  style={{ imageRendering: 'pixelated' }}
                  priority
                />
              </div>
              
              {/* Token Jar on Pedestal - IN FRONT of old man */}
              <div className="absolute top-44 left-1/2 -translate-x-1/2 z-10">
                <div className={data.isProfitable ? 'animate-pulse' : ''}>
                  <Image
                    src="/assets/zelda/token-jar.png"
                    alt="Token Jar"
                    width={100}
                    height={100}
                    className={data.isProfitable ? 'drop-shadow-[0_0_15px_rgba(255,215,0,0.6)]' : ''}
                    style={{ imageRendering: 'pixelated' }}
                    priority
                  />
                </div>
              </div>
              
              {/* Dialog box - between jar and unicorn */}
              <div className="absolute bottom-28 left-1/2 -translate-x-1/2 w-[80%] max-w-lg z-20">
                <div className="bg-black border-2 border-[#fcfcfc] px-4 py-3">
                  <p className="text-[#fcfcfc] text-[11px] leading-relaxed text-center zelda-text">
                    {displayedText}
                    {isTyping && <BlinkingCursor />}
                  </p>
                </div>
              </div>
              
              {/* Unicorn player character - at cave entrance */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10">
                <AnimatedUnicorn />
              </div>
              
              {/* Net profit indicator - top right corner */}
              <div className="absolute top-22 right-22 z-10 text-right">
                <div className={`text-sm font-bold ${data.isProfitable ? 'text-[#5ce65c]' : 'text-[#e4464b]'}`}>
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
