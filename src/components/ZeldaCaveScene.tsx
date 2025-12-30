"use client";

import { useState, useEffect } from "react";

// =============================================================================
// ZELDA CAVE SCENE COMPONENT
// Replicates the classic "It's dangerous to go alone" cave scene
// =============================================================================

interface ZeldaCaveSceneProps {
  isProfitable: boolean;
  netProfit: number;
  jarValue: number;
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
  
  const flameOffsets = [
    { x: 0, h: 8 },
    { x: 1, h: 10 },
    { x: -1, h: 9 },
  ];
  const offset = flameOffsets[frame];
  
  return (
    <svg viewBox="0 0 16 32" width="32" height="64" style={{ imageRendering: "pixelated" }}>
      {/* Torch handle */}
      <rect x="6" y="16" width="4" height="14" fill="#8b4513" />
      <rect x="5" y="28" width="6" height="4" fill="#5c3317" />
      
      {/* Flame base */}
      <rect x="4" y="12" width="8" height="6" fill="#fc6c18" />
      
      {/* Animated flame */}
      <rect x={5 + offset.x} y={14 - offset.h} width="6" height={offset.h} fill="#fcbc18" />
      <rect x={6 + offset.x} y={12 - offset.h} width="4" height={offset.h - 2} fill="#fc9090" />
      <rect x={7 + offset.x} y={10 - offset.h} width="2" height={offset.h - 4} fill="#fcfcfc" />
      
      {/* Glow effect */}
      <rect x="2" y="10" width="12" height="10" fill="#fc6c18" opacity="0.3" />
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
  // Fill level based on value
  const fillLevel = Math.min(5, Math.max(1, Math.floor(jarValue / 200) + 1));
  
  return (
    <svg viewBox="0 0 24 32" width="72" height="96" style={{ imageRendering: "pixelated" }}>
      {/* Pedestal */}
      <rect x="4" y="24" width="16" height="4" fill="#5c5c5c" />
      <rect x="2" y="28" width="20" height="4" fill="#3c3c3c" />
      <rect x="6" y="22" width="12" height="2" fill="#7c7c7c" />
      
      {/* Jar */}
      {/* Jar rim */}
      <rect x="7" y="6" width="10" height="2" fill="#fcbcb0" />
      {/* Jar neck */}
      <rect x="8" y="8" width="8" height="2" fill="#fcbcb0" />
      {/* Jar body */}
      <rect x="6" y="10" width="12" height="12" fill="#fcbcb0" />
      
      {/* Jar contents - fill based on value */}
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
          <rect x="2" y="12" width="2" height="2" fill="#FFD700" className="animate-pulse" />
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

// Cave brick wall pattern
function CaveBricks() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Top wall */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-repeat"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              90deg,
              #3c3c3c 0px,
              #3c3c3c 30px,
              #2c2c2c 30px,
              #2c2c2c 32px
            ),
            repeating-linear-gradient(
              0deg,
              #3c3c3c 0px,
              #3c3c3c 14px,
              #2c2c2c 14px,
              #2c2c2c 16px
            )
          `,
          backgroundSize: '64px 32px',
        }}
      />
      
      {/* Left wall */}
      <div className="absolute top-16 left-0 w-16 bottom-16 bg-repeat"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              90deg,
              #3c3c3c 0px,
              #3c3c3c 14px,
              #2c2c2c 14px,
              #2c2c2c 16px
            ),
            repeating-linear-gradient(
              0deg,
              #3c3c3c 0px,
              #3c3c3c 30px,
              #2c2c2c 30px,
              #2c2c2c 32px
            )
          `,
          backgroundSize: '32px 64px',
        }}
      />
      
      {/* Right wall */}
      <div className="absolute top-16 right-0 w-16 bottom-16 bg-repeat"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              90deg,
              #3c3c3c 0px,
              #3c3c3c 14px,
              #2c2c2c 14px,
              #2c2c2c 16px
            ),
            repeating-linear-gradient(
              0deg,
              #3c3c3c 0px,
              #3c3c3c 30px,
              #2c2c2c 30px,
              #2c2c2c 32px
            )
          `,
          backgroundSize: '32px 64px',
        }}
      />
      
      {/* Bottom wall */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-repeat"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              90deg,
              #3c3c3c 0px,
              #3c3c3c 30px,
              #2c2c2c 30px,
              #2c2c2c 32px
            ),
            repeating-linear-gradient(
              0deg,
              #3c3c3c 0px,
              #3c3c3c 14px,
              #2c2c2c 14px,
              #2c2c2c 16px
            )
          `,
          backgroundSize: '64px 32px',
        }}
      />
    </div>
  );
}

export default function ZeldaCaveScene({ isProfitable, netProfit, jarValue }: ZeldaCaveSceneProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  
  // Select message based on profitability
  const messages = isProfitable ? PROFITABLE_MESSAGES : NOT_PROFITABLE_MESSAGES;
  const messageIndex = Math.floor(Math.abs(netProfit) % messages.length);
  const message = messages[messageIndex];
  
  // Typewriter effect
  useEffect(() => {
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
  }, [message]);

  return (
    <div className="zelda-cave relative bg-black" style={{ aspectRatio: '256/224' }}>
      {/* Cave brick walls */}
      <CaveBricks />
      
      {/* Cave floor - darker area */}
      <div className="absolute inset-16 bg-[#1c1c1c]" />
      
      {/* Torches */}
      <div className="absolute left-20 top-20">
        <PixelTorch />
      </div>
      <div className="absolute right-20 top-20">
        <PixelTorch />
      </div>
      
      {/* Old Man */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2">
        <PixelOldMan isProfitable={isProfitable} />
      </div>
      
      {/* Token Jar on Pedestal */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/4">
        <PixelJarPedestal jarValue={jarValue} isProfitable={isProfitable} />
      </div>
      
      {/* Dialog box */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-4/5 max-w-md">
        <div className="bg-black border-2 border-[#fcfcfc] p-3">
          <p className="text-[#fcfcfc] text-xs leading-relaxed text-center" style={{ fontFamily: "'Press Start 2P', monospace" }}>
            {displayedText}
            {isTyping && <BlinkingCursor />}
          </p>
        </div>
      </div>
      
      {/* Value display */}
      <div className="absolute bottom-4 right-4 text-right">
        <div className={`text-xs ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
          {isProfitable ? '+' : ''}{netProfit >= 0 ? '+' : ''}${Math.abs(netProfit).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
