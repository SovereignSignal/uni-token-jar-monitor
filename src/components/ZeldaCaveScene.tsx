"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

// =============================================================================
// ZELDA CAVE SCENE - Full-width with sprite-based backgrounds
// All sprites now match NES pixel density (chunky 8-bit style)
// =============================================================================

interface ZeldaCaveSceneProps {
  isProfitable: boolean;
  message: string;
  jarValue: number;
}

// Animated torch component - NES style
function AnimatedTorch({ side }: { side: "left" | "right" }) {
  const [frame, setFrame] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % 4);
    }, 150);
    return () => clearInterval(interval);
  }, []);
  
  const flameOffsets = [0, -2, 1, -1];
  
  return (
    <div className="relative flex flex-col items-center">
      <div 
        className="relative"
        style={{ 
          transform: `translateY(${flameOffsets[frame]}px) ${side === "right" ? "scaleX(-1)" : ""}`,
          filter: "drop-shadow(0 0 20px #FF6600) drop-shadow(0 0 40px #FF6600)",
        }}
      >
        <Image
          src="/assets/zelda/torch.png"
          alt="Torch"
          width={64}
          height={128}
          style={{ imageRendering: "pixelated" }}
          priority
        />
      </div>
    </div>
  );
}

// Typewriter text effect
function TypewriterText({ text, isProfitable }: { text: string; isProfitable: boolean }) {
  const [displayText, setDisplayText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  
  useEffect(() => {
    setDisplayText("");
    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 35);
    return () => clearInterval(interval);
  }, [text]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor((s) => !s);
    }, 500);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <span className={isProfitable ? "text-[#00FF00]" : "text-[#FCE4B8]"}>
      {displayText}
      <span className={`${showCursor ? "opacity-100" : "opacity-0"} ${isProfitable ? "text-[#00FF00]" : "text-[#FF6600]"}`}>
        ▌
      </span>
    </span>
  );
}

// Animated unicorn with bounce - NES style
function AnimatedUnicorn() {
  const [frame, setFrame] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % 2);
    }, 600);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div style={{ transform: `translateY(${frame === 1 ? -3 : 0}px)`, transition: "transform 0.3s ease-out" }}>
      <Image
        src="/assets/zelda/unicorn.png"
        alt="Uniswap Unicorn"
        width={80}
        height={80}
        style={{ imageRendering: "pixelated" }}
        priority
      />
    </div>
  );
}

export default function ZeldaCaveScene({ isProfitable, message, jarValue }: ZeldaCaveSceneProps) {
  return (
    <div 
      className="w-full min-h-[550px] relative flex"
      style={{
        backgroundImage: "url('/assets/zelda/cave-wall.png')",
        backgroundSize: "64px 64px",
        imageRendering: "pixelated",
      }}
    >
      {/* Left side panel - Torches on wall */}
      <div className="w-24 flex flex-col items-center justify-around py-6">
        <AnimatedTorch side="left" />
        <AnimatedTorch side="left" />
      </div>
      
      {/* Main cave interior with floor texture */}
      <div 
        className="flex-1 flex flex-col items-center justify-between py-6 relative"
        style={{
          backgroundImage: "url('/assets/zelda/cave-floor.png')",
          backgroundSize: "64px 64px",
          imageRendering: "pixelated",
        }}
      >
        {/* Vignette overlay for depth */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.6) 100%)",
          }}
        />
        
        {/* Top section: Old Man - NES style sprite */}
        <div className="flex flex-col items-center relative z-10">
          <Image
            src="/assets/zelda/old-man.png"
            alt="Old Man Sage"
            width={96}
            height={128}
            style={{ imageRendering: "pixelated" }}
            priority
          />
        </div>
        
        {/* Middle section: Token Jar on Pedestal - NES style */}
        <div className="flex flex-col items-center relative z-10 my-2">
          {/* Glow effect when profitable */}
          {isProfitable && (
            <div 
              className="absolute inset-0 animate-pulse"
              style={{
                background: "radial-gradient(circle, rgba(255,215,0,0.4) 0%, transparent 70%)",
                filter: "blur(20px)",
                transform: "scale(1.5)",
              }}
            />
          )}
          
          <Image
            src="/assets/zelda/token-jar.png"
            alt="Token Jar"
            width={96}
            height={128}
            style={{ 
              imageRendering: "pixelated",
              filter: isProfitable ? "drop-shadow(0 0 20px gold)" : "none",
            }}
            priority
          />
          
          {/* Jar value label */}
          <div 
            className="mt-2 px-3 py-1 bg-black/90 border-2 border-[#8B4513]"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            <span className="text-[#00FF00] text-base">${jarValue.toFixed(0)}</span>
            <span className="text-[#666] text-[8px] ml-1">IN JAR</span>
          </div>
        </div>
        
        {/* Dialog box */}
        <div 
          className="w-full max-w-2xl mx-auto bg-black/95 border-4 border-[#FCE4B8] p-4 relative z-10"
          style={{ fontFamily: "'Press Start 2P', monospace" }}
        >
          <div className="text-xs leading-relaxed min-h-[48px]">
            <TypewriterText text={message} isProfitable={isProfitable} />
          </div>
        </div>
        
        {/* Bottom: Unicorn character - NES style */}
        <div className="flex flex-col items-center mt-3 relative z-10">
          <AnimatedUnicorn />
        </div>
        
      </div>
      
      {/* Right side panel - Torches on wall */}
      <div className="w-24 flex flex-col items-center justify-around py-6">
        <AnimatedTorch side="right" />
        <AnimatedTorch side="right" />
      </div>
      
    </div>
  );
}
