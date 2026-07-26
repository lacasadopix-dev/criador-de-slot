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
  isEditingPaylines?: boolean;
  selectedPaylineId?: string;
  testPaylineId?: string | null;
  onUpdatePaylineBadgePos?: (paylineId: string, xPct: number, yPct: number) => void;
  onUpdatePaylineMediaPos?: (paylineId: string, xPct: number, yPct: number) => void;
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
  isEditingPaylines = false,
  selectedPaylineId,
  testPaylineId,
  onUpdatePaylineBadgePos,
  onUpdatePaylineMediaPos,
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
      const startTimers: NodeJS.Timeout[] = [];
      const stopTimers: NodeJS.Timeout[] = [];

      // Stagger parameters based on spinStyle for cascade start and stop
      let startDelay = 100; // Time delay between each reel starting
      let baseSpinDuration = 1100; // Spin duration for the first reel
      let stopDelay = 220; // Delay between stopping each consecutive reel

      if (spinStyle === 'turbo') {
        startDelay = 50;
        baseSpinDuration = 350;
        stopDelay = 90;
      } else if (spinStyle === 'cascade') {
        startDelay = 120;
        baseSpinDuration = 1200;
        stopDelay = 250;
      } else if (spinStyle === 'zoom') {
        startDelay = 80;
        baseSpinDuration = 800;
        stopDelay = 180;
      } else if (spinStyle === 'random') {
        startDelay = 100;
        baseSpinDuration = 1000;
        stopDelay = 200;
      }

      // Initialize all reels to idle first, then trigger them sequentially
      setReelsSpinning(Array(effectiveNumReels).fill(false));

      for (let col = 0; col < effectiveNumReels; col++) {
        // Cascade Start
        const sTimer = setTimeout(() => {
          setReelsSpinning(prev => {
            const next = [...prev];
            next[col] = true;
            return next;
          });
        }, col * startDelay);
        startTimers.push(sTimer);

        // Cascade Stop
        const stopTime = col * startDelay + baseSpinDuration + col * stopDelay;
        const pTimer = setTimeout(() => {
          setReelsSpinning(prev => {
            const next = [...prev];
            next[col] = false;
            return next;
          });
        }, stopTime);
        stopTimers.push(pTimer);
      }

      return () => {
        startTimers.forEach(t => clearTimeout(t));
        stopTimers.forEach(t => clearTimeout(t));
      };
    } else {
      setReelsSpinning(Array(effectiveNumReels).fill(false));
    }
  }, [isSpinning, effectiveNumReels, spinStyle]);

  const winningPaylines = useMemo(() => {
    if (isSpinning || reelsSpinning.some(s => s) || !grid || !paylines) return [];
    const realWins = evaluatePaylines(grid, paylines, effectiveNumReels, effectiveNumRows);
    if (realWins.length > 0) return realWins;

    // Synthetic preview win for editing paylines or test triggers
    if (isEditingPaylines || testPaylineId) {
      const activeLineId = testPaylineId || selectedPaylineId || paylines[0]?.id;
      const targetPayline = paylines.find(p => p.id === activeLineId) || paylines[0];
      if (targetPayline && targetPayline.positions) {
        return [{
          payline: targetPayline,
          matchCount: targetPayline.positions.length || effectiveNumReels,
          payout: targetPayline.payoutMultiplier * 10,
          positions: targetPayline.positions.map((row, col) => ({ col, row })),
        }];
      }
    }

    return [];
  }, [grid, paylines, isSpinning, reelsSpinning, effectiveNumReels, effectiveNumRows, isEditingPaylines, testPaylineId, selectedPaylineId]);

  const reelsLandedRef = useRef<boolean[]>([]);

  useEffect(() => {
    if (isSpinning) {
      reelsLandedRef.current = Array(effectiveNumReels).fill(false);
    }
  }, [isSpinning, effectiveNumReels]);

  // Safety watchdog timer: ensure isSpinning resolves if reels take too long or tab loses focus
  useEffect(() => {
    if (isSpinning) {
      const maxSpinDuration = spinStyle === 'turbo' ? 3000 : 5000;
      const watchdogTimer = setTimeout(() => {
        onAllStoppedRef.current?.();
      }, maxSpinDuration);
      return () => clearTimeout(watchdogTimer);
    }
  }, [isSpinning, spinStyle]);

  const handleLandingComplete = (colIndex: number) => {
    reelsLandedRef.current[colIndex] = true;
    if (reelsLandedRef.current.slice(0, effectiveNumReels).every(Boolean)) {
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
        isEditingPaylines={isEditingPaylines}
        selectedPaylineId={selectedPaylineId}
        onUpdatePaylineBadgePos={onUpdatePaylineBadgePos}
        onUpdatePaylineMediaPos={onUpdatePaylineMediaPos}
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
