import { SymbolType, Payline } from '../types';

export interface WinningPayline {
  payline: Payline;
  symbol: SymbolType;
  matchCount: number;
  positions: { col: number; row: number }[];
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
