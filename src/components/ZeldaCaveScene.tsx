"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

// =============================================================================
// ZELDA CAVE SCENE - Wider cave interior with proper NES aesthetic
// Fixed: wider layout, floor texture visible, dialog arrow, torch animation
// =============================================================================

interface ZeldaCaveSceneProps {
  isProfitable: boolean;
  message: string;
  jarValue: number;
}

// Animated torch with multi-frame flickering
function AnimatedTorch({ side }: { side: "left" | "right" }) {
  const [frame, setFrame] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % 6);
    }, 120);
    return () => clearInterval(interval);
  }, []);
  
  // More dynamic flame animation
  const flameOffsets = [0, -3, -1, -4, -2, 0];
  const flameScales = [1, 1.05, 0.95, 1.1, 0.98, 1.02];
  const glowIntensity = [20, 25, 18, 30, 22, 24];
  
  return (
    <div className="relative flex flex-col items-center">
      <div 
        className="relative"
        style={{ 
          transform: `translateY(${flameOffsets[frame]}px) scaleY(${flameScales[frame]}) ${side === "right" ? "scaleX(-1)" : ""}`,
          filter: `drop-shadow(0 0 ${glowIntensity[frame]}px #FF6600) drop-shadow(0 0 ${glowIntensity[frame] * 2}px #FF4400)`,
          transition: "transform 0.1s ease-out",
        }}
      >
        <Image
          src="/assets/zelda/torch.png"
          alt="Torch"
          width={56}
          height={112}
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

// Animated unicorn with bounce
function AnimatedUnicorn() {
  const [frame, setFrame] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % 2);
    }, 600);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div style={{ transform: `translateY(${frame === 1 ? -4 : 0}px)`, transition: "transform 0.3s ease-out" }}>
      <Image
        src="/assets/zelda/unicorn.png"
        alt="Uniswap Unicorn"
        width={128}
        height={128}
        style={{ imageRendering: "pixelated" }}
        priority
      />
    </div>
  );
}

// Dialog arrow indicator (classic RPG style)
function DialogArrow() {
  const [bounce, setBounce] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setBounce((b) => (b + 1) % 2);
    }, 400);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div 
      className="absolute -top-4 left-1/2 transform -translate-x-1/2"
      style={{ transform: `translateX(-50%) translateY(${bounce === 1 ? -2 : 0}px)` }}
    >
      <svg viewBox="0 0 12 8" width="24" height="16" style={{ imageRendering: "pixelated" }}>
        <polygon points="0,8 6,0 12,8" fill="#FCE4B8" />
      </svg>
    </div>
  );
}

export default function ZeldaCaveScene({ isProfitable, message, jarValue }: ZeldaCaveSceneProps) {
  return (
    <div 
      className="w-full min-h-[520px] relative flex"
      style={{
        backgroundImage: "url('/assets/zelda/cave-wall.png')",
        backgroundSize: "64px 64px",
        imageRendering: "pixelated",
      }}
    >
      {/* Left wall with torches - narrower */}
      <div className="w-16 flex flex-col items-center justify-around py-8">
        <AnimatedTorch side="left" />
        <AnimatedTorch side="left" />
      </div>
      
      {/* Main cave interior - WIDER with visible floor */}
      <div 
        className="flex-1 relative"
        style={{
          backgroundImage: "url('/assets/zelda/cave-floor.png')",
          backgroundSize: "64px 64px",
          imageRendering: "pixelated",
        }}
      >
        {/* Subtle vignette for depth - less dark */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)",
          }}
        />
        
        {/* Content container - horizontal layout for old man and jar */}
        <div className="relative z-10 h-full flex flex-col items-center justify-between py-4">
          
          {/* Top row: Old Man with more space */}
          <div className="flex flex-col items-center">
            <Image
              src="/assets/zelda/old-man.png"
              alt="Old Man Sage"
              width={112}
              height={140}
              style={{ imageRendering: "pixelated" }}
              priority
            />
          </div>
          
          {/* Middle row: Token Jar - more prominent */}
          <div className="flex flex-col items-center relative -mt-2">
            {/* Glow effect when profitable */}
            {isProfitable && (
              <div 
                className="absolute inset-0 animate-pulse"
                style={{
                  background: "radial-gradient(circle, rgba(255,215,0,0.5) 0%, transparent 70%)",
                  filter: "blur(25px)",
                  transform: "scale(2)",
                }}
              />
            )}
            
            <Image
              src="/assets/zelda/token-jar.png"
              alt="Token Jar"
              width={112}
              height={140}
              style={{ 
                imageRendering: "pixelated",
                filter: isProfitable ? "drop-shadow(0 0 25px gold)" : "none",
              }}
              priority
            />
            
            {/* Jar value label */}
            <div 
              className="mt-1 px-4 py-1 bg-black/90 border-2 border-[#8B4513]"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              <span className="text-[#00FF00] text-lg">${jarValue.toFixed(0)}</span>
              <span className="text-[#888] text-[10px] ml-2">IN JAR</span>
            </div>
          </div>
          
          {/* Dialog box with arrow */}
          <div className="w-full max-w-2xl mx-auto relative">
            <DialogArrow />
            <div 
              className="bg-black/95 border-4 border-[#FCE4B8] p-4"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              <div className="text-xs leading-relaxed min-h-[48px]">
                <TypewriterText text={message} isProfitable={isProfitable} />
              </div>
            </div>
          </div>
          
          {/* Bottom: Unicorn character */}
          <div className="flex flex-col items-center mt-2">
            <AnimatedUnicorn />
          </div>
          
        </div>
      </div>
      
      {/* Right wall with torches - narrower */}
      <div className="w-16 flex flex-col items-center justify-around py-8">
        <AnimatedTorch side="right" />
        <AnimatedTorch side="right" />
      </div>
      
    </div>
  );
}
