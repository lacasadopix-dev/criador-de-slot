import React from 'react';
import { motion } from 'motion/react';
import { Crown, Shield, Sword, Gem, Coins, Hexagon, Castle, Orbit } from 'lucide-react';
import { SymbolType, SymbolImageConfig } from '../types';

interface SlotSymbolProps {
  type: SymbolType;
  isWinning?: boolean;
  customImage?: string;
  symbolConfig?: SymbolImageConfig;
}

export const SlotSymbol: React.FC<SlotSymbolProps> = ({ type, isWinning, customImage, symbolConfig }) => {
  const imageUrl = symbolConfig?.url || customImage;
  const fitMode = symbolConfig?.objectFit || 'cover';
  const offsetX = symbolConfig?.offsetX || 0;
  const offsetY = symbolConfig?.offsetY || 0;
  const zoomScale = (symbolConfig?.scale || 100) / 100;

  const getSymbolContent = () => {
    const iconClasses = "w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 transition-all";

    if (imageUrl) {
      return (
        <div className="relative w-full h-full overflow-hidden flex items-center justify-center rounded-md">
          <img 
            src={imageUrl} 
            alt={type} 
            style={{
              objectFit: fitMode,
              transform: `translate(${offsetX}%, ${offsetY}%) scale(${zoomScale})`,
              imageRendering: 'auto',
              WebkitBackfaceVisibility: 'hidden',
              backfaceVisibility: 'hidden',
            }}
            className="w-full h-full absolute inset-0 transition-transform duration-75 pointer-events-none"
          />
        </div>
      );
    }

    switch (type) {
      case 'King':
        return <Crown className={`${iconClasses} text-yellow-300 drop-shadow-[0_0_15px_rgba(253,224,71,0.8)]`} />;
      case 'Queen':
        return <Crown className={`${iconClasses} text-pink-400 drop-shadow-[0_0_15px_rgba(244,114,182,0.8)]`} />;
      case 'Crown':
        return <Crown className={`${iconClasses} text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,1)]`} />;
      case 'Lion':
        return <Orbit className={`${iconClasses} text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.8)]`} />;
      case 'Sword':
        return <Sword className={`${iconClasses} text-slate-300 drop-shadow-[0_0_15px_rgba(203,213,225,0.8)]`} />;
      case 'Shield':
        return <Shield className={`${iconClasses} text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]`} />;
      case 'Castle':
        return <Castle className={`${iconClasses} text-purple-400 drop-shadow-[0_0_15px_rgba(192,132,252,0.8)]`} />;
      case 'Diamond':
        return <Gem className={`${iconClasses} text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]`} />;
      case 'Coin':
        return <Coins className={`${iconClasses} text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.8)]`} />;
      case 'Dragon':
        return <Hexagon className={`${iconClasses} text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]`} />;
      default:
        return null;
    }
  };

  return (
    <div className={`relative flex items-center justify-center w-full h-full flex-1 min-h-0 symbol-container rounded-md overflow-hidden transition-all duration-300 ${isWinning ? 'box-gold-glow border-2 border-yellow-400 z-10 scale-105' : ''}`}>
      <motion.div
        animate={isWinning ? {
          scale: [1, 1.12, 1],
          rotate: [0, 3, -3, 0],
        } : {}}
        transition={{ duration: 1, repeat: isWinning ? Infinity : 0 }}
        className="w-full h-full flex items-center justify-center p-0.5"
      >
        {getSymbolContent()}
      </motion.div>
      {/* Dynamic Lighting Overlay (Only for standard icon symbols) */}
      {!imageUrl && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none mix-blend-overlay"></div>
      )}
    </div>
  );
};

