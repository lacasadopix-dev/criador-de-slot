import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'motion/react';
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
  const controls = useAnimation();

  useEffect(() => {
    if (resultSymbols && resultSymbols.length > 0 && !isSpinning && !isReelSpinning) {
      setCurrentSymbols(resultSymbols);
    }
  }, [resultSymbols, isSpinning, isReelSpinning]);

  useEffect(() => {
    const isOddCol = colIndex % 2 !== 0;

    if (isReelSpinning) {
      if (spinStyle === 'cascade') {
        controls.start({
          y: [-800, 0],
          transition: {
            repeat: Infinity,
            repeatType: 'loop',
            duration: 0.28,
            ease: 'easeIn',
          }
        });
      } else if (spinStyle === 'random') {
        // Alternating directions: even columns down, odd columns up
        controls.start({
          y: isOddCol ? [0, 800] : [0, -800],
          transition: {
            repeat: Infinity,
            repeatType: 'loop',
            duration: 0.32,
            ease: 'linear',
          }
        });
      } else if (spinStyle === 'zoom') {
        // Zoom pulse expand animation
        controls.start({
          scale: [0.85, 1.12, 0.85],
          opacity: [0.6, 1, 0.6],
          transition: {
            repeat: Infinity,
            repeatType: 'reverse',
            duration: 0.25,
            ease: 'easeInOut',
          }
        });
      } else if (spinStyle === 'turbo') {
        controls.start({
          y: [0, -800],
          transition: {
            repeat: Infinity,
            repeatType: 'loop',
            duration: 0.18,
            ease: 'linear',
          }
        });
      } else {
        // 'smooth' default
        controls.start({
          y: [0, -800],
          transition: {
            repeat: Infinity,
            repeatType: 'loop',
            duration: 0.36,
            ease: 'linear',
          }
        });
      }
    } else {
      controls.stop();
      if (resultSymbols && resultSymbols.length > 0) {
        setCurrentSymbols(resultSymbols);
      }

      if (spinStyle === 'cascade') {
        controls.set({ y: -220, scale: 1, opacity: 1 });
        controls.start({
          y: 0,
          transition: { type: 'spring', stiffness: 220, damping: 12, mass: 1.1 }
        }).then(() => {
          onLandingComplete?.();
        });
      } else if (spinStyle === 'random') {
        const startY = isOddCol ? 120 : -120;
        controls.set({ y: startY, scale: 1, opacity: 1 });
        controls.start({
          y: 0,
          transition: { type: 'spring', stiffness: 280, damping: 16 }
        }).then(() => {
          onLandingComplete?.();
        });
      } else if (spinStyle === 'zoom') {
        controls.set({ scale: 0.3, opacity: 0, y: 0 });
        controls.start({
          scale: 1,
          opacity: 1,
          transition: { type: 'spring', stiffness: 350, damping: 18 }
        }).then(() => {
          onLandingComplete?.();
        });
      } else if (spinStyle === 'turbo') {
        controls.set({ y: -20, scale: 1, opacity: 1 });
        controls.start({
          y: 0,
          transition: { type: 'tween', duration: 0.10, ease: 'easeOut' }
        }).then(() => {
          onLandingComplete?.();
        });
      } else {
        // smooth
        controls.set({ y: -45, scale: 1, opacity: 1 });
        controls.start({
          y: 0,
          transition: { type: 'spring', stiffness: 320, damping: 20 }
        }).then(() => {
          onLandingComplete?.();
        });
      }
    }
  }, [isReelSpinning, resultSymbols, controls, spinStyle, colIndex, onLandingComplete]);

  const transformStyle: React.CSSProperties = individualPosition ? {
    transform: `translate(${individualPosition.offsetX || 0}%, ${individualPosition.offsetY || 0}%) scale(${(individualPosition.scale || 100) / 100})`,
    transition: 'transform 0.15s ease-out',
  } : {};

  const spinningColumn = Array.from({ length: 20 }).map((_, i) => {
    const sym = ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)];
    return (
      <div key={i} className="py-2 h-24 sm:h-32 flex items-center justify-center">
        <SlotSymbol 
          type={sym} 
          customImage={customSymbols?.[sym]} 
          symbolConfig={customSymbolConfigs?.[sym]}
        />
      </div>
    );
  });

  return (
    <div 
      style={transformStyle}
      className={`relative flex-1 h-full max-w-[120px] overflow-hidden rounded-md sm:rounded-xl transition-all ${
        showReelBg ? 'bg-black/60 shadow-[inset_0_0_30px_rgba(0,0,0,0.8)]' : 'bg-transparent'
      } ${
        showReelBorders ? 'border-x sm:border-x-2 border-[#4d3d00]' : 'border-none'
      } ${
        isReelSpinning && spinStyle === 'turbo' ? 'blur-[1.5px] scale-y-105 transition-all' : ''
      }`}
    >
      <motion.div 
        animate={controls}
        className="absolute top-0 w-full px-0.5 sm:px-1.5 flex flex-col h-full"
      >
        {isReelSpinning ? spinningColumn : (
          <div className="flex flex-col justify-around h-full py-1 gap-1">
            {currentSymbols.map((symbol, i) => (
              <div
                key={i}
                data-symbol-col={colIndex}
                data-symbol-row={i}
                className="relative flex items-center justify-center w-full h-full flex-1 min-h-0"
              >
                <SlotSymbol 
                  type={symbol} 
                  isWinning={winningRows?.has(i)}
                  customImage={customSymbols?.[symbol]} 
                  symbolConfig={customSymbolConfigs?.[symbol]}
                />
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};
