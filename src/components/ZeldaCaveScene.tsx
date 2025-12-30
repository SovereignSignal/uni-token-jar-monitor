"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

// =============================================================================
// ZELDA CAVE SCENE - Main game screen
// Clean layout: Brick walls frame, old man + torches, jar, dialog, unicorn
// =============================================================================

interface ZeldaCaveSceneProps {
  isProfitable: boolean;
  message: string;
  jarValue: number;
}

// Blinking cursor for typewriter effect
function BlinkingCursor() {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    const interval = setInterval(() => setVisible(v => !v), 500);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <span 
      className="inline-block w-2 h-3 ml-1"
      style={{ backgroundColor: visible ? '#FCE4B8' : 'transparent' }}
    />
  );
}

// Typewriter text component
function TypewriterText({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  
  useEffect(() => {
    setDisplayedText("");
    setIsTyping(true);
    let index = 0;
    
    const typeInterval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(typeInterval);
      }
    }, 40);
    
    return () => clearInterval(typeInterval);
  }, [text]);
  
  return (
    <span>
      {displayedText}
      {isTyping && <BlinkingCursor />}
    </span>
  );
}

// Animated torch using PNG sprite
function AnimatedTorch({ flipped = false }: { flipped?: boolean }) {
  const [frame, setFrame] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % 4);
    }, 150);
    return () => clearInterval(interval);
  }, []);
  
  const transforms = [
    'scale(1)',
    'scale(1.02, 0.98)',
    'scale(0.98, 1.02)',
    'scale(1.01, 0.99)',
  ];
  
  return (
    <div 
      style={{ 
        transform: `${transforms[frame]} ${flipped ? 'scaleX(-1)' : ''}`,
        transition: 'transform 0.1s ease-out',
        filter: 'drop-shadow(0 0 8px rgba(255, 102, 0, 0.6))',
      }}
    >
      <Image
        src="/assets/zelda/torch.png"
        alt="Torch"
        width={40}
        height={80}
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
        transform: `translateY(${frame === 1 ? -2 : 0}px)`,
        transition: 'transform 0.3s ease-out',
      }}
    >
      <Image
        src="/assets/zelda/unicorn.png"
        alt="Uniswap Unicorn"
        width={40}
        height={40}
        style={{ imageRendering: 'pixelated' }}
        priority
      />
    </div>
  );
}

export default function ZeldaCaveScene({ isProfitable, message, jarValue }: ZeldaCaveSceneProps) {
  return (
    <div 
      className="relative w-full aspect-[4/3] max-w-2xl mx-auto bg-black overflow-hidden border-4 border-[#8B4513]"
      style={{ imageRendering: 'pixelated' }}
    >
      {/* === CAVE WALLS - Brown brick frame === */}
      
      {/* Top wall */}
      <div 
        className="absolute top-0 left-0 right-0 h-10"
        style={{
          background: `
            repeating-linear-gradient(90deg, #8B4513 0px, #8B4513 20px, #654321 20px, #654321 22px),
            repeating-linear-gradient(0deg, #8B4513 0px, #8B4513 8px, #654321 8px, #654321 10px)
          `,
          backgroundSize: '44px 20px',
        }}
      />
      
      {/* Left wall */}
      <div 
        className="absolute top-10 left-0 w-10 bottom-10"
        style={{
          background: `
            repeating-linear-gradient(90deg, #8B4513 0px, #8B4513 8px, #654321 8px, #654321 10px),
            repeating-linear-gradient(0deg, #8B4513 0px, #8B4513 20px, #654321 20px, #654321 22px)
          `,
          backgroundSize: '20px 44px',
        }}
      />
      
      {/* Right wall */}
      <div 
        className="absolute top-10 right-0 w-10 bottom-10"
        style={{
          background: `
            repeating-linear-gradient(90deg, #8B4513 0px, #8B4513 8px, #654321 8px, #654321 10px),
            repeating-linear-gradient(0deg, #8B4513 0px, #8B4513 20px, #654321 20px, #654321 22px)
          `,
          backgroundSize: '20px 44px',
        }}
      />
      
      {/* Bottom wall */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-10"
        style={{
          background: `
            repeating-linear-gradient(90deg, #8B4513 0px, #8B4513 20px, #654321 20px, #654321 22px),
            repeating-linear-gradient(0deg, #8B4513 0px, #8B4513 8px, #654321 8px, #654321 10px)
          `,
          backgroundSize: '44px 20px',
        }}
      />
      
      {/* Cave entrance opening at bottom center */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-10 bg-black" />
      
      {/* Cave floor at entrance */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-5"
        style={{
          background: `
            repeating-linear-gradient(90deg, #4a3a2a 0px, #4a3a2a 8px, #2a1a0a 8px, #2a1a0a 10px),
            repeating-linear-gradient(0deg, #4a3a2a 0px, #4a3a2a 4px, #2a1a0a 4px, #2a1a0a 5px)
          `,
          backgroundSize: '20px 10px',
        }}
      />
      
      {/* === CAVE INTERIOR === */}
      <div className="absolute top-10 left-10 right-10 bottom-10 bg-black flex flex-col items-center py-3">
        
        {/* Row 1: Old Man with Torches on sides */}
        <div className="flex items-center justify-center gap-6 w-full mb-2">
          <AnimatedTorch />
          <Image
            src="/assets/zelda/old-man.png"
            alt="Old Man Sage"
            width={56}
            height={84}
            style={{ imageRendering: 'pixelated' }}
            priority
          />
          <AnimatedTorch flipped />
        </div>
        
        {/* Row 2: Token Jar on Pedestal */}
        <div className={`mb-2 ${isProfitable ? 'animate-pulse' : ''}`}>
          <Image
            src="/assets/zelda/token-jar.png"
            alt="Token Jar"
            width={56}
            height={56}
            className={isProfitable ? 'drop-shadow-[0_0_8px_rgba(255,215,0,0.6)]' : ''}
            style={{ imageRendering: 'pixelated' }}
            priority
          />
        </div>
        
        {/* Row 3: Dialog Box */}
        <div className="w-[90%] bg-black border-2 border-[#FCE4B8] px-3 py-2 mb-2">
          <p 
            className="text-[#FCE4B8] text-[9px] leading-relaxed text-center"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            <TypewriterText text={message} />
          </p>
        </div>
        
        {/* Row 4: Unicorn at entrance */}
        <div className="mt-auto">
          <AnimatedUnicorn />
        </div>
        
      </div>
    </div>
  );
}
