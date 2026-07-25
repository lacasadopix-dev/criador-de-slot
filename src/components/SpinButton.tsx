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
        return 'w-[220px] h-[90px] rounded-full px-6';
      case 'rounded':
        return 'w-[180px] h-[120px] rounded-3xl';
      case 'square':
        return 'w-[150px] h-[150px] rounded-xl';
      case 'octagon':
        return 'w-[160px] h-[160px] [clip-path:polygon(30%_0%,70%_0%,100%_30%,100%_70%,70%_100%,30%_100%,0%_70%,0%_30%)] rounded-none';
      case 'diamond':
        return 'w-[130px] h-[130px] rotate-45 rounded-2xl my-4 mx-4';
      case 'circle':
      default:
        return 'w-[180px] h-[180px] rounded-full';
    }
  };

  const getGlowClasses = () => {
    switch (shape) {
      case 'pill':
        return 'rounded-full';
      case 'rounded':
        return 'rounded-3xl';
      case 'square':
        return 'rounded-xl';
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
      <div className={`absolute inset-0 bg-[#d4af37] blur-[30px] opacity-25 group-hover:opacity-50 transition-opacity duration-500 ${getGlowClasses()}`} />
      
      <button
        type="button"
        onClick={onSpin}
        disabled={isSpinning}
        className={`relative bg-gradient-to-br from-[#2a2a2a] to-[#0a0a0a] border-[6px] border-[#8b6914] shadow-[inset_0_0_25px_rgba(212,175,55,0.3),0_10px_30px_rgba(0,0,0,0.9)] flex items-center justify-center overflow-hidden transition-all duration-150 hover:scale-105 active:scale-95 disabled:opacity-80 disabled:hover:scale-100 cursor-pointer ${getShapeClasses()}`}
      >
        {/* Animated Gears/Decorations */}
        <motion.div
          animate={isSpinning ? { rotate: 360 } : { rotate: 0 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className={`absolute inset-0 border-[6px] border-dashed border-[#d4af37]/30 ${shape === 'pill' || shape === 'rounded' ? 'rounded-2xl' : shape === 'square' ? 'rounded-lg' : shape === 'diamond' ? 'rounded-lg' : 'rounded-full'}`}
        />
        <motion.div
          animate={isSpinning ? { rotate: -360 } : { rotate: 0 }}
          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          className={`absolute inset-3 border-[4px] border-dotted border-[#d4af37]/50 ${shape === 'pill' || shape === 'rounded' ? 'rounded-xl' : shape === 'square' ? 'rounded-md' : shape === 'diamond' ? 'rounded-md' : 'rounded-full'}`}
        />
        
        {/* Central Gem/Text */}
        <div className={`z-10 flex flex-col items-center justify-center ${shape === 'diamond' ? '-rotate-45' : ''}`}>
          <span className="text-[26px] sm:text-[28px] font-black text-gold-gradient tracking-widest drop-shadow-[0_3px_6px_rgba(0,0,0,1)] uppercase">
            Girar
          </span>
          {isSpinning && (
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="mt-1"
            >
              <Zap className="w-7 h-7 text-[#d4af37]" />
            </motion.div>
          )}
        </div>
      </button>
    </div>
  );
};

