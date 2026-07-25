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
  spinStyle?: 'smooth' | 'turbo' | 'cascade';
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
  colIndex,
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
    const loopDuration = spinStyle === 'turbo' ? 0.12 : spinStyle === 'cascade' ? 0.22 : 0.3;

    if (isReelSpinning) {
      controls.start({
        y: [0, -800],
        transition: {
          y: {
            repeat: Infinity,
            repeatType: "loop",
            duration: loopDuration,
            ease: spinStyle === 'cascade' ? "easeIn" : "linear",
          }
        }
      });
    } else {
      controls.stop();
      if (resultSymbols && resultSymbols.length > 0) {
        setCurrentSymbols(resultSymbols);
      }

      if (spinStyle === 'cascade') {
        controls.set({ y: -200 });
        controls.start({
          y: 0,
          transition: { type: "spring", stiffness: 220, damping: 12, mass: 1.1 }
        }).then(() => {
          onLandingComplete?.();
        });
      } else if (spinStyle === 'turbo') {
        controls.set({ y: -15 });
        controls.start({
          y: 0,
          transition: { type: "tween", duration: 0.08, ease: "easeOut" }
        }).then(() => {
          onLandingComplete?.();
        });
      } else {
        controls.set({ y: -35 });
        controls.start({
          y: 0,
          transition: { type: "spring", stiffness: 380, damping: 22 }
        }).then(() => {
          onLandingComplete?.();
        });
      }
    }
  }, [isReelSpinning, resultSymbols, controls, spinStyle, onLandingComplete]);

  const transformStyle: React.CSSProperties = individualPosition ? {
    transform: `translate(${individualPosition.offsetX || 0}%, ${individualPosition.offsetY || 0}%) scale(${(individualPosition.scale || 100) / 100})`,
    transition: 'transform 0.15s ease-out',
  } : {};

  const spinningColumn = Array.from({ length: 20 }).map((_, i) => {
    const sym = ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)];
    return (
      <div key={i} className="py-1 h-16 sm:h-20">
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
