"use client";

import { useEffect, useState, useCallback } from "react";
import { REFRESH_INTERVAL_MS, TOKENJAR_ADDRESS, FIREPIT_ADDRESS } from "@/lib/constants";
import type { TokenJarApiResponse } from "./api/tokenjar/route";
import type { ProfitabilityData } from "@/lib/profitability";
import ZeldaHUD from "@/components/ZeldaHUD";
import ZeldaCaveScene from "@/components/ZeldaCaveScene";
import ZeldaStatsBar from "@/components/ZeldaStatsBar";

// =============================================================================
// ZELDA NES-STYLE TOKEN JAR MONITOR
// Full-width layout using all screen real estate
// Three sections: HUD (top) | Cave Scene (middle) | Stats Bar (bottom)
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

export default function Home() {
  const [data, setData] = useState<ProfitabilityData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  // Loading state
  const isLoading = !data && !error;

  return (
    <main className="min-h-screen flex flex-col">
      
      {/* === TOP: ZELDA HUD === */}
      <ZeldaHUD
        jarValue={data?.totalJarValueUsd ?? 0}
        burnCost={data?.burnCostUsd ?? 0}
        netProfit={data?.netProfitUsd ?? 0}
        uniPrice={data?.uniPriceUsd ?? 0}
        isProfitable={data?.isProfitable ?? false}
        isLoading={isLoading}
        tokenCount={data?.displayTokens?.length ?? 0}
      />
      
      {/* === MIDDLE: CAVE SCENE (takes all remaining space) === */}
      <div className="flex-1">
        {error ? (
          // Error state
          <div 
            className="w-full h-full min-h-[400px] flex items-center justify-center"
            style={{
              backgroundImage: "url('/assets/zelda/cave-wall.png')",
              backgroundSize: "64px 64px",
            }}
          >
            <div 
              className="bg-black border-4 border-[#FF0000] p-8 max-w-md"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              <div className="text-[#FF0000] text-xl mb-4">GAME OVER</div>
              <div className="text-[#FCE4B8] text-sm mb-6">{error}</div>
              <button 
                onClick={fetchData}
                className="px-8 py-3 bg-[#8B4513] text-[#FCE4B8] text-sm border-4 border-[#654321] hover:bg-[#654321] transition-colors"
              >
                CONTINUE?
              </button>
            </div>
          </div>
        ) : isLoading ? (
          // Loading state
          <div 
            className="w-full h-full min-h-[400px] flex items-center justify-center"
            style={{
              backgroundImage: "url('/assets/zelda/cave-wall.png')",
              backgroundSize: "64px 64px",
            }}
          >
            <div 
              className="text-[#FCE4B8] text-2xl animate-pulse"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              LOADING...
            </div>
          </div>
        ) : (
          // Main cave scene
          <ZeldaCaveScene
            isProfitable={data?.isProfitable ?? false}
            message={message}
            jarValue={data?.totalJarValueUsd ?? 0}
          />
        )}
      </div>
      
      {/* === BOTTOM: STATS BAR === */}
      <ZeldaStatsBar
        gasEstimate={data?.gasEstimateUsd ?? 50}
        tokenCount={data?.displayTokens?.length ?? 0}
        tokenValue={data?.totalJarValueUsd ?? 0}
        uniPrice={data?.uniPriceUsd ?? 0}
        netProfit={data?.netProfitUsd ?? 0}
        isProfitable={data?.isProfitable ?? false}
        isLoading={isLoading}
        lastUpdate={lastFetch ? formatTimeAgo(lastFetch) : ""}
      />
      
      {/* === FOOTER: Contract Links === */}
      <footer 
        className="px-6 py-2"
        style={{ 
          fontFamily: "'Press Start 2P', monospace",
          backgroundImage: "url('/assets/zelda/cave-wall.png')",
          backgroundSize: "64px 64px",
          borderTop: "4px solid #654321",
        }}
      >
        <div className="max-w-6xl mx-auto flex justify-between items-center text-[8px]">
          <div className="text-[#666] bg-black/80 px-2 py-1">
            REFRESHES EVERY 30S • PRICES VIA COINGECKO
          </div>
          <div className="flex gap-6 bg-black/80 px-2 py-1">
            <a 
              href={`https://etherscan.io/address/${TOKENJAR_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#8B4513] hover:text-[#FCE4B8] transition-colors"
            >
              JAR CONTRACT
            </a>
            <a 
              href={`https://etherscan.io/address/${FIREPIT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#8B4513] hover:text-[#FCE4B8] transition-colors"
            >
              FIREPIT
            </a>
          </div>
        </div>
      </footer>
      
    </main>
  );
}
