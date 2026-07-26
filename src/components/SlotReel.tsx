import React, { useEffect, useState, useMemo } from 'react';
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

  const numRows = currentSymbols.length || 3;

  // Generate a deterministic reel strip with 15 symbols for spinning animation
  const spinningStrip = useMemo(() => {
    return Array.from({ length: 15 }).map((_, i) => ALL_SYMBOLS[(i + colIndex * 3) % ALL_SYMBOLS.length]);
  }, [colIndex]);

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
          y: ['-200%', '0%'],
          transition: {
            repeat: Infinity,
            repeatType: 'loop',
            duration: 0.3,
            ease: 'linear',
          }
        });
      } else if (spinStyle === 'random') {
        controls.start({
          y: isOddCol ? ['0%', '-200%'] : ['-200%', '0%'],
          transition: {
            repeat: Infinity,
            repeatType: 'loop',
            duration: 0.32,
            ease: 'linear',
          }
        });
      } else if (spinStyle === 'zoom') {
        controls.start({
          scale: [0.94, 1.04, 0.94],
          opacity: [0.8, 1, 0.8],
          transition: {
            repeat: Infinity,
            repeatType: 'reverse',
            duration: 0.22,
            ease: 'easeInOut',
          }
        });
      } else if (spinStyle === 'turbo') {
        controls.start({
          y: ['0%', '-300%'],
          transition: {
            repeat: Infinity,
            repeatType: 'loop',
            duration: 0.14,
            ease: 'linear',
          }
        });
      } else {
        // Standard Casino Slot Roll ('smooth')
        // Continuous top-to-bottom vertical scroll
        controls.start({
          y: ['0%', '-300%'],
          transition: {
            repeat: Infinity,
            repeatType: 'loop',
            duration: 0.28,
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
        controls.set({ y: '-25%', scale: 1, opacity: 1 });
        controls.start({
          y: '0%',
          transition: { type: 'spring', stiffness: 260, damping: 15 }
        }).then(() => {
          onLandingComplete?.();
        });
      } else if (spinStyle === 'random') {
        const startY = isOddCol ? '20%' : '-20%';
        controls.set({ y: startY, scale: 1, opacity: 1 });
        controls.start({
          y: '0%',
          transition: { type: 'spring', stiffness: 280, damping: 16 }
        }).then(() => {
          onLandingComplete?.();
        });
      } else if (spinStyle === 'zoom') {
        controls.set({ scale: 0.88, opacity: 0.6, y: '0%' });
        controls.start({
          scale: 1,
          opacity: 1,
          transition: { type: 'spring', stiffness: 350, damping: 20 }
        }).then(() => {
          onLandingComplete?.();
        });
      } else if (spinStyle === 'turbo') {
        controls.set({ y: '-10%', scale: 1, opacity: 1 });
        controls.start({
          y: '0%',
          transition: { type: 'tween', duration: 0.08, ease: 'easeOut' }
        }).then(() => {
          onLandingComplete?.();
        });
      } else {
        // Standard Casino Landing: Crisp top-to-bottom drop into place with subtle bounce
        controls.set({ y: '-18%', scale: 1, opacity: 1 });
        controls.start({
          y: '0%',
          transition: { type: 'spring', stiffness: 340, damping: 22 }
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

  // Each symbol in the spinning strip has height matching 1/numRows of the reel container (e.g. 33.333% for 3 rows)
  const itemHeightPct = 100 / numRows;

  return (
    <div 
      style={transformStyle}
      className={`relative flex-1 h-full max-w-[120px] overflow-hidden rounded-md sm:rounded-xl transition-all ${
        showReelBg ? 'bg-black/60 shadow-[inset_0_0_30px_rgba(0,0,0,0.8)]' : 'bg-transparent'
      } ${
        showReelBorders ? 'border-x sm:border-x-2 border-[#4d3d00]' : 'border-none'
      }`}
    >
      <motion.div 
        animate={controls}
        className={`absolute top-0 left-0 w-full h-full flex flex-col ${
          isReelSpinning ? 'blur-[0.5px] opacity-95' : ''
        }`}
      >
        {isReelSpinning ? (
          <div className="w-full flex flex-col">
            {spinningStrip.map((sym, i) => (
              <div 
                key={i} 
                style={{ height: `${itemHeightPct}%`, minHeight: `${itemHeightPct}%` }}
                className="w-full flex items-center justify-center p-1 shrink-0"
              >
                <SlotSymbol 
                  type={sym} 
                  customImage={customSymbols?.[sym]} 
                  symbolConfig={customSymbolConfigs?.[sym]}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col h-full w-full py-1">
            {currentSymbols.map((symbol, i) => (
              <div
                key={i}
                data-symbol-col={colIndex}
                data-symbol-row={i}
                className="relative flex items-center justify-center w-full flex-1 min-h-0"
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

