"use client";

import { useState, useEffect } from "react";

// =============================================================================
// UNISWAP UNICORN CHARACTER
// Link-style player character with Uniswap branding
// =============================================================================

interface ZeldaUnicornProps {
  facing?: "up" | "down" | "left" | "right";
  animate?: boolean;
}

export default function ZeldaUnicorn({ facing = "up", animate = true }: ZeldaUnicornProps) {
  const [frame, setFrame] = useState(0);
  
  useEffect(() => {
    if (!animate) return;
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % 2);
    }, 500);
    return () => clearInterval(interval);
  }, [animate]);
  
  // Slight bounce animation
  const yOffset = animate && frame === 1 ? -2 : 0;
  
  return (
    <svg 
      viewBox="0 0 16 16" 
      width="48" 
      height="48" 
      style={{ imageRendering: "pixelated", transform: `translateY(${yOffset}px)` }}
    >
      {facing === "up" && (
        <>
          {/* Back view - facing old man */}
          {/* Horn */}
          <rect x="7" y="0" width="2" height="2" fill="#FFD700" />
          
          {/* Head/Mane from back */}
          <rect x="5" y="2" width="6" height="4" fill="#FF007A" />
          <rect x="4" y="3" width="2" height="3" fill="#7B61FF" />
          <rect x="10" y="3" width="2" height="3" fill="#7B61FF" />
          
          {/* Body */}
          <rect x="4" y="6" width="8" height="6" fill="#FF007A" />
          
          {/* Legs */}
          <rect x="4" y="12" width="2" height="3" fill="#c7005f" />
          <rect x="10" y="12" width="2" height="3" fill="#c7005f" />
          
          {/* Hooves */}
          <rect x="4" y="15" width="2" height="1" fill="#FFD700" />
          <rect x="10" y="15" width="2" height="1" fill="#FFD700" />
          
          {/* Tail */}
          <rect x="2" y="7" width="2" height="2" fill="#7B61FF" />
          <rect x="1" y="8" width="2" height="2" fill="#7B61FF" />
        </>
      )}
      
      {facing === "down" && (
        <>
          {/* Front view */}
          {/* Horn */}
          <rect x="7" y="0" width="2" height="2" fill="#FFD700" />
          
          {/* Head */}
          <rect x="4" y="2" width="8" height="5" fill="#FF007A" />
          
          {/* Eyes */}
          <rect x="5" y="4" width="2" height="2" fill="#fff" />
          <rect x="9" y="4" width="2" height="2" fill="#fff" />
          <rect x="6" y="5" width="1" height="1" fill="#000" />
          <rect x="9" y="5" width="1" height="1" fill="#000" />
          
          {/* Mane */}
          <rect x="3" y="3" width="2" height="3" fill="#7B61FF" />
          <rect x="11" y="3" width="2" height="3" fill="#7B61FF" />
          
          {/* Body */}
          <rect x="4" y="7" width="8" height="5" fill="#FF007A" />
          
          {/* Legs */}
          <rect x="5" y="12" width="2" height="3" fill="#c7005f" />
          <rect x="9" y="12" width="2" height="3" fill="#c7005f" />
          
          {/* Hooves */}
          <rect x="5" y="15" width="2" height="1" fill="#FFD700" />
          <rect x="9" y="15" width="2" height="1" fill="#FFD700" />
        </>
      )}
      
      {facing === "left" && (
        <>
          {/* Side view - facing left */}
          {/* Horn */}
          <rect x="2" y="1" width="2" height="1" fill="#FFD700" />
          <rect x="3" y="2" width="1" height="1" fill="#FFD700" />
          
          {/* Head */}
          <rect x="2" y="3" width="6" height="4" fill="#FF007A" />
          
          {/* Eye */}
          <rect x="3" y="4" width="2" height="2" fill="#fff" />
          <rect x="3" y="5" width="1" height="1" fill="#000" />
          
          {/* Mane */}
          <rect x="7" y="2" width="2" height="4" fill="#7B61FF" />
          <rect x="8" y="3" width="2" height="3" fill="#7B61FF" />
          
          {/* Body */}
          <rect x="4" y="7" width="8" height="5" fill="#FF007A" />
          
          {/* Legs */}
          <rect x="5" y="12" width="2" height="3" fill="#c7005f" />
          <rect x="9" y="12" width="2" height="3" fill="#c7005f" />
          
          {/* Hooves */}
          <rect x="5" y="15" width="2" height="1" fill="#FFD700" />
          <rect x="9" y="15" width="2" height="1" fill="#FFD700" />
          
          {/* Tail */}
          <rect x="11" y="8" width="2" height="2" fill="#7B61FF" />
          <rect x="12" y="9" width="2" height="2" fill="#7B61FF" />
        </>
      )}
      
      {facing === "right" && (
        <>
          {/* Side view - facing right */}
          {/* Horn */}
          <rect x="12" y="1" width="2" height="1" fill="#FFD700" />
          <rect x="12" y="2" width="1" height="1" fill="#FFD700" />
          
          {/* Head */}
          <rect x="8" y="3" width="6" height="4" fill="#FF007A" />
          
          {/* Eye */}
          <rect x="11" y="4" width="2" height="2" fill="#fff" />
          <rect x="12" y="5" width="1" height="1" fill="#000" />
          
          {/* Mane */}
          <rect x="6" y="2" width="2" height="4" fill="#7B61FF" />
          <rect x="5" y="3" width="2" height="3" fill="#7B61FF" />
          
          {/* Body */}
          <rect x="4" y="7" width="8" height="5" fill="#FF007A" />
          
          {/* Legs */}
          <rect x="5" y="12" width="2" height="3" fill="#c7005f" />
          <rect x="9" y="12" width="2" height="3" fill="#c7005f" />
          
          {/* Hooves */}
          <rect x="5" y="15" width="2" height="1" fill="#FFD700" />
          <rect x="9" y="15" width="2" height="1" fill="#FFD700" />
          
          {/* Tail */}
          <rect x="2" y="8" width="2" height="2" fill="#7B61FF" />
          <rect x="1" y="9" width="2" height="2" fill="#7B61FF" />
        </>
      )}
    </svg>
  );
}
