"use client";

import { useState, useEffect } from "react";

// =============================================================================
// ZELDA-STYLE MESSAGE BOX COMPONENT
// Inspired by "It's dangerous to go alone! Take this." from The Legend of Zelda
// =============================================================================

interface ZeldaMessageBoxProps {
  isProfitable: boolean;
  netProfit: number;
}

// Pixel art old man/sage character (simplified)
function PixelSage({ isProfitable }: { isProfitable: boolean }) {
  const robeColor = isProfitable ? "#22c55e" : "#ef4444";
  const robeHighlight = isProfitable ? "#4ade80" : "#f87171";
  
  return (
    <svg viewBox="0 0 24 32" width="48" height="64" style={{ imageRendering: "pixelated" }}>
      {/* Hood/Head */}
      <rect x="8" y="2" width="8" height="2" fill={robeColor} />
      <rect x="6" y="4" width="12" height="2" fill={robeColor} />
      <rect x="5" y="6" width="14" height="4" fill={robeColor} />
      
      {/* Face */}
      <rect x="7" y="8" width="10" height="6" fill="#fcd9b6" />
      {/* Eyes */}
      <rect x="8" y="9" width="2" height="2" fill="#1a1a2e" />
      <rect x="14" y="9" width="2" height="2" fill="#1a1a2e" />
      {/* Beard */}
      <rect x="9" y="12" width="6" height="2" fill="#e5e5e5" />
      <rect x="10" y="14" width="4" height="2" fill="#e5e5e5" />
      <rect x="11" y="16" width="2" height="1" fill="#e5e5e5" />
      
      {/* Robe body */}
      <rect x="4" y="14" width="16" height="10" fill={robeColor} />
      <rect x="3" y="16" width="18" height="8" fill={robeColor} />
      {/* Robe highlight */}
      <rect x="11" y="14" width="2" height="10" fill={robeHighlight} />
      
      {/* Arms */}
      <rect x="1" y="18" width="4" height="3" fill={robeColor} />
      <rect x="19" y="18" width="4" height="3" fill={robeColor} />
      {/* Hands */}
      <rect x="0" y="19" width="2" height="2" fill="#fcd9b6" />
      <rect x="22" y="19" width="2" height="2" fill="#fcd9b6" />
      
      {/* Feet */}
      <rect x="6" y="24" width="4" height="2" fill="#4a3728" />
      <rect x="14" y="24" width="4" height="2" fill="#4a3728" />
      
      {/* Glow effect for profitable state */}
      {isProfitable && (
        <>
          <rect x="10" y="20" width="4" height="4" fill="#ffd700" opacity="0.8" />
          <rect x="11" y="21" width="2" height="2" fill="#fff" />
        </>
      )}
      
      {/* Warning flame for not profitable */}
      {!isProfitable && (
        <>
          <rect x="11" y="18" width="2" height="2" fill="#ff6b35" />
          <rect x="10" y="19" width="4" height="2" fill="#ff4500" />
          <rect x="11" y="21" width="2" height="1" fill="#ffd700" />
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
    <div className={`zelda-message-box relative ${isProfitable ? 'profitable' : 'not-profitable'}`}>
      {/* Outer border - pixel style */}
      <div 
        className="relative p-1"
        style={{
          background: isProfitable 
            ? 'linear-gradient(135deg, #166534 0%, #14532d 100%)' 
            : 'linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%)',
          boxShadow: isProfitable
            ? '0 0 20px rgba(34, 197, 94, 0.3), inset 0 0 10px rgba(0,0,0,0.5)'
            : '0 0 20px rgba(239, 68, 68, 0.3), inset 0 0 10px rgba(0,0,0,0.5)',
        }}
      >
        {/* Inner content area */}
        <div 
          className="relative p-4 flex gap-4"
          style={{
            background: '#0a0a12',
            border: `3px solid ${isProfitable ? '#22c55e' : '#ef4444'}`,
          }}
        >
          {/* Sage character */}
          <div className="flex-shrink-0 flex items-center">
            <div className={isProfitable ? 'sage-glow-green' : 'sage-glow-red'}>
              <PixelSage isProfitable={isProfitable} />
            </div>
          </div>
          
          {/* Message content */}
          <div className="flex-1 flex flex-col justify-center min-w-0">
            {/* Title */}
            <div 
              className={`text-xs mb-2 tracking-widest ${
                isProfitable ? 'text-green-400' : 'text-red-400'
              }`}
              style={{
                textShadow: isProfitable 
                  ? '0 0 10px rgba(34, 197, 94, 0.8)' 
                  : '0 0 10px rgba(239, 68, 68, 0.8)'
              }}
            >
              {title}
            </div>
            
            {/* Message with typewriter effect */}
            <div className="text-[11px] text-gray-200 leading-relaxed">
              {displayedText}
              {isTyping && <BlinkingCursor />}
            </div>
            
            {/* Decorative corners */}
            <div className="absolute top-2 left-2 w-2 h-2 border-t-2 border-l-2" 
                 style={{ borderColor: isProfitable ? '#4ade80' : '#f87171' }} />
            <div className="absolute top-2 right-2 w-2 h-2 border-t-2 border-r-2" 
                 style={{ borderColor: isProfitable ? '#4ade80' : '#f87171' }} />
            <div className="absolute bottom-2 left-2 w-2 h-2 border-b-2 border-l-2" 
                 style={{ borderColor: isProfitable ? '#4ade80' : '#f87171' }} />
            <div className="absolute bottom-2 right-2 w-2 h-2 border-b-2 border-r-2" 
                 style={{ borderColor: isProfitable ? '#4ade80' : '#f87171' }} />
          </div>
        </div>
        
        {/* Pixel border decorations */}
        <div 
          className="absolute -top-1 left-1/2 -translate-x-1/2 px-3 py-0.5 text-[8px] tracking-widest"
          style={{
            background: isProfitable ? '#166534' : '#991b1b',
            color: isProfitable ? '#86efac' : '#fca5a5',
          }}
        >
          ◆ SAGE SPEAKS ◆
        </div>
      </div>
      
      {/* CSS for glow animations */}
      <style jsx>{`
        .sage-glow-green {
          animation: glowGreen 2s ease-in-out infinite;
        }
        .sage-glow-red {
          animation: glowRed 1.5s ease-in-out infinite;
        }
        @keyframes glowGreen {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(34, 197, 94, 0.4)); }
          50% { filter: drop-shadow(0 0 12px rgba(34, 197, 94, 0.8)); }
        }
        @keyframes glowRed {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(239, 68, 68, 0.4)); }
          50% { filter: drop-shadow(0 0 12px rgba(239, 68, 68, 0.8)); }
        }
      `}</style>
    </div>
  );
}
