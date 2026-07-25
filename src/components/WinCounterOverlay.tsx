import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coins, Sparkles, Trophy } from 'lucide-react';

interface WinCounterOverlayProps {
  winAmount: number;
  isBigWin?: boolean;
  onClose?: () => void;
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  bgImage?: string;
}

export const WinCounterOverlay: React.FC<WinCounterOverlayProps> = ({
  winAmount,
  isBigWin = false,
  onClose,
  bgColor,
  textColor,
  borderColor,
  bgImage,
}) => {
  const [displayValue, setDisplayValue] = useState<number>(0);

  // Animated Count Up from 0 to winAmount
  useEffect(() => {
    if (winAmount <= 0) {
      setDisplayValue(0);
      return;
    }

    let startTimestamp: number | null = null;
    const duration = isBigWin ? 2500 : 1600; // ms

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Ease out expo for satisfying slowdown at exact end
      const easeProgress = 1 - Math.pow(2, -10 * progress);
      const current = easeProgress * winAmount;

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setDisplayValue(winAmount);
      }
    };

    requestAnimationFrame(step);
  }, [winAmount, isBigWin]);

  if (winAmount <= 0) return null;

  // Floating Coins / Money particles generator
  const particleCount = isBigWin ? 18 : 10;
  const particles = Array.from({ length: particleCount }).map((_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 260, // scatter X
    delay: Math.random() * 0.8,
    duration: 1.5 + Math.random() * 1.2,
    scale: 0.6 + Math.random() * 0.8,
    symbol: i % 3 === 0 ? '🪙' : i % 3 === 1 ? '💵' : '✨',
  }));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.7, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.7, y: -20 }}
        className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-auto flex flex-col items-center"
      >
        {/* Floating Money Particle Canvas */}
        <div className="absolute inset-0 pointer-events-none overflow-visible flex items-center justify-center">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 1, y: 0, x: p.x, scale: p.scale }}
              animate={{
                opacity: [1, 1, 0],
                y: [-10, -120 - Math.random() * 80],
                x: p.x + (Math.random() - 0.5) * 40,
                rotate: [0, (Math.random() - 0.5) * 180],
              }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                delay: p.delay,
                ease: 'easeOut',
              }}
              className="absolute text-xl sm:text-2xl select-none"
            >
              {p.symbol}
            </motion.div>
          ))}
        </div>

        {/* Main Win Banner Card */}
        <div 
          onClick={onClose}
          style={{
            backgroundColor: bgColor ? bgColor : undefined,
            borderColor: borderColor ? borderColor : undefined,
            backgroundImage: bgImage ? `url(${bgImage})` : undefined,
            backgroundSize: bgImage ? 'cover' : undefined,
            backgroundPosition: bgImage ? 'center' : undefined,
          }}
          className={`relative cursor-pointer px-5 py-2.5 sm:px-8 sm:py-3.5 rounded-2xl border-2 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(234,179,8,0.8)] backdrop-blur-xl ${
            !bgColor && !bgImage
              ? isBigWin
                ? 'bg-gradient-to-r from-amber-950 via-yellow-600 to-amber-950 border-yellow-300 text-white'
                : 'bg-gradient-to-r from-emerald-950 via-green-900 to-emerald-950 border-emerald-400 text-white'
              : 'text-white'
          }`}
        >
          {/* Header Title */}
          <div className="flex items-center gap-2 mb-0.5">
            <Trophy className={`w-4 h-4 sm:w-5 sm:h-5 ${isBigWin ? 'text-yellow-300 animate-spin' : 'text-emerald-300'}`} />
            <span className={`text-xs sm:text-sm font-black uppercase tracking-widest ${isBigWin ? 'text-yellow-200' : 'text-emerald-200'}`}>
              {isBigWin ? '🎉 SUPER GRANDE VITÓRIA! 🎉' : '✨ GANHO DA RODADA ✨'}
            </span>
            <Sparkles className="w-4 h-4 text-yellow-300" />
          </div>

          {/* Animated Money Counter */}
          <div 
            style={{ color: textColor ? textColor : undefined }}
            className="flex items-baseline gap-1 font-mono font-black text-2xl sm:text-4xl text-yellow-300 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] tracking-tight"
          >
            <span className="text-lg sm:text-2xl text-amber-200">R$</span>
            <span>
              {displayValue.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          {/* Subtle click to dismiss hint */}
          <span className="text-[9px] text-yellow-100/70 font-semibold mt-0.5 uppercase tracking-wider">
            Clique para fechar
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
