import type { SwapTrade } from "./types";

export function calculateWinRate(trades: SwapTrade[]) {
  if (trades.length === 0) return 0;
  const wins = trades.filter((trade) => trade.pnlUsd > 0).length;
  return Number(((wins / trades.length) * 100).toFixed(1));
}
