import React from 'react';
import { motion } from 'motion/react';
import { Zap } from 'lucide-react';

export type ButtonShape = 'circle' | 'pill' | 'rounded' | 'square' | 'octagon' | 'diamond';

interface SpinButtonProps {
  onSpin: () => void;
  isSpinning: boolean;
  shape?: ButtonShape;
}

export const SpinButton: React.FC<SpinButtonProps> = ({ onSpin, isSpinning, shape = 'circle' }) => {
  const getShapeClasses = () => {
    switch (shape) {
      case 'pill':
        return 'w-[320px] h-[130px] rounded-full px-8';
      case 'rounded':
        return 'w-[260px] h-[180px] rounded-3xl';
      case 'square':
        return 'w-[220px] h-[220px] rounded-2xl';
      case 'octagon':
        return 'w-[240px] h-[240px] [clip-path:polygon(30%_0%,70%_0%,100%_30%,100%_70%,70%_100%,30%_100%,0%_70%,0%_30%)] rounded-none';
      case 'diamond':
        return 'w-[200px] h-[200px] rotate-45 rounded-2xl my-4 mx-4';
      case 'circle':
      default:
        return 'w-[250px] h-[250px] rounded-full';
    }
  };

  const getGlowClasses = () => {
    switch (shape) {
      case 'pill':
        return 'rounded-full';
      case 'rounded':
        return 'rounded-3xl';
      case 'square':
        return 'rounded-2xl';
      case 'octagon':
        return 'rounded-none';
      case 'diamond':
        return 'rotate-45 rounded-2xl';
      case 'circle':
      default:
        return 'rounded-full';
    }
  };

  return (
    <div className="relative group flex items-center justify-center">
      {/* Outer Glow */}
      <div className={`absolute inset-0 bg-[#d4af37] blur-[35px] opacity-35 group-hover:opacity-60 transition-opacity duration-500 ${getGlowClasses()}`} />
      
      <button
        type="button"
        onClick={onSpin}
        disabled={isSpinning}
        className={`relative bg-gradient-to-br from-[#2a2a2a] via-[#1a1a1a] to-[#0a0a0a] border-[8px] border-[#d4af37] shadow-[inset_0_0_35px_rgba(212,175,55,0.4),0_15px_40px_rgba(0,0,0,0.95)] flex items-center justify-center overflow-hidden transition-all duration-150 hover:scale-105 active:scale-95 disabled:opacity-80 disabled:hover:scale-100 cursor-pointer ${getShapeClasses()}`}
      >
        {/* Animated Gears/Decorations */}
        <motion.div
          animate={isSpinning ? { rotate: 360 } : { rotate: 0 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className={`absolute inset-0 border-[8px] border-dashed border-[#d4af37]/40 ${shape === 'pill' || shape === 'rounded' ? 'rounded-2xl' : shape === 'square' ? 'rounded-xl' : shape === 'diamond' ? 'rounded-xl' : 'rounded-full'}`}
        />
        <motion.div
          animate={isSpinning ? { rotate: -360 } : { rotate: 0 }}
          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          className={`absolute inset-4 border-[5px] border-dotted border-[#d4af37]/60 ${shape === 'pill' || shape === 'rounded' ? 'rounded-xl' : shape === 'square' ? 'rounded-lg' : shape === 'diamond' ? 'rounded-lg' : 'rounded-full'}`}
        />
        
        {/* Central Gem/Text */}
        <div className={`z-10 flex flex-col items-center justify-center ${shape === 'diamond' ? '-rotate-45' : ''}`}>
          <span className="text-[38px] sm:text-[44px] font-black text-gold-gradient tracking-widest drop-shadow-[0_4px_8px_rgba(0,0,0,1)] uppercase">
            GIRAR
          </span>
          {isSpinning && (
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="mt-1"
            >
              <Zap className="w-9 h-9 text-[#d4af37]" />
            </motion.div>
          )}
        </div>
      </button>
    </div>
  );
};

