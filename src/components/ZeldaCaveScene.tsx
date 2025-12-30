"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

// =============================================================================
// ZELDA CAVE SCENE - Full-width with sprite-based backgrounds
// Uses the sides of the page, larger elements, no CSS patterns
// =============================================================================

interface ZeldaCaveSceneProps {
  isProfitable: boolean;
  message: string;
  jarValue: number;
}

// Animated torch component - LARGER
function AnimatedTorch({ side }: { side: "left" | "right" }) {
  const [frame, setFrame] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % 4);
    }, 150);
    return () => clearInterval(interval);
  }, []);
  
  const flameOffsets = [0, -3, 2, -1];
  
  return (
    <div className="relative flex flex-col items-center">
      <div 
        className="relative"
        style={{ 
          transform: `translateY(${flameOffsets[frame]}px) ${side === "right" ? "scaleX(-1)" : ""}`,
          filter: "drop-shadow(0 0 25px #FF6600) drop-shadow(0 0 50px #FF6600)",
        }}
      >
        <Image
          src="/assets/zelda/torch.png"
          alt="Torch"
          width={100}
          height={150}
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
        width={100}
        height={100}
        style={{ imageRendering: "pixelated" }}
        priority
      />
    </div>
  );
}

export default function ZeldaCaveScene({ isProfitable, message, jarValue }: ZeldaCaveSceneProps) {
  return (
    <div 
      className="w-full min-h-[600px] relative flex"
      style={{
        backgroundImage: "url('/assets/zelda/cave-wall.png')",
        backgroundSize: "64px 64px",
        imageRendering: "pixelated",
      }}
    >
      {/* Left side panel - Additional torches/decorations */}
      <div className="w-32 flex flex-col items-center justify-around py-8">
        <AnimatedTorch side="left" />
        <div className="flex flex-col gap-4">
          <div className="w-8 h-8 bg-[#8B4513] border-2 border-[#654321] animate-pulse" />
          <div className="w-8 h-8 bg-[#654321] border-2 border-[#8B4513]" />
          <div className="w-8 h-8 bg-[#8B4513] border-2 border-[#654321] animate-pulse" style={{ animationDelay: "0.5s" }} />
        </div>
        <AnimatedTorch side="left" />
      </div>
      
      {/* Main cave interior */}
      <div 
        className="flex-1 flex flex-col items-center justify-between py-8 relative"
        style={{
          backgroundImage: "url('/assets/zelda/cave-floor.png')",
          backgroundSize: "64px 64px",
          imageRendering: "pixelated",
          boxShadow: "inset 0 0 150px rgba(0,0,0,0.7)",
        }}
      >
        
        {/* Top section: Old Man */}
        <div className="flex flex-col items-center">
          <Image
            src="/assets/zelda/old-man.png"
            alt="Old Man Sage"
            width={160}
            height={200}
            style={{ imageRendering: "pixelated" }}
            priority
          />
        </div>
        
        {/* Middle section: Token Jar on Pedestal */}
        <div className="flex flex-col items-center relative my-4">
          {/* Glow effect when profitable */}
          {isProfitable && (
            <div 
              className="absolute inset-0 animate-pulse"
              style={{
                background: "radial-gradient(circle, rgba(255,215,0,0.5) 0%, transparent 70%)",
                filter: "blur(30px)",
                transform: "scale(2)",
              }}
            />
          )}
          
          <Image
            src="/assets/zelda/token-jar.png"
            alt="Token Jar"
            width={140}
            height={180}
            style={{ 
              imageRendering: "pixelated",
              filter: isProfitable ? "drop-shadow(0 0 30px gold)" : "none",
            }}
            priority
          />
          
          {/* Jar value label */}
          <div 
            className="mt-3 px-4 py-2 bg-black border-4 border-[#8B4513]"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            <span className="text-[#00FF00] text-lg">${jarValue.toFixed(0)}</span>
            <span className="text-[#666] text-xs ml-2">IN JAR</span>
          </div>
        </div>
        
        {/* Dialog box - LARGER */}
        <div 
          className="w-full max-w-3xl mx-auto bg-black border-4 border-[#FCE4B8] p-6"
          style={{ fontFamily: "'Press Start 2P', monospace" }}
        >
          <div className="text-sm leading-relaxed min-h-[60px]">
            <TypewriterText text={message} isProfitable={isProfitable} />
          </div>
        </div>
        
        {/* Bottom: Unicorn character - LARGER */}
        <div className="flex flex-col items-center mt-4">
          <AnimatedUnicorn />
        </div>
        
      </div>
      
      {/* Right side panel - Additional torches/decorations */}
      <div className="w-32 flex flex-col items-center justify-around py-8">
        <AnimatedTorch side="right" />
        <div className="flex flex-col gap-4">
          <div className="w-8 h-8 bg-[#8B4513] border-2 border-[#654321] animate-pulse" style={{ animationDelay: "0.3s" }} />
          <div className="w-8 h-8 bg-[#654321] border-2 border-[#8B4513]" />
          <div className="w-8 h-8 bg-[#8B4513] border-2 border-[#654321] animate-pulse" style={{ animationDelay: "0.7s" }} />
        </div>
        <AnimatedTorch side="right" />
      </div>
      
    </div>
  );
}
