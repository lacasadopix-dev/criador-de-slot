import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { WinningPayline } from '../utils/paylines';
import { ReelPosition } from '../types';

interface PaylineOverlayProps {
  winningPaylines: WinningPayline[];
  numReels?: number;
  numRows?: number;
  isSpinning?: boolean;
  individualReelPositions?: Record<number, ReelPosition>;
}

export const PaylineOverlay: React.FC<PaylineOverlayProps> = ({
  winningPaylines,
  numReels = 5,
  numRows = 3,
  isSpinning = false,
  individualReelPositions,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [coords, setCoords] = useState<Record<string, Array<{ x: number; y: number }>>>({});

  const measure = useCallback(() => {
    const overlayEl = overlayRef.current;
    if (!overlayEl) return;

    const container = overlayEl.parentElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    if (containerRect.width === 0 || containerRect.height === 0) return;

    setDimensions({
      width: containerRect.width,
      height: containerRect.height,
    });

    const newCoords: Record<string, Array<{ x: number; y: number }>> = {};

    winningPaylines.forEach((winLine, index) => {
      const lineId = winLine.payline.id || String(index);
      const points: Array<{ x: number; y: number }> = [];

      winLine.positions.forEach(pos => {
        const symbolEl = container.querySelector(
          `[data-symbol-col="${pos.col}"][data-symbol-row="${pos.row}"]`
        );

        if (symbolEl) {
          const rect = symbolEl.getBoundingClientRect();
          // Center point of this symbol relative to container
          points.push({
            x: rect.left + rect.width / 2 - containerRect.left,
            y: rect.top + rect.height / 2 - containerRect.top,
          });
        } else {
          // Precise proportional center calculation
          const colWidth = containerRect.width / numReels;
          const rowHeight = containerRect.height / numRows;
          points.push({
            x: (pos.col + 0.5) * colWidth,
            y: (pos.row + 0.5) * rowHeight,
          });
        }
      });

      newCoords[lineId] = points;
    });

    setCoords(newCoords);
  }, [winningPaylines, numReels, numRows]);

  useEffect(() => {
    if (isSpinning || !winningPaylines || winningPaylines.length === 0) {
      setCoords({});
      return;
    }

    // Measure initially and after slight delay to ensure DOM layout stability
    measure();
    const timer1 = setTimeout(measure, 50);
    const timer2 = setTimeout(measure, 200);

    const container = overlayRef.current?.parentElement;
    let observer: ResizeObserver | null = null;
    if (container) {
      observer = new ResizeObserver(() => {
        measure();
      });
      observer.observe(container);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      if (observer) observer.disconnect();
    };
  }, [winningPaylines, isSpinning, numReels, numRows, individualReelPositions, measure]);

  if (isSpinning || !winningPaylines || winningPaylines.length === 0) {
    return null;
  }

  const svgWidth = dimensions.width > 0 ? dimensions.width : 1000;
  const svgHeight = dimensions.height > 0 ? dimensions.height : 1000;
  const baseStrokeWidth = Math.max(4, Math.min(9, svgWidth / 90));

  return (
    <div ref={overlayRef} className="absolute inset-0 pointer-events-none z-30 w-full h-full">
      <svg 
        className="w-full h-full overflow-visible" 
        viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="glow-payline" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {winningPaylines.map((winLine, index) => {
          const { payline, positions, matchCount } = winLine;
          const lineColor = payline.color || '#f59e0b';
          const strokeWidth = payline.strokeWidth ? Math.min(payline.strokeWidth, baseStrokeWidth * 1.5) : baseStrokeWidth;

          if (!positions || positions.length === 0) return null;

          const lineId = payline.id || String(index);
          const measuredPoints = coords[lineId];

          // Use direct pixel coordinates relative to slot machine container
          const points = positions.map((pos, pIdx) => {
            if (measuredPoints && measuredPoints[pIdx]) {
              return {
                x: measuredPoints[pIdx].x,
                y: measuredPoints[pIdx].y,
              };
            }
            return {
              x: ((pos.col + 0.5) / numReels) * svgWidth,
              y: ((pos.row + 0.5) / numRows) * svgHeight,
            };
          });

          if (points.length === 0) return null;

          const firstPoint = points[0];
          const lastPoint = points[points.length - 1];

          // Path D string connecting all matched symbol centers
          const pathD = points.reduce((acc, pt, i) => {
            return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
          }, '');

          // Unique key to force drawing animation restart on new wins or line changes
          const drawAnimationKey = `${lineId}-${positions.map(p => `${p.col}_${p.row}`).join('-')}`;
          const animationDuration = 0.85;

          // Safe badge coordinates inside canvas bounds
          const badgeHalfW = 22;
          const leftBadgeX = Math.max(badgeHalfW + 6, Math.min(svgWidth - badgeHalfW - 6, firstPoint.x - 28));
          const rightBadgeX = Math.max(badgeHalfW + 6, Math.min(svgWidth - badgeHalfW - 6, lastPoint.x + 28));

          return (
            <g key={drawAnimationKey} className="transition-all duration-300">
              {/* 1. Outer Glow Path - Animated Drawing */}
              <motion.path
                d={pathD}
                fill="none"
                stroke={lineColor}
                strokeWidth={strokeWidth * 2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow-payline)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.65 }}
                transition={{ duration: animationDuration, ease: [0.25, 0.1, 0.25, 1] }}
              />

              {/* 2. Main High-Contrast Line Path - Animated Drawing */}
              <motion.path
                d={pathD}
                fill="none"
                stroke={lineColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: animationDuration, ease: [0.25, 0.1, 0.25, 1] }}
              />

              {/* 3. Inner White Core Tracer - Animated Drawing & Continuous Flow */}
              <motion.path
                d={pathD}
                fill="none"
                stroke="#ffffff"
                strokeWidth={Math.max(2, strokeWidth * 0.45)}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="14 8"
                initial={{ pathLength: 0, strokeDashoffset: 0 }}
                animate={{ pathLength: 1, strokeDashoffset: [-80, 0] }}
                transition={{
                  pathLength: { duration: animationDuration, ease: [0.25, 0.1, 0.25, 1] },
                  strokeDashoffset: { duration: 1.0, repeat: Infinity, ease: 'linear' }
                }}
              />

              {/* 4. Glowing Connection Dots at Winning Symbol Centers */}
              {points.map((pt, pIdx) => {
                const dotDelay = (pIdx / Math.max(1, points.length - 1)) * (animationDuration * 0.8);
                return (
                  <motion.g 
                    key={pIdx}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: dotDelay, duration: 0.3, type: 'spring', stiffness: 350, damping: 18 }}
                  >
                    {/* Outer pulse circle */}
                    <motion.circle
                      cx={pt.x}
                      cy={pt.y}
                      r={strokeWidth * 2.0}
                      fill={lineColor}
                      opacity="0.3"
                      animate={{ scale: [0.85, 1.35, 0.85], opacity: [0.6, 0.15, 0.6] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: dotDelay + 0.2 }}
                    />
                    {/* Core Dot */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={Math.max(5, strokeWidth * 0.7)}
                      fill={lineColor}
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      className="drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]"
                    />
                  </motion.g>
                );
              })}

              {/* 5. Line Identifier Badge at Left */}
              <motion.g 
                transform={`translate(${leftBadgeX}, ${firstPoint.y})`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.35, type: 'spring', stiffness: 300 }}
              >
                <rect
                  x="-22"
                  y="-11"
                  width="44"
                  height="22"
                  rx="11"
                  fill="#000000"
                  stroke={lineColor}
                  strokeWidth="2"
                  className="drop-shadow-[0_0_10px_rgba(0,0,0,0.95)]"
                />
                <text
                  x="0"
                  y="3.5"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="11"
                  fontWeight="900"
                >
                  L{payline.id}
                </text>
              </motion.g>

              {/* 6. Match Multiplier Badge at Right */}
              {lastPoint && (
                <motion.g 
                  transform={`translate(${rightBadgeX}, ${lastPoint.y})`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: animationDuration, duration: 0.4, type: 'spring', stiffness: 350 }}
                >
                  <rect
                    x="-22"
                    y="-11"
                    width="44"
                    height="22"
                    rx="11"
                    fill="#000000"
                    stroke={lineColor}
                    strokeWidth="2"
                    className="drop-shadow-[0_0_10px_rgba(0,0,0,0.95)]"
                  />
                  <text
                    x="0"
                    y="3.5"
                    textAnchor="middle"
                    fill="#fde047"
                    fontSize="11"
                    fontWeight="900"
                  >
                    {matchCount}x
                  </text>
                </motion.g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
