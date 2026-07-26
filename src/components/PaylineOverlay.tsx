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
  isEditingPaylines?: boolean;
  selectedPaylineId?: string;
  onUpdatePaylineBadgePos?: (paylineId: string, xPct: number, yPct: number) => void;
}

export const PaylineOverlay: React.FC<PaylineOverlayProps> = ({
  winningPaylines,
  numReels = 5,
  numRows = 3,
  isSpinning = false,
  individualReelPositions,
  isEditingPaylines = false,
  selectedPaylineId,
  onUpdatePaylineBadgePos,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [coords, setCoords] = useState<Record<string, Array<{ x: number; y: number }>>>({});

  // Dragging custom win badge position
  const handleBadgeDragStart = (e: React.MouseEvent | React.TouchEvent, lineId: string) => {
    e.stopPropagation();
    if (!onUpdatePaylineBadgePos || !overlayRef.current) return;

    const overlay = overlayRef.current;
    const rect = overlay.getBoundingClientRect();

    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const clientY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;

      const xPct = Math.max(0, Math.min(100, Math.round(((clientX - rect.left) / rect.width) * 100)));
      const yPct = Math.max(0, Math.min(100, Math.round(((clientY - rect.top) / rect.height) * 100)));

      onUpdatePaylineBadgePos(lineId, xPct, yPct);
    };

    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleUp);
  };

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
          const innerContainer = symbolEl.querySelector('.symbol-container') || symbolEl;
          const rect = innerContainer.getBoundingClientRect();
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

    // Measure initially and continuously during reel landing springs to ensure exact center alignment
    measure();

    let animFrameId: number;
    const startTime = Date.now();
    
    const tick = () => {
      measure();
      if (Date.now() - startTime < 1200) {
        animFrameId = requestAnimationFrame(tick);
      }
    };

    animFrameId = requestAnimationFrame(tick);

    const timer1 = setTimeout(measure, 100);
    const timer2 = setTimeout(measure, 300);
    const timer3 = setTimeout(measure, 600);
    const timer4 = setTimeout(measure, 1000);

    const container = overlayRef.current?.parentElement;
    let observer: ResizeObserver | null = null;
    if (container) {
      observer = new ResizeObserver(() => {
        measure();
      });
      observer.observe(container);
    }

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
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
                    {/* Outer pulse halo */}
                    <motion.circle
                      cx={pt.x}
                      cy={pt.y}
                      r={strokeWidth * 2.4}
                      fill={lineColor}
                      opacity="0.35"
                      animate={{ scale: [0.85, 1.45, 0.85], opacity: [0.7, 0.15, 0.7] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: dotDelay + 0.2 }}
                    />
                    {/* Concentric Target Ring */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={strokeWidth * 1.35}
                      fill="none"
                      stroke={lineColor}
                      strokeWidth="2"
                      opacity="0.9"
                      className="drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]"
                    />
                    {/* Main Core Dot */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={Math.max(6, strokeWidth * 0.75)}
                      fill={lineColor}
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      className="drop-shadow-[0_0_12px_rgba(255,255,255,1)]"
                    />
                    {/* White Center Pinpoint Target */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={Math.max(2, strokeWidth * 0.28)}
                      fill="#ffffff"
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

              {/* 7. Custom Win Media Overlay (Foto ou Vídeo por URL) */}
              {payline.winMediaUrl && payline.winMediaType && payline.winMediaType !== 'none' && (
                <foreignObject
                  x={Math.max(10, Math.min(svgWidth - 160, (payline.winBadgePosX !== undefined ? (payline.winBadgePosX / 100) * svgWidth : (leftBadgeX + rightBadgeX) / 2) - 75))}
                  y={Math.max(10, Math.min(svgHeight - 160, (payline.winBadgePosY !== undefined ? (payline.winBadgePosY / 100) * svgHeight : (firstPoint.y + lastPoint.y) / 2) - 85))}
                  width="150"
                  height="150"
                  className="overflow-visible pointer-events-auto"
                >
                  <motion.div
                    initial={{ scale: 0.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className={`w-full h-full flex flex-col items-center justify-center relative p-1 rounded-2xl bg-black/90 border-2 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.95)] ${
                      payline.winAnimationType === 'bounce'
                        ? 'animate-bounce'
                        : payline.winAnimationType === 'pulse'
                        ? 'animate-pulse'
                        : payline.winAnimationType === 'shake'
                        ? 'animate-pulse scale-105'
                        : ''
                    }`}
                  >
                    {payline.winMediaType === 'video' ? (
                      <video
                        src={payline.winMediaUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className={`w-full h-full rounded-xl ${
                          payline.winMediaFit === 'contain' ? 'object-contain' : 'object-cover'
                        }`}
                      />
                    ) : (
                      <img
                        src={payline.winMediaUrl}
                        alt={payline.name}
                        className={`w-full h-full rounded-xl ${
                          payline.winMediaFit === 'contain' ? 'object-contain' : 'object-cover'
                        }`}
                      />
                    )}
                    <div className="absolute -bottom-2.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black text-[9px] font-black uppercase tracking-wider shadow-md whitespace-nowrap border border-yellow-200">
                      {payline.name} ({payline.payoutMultiplier}x)
                    </div>
                  </motion.div>
                </foreignObject>
              )}

              {/* 8. Custom Win Value Badge / Banner (Arrastável Livremente pelo ADM) */}
              {(() => {
                const customX = payline.winBadgePosX !== undefined 
                  ? (payline.winBadgePosX / 100) * svgWidth 
                  : (leftBadgeX + rightBadgeX) / 2;
                const customY = payline.winBadgePosY !== undefined 
                  ? (payline.winBadgePosY / 100) * svgHeight 
                  : (firstPoint.y + lastPoint.y) / 2 + 35;

                return (
                  <motion.g
                    transform={`translate(${customX}, ${customY})`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.15, duration: 0.35, type: 'spring', stiffness: 300 }}
                    className="pointer-events-auto cursor-move select-none"
                    onMouseDown={(e) => handleBadgeDragStart(e, payline.id)}
                    onTouchStart={(e) => handleBadgeDragStart(e, payline.id)}
                  >
                    <rect
                      x="-70"
                      y="-20"
                      width="140"
                      height="40"
                      rx="20"
                      fill="rgba(0, 0, 0, 0.92)"
                      stroke={lineColor}
                      strokeWidth="3"
                      className="drop-shadow-[0_0_20px_rgba(245,158,11,0.95)]"
                    />
                    <text
                      x="0"
                      y="-4"
                      textAnchor="middle"
                      fill="#fde047"
                      fontSize="10"
                      fontWeight="900"
                      letterSpacing="1"
                    >
                      {payline.name.toUpperCase()}
                    </text>
                    <text
                      x="0"
                      y="10"
                      textAnchor="middle"
                      fill="#34d399"
                      fontSize="11"
                      fontWeight="900"
                    >
                      GANHO {payline.payoutMultiplier}x
                    </text>
                    {(isEditingPaylines || onUpdatePaylineBadgePos) && (
                      <text
                        x="0"
                        y="28"
                        textAnchor="middle"
                        fill="#38bdf8"
                        fontSize="8"
                        fontWeight="900"
                        className="uppercase tracking-widest"
                      >
                        ✋ ARRASTE AQUI
                      </text>
                    )}
                  </motion.g>
                );
              })()}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
