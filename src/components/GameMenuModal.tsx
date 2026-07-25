import React, { useState } from 'react';
import { Volume2, VolumeX, Music, Zap, BookOpen, History, Settings, ShieldAlert, X, Trophy, Info, Layers } from 'lucide-react';
import { GameSettings, SpinHistoryItem, SymbolType, Payline } from '../types';

interface GameMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  history: SpinHistoryItem[];
  onOpenAdmin: () => void;
  gameRulesText?: string;
  paylines?: Payline[];
  symbolPayouts?: Record<SymbolType, number>;
}

const DEFAULT_SYMBOL_INFO: { type: SymbolType; name: string; color: string }[] = [
  { type: 'Crown', name: 'Coroa Imperial', color: 'text-yellow-400' },
  { type: 'Dragon', name: 'Dragão do Reino', color: 'text-emerald-400' },
  { type: 'King', name: 'Rei Supremo', color: 'text-amber-300' },
  { type: 'Queen', name: 'Rainha das Armas', color: 'text-pink-400' },
  { type: 'Lion', name: 'Leão Guardião', color: 'text-orange-400' },
  { type: 'Castle', name: 'Castelo Fortificado', color: 'text-purple-400' },
  { type: 'Sword', name: 'Espada Mágica', color: 'text-slate-300' },
  { type: 'Shield', name: 'Escudo Real', color: 'text-red-400' },
  { type: 'Diamond', name: 'Diamante Ancestral', color: 'text-cyan-400' },
  { type: 'Coin', name: 'Moeda de Ouro', color: 'text-yellow-500' },
];

export const GameMenuModal: React.FC<GameMenuModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  history,
  onOpenAdmin,
  gameRulesText,
  paylines,
  symbolPayouts,
}) => {
  const [activeTab, setActiveTab] = useState<'paytable' | 'paylines' | 'settings' | 'history' | 'rules'>('paytable');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-gradient-to-b from-[#1a1400] via-[#0d0900] to-[#050914] border-2 border-[#8b6914] rounded-2xl shadow-[0_0_50px_rgba(212,175,55,0.25)] flex flex-col overflow-hidden text-white">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-[#8b6914]/40 bg-black/40">
          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-[#fff4cc] to-[#d4af37] tracking-widest uppercase" style={{ fontFamily: 'serif' }}>
              Fortune Kingdom
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#d4af37] font-bold">
              Motor do Jogo
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => { onClose(); onOpenAdmin(); }}
              className="p-1.5 sm:p-2 rounded-lg bg-red-950/60 border border-red-700/50 hover:bg-red-900/80 text-red-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              title="Acessar Painel de Administração"
            >
              <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />
              <span className="hidden sm:inline">Painel Admin</span>
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg bg-black/50 hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-black/30 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('paytable')}
            className={`flex-1 min-w-[80px] py-2.5 px-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer ${
              activeTab === 'paytable'
                ? 'border-[#d4af37] text-[#d4af37] bg-white/5'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Símbolos</span>
          </button>

          <button
            onClick={() => setActiveTab('paylines')}
            className={`flex-1 min-w-[80px] py-2.5 px-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer ${
              activeTab === 'paylines'
                ? 'border-[#d4af37] text-[#d4af37] bg-white/5'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Linhas ({paylines?.filter(p => p.active).length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`flex-1 min-w-[80px] py-2.5 px-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer ${
              activeTab === 'rules'
                ? 'border-[#d4af37] text-[#d4af37] bg-white/5'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Regras</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 min-w-[80px] py-2.5 px-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer ${
              activeTab === 'settings'
                ? 'border-[#d4af37] text-[#d4af37] bg-white/5'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Ajustes</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 min-w-[80px] py-2.5 px-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer ${
              activeTab === 'history'
                ? 'border-[#d4af37] text-[#d4af37] bg-white/5'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Histórico</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* TAB 1: PAYTABLE */}
          {activeTab === 'paytable' && (
            <div className="space-y-3">
              <div className="text-center mb-2">
                <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-widest">
                  Tabela de Pagamentos dos Símbolos
                </h3>
                <p className="text-[11px] text-gray-400">
                  Multiplicadores configurados no Motor do Jogo para combinações vencedoras.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {DEFAULT_SYMBOL_INFO.map((item) => {
                  const baseMult = symbolPayouts?.[item.type] ?? 10;
                  return (
                    <div 
                      key={item.type}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-black/50 border border-[#8b6914]/30 hover:border-[#d4af37]/60 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#2a2000] to-black border border-[#8b6914]/50 flex items-center justify-center">
                          <span className={`font-bold ${item.color} text-sm`}>{item.name[0]}</span>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-gray-200">{item.name}</div>
                          <div className="text-[10px] text-gray-400">Multiplicador Base: {baseMult}x</div>
                        </div>
                      </div>

                      <div className="flex gap-2 text-right text-[11px]">
                        <div className="bg-black/60 px-2 py-1 rounded border border-white/5">
                          <span className="text-yellow-400 font-extrabold">{baseMult}x</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: PAYLINES */}
          {activeTab === 'paylines' && (
            <div className="space-y-3">
              <div className="text-center mb-2">
                <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-widest">
                  Linhas de Pagamento Ativas
                </h3>
                <p className="text-[11px] text-gray-400">
                  Combinações e multiplicadores de cada linha ativa no motor.
                </p>
              </div>

              <div className="space-y-2">
                {paylines && paylines.length > 0 ? (
                  paylines.filter(p => p.active).map((line) => (
                    <div 
                      key={line.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-black/50 border border-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full border border-white/30" 
                          style={{ backgroundColor: line.color }} 
                        />
                        <div>
                          <span className="text-xs font-bold text-white block">{line.name}</span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            Caminho da Linha: [{line.positions.join(', ')}]
                          </span>
                        </div>
                      </div>
                      <div className="bg-yellow-500/20 border border-yellow-500/40 px-3 py-1 rounded-lg text-yellow-300 font-black text-xs">
                        {line.payoutMultiplier}x Aposta
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-400 text-xs">
                    Nenhuma linha de pagamento configurada.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: RULES */}
          {activeTab === 'rules' && (
            <div className="space-y-3 text-xs text-gray-200 leading-relaxed bg-black/50 p-4 rounded-xl border border-[#8b6914]/40">
              <div className="flex items-center gap-2 text-yellow-400 font-bold text-sm border-b border-white/10 pb-2 mb-2">
                <Info className="w-4 h-4 text-[#d4af37]" />
                <span>Regras Oficiais do Jogo</span>
              </div>

              <div className="whitespace-pre-line text-gray-300 font-sans text-xs leading-relaxed">
                {gameRulesText || `1. REGRAS GERAIS:
• Combine 3 ou mais símbolos idênticos em uma das linhas de pagamento ativas para vencer.
• Os pagamentos são multiplicados pelo valor da aposta por linha.
• Apenas o maior ganho por linha de pagamento é concedido.`}
              </div>
            </div>
          )}

          {/* TAB 4: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="bg-black/40 p-3 rounded-xl border border-[#8b6914]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {settings.soundEnabled ? (
                      <Volume2 className="w-5 h-5 text-yellow-400" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-gray-500" />
                    )}
                    <div>
                      <div className="text-xs font-bold text-gray-200">Efeitos Sonoros</div>
                      <div className="text-[10px] text-gray-400">Sons de giros e vitórias</div>
                    </div>
                  </div>
                  <button
                    onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      settings.soundEnabled ? 'bg-[#d4af37]' : 'bg-gray-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-black absolute top-0.5 transition-transform ${
                        settings.soundEnabled ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between border-t border-white/10 pt-3">
                  <div className="flex items-center gap-2.5">
                    <Music className="w-5 h-5 text-yellow-400" />
                    <div>
                      <div className="text-xs font-bold text-gray-200">Música de Fundo</div>
                      <div className="text-[10px] text-gray-400">Trilha orquestral AAA</div>
                    </div>
                  </div>
                  <button
                    onClick={() => onUpdateSettings({ musicEnabled: !settings.musicEnabled })}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      settings.musicEnabled ? 'bg-[#d4af37]' : 'bg-gray-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-black absolute top-0.5 transition-transform ${
                        settings.musicEnabled ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between border-t border-white/10 pt-3">
                  <div className="flex items-center gap-2.5">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    <div>
                      <div className="text-xs font-bold text-gray-200">Modo Turbo</div>
                      <div className="text-[10px] text-gray-400">Animação ultra-rápida de giros</div>
                    </div>
                  </div>
                  <button
                    onClick={() => onUpdateSettings({ turboMode: !settings.turboMode })}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      settings.turboMode ? 'bg-[#d4af37]' : 'bg-gray-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-black absolute top-0.5 transition-transform ${
                        settings.turboMode ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Auto Spin selector */}
              <div className="bg-black/40 p-3 rounded-xl border border-[#8b6914]/30 space-y-2">
                <div className="text-xs font-bold text-gray-200">Giros Automáticos</div>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 25, 50, 100].map((count) => (
                    <button
                      key={count}
                      onClick={() => onUpdateSettings({ autoSpinCount: count, isAutoSpinning: true })}
                      className={`py-2 rounded-lg font-bold text-xs border transition cursor-pointer ${
                        settings.autoSpinCount === count && settings.isAutoSpinning
                          ? 'bg-[#d4af37] text-black border-[#d4af37]'
                          : 'bg-black/60 border-white/10 text-gray-300 hover:border-[#d4af37]/50'
                      }`}
                    >
                      {count}x
                    </button>
                  ))}
                </div>
                {settings.isAutoSpinning && (
                  <button
                    onClick={() => onUpdateSettings({ isAutoSpinning: false })}
                    className="w-full mt-2 py-1.5 bg-red-900/60 border border-red-500/50 rounded-lg text-red-200 font-bold text-xs hover:bg-red-800/80 transition cursor-pointer"
                  >
                    Parar Giros Automáticos
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-2">
                Últimas Jogadas ({history.length})
              </div>

              {history.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-xs">
                  Nenhuma jogada registrada nesta sessão.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                  {history.map((item) => (
                    <div 
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-black/60 border border-white/5 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 font-mono">{item.time}</span>
                        <span className="text-gray-300 font-semibold">
                          Aposta: R$ {item.bet.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {item.win > 0 ? (
                          <span className="text-green-400 font-bold">
                            +R$ {item.win.toFixed(2)} ({item.multiplier}x)
                          </span>
                        ) : (
                          <span className="text-gray-500">Sem ganho</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
