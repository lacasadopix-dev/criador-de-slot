import React, { useState, useEffect } from 'react';
import { GameMenuModal } from './components/GameMenuModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { AutoSpinModal } from './components/AutoSpinModal';
import { GameStage } from './components/GameStage';
import { GameState, SymbolType, AdminConfig, GameSettings, SpinHistoryItem, Payline, BonusConfig } from './types';
import { calculatePaylinePayouts } from './utils/paylines';

const ALL_SYMBOLS: SymbolType[] = ['King', 'Queen', 'Crown', 'Lion', 'Sword', 'Shield', 'Castle', 'Diamond', 'Coin', 'Dragon'];

const DEFAULT_PAYLINES: Payline[] = [
  { id: '1', name: 'Linha Central (Horizontal)', positions: [1, 1, 1, 1, 1], payoutMultiplier: 5, color: '#ef4444', active: true },
  { id: '2', name: 'Linha Superior (Horizontal)', positions: [0, 0, 0, 0, 0], payoutMultiplier: 5, color: '#3b82f6', active: true },
  { id: '3', name: 'Linha Inferior (Horizontal)', positions: [2, 2, 2, 2, 2], payoutMultiplier: 5, color: '#10b981', active: true },
  { id: '4', name: 'Viga V (Diagonal Descendente)', positions: [0, 1, 2, 1, 0], payoutMultiplier: 10, color: '#f59e0b', active: true },
  { id: '5', name: 'Viga V Invertida (Ascendente)', positions: [2, 1, 0, 1, 2], payoutMultiplier: 10, color: '#8b5cf6', active: true },
  { id: '6', name: 'Ziguezague Topo', positions: [0, 0, 1, 2, 2], payoutMultiplier: 8, color: '#ec4899', active: true },
  { id: '7', name: 'Ziguezague Base', positions: [2, 2, 1, 0, 0], payoutMultiplier: 8, color: '#06b6d4', active: true },
];

const DEFAULT_BONUS_CONFIG: BonusConfig = {
  enabled: true,
  scatterSymbol: 'Crown',
  triggerScatterCount: 3,
  freeSpinsCount: 10,
  bonusMultiplier: 3,
  bonusGameType: 'free_spins',
  bonusProbabilityPct: 5,
};

const DEFAULT_SYMBOL_PAYOUTS: Record<SymbolType, number> = {
  Dragon: 100,
  Crown: 50,
  Castle: 25,
  Lion: 15,
  Diamond: 10,
  Sword: 8,
  Shield: 5,
  Coin: 4,
  King: 3,
  Queen: 2,
};

const DEFAULT_GAME_RULES = `1. REGRAS GERAIS:
• Combine 3 ou mais símbolos idênticos em uma das linhas de pagamento ativas para vencer.
• Os pagamentos são multiplicados pelo valor da aposta por linha.
• Apenas o maior ganho por linha de pagamento é concedido.

2. LINHAS DE PAGAMENTO:
• O jogo conta com linhas de pagamento totalmente personalizáveis no Motor do Jogo.
• As combinações válidas pagam da esquerda para a direita em rolos consecutivos.

3. MODO DE BÔNUS E RODADAS GRÁTIS:
• 3 ou mais símbolos Scatter (Coroa) acionam o Modo Bônus com Rodadas Grátis!
• Durante as Rodadas Grátis, os ganhos podem ter multiplicadores adicionais.`;

const generateRandomGrid = (numReels = 5, numRows = 3): SymbolType[][] => {
  const grid: SymbolType[][] = [];
  for (let i = 0; i < numReels; i++) {
    const col: SymbolType[] = [];
    for (let j = 0; j < numRows; j++) {
      col.push(ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)]);
    }
    grid.push(col);
  }
  return grid;
};

// Generates a grid guaranteed to contain a matching win line
const generateWinningGrid = (isBigWin: boolean, numReels = 5, numRows = 3, paylines: Payline[] = DEFAULT_PAYLINES): SymbolType[][] => {
  const symbol: SymbolType = isBigWin ? 'Crown' : ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)];
  const grid = generateRandomGrid(numReels, numRows);
  const reelsToMatch = isBigWin ? numReels : Math.min(3, numReels);

  const activePaylines = paylines.filter(p => p.active !== false);
  const selectedPayline = activePaylines.length > 0 ? activePaylines[Math.floor(Math.random() * activePaylines.length)] : null;

  if (selectedPayline && selectedPayline.positions) {
    for (let col = 0; col < Math.min(reelsToMatch, selectedPayline.positions.length); col++) {
      const row = selectedPayline.positions[col];
      if (row >= 0 && row < numRows) {
        grid[col][row] = symbol;
      }
    }
  } else {
    const midRow = Math.floor(numRows / 2);
    for (let col = 0; col < reelsToMatch; col++) {
      grid[col][midRow] = symbol;
    }
  }

  return grid;
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    balance: 25680.00,
    bet: 10.00,
    win: 0,
    isSpinning: false,
    progression: 95,
    bigWin: false,
    freeSpinsRemaining: 0,
    inBonusMode: false,
  });

  const [adminConfig, setAdminConfig] = useState<AdminConfig>({
    targetRtp: 96.5,
    volatility: 'medium',
    forcedOutcome: 'none',
    minBet: 1.00,
    maxBet: 500.00,
    allowedBets: [1, 2, 5, 10, 20, 50, 100, 250, 500],
    totalSpins: 0,
    totalWagered: 0,
    totalPayout: 0,
    autoWinBoost: false,
    bgImage: '/background.jpg',
    bgPosX: 0,
    bgPosY: 0,
    bgZoom: 100,
    slotTop: 28,
    slotLeft: 5,
    slotWidth: 90,
    slotHeight: 48,
    spinBottom: 4,
    spinLeft: 50,
    spinScale: 100,
    turboTop: 88,
    turboLeft: 80,
    turboScale: 100,
    turboVisible: true,
    balanceTop: 3,
    balanceLeft: 3,
    betTop: 3,
    betLeft: 55,
    customSymbols: {},
    // Motor do Jogo
    numReels: 5,
    numRows: 3,
    paylines: DEFAULT_PAYLINES,
    bonusConfig: DEFAULT_BONUS_CONFIG,
    gameRulesText: DEFAULT_GAME_RULES,
    symbolPayouts: DEFAULT_SYMBOL_PAYOUTS,
    individualReelPositions: {},
  });

  const [gameSettings, setGameSettings] = useState<GameSettings>({
    soundEnabled: true,
    musicEnabled: true,
    turboMode: false,
    autoSpinCount: 0,
    isAutoSpinning: false,
  });

  const [spinHistory, setSpinHistory] = useState<SpinHistoryItem[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isAutoModalOpen, setIsAutoModalOpen] = useState<boolean>(false);

  const [grid, setGrid] = useState<SymbolType[][]>(generateRandomGrid(adminConfig.numReels, adminConfig.numRows));
  const pendingResultRef = React.useRef<{ winAmount: number; isBigWin: boolean; currentBet: number; winMultiplier: number; resultGrid: SymbolType[][] } | null>(null);

  useEffect(() => {
    setGrid(generateRandomGrid(adminConfig.numReels || 5, adminConfig.numRows || 3));
  }, [adminConfig.numReels, adminConfig.numRows]);

  const handleBetChange = (delta: number) => {
    if (gameState.isSpinning) return;
    const allowed = (adminConfig.allowedBets && adminConfig.allowedBets.length > 0)
      ? adminConfig.allowedBets.filter(b => b >= adminConfig.minBet && b <= adminConfig.maxBet)
      : [1, 2, 5, 10, 20, 50, 100, 250, 500];

    allowed.sort((a, b) => a - b);

    setGameState(prev => {
      let nextBet = prev.bet;
      if (delta > 0) {
        const nextVal = allowed.find(v => v > prev.bet);
        nextBet = nextVal !== undefined ? nextVal : (allowed[allowed.length - 1] || prev.bet);
      } else {
        const prevVal = [...allowed].reverse().find(v => v < prev.bet);
        nextBet = prevVal !== undefined ? prevVal : (allowed[0] || prev.bet);
      }
      return { ...prev, bet: Math.max(adminConfig.minBet, Math.min(adminConfig.maxBet, nextBet)) };
    });
  };

  const handleSpin = () => {
    if (gameState.balance < gameState.bet || gameState.isSpinning) return;

    const currentBet = gameState.bet;

    // Deduct balance and set spinning state
    setGameState(prev => ({
      ...prev,
      balance: prev.balance - currentBet,
      win: 0,
      isSpinning: true,
      bigWin: false
    }));

    // Determine outcome based on Admin config or RTP probability
    let isBigWin = false;
    let isWin = false;
    let winMultiplier = 0;

    if (adminConfig.forcedOutcome === 'big_win') {
      isBigWin = true;
      isWin = true;
      winMultiplier = 50;
    } else if (adminConfig.forcedOutcome === 'normal_win') {
      isWin = true;
      winMultiplier = 5;
    } else if (adminConfig.forcedOutcome === 'loss') {
      isWin = false;
      winMultiplier = 0;
    } else {
      // Calculated via target RTP probability
      const rtpFactor = adminConfig.targetRtp / 100;
      const winChance = rtpFactor * (adminConfig.volatility === 'high' ? 0.35 : 0.5);
      const bigWinChance = winChance * 0.15;

      const rand = Math.random();
      if (rand < bigWinChance) {
        isBigWin = true;
        isWin = true;
        winMultiplier = 50;
      } else if (rand < winChance) {
        isWin = true;
        winMultiplier = Math.floor(Math.random() * 8) + 2; // 2x to 9x
      }
    }

    const resultGrid = isWin 
      ? generateWinningGrid(isBigWin, adminConfig.numReels || 5, adminConfig.numRows || 3, adminConfig.paylines) 
      : generateRandomGrid(adminConfig.numReels || 5, adminConfig.numRows || 3);

    // Calculate real mathematical payout based on grid symbols & payline multipliers
    const paylineCalc = calculatePaylinePayouts(
      resultGrid,
      adminConfig.paylines,
      currentBet,
      adminConfig.symbolPayouts,
      adminConfig.numReels || 5,
      adminConfig.numRows || 3
    );

    let finalWinAmount = paylineCalc.totalWin;
    let finalWinMultiplier = paylineCalc.totalMultiplier;

    // Fallback if winning intent was triggered but payline calc yielded zero
    if (isWin && finalWinAmount === 0) {
      finalWinAmount = Math.round(currentBet * (winMultiplier || 2) * 100) / 100;
      finalWinMultiplier = Math.round((finalWinAmount / currentBet) * 100) / 100;
    }

    // Reset forcedOutcome after use
    if (adminConfig.forcedOutcome !== 'none') {
      setAdminConfig(prev => ({ ...prev, forcedOutcome: 'none' }));
    }

    // Store pending outcome
    pendingResultRef.current = {
      winAmount: finalWinAmount,
      isBigWin: isBigWin || finalWinMultiplier >= 15,
      currentBet,
      winMultiplier: finalWinMultiplier,
      resultGrid,
    };

    // Set outcome grid for slot reels
    setGrid(resultGrid);
  };

  const handleAllReelsStopped = () => {
    if (!pendingResultRef.current) {
      setGameState(prev => ({ ...prev, isSpinning: false }));
      return;
    }

    const { winAmount, isBigWin, currentBet, winMultiplier, resultGrid } = pendingResultRef.current;
    pendingResultRef.current = null;

    setGameState(prev => ({
      ...prev,
      isSpinning: false,
      win: winAmount,
      balance: prev.balance + winAmount,
      bigWin: isBigWin,
      progression: Math.min(100, prev.progression + (winAmount > 0 ? 2 : 0.5))
    }));

    // Update admin stats
    setAdminConfig(prev => ({
      ...prev,
      totalSpins: prev.totalSpins + 1,
      totalWagered: prev.totalWagered + currentBet,
      totalPayout: prev.totalPayout + winAmount,
    }));

    // Add history item
    const now = new Date();
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    setSpinHistory(prev => [
      {
        id: Math.random().toString(36).substr(2, 9),
        time: timeStr,
        bet: currentBet,
        win: winAmount,
        multiplier: winMultiplier,
        symbols: resultGrid[0],
      },
      ...prev.slice(0, 49), // Keep last 50
    ]);

    // Auto spin check
    if (gameSettings.isAutoSpinning) {
      if (gameSettings.autoSpinCount >= 1000) {
        // Infinite mode: keep running
      } else if (gameSettings.autoSpinCount > 1) {
        setGameSettings(prev => ({ ...prev, autoSpinCount: prev.autoSpinCount - 1 }));
      } else {
        setGameSettings(prev => ({ ...prev, isAutoSpinning: false, autoSpinCount: 0 }));
      }
    }
  };

  const handleStartAutoSpin = (count: number, betAmount: number, turbo: boolean) => {
    setGameState(prev => ({ ...prev, bet: betAmount }));
    setGameSettings(prev => ({
      ...prev,
      turboMode: turbo,
      autoSpinCount: count,
      isAutoSpinning: true,
    }));
  };

  const handleStopAutoSpin = () => {
    setGameSettings(prev => ({
      ...prev,
      isAutoSpinning: false,
      autoSpinCount: 0,
    }));
  };

  // Auto spin trigger effect
  useEffect(() => {
    if (gameSettings.isAutoSpinning && !gameState.isSpinning) {
      if (gameState.balance < gameState.bet) {
        setGameSettings(prev => ({ ...prev, isAutoSpinning: false, autoSpinCount: 0 }));
        return;
      }
      const delay = gameSettings.turboMode ? 350 : 800;
      const timer = setTimeout(() => {
        handleSpin();
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [gameSettings.isAutoSpinning, gameState.isSpinning, gameState.balance, gameState.bet, gameSettings.turboMode]);

  const handleUpdatePaylineBadgePos = (paylineId: string, xPct: number, yPct: number) => {
    setAdminConfig(prev => ({
      ...prev,
      paylines: (prev.paylines || []).map(p =>
        p.id === paylineId ? { ...p, winBadgePosX: xPct, winBadgePosY: yPct } : p
      )
    }));
  };

  const handleUpdatePaylineMediaPos = (paylineId: string, xPct: number, yPct: number) => {
    setAdminConfig(prev => ({
      ...prev,
      paylines: (prev.paylines || []).map(p =>
        p.id === paylineId ? { ...p, winMediaPosX: xPct, winMediaPosY: yPct } : p
      )
    }));
  };

  return (
    <div className="relative w-full h-screen h-[100dvh] bg-[#020617] font-sans text-white flex items-center justify-center overflow-hidden touch-none select-none p-0">
      
      {/* Game Stage Container */}
      <div className="relative w-full h-full max-h-[100dvh] aspect-[9/16] max-w-[500px] sm:max-w-[540px] bg-[#050914] sm:rounded-3xl sm:border-[5px] sm:border-amber-500/25 shadow-[0_0_90px_rgba(0,0,0,0.95)] overflow-hidden flex items-center justify-center">
        <GameStage 
          adminConfig={adminConfig}
          gameState={gameState}
          gameSettings={gameSettings}
          grid={grid}
          onSpin={handleSpin}
          onBetChange={handleBetChange}
          onOpenMenu={() => setIsMenuOpen(true)}
          onOpenAdmin={() => setIsAdminOpen(true)}
          onOpenAutoModal={() => setIsAutoModalOpen(true)}
          onStopAutoSpin={handleStopAutoSpin}
          onClearWin={() => setGameState(prev => ({ ...prev, win: 0 }))}
          onAllReelsStopped={handleAllReelsStopped}
          onToggleTurbo={() => setGameSettings(prev => ({ ...prev, turboMode: !prev.turboMode }))}
          onUpdateAdminConfig={(newConfig) => setAdminConfig(prev => ({ ...prev, ...newConfig }))}
          onUpdatePaylineBadgePos={handleUpdatePaylineBadgePos}
          onUpdatePaylineMediaPos={handleUpdatePaylineMediaPos}
        />
      </div>

      {/* AUTO SPIN MODAL */}
      <AutoSpinModal
        isOpen={isAutoModalOpen}
        onClose={() => setIsAutoModalOpen(false)}
        currentBet={gameState.bet}
        minBet={adminConfig.minBet}
        maxBet={adminConfig.maxBet}
        allowedBets={adminConfig.allowedBets}
        balance={gameState.balance}
        turboMode={gameSettings.turboMode}
        autoSpinCount={gameSettings.autoSpinCount}
        isAutoSpinning={gameSettings.isAutoSpinning}
        onStartAutoSpin={handleStartAutoSpin}
        onStopAutoSpin={handleStopAutoSpin}
      />

      {/* GAME MENU MODAL */}
      <GameMenuModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        settings={gameSettings}
        onUpdateSettings={(newSettings) => setGameSettings(prev => ({ ...prev, ...newSettings }))}
        history={spinHistory}
        onOpenAdmin={() => setIsAdminOpen(true)}
        gameRulesText={adminConfig.gameRulesText}
        paylines={adminConfig.paylines}
        symbolPayouts={adminConfig.symbolPayouts}
      />

      {/* ADMIN PANEL MODAL */}
      <AdminPanelModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        adminConfig={adminConfig}
        onUpdateAdminConfig={(newConfig) => setAdminConfig(prev => ({ ...prev, ...newConfig }))}
        gameState={gameState}
        onUpdateBalance={(newBalance) => setGameState(prev => ({ ...prev, balance: newBalance }))}
        onResetStats={() => setAdminConfig(prev => ({ ...prev, totalSpins: 0, totalWagered: 0, totalPayout: 0 }))}
      />

    </div>
  );
}

