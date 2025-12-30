"use client";

import { useState, useEffect } from "react";

// =============================================================================
// ZELDA-STYLE MESSAGE BOX COMPONENT
// Inspired by "It's dangerous to go alone! Take this." from The Legend of Zelda
// Uses Uniswap pink theme to match the app aesthetic
// =============================================================================

interface ZeldaMessageBoxProps {
  isProfitable: boolean;
  netProfit: number;
}

// Pixel art old man/sage character - Uniswap themed
function PixelSage({ isProfitable }: { isProfitable: boolean }) {
  return (
    <svg viewBox="0 0 24 32" width="48" height="64" style={{ imageRendering: "pixelated" }}>
      {/* Hood/Head - Pink themed */}
      <rect x="8" y="2" width="8" height="2" fill="#FF007A" />
      <rect x="6" y="4" width="12" height="2" fill="#FF007A" />
      <rect x="5" y="6" width="14" height="4" fill="#c7005f" />
      
      {/* Face */}
      <rect x="7" y="8" width="10" height="6" fill="#fcd9b6" />
      {/* Eyes */}
      <rect x="8" y="9" width="2" height="2" fill="#191B1F" />
      <rect x="14" y="9" width="2" height="2" fill="#191B1F" />
      {/* Eye shine */}
      <rect x="8" y="9" width="1" height="1" fill="#fff" />
      <rect x="14" y="9" width="1" height="1" fill="#fff" />
      {/* Beard */}
      <rect x="9" y="12" width="6" height="2" fill="#e5e5e5" />
      <rect x="10" y="14" width="4" height="2" fill="#d4d4d4" />
      <rect x="11" y="16" width="2" height="1" fill="#c4c4c4" />
      
      {/* Robe body - Pink themed */}
      <rect x="4" y="14" width="16" height="10" fill="#FF007A" />
      <rect x="3" y="16" width="18" height="8" fill="#c7005f" />
      {/* Robe highlight */}
      <rect x="11" y="14" width="2" height="10" fill="#ff5fa2" />
      
      {/* Arms */}
      <rect x="1" y="18" width="4" height="3" fill="#FF007A" />
      <rect x="19" y="18" width="4" height="3" fill="#FF007A" />
      {/* Hands */}
      <rect x="0" y="19" width="2" height="2" fill="#fcd9b6" />
      <rect x="22" y="19" width="2" height="2" fill="#fcd9b6" />
      
      {/* Feet */}
      <rect x="6" y="24" width="4" height="2" fill="#2D2F36" />
      <rect x="14" y="24" width="4" height="2" fill="#2D2F36" />
      
      {/* Item being held - Gold coin for profitable, Flame for not */}
      {isProfitable ? (
        <>
          {/* Gold coin */}
          <rect x="10" y="20" width="4" height="4" fill="#FFD700" />
          <rect x="11" y="21" width="2" height="2" fill="#fff" opacity="0.6" />
        </>
      ) : (
        <>
          {/* Warning flame */}
          <rect x="11" y="18" width="2" height="2" fill="#ff6b35" />
          <rect x="10" y="19" width="4" height="2" fill="#ff4500" />
          <rect x="11" y="21" width="2" height="2" fill="#FFD700" />
        </>
      )}
    </svg>
  );
}

// Blinking cursor for retro text effect
function BlinkingCursor() {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    const interval = setInterval(() => setVisible(v => !v), 530);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <span 
      className="inline-block w-2 h-4 ml-1 align-middle"
      style={{ 
        backgroundColor: visible ? '#FF007A' : 'transparent',
        transition: 'none'
      }}
    />
  );
}

// Get message based on profitability
function getMessage(isProfitable: boolean, netProfit: number): { title: string; message: string } {
  if (isProfitable) {
    const profit = Math.abs(netProfit).toLocaleString();
    return {
      title: "THE JAR OVERFLOWS!",
      message: `IT'S PROFITABLE TO BURN! CLAIM YOUR +$${profit} REWARD.`
    };
  } else {
    const loss = Math.abs(netProfit).toLocaleString();
    return {
      title: "HEED MY WARNING!",
      message: `IT'S DANGEROUS TO BURN ALONE! YOU WOULD LOSE $${loss}.`
    };
  }
}

export default function ZeldaMessageBox({ isProfitable, netProfit }: ZeldaMessageBoxProps) {
  const { title, message } = getMessage(isProfitable, netProfit);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  
  // Typewriter effect
  useEffect(() => {
    setDisplayedText("");
    setIsTyping(true);
    let index = 0;
    const fullText = message;
    
    const typeInterval = setInterval(() => {
      if (index < fullText.length) {
        setDisplayedText(fullText.slice(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(typeInterval);
      }
    }, 35);
    
    return () => clearInterval(typeInterval);
  }, [message]);

  return (
    <div className="retro-panel p-4 relative overflow-hidden">
      {/* Header label */}
      <div className="absolute -top-0 left-1/2 -translate-x-1/2 px-3 py-0.5 text-[8px] tracking-widest text-[#FF007A] bg-[#191B1F] border-x-2 border-b-2 border-[#FF007A]">
        ◆ SAGE SPEAKS ◆
      </div>
      
      {/* Content */}
      <div className="flex gap-4 mt-2">
        {/* Sage character */}
        <div className="flex-shrink-0 flex items-center">
          <div className={isProfitable ? 'sage-glow-gold' : 'sage-glow-fire'}>
            <PixelSage isProfitable={isProfitable} />
          </div>
        </div>
        
        {/* Message content */}
        <div className="flex-1 flex flex-col justify-center min-w-0">
          {/* Title */}
          <div 
            className={`text-xs mb-2 tracking-wider ${
              isProfitable ? 'text-[#FFD700]' : 'text-[#FF007A]'
            }`}
            style={{
              textShadow: isProfitable 
                ? '0 0 10px rgba(255, 215, 0, 0.6)' 
                : '0 0 10px rgba(255, 0, 122, 0.6)'
            }}
          >
            {title}
          </div>
          
          {/* Message with typewriter effect */}
          <div className="text-[10px] text-gray-300 leading-relaxed">
            {displayedText}
            {isTyping && <BlinkingCursor />}
          </div>
          
          {/* Status indicator */}
          <div className="mt-3 flex items-center gap-2">
            <div 
              className={`w-2 h-2 ${isProfitable ? 'bg-[#FFD700]' : 'bg-[#FF007A]'}`}
              style={{ 
                boxShadow: `0 0 8px ${isProfitable ? '#FFD700' : '#FF007A'}`,
                animation: 'pulse 1.5s ease-in-out infinite'
              }}
            />
            <span className={`text-[8px] ${isProfitable ? 'text-[#FFD700]' : 'text-[#FF007A]'}`}>
              {isProfitable ? 'OPPORTUNITY DETECTED' : 'DANGER ZONE'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Decorative pixel corners */}
      <div className="absolute top-2 left-2 w-2 h-2 border-t-2 border-l-2 border-[#FF007A] opacity-50" />
      <div className="absolute top-2 right-2 w-2 h-2 border-t-2 border-r-2 border-[#FF007A] opacity-50" />
      <div className="absolute bottom-2 left-2 w-2 h-2 border-b-2 border-l-2 border-[#FF007A] opacity-50" />
      <div className="absolute bottom-2 right-2 w-2 h-2 border-b-2 border-r-2 border-[#FF007A] opacity-50" />
      
      {/* CSS for glow animations */}
      <style jsx>{`
        .sage-glow-gold {
          animation: glowGold 2s ease-in-out infinite;
        }
        .sage-glow-fire {
          animation: glowFire 1.5s ease-in-out infinite;
        }
        @keyframes glowGold {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(255, 215, 0, 0.4)); }
          50% { filter: drop-shadow(0 0 12px rgba(255, 215, 0, 0.8)); }
        }
        @keyframes glowFire {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(255, 0, 122, 0.4)); }
          50% { filter: drop-shadow(0 0 12px rgba(255, 0, 122, 0.8)); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
