import React, { useEffect, useState, useMemo, useRef } from 'react';
import { SymbolType, SymbolImageConfig } from '../types';
import { SlotSymbol } from './SlotSymbol';

interface SlotReelProps {
  isSpinning: boolean;
  isReelSpinning: boolean;
  resultSymbols: SymbolType[];
  customSymbols?: Partial<Record<SymbolType, string>>;
  customSymbolConfigs?: Partial<Record<SymbolType, SymbolImageConfig>>;
  showReelBorders?: boolean;
  showReelBg?: boolean;
  individualPosition?: { offsetX: number; offsetY: number; scale: number };
  spinStyle?: 'smooth' | 'cascade' | 'random' | 'zoom' | 'turbo';
  winningRows?: Set<number>;
  colIndex?: number;
  onLandingComplete?: () => void;
}

const ALL_SYMBOLS: SymbolType[] = ['King', 'Queen', 'Crown', 'Lion', 'Sword', 'Shield', 'Castle', 'Diamond', 'Coin', 'Dragon'];

// Shared audio context for synchronized click sounds
let globalAudioCtx: AudioContext | null = null;

const playClickSound = () => {
  try {
    if (!globalAudioCtx) {
      globalAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (globalAudioCtx.state === 'suspended') {
      globalAudioCtx.resume();
    }
    
    const osc = globalAudioCtx.createOscillator();
    const gain = globalAudioCtx.createGain();
    
    // Low mechanical wood-block click
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110, globalAudioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, globalAudioCtx.currentTime + 0.04);
    
    gain.gain.setValueAtTime(0.04, globalAudioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, globalAudioCtx.currentTime + 0.04);
    
    osc.connect(gain);
    gain.connect(globalAudioCtx.destination);
    osc.start();
    osc.stop(globalAudioCtx.currentTime + 0.04);
  } catch (e) {
    // Web audio blocked or unsupported
  }
};

export const SlotReel: React.FC<SlotReelProps> = ({ 
  isSpinning,
  isReelSpinning,
  resultSymbols, 
  customSymbols, 
  customSymbolConfigs,
  showReelBorders = false,
  showReelBg = false,
  individualPosition,
  spinStyle = 'smooth',
  winningRows,
  colIndex = 0,
  onLandingComplete,
}) => {
  const [currentSymbols, setCurrentSymbols] = useState<SymbolType[]>(resultSymbols || ['Castle', 'Sword', 'Diamond']);
  const [renderStrip, setRenderStrip] = useState<SymbolType[]>(currentSymbols);

  const numRows = currentSymbols.length || 3;

  // 1. Generate unique independent random strip for each column
  const spinningStrip = useMemo(() => {
    const base = [...ALL_SYMBOLS];
    const uniqueStrip: SymbolType[] = [];
    // Generate a long unique pattern to give each reel distinct personality
    for (let i = 0; i < 30; i++) {
      const idx = (i * 7 + colIndex * 13) % base.length;
      uniqueStrip.push(base[idx]);
    }
    return uniqueStrip;
  }, [colIndex]);

  // Elements and Animation Refs
  const stripRef = useRef<HTMLDivElement>(null);
  const animRef = useRef({
    y: 0,
    velocity: 0,
    targetY: 0,
    state: 'IDLE' as 'IDLE' | 'ACCELERATING' | 'CRUISING' | 'DECELERATING' | 'STOPPED',
    strip: [] as SymbolType[],
    lastIntegerY: 0,
  });

  // Safe reference storage to bypass React stale closures in requestAnimationFrame
  const callbacksRef = useRef({
    numRows,
    resultSymbols,
    onLandingComplete,
  });

  useEffect(() => {
    callbacksRef.current = {
      numRows,
      resultSymbols,
      onLandingComplete,
    };
  }, [numRows, resultSymbols, onLandingComplete]);

  // Synchronize base symbols when completely idle
  useEffect(() => {
    if (!isSpinning && !isReelSpinning && resultSymbols && resultSymbols.length > 0) {
      setCurrentSymbols(resultSymbols);
      setRenderStrip(resultSymbols);
      animRef.current.y = 0;
      animRef.current.velocity = 0;
      animRef.current.state = 'IDLE';
      if (stripRef.current) {
        stripRef.current.style.transform = `translate3d(0, 0, 0)`;
        stripRef.current.style.filter = 'none';
      }
    }
  }, [resultSymbols, isSpinning, isReelSpinning]);

  // 2. The Core 60 FPS requestAnimationFrame Tick Loop
  const tick = () => {
    const anim = animRef.current;
    if (anim.state === 'IDLE') return;

    const { numRows: currentNumRows, resultSymbols: targetResult, onLandingComplete: landingDone } = callbacksRef.current;

    // PHYSICS UPDATE STATE MACHINE
    if (anim.state === 'ACCELERATING') {
      const accel = spinStyle === 'turbo' ? 0.08 : 0.04;
      const maxSpeed = spinStyle === 'turbo' ? 0.95 : 0.70; // High speed for high-fidelity motion blur
      
      anim.velocity = Math.min(maxSpeed, anim.velocity + accel);
      anim.y += anim.velocity;

      // Loop infinitely during spin
      if (anim.y >= anim.strip.length - currentNumRows) {
        anim.y = anim.y % (anim.strip.length - currentNumRows);
      }
    } else if (anim.state === 'CRUISING') {
      anim.y += anim.velocity;
      if (anim.y >= anim.strip.length - currentNumRows) {
        anim.y = anim.y % (anim.strip.length - currentNumRows);
      }
    } else if (anim.state === 'DECELERATING') {
      const distance = anim.targetY - anim.y;

      if (distance > 2.5) {
        // Linear deceleration while further away
        const decelRate = spinStyle === 'turbo' ? 0.035 : 0.015;
        anim.velocity = Math.max(0.12, anim.velocity - decelRate);
        anim.y += anim.velocity;
      } else {
        // High-precision Spring-Damper System for standard/cascade bounce
        // Gives the exact snappy drop & organic impact bounce of Fortune Tiger
        const springK = spinStyle === 'turbo' ? 0.22 : 0.12;
        const dampingC = spinStyle === 'turbo' ? 0.55 : 0.42;

        const springForce = springK * distance;
        const dampingForce = dampingC * anim.velocity;
        const force = springForce - dampingForce;

        anim.velocity += force;
        anim.y += anim.velocity;

        // Check if finished bouncing and settled
        if (Math.abs(distance) < 0.005 && Math.abs(anim.velocity) < 0.005) {
          anim.y = anim.targetY;
          anim.velocity = 0;
          anim.state = 'IDLE';

          // Commit final symbols to state
          const finalSymbols = targetResult && targetResult.length > 0 ? targetResult : currentSymbols;
          setCurrentSymbols(finalSymbols);
          setRenderStrip(finalSymbols);
          
          // Reset transform to flat idle state
          if (stripRef.current) {
            stripRef.current.style.transform = `translate3d(0, 0, 0)`;
            stripRef.current.style.filter = 'none';
          }
          
          // Trigger complete
          landingDone?.();
          return;
        }
      }
    }

    // PLAY SOUND SENSORS
    const currentIntegerY = Math.floor(anim.y);
    if (currentIntegerY !== anim.lastIntegerY && anim.state !== 'IDLE') {
      anim.lastIntegerY = currentIntegerY;
      playClickSound();
    }

    // DIRECT DOM TRANSFORM UPDATES (Crucial for stutter-free 60 FPS performance)
    if (stripRef.current) {
      const itemHeightPct = 100 / currentNumRows;
      const translateY = -anim.y * itemHeightPct;
      
      // Calculate dynamic physical motion blur
      const blurMultiplier = spinStyle === 'turbo' ? 4.5 : 3.5;
      const blurPx = Math.min(3.5, anim.velocity * blurMultiplier);

      stripRef.current.style.transform = `translate3d(0, ${translateY}%, 0)`;
      stripRef.current.style.filter = blurPx > 0.1 ? `blur(${blurPx}px)` : 'none';
    }

    // Frame recursion
    if (anim.state !== 'IDLE') {
      requestAnimationFrame(tick);
    }
  };

  // 3. Handle external trigger hooks from SlotMachine
  useEffect(() => {
    const anim = animRef.current;

    if (isReelSpinning) {
      // PHASE A: ENTER ACCELERATION
      if (anim.state === 'IDLE' || anim.state === 'STOPPED') {
        const startSymbols = [...currentSymbols];
        const combinedStrip = [...startSymbols, ...spinningStrip];

        anim.strip = combinedStrip;
        anim.y = 0;
        anim.velocity = 0;
        anim.state = 'ACCELERATING';
        anim.lastIntegerY = 0;

        setRenderStrip(combinedStrip);
        requestAnimationFrame(tick);
      }
    } else {
      // PHASE B: ENTER DECELERATION & ORGANIC LANDING
      if (anim.state === 'ACCELERATING' || anim.state === 'CRUISING') {
        const currentY = anim.y;
        const currentBase = Math.floor(currentY);
        const frac = currentY - currentBase;

        // Extract currently visible symbols cleanly to ensure 100% flicker-free transition
        const N = anim.strip.length;
        const visibleSymbols: SymbolType[] = [];
        for (let j = 0; j < numRows + 3; j++) {
          visibleSymbols.push(anim.strip[(currentBase + j) % N]);
        }

        // Custom cascade landing distance based on column index
        // Staggers the останавливается sequences beautifully
        const stoppingDistance = spinStyle === 'turbo' 
          ? 6 + colIndex * 2 
          : 12 + colIndex * 3;

        const filler: SymbolType[] = [];
        for (let j = 0; j < stoppingDistance; j++) {
          filler.push(ALL_SYMBOLS[(j + colIndex * 3) % ALL_SYMBOLS.length]);
        }

        const targetSymbols = resultSymbols && resultSymbols.length > 0 
          ? resultSymbols 
          : (['Castle', 'Sword', 'Diamond'] as SymbolType[]);

        const landingStrip = [...visibleSymbols, ...filler, ...targetSymbols];

        anim.strip = landingStrip;
        anim.y = frac;
        anim.targetY = landingStrip.length - numRows;
        anim.state = 'DECELERATING';

        setRenderStrip(landingStrip);
      }
    }
  }, [isReelSpinning, resultSymbols, spinningStrip, numRows, colIndex, spinStyle]);

  const transformStyle: React.CSSProperties = individualPosition ? {
    transform: `translate(${individualPosition.offsetX || 0}%, ${individualPosition.offsetY || 0}%) scale(${(individualPosition.scale || 100) / 100})`,
    transition: 'transform 0.15s ease-out',
  } : {};

  return (
    <div 
      style={transformStyle}
      className={`relative flex-1 h-full max-w-[120px] overflow-hidden rounded-md sm:rounded-xl transition-all ${
        showReelBg ? 'bg-black/60 shadow-[inset_0_0_30px_rgba(0,0,0,0.8)]' : 'bg-transparent'
      } ${
        showReelBorders ? 'border-x sm:border-x-2 border-[#4d3d00]' : 'border-none'
      }`}
    >
      <div 
        ref={stripRef}
        className="absolute top-0 left-0 w-full flex flex-col will-change-transform"
        style={{
          height: `${renderStrip.length * (100 / numRows)}%`,
        }}
      >
        {renderStrip.map((symbol, i) => (
          <div
            key={i}
            style={{ height: `${100 / renderStrip.length}%` }}
            className="relative flex items-center justify-center w-full flex-1 min-h-0"
          >
            <SlotSymbol 
              type={symbol} 
              isWinning={animRef.current.state === 'IDLE' ? winningRows?.has(i) : false}
              customImage={customSymbols?.[symbol]} 
              symbolConfig={customSymbolConfigs?.[symbol]}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
