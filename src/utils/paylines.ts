import { SymbolType, Payline } from '../types';

export interface WinningPayline {
  payline: Payline;
  symbol: SymbolType;
  matchCount: number;
  positions: { col: number; row: number }[];
}

export interface PaylineCalculationResult {
  winningLines: WinningPayline[];
  totalWin: number;
  totalMultiplier: number;
  lineWins: { lineId: string; lineName: string; winAmount: number; multiplier: number }[];
}

export const evaluatePaylines = (
  grid: SymbolType[][],
  paylines: Payline[],
  numReels: number = 5,
  numRows: number = 3
): WinningPayline[] => {
  if (!grid || grid.length === 0 || !paylines || paylines.length === 0) return [];

  const winningLines: WinningPayline[] = [];
  const activePaylines = paylines.filter(p => p.active !== false);

  for (const payline of activePaylines) {
    if (!payline.positions || payline.positions.length === 0) continue;

    const linePositions: { col: number; row: number }[] = [];
    const lineSymbols: SymbolType[] = [];

    for (let col = 0; col < Math.min(numReels, payline.positions.length); col++) {
      const row = payline.positions[col];
      if (row >= 0 && row < numRows && grid[col] && grid[col][row] !== undefined) {
        linePositions.push({ col, row });
        lineSymbols.push(grid[col][row]);
      }
    }

    if (lineSymbols.length === 0) continue;

    const firstSymbol = lineSymbols[0];
    let matchCount = 1;

    for (let i = 1; i < lineSymbols.length; i++) {
      if (lineSymbols[i] === firstSymbol) {
        matchCount++;
      } else {
        break;
      }
    }

    // A match of 3 or more on a payline is a win!
    if (matchCount >= 3) {
      winningLines.push({
        payline,
        symbol: firstSymbol,
        matchCount,
        positions: linePositions.slice(0, matchCount),
      });
    }
  }

  return winningLines;
};

export const calculatePaylinePayouts = (
  grid: SymbolType[][],
  paylines: Payline[],
  betAmount: number,
  symbolPayouts?: Record<SymbolType, number>,
  numReels: number = 5,
  numRows: number = 3
): PaylineCalculationResult => {
  const winningLines = evaluatePaylines(grid, paylines, numReels, numRows);
  if (!winningLines || winningLines.length === 0) {
    return { winningLines: [], totalWin: 0, totalMultiplier: 0, lineWins: [] };
  }

  const payouts = symbolPayouts || {
    Dragon: 100, Crown: 50, Castle: 25, Lion: 15, Diamond: 10,
    Sword: 8, Shield: 5, Coin: 4, King: 3, Queen: 2
  };

  const activeLines = paylines.filter(p => p.active !== false);
  const activeCount = Math.max(1, activeLines.length);

  let totalWin = 0;
  const lineWins: { lineId: string; lineName: string; winAmount: number; multiplier: number }[] = [];

  for (const winLine of winningLines) {
    const symbolVal = payouts[winLine.symbol] ?? 5;
    const lineMult = winLine.payline.payoutMultiplier || 1;
    
    // Match factor
    let matchFactor = 1.0;
    if (winLine.matchCount === 4) matchFactor = 2.5;
    else if (winLine.matchCount === 5) matchFactor = 6.0;
    else if (winLine.matchCount >= 6) matchFactor = 15.0;

    // Mathematical formula for realistic slot payout
    // Bet per line = betAmount / activeCount
    // Line win = (betAmount / activeCount) * (symbolVal / 5) * lineMult * matchFactor
    const lineWin = Math.max(0.2, (betAmount / activeCount) * (symbolVal / 5) * lineMult * matchFactor);
    const roundedLineWin = Math.round(lineWin * 100) / 100;
    const lineMultiplier = Math.round((roundedLineWin / betAmount) * 100) / 100;

    totalWin += roundedLineWin;
    lineWins.push({
      lineId: winLine.payline.id,
      lineName: winLine.payline.name,
      winAmount: roundedLineWin,
      multiplier: lineMultiplier
    });
  }

  const roundedTotalWin = Math.round(totalWin * 100) / 100;
  const totalMultiplier = betAmount > 0 ? Math.round((roundedTotalWin / betAmount) * 100) / 100 : 0;

  return {
    winningLines,
    totalWin: roundedTotalWin,
    totalMultiplier,
    lineWins
  };
};
