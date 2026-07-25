import React, { useState, useEffect } from 'react';
import { Play, Square, X, RotateCw, Zap, DollarSign, Layers, CheckCircle2, ShieldAlert } from 'lucide-react';

interface AutoSpinModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBet: number;
  minBet: number;
  maxBet: number;
  balance: number;
  turboMode: boolean;
  autoSpinCount: number;
  isAutoSpinning: boolean;
  onStartAutoSpin: (count: number, bet: number, turbo: boolean) => void;
  onStopAutoSpin: () => void;
}

const PRESET_SPINS = [10, 25, 50, 75, 100, 200, 500];

export const AutoSpinModal: React.FC<AutoSpinModalProps> = ({
  isOpen,
  onClose,
  currentBet,
  minBet,
  maxBet,
  balance,
  turboMode,
  autoSpinCount,
  isAutoSpinning,
  onStartAutoSpin,
  onStopAutoSpin,
}) => {
  const [selectedSpins, setSelectedSpins] = useState<number>(50);
  const [betAmount, setBetAmount] = useState<number>(currentBet);
  const [isTurbo, setIsTurbo] = useState<boolean>(turboMode);

  useEffect(() => {
    setBetAmount(currentBet);
  }, [currentBet]);

  useEffect(() => {
    setIsTurbo(turboMode);
  }, [turboMode]);

  if (!isOpen) return null;

  const handleBetChange = (delta: number) => {
    setBetAmount(prev => {
      const updated = prev + delta;
      return Math.max(minBet, Math.min(maxBet, Math.round(updated * 100) / 100));
    });
  };

  const handleStart = () => {
    onStartAutoSpin(selectedSpins, betAmount, isTurbo);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-[#0b0f19] border-2 border-[#d4af37]/60 rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(212,175,55,0.3)] text-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent shadow-[0_0_15px_#d4af37]" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <RotateCw className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500 uppercase tracking-wider">
              Rodadas Automáticas
            </h2>
            <p className="text-xs text-amber-200/70">
              Configure suas apostas e jogue no piloto automático
            </p>
          </div>
        </div>

        {/* Currently Active Banner */}
        {isAutoSpinning && (
          <div className="mb-5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-300">
              <RotateCw className="w-4 h-4 animate-spin text-amber-400" />
              <span className="text-xs font-bold uppercase">Auto-Spin Ativo: {autoSpinCount} rodadas restantes</span>
            </div>
            <button
              type="button"
              onClick={() => {
                onStopAutoSpin();
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs uppercase transition shadow-lg cursor-pointer flex items-center gap-1"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Parar</span>
            </button>
          </div>
        )}

        {/* SECTION 1: Quantidade de Rodadas */}
        <div className="mb-5">
          <label className="text-sm font-extrabold uppercase text-amber-300 tracking-wider flex items-center gap-2 mb-3">
            <Layers className="w-5 h-5 text-amber-400" />
            <span>Quantidade de Rodadas</span>
          </label>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {PRESET_SPINS.map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setSelectedSpins(num)}
                className={`py-3 rounded-xl font-black text-sm sm:text-base transition cursor-pointer border ${
                  selectedSpins === num
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-yellow-200 shadow-[0_0_15px_rgba(245,158,11,0.6)] scale-105'
                    : 'bg-white/5 hover:bg-white/10 text-gray-200 border-white/10 hover:border-amber-400/40'
                }`}
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSelectedSpins(1000)}
              className={`py-3 rounded-xl font-black text-xs sm:text-sm transition cursor-pointer border ${
                selectedSpins === 1000
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-yellow-200 shadow-[0_0_15px_rgba(245,158,11,0.6)] scale-105'
                  : 'bg-white/5 hover:bg-white/10 text-gray-200 border-white/10 hover:border-amber-400/40'
              }`}
            >
              ∞ Infinito
            </button>
          </div>

          {/* Custom Input */}
          <div className="flex items-center gap-2 bg-black/50 p-2.5 rounded-xl border border-white/15">
            <span className="text-xs sm:text-sm text-gray-300 font-extrabold px-2">Personalizado:</span>
            <input
              type="number"
              min={1}
              max={9999}
              value={selectedSpins}
              onChange={(e) => setSelectedSpins(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-amber-300 font-mono font-black text-center text-base focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* SECTION 2: Valor da Aposta */}
        <div className="mb-5">
          <label className="text-sm font-extrabold uppercase text-amber-300 tracking-wider flex items-center justify-between mb-3">
            <span className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-400" />
              <span>Valor da Aposta (por rodada)</span>
            </span>
            <span className="text-amber-400 font-mono text-xs sm:text-sm font-black">
              Saldo: R$ {balance.toFixed(2)}
            </span>
          </label>

          <div className="flex items-center justify-between bg-black/60 p-3 rounded-2xl border border-amber-500/40 gap-3">
            <button
              type="button"
              onClick={() => handleBetChange(-1.0)}
              className="w-11 h-11 rounded-xl bg-amber-500/20 hover:bg-amber-400 text-amber-300 hover:text-black font-black text-xl flex items-center justify-center border border-amber-400/40 transition cursor-pointer active:scale-90"
            >
              -
            </button>
            <div className="text-center flex-1">
              <div className="text-2xl font-black text-amber-300 font-mono tracking-tight">
                R$ {betAmount.toFixed(2)}
              </div>
              <div className="text-xs text-gray-300 uppercase tracking-widest font-extrabold">
                Total {selectedSpins === 1000 ? 'Estimado' : ''}: R$ {(betAmount * (selectedSpins === 1000 ? 100 : selectedSpins)).toFixed(2)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleBetChange(1.0)}
              className="w-11 h-11 rounded-xl bg-amber-500/20 hover:bg-amber-400 text-amber-300 hover:text-black font-black text-xl flex items-center justify-center border border-amber-400/40 transition cursor-pointer active:scale-90"
            >
              +
            </button>
          </div>

          {/* Quick Bet Presets */}
          <div className="grid grid-cols-4 gap-2 mt-2.5">
            {[1, 5, 10, 25, 50, 100, 250, 500].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setBetAmount(val)}
                className={`py-2 rounded-lg text-xs sm:text-sm font-extrabold transition border cursor-pointer ${
                  betAmount === val 
                    ? 'bg-amber-400 text-black border-amber-200 font-black scale-105 shadow-md' 
                    : 'bg-white/5 hover:bg-white/10 text-gray-200 border-white/10'
                }`}
              >
                R$ {val}
              </button>
            ))}
          </div>
        </div>

        {/* SECTION 3: Modo de Jogo (Velocidade) */}
        <div className="mb-6">
          <label className="text-sm font-extrabold uppercase text-amber-300 tracking-wider flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-amber-400" />
            <span>Velocidade das Rodadas</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setIsTurbo(false)}
              className={`p-3.5 rounded-2xl border flex items-center gap-3 transition cursor-pointer ${
                !isTurbo
                  ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
              }`}
            >
              <div className={`p-2.5 rounded-xl ${!isTurbo ? 'bg-amber-400 text-black' : 'bg-white/10 text-gray-400'}`}>
                <RotateCw className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-sm font-black uppercase">Modo Normal</div>
                <div className="text-xs text-gray-300">Animação suave</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsTurbo(true)}
              className={`p-3.5 rounded-2xl border flex items-center gap-3 transition cursor-pointer ${
                isTurbo
                  ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
              }`}
            >
              <div className={`p-2.5 rounded-xl ${isTurbo ? 'bg-amber-400 text-black' : 'bg-white/10 text-gray-400'}`}>
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div className="text-left">
                <div className="text-sm font-black uppercase">Modo Turbo</div>
                <div className="text-xs text-gray-300">Giro rápido e direto</div>
              </div>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {isAutoSpinning ? (
            <button
              type="button"
              onClick={() => {
                onStopAutoSpin();
                onClose();
              }}
              className="flex-1 py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-base uppercase tracking-wider shadow-lg transition cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              <Square className="w-5 h-5 fill-current" />
              <span>CANCELAR AUTO-SPIN</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStart}
              className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black font-black text-base uppercase tracking-wider shadow-[0_0_25px_rgba(245,158,11,0.7)] hover:brightness-110 transition cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              <Play className="w-6 h-6 fill-current" />
              <span>INICIAR {selectedSpins} RODADAS</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
