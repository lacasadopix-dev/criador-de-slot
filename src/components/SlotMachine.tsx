import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SlotReel } from './SlotReel';
import { PaylineOverlay } from './PaylineOverlay';
import { SymbolType, SymbolImageConfig, ReelPosition, Payline } from '../types';
import { evaluatePaylines } from '../utils/paylines';

interface SlotMachineProps {
  isSpinning: boolean;
  grid: SymbolType[][];
  customSymbols?: Partial<Record<SymbolType, string>>;
  customSymbolConfigs?: Partial<Record<SymbolType, SymbolImageConfig>>;
  showReelBorders?: boolean;
  showReelBg?: boolean;
  individualReelPositions?: Record<number, ReelPosition>;
  spinStyle?: 'smooth' | 'cascade' | 'random' | 'zoom' | 'turbo';
  paylines?: Payline[];
  numReels?: number;
  numRows?: number;
  onAllReelsStopped?: () => void;
}

export const SlotMachine: React.FC<SlotMachineProps> = ({ 
  isSpinning, 
  grid, 
  customSymbols, 
  customSymbolConfigs,
  showReelBorders,
  showReelBg,
  individualReelPositions,
  spinStyle = 'smooth',
  paylines,
  numReels,
  numRows,
  onAllReelsStopped,
}) => {
  const effectiveNumReels = numReels || grid?.length || 5;
  const effectiveNumRows = numRows || (grid?.[0] ? grid[0].length : 3);

  const [reelsSpinning, setReelsSpinning] = useState<boolean[]>(Array(effectiveNumReels).fill(false));
  const onAllStoppedRef = useRef(onAllReelsStopped);

  useEffect(() => {
    onAllStoppedRef.current = onAllReelsStopped;
  }, [onAllReelsStopped]);

  useEffect(() => {
    if (isSpinning) {
      setReelsSpinning(Array(effectiveNumReels).fill(true));

      let baseSpinTime = 1000;
      let reelDelay = 220;

      if (spinStyle === 'turbo') {
        baseSpinTime = 400;
        reelDelay = 100;
      } else if (spinStyle === 'cascade') {
        baseSpinTime = 700;
        reelDelay = 200;
      } else if (spinStyle === 'zoom') {
        baseSpinTime = 600;
        reelDelay = 180;
      } else if (spinStyle === 'random') {
        baseSpinTime = 800;
        reelDelay = 180;
      }

      const timers: NodeJS.Timeout[] = [];

      for (let col = 0; col < effectiveNumReels; col++) {
        // For 'random', we can vary the delay order
        const colOrder = spinStyle === 'random' ? (col % 2 === 0 ? col : effectiveNumReels - col) : col;
        const delay = baseSpinTime + Math.abs(colOrder) * reelDelay;
        const timer = setTimeout(() => {
          setReelsSpinning(prev => {
            const next = [...prev];
            next[col] = false;
            return next;
          });
        }, delay);
        timers.push(timer);
      }

      return () => {
        timers.forEach(t => clearTimeout(t));
      };
    } else {
      setReelsSpinning(Array(effectiveNumReels).fill(false));
    }
  }, [isSpinning, effectiveNumReels, spinStyle]);

  const winningPaylines = useMemo(() => {
    if (isSpinning || reelsSpinning.some(s => s) || !grid || !paylines) return [];
    return evaluatePaylines(grid, paylines, effectiveNumReels, effectiveNumRows);
  }, [grid, paylines, isSpinning, reelsSpinning, effectiveNumReels, effectiveNumRows]);

  const handleLandingComplete = (colIndex: number) => {
    if (colIndex === effectiveNumReels - 1 && isSpinning) {
      onAllStoppedRef.current?.();
    }
  };

  return (
    <div className="relative z-10 w-full h-full flex items-center justify-center p-0.5 sm:p-1 md:p-2">
      {/* SVG Payline Overlay */}
      <PaylineOverlay 
        winningPaylines={winningPaylines}
        numReels={effectiveNumReels}
        numRows={effectiveNumRows}
        isSpinning={isSpinning || reelsSpinning.some(s => s)}
        individualReelPositions={individualReelPositions}
      />

      {/* Main Grid */}
      <div className="flex gap-0.5 sm:gap-1.5 md:gap-2 w-full h-full justify-center items-center">
        {grid.map((column, colIndex) => {
          const winningRows = new Set<number>();
          if (!isSpinning && !reelsSpinning.some(s => s) && winningPaylines.length > 0) {
            winningPaylines.forEach(winLine => {
              winLine.positions.forEach(pos => {
                if (pos.col === colIndex) {
                  winningRows.add(pos.row);
                }
              });
            });
          }

          return (
            <SlotReel 
              key={colIndex}
              colIndex={colIndex}
              isSpinning={isSpinning}
              isReelSpinning={reelsSpinning[colIndex] ?? false}
              resultSymbols={column}
              customSymbols={customSymbols}
              customSymbolConfigs={customSymbolConfigs}
              showReelBorders={showReelBorders}
              showReelBg={showReelBg}
              individualPosition={individualReelPositions?.[colIndex]}
              spinStyle={spinStyle}
              winningRows={winningRows}
              onLandingComplete={() => handleLandingComplete(colIndex)}
            />
          );
        })}
      </div>
    </div>
  );
};
