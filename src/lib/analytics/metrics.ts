import type { SwapTrade, WalletAnalytics } from "./types";
import { buildPnlSeries, calculateTotalPnl } from "./pnl";
import { calculateWinRate } from "./winrate";
import { classifyTrader } from "./traderType";

export function computeAnalytics(trades: SwapTrade[]): WalletAnalytics {
  const totalPnl = calculateTotalPnl(trades);
  const winRate = calculateWinRate(trades);
  const pnlSeries = buildPnlSeries(trades);
  const traderType = classifyTrader(trades, winRate, totalPnl);

  const recentTrades = [...trades]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 6);

  const networkCounts = new Map<string, number>();
  trades.forEach((trade) => {
    networkCounts.set(
      trade.chainName,
      (networkCounts.get(trade.chainName) ?? 0) + 1
    );
  });

  const mostUsedNetwork =
    Array.from(networkCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    "Unknown";

  return {
    totalTransactions: trades.length,
    totalTrades: trades.length,
    pnl: totalPnl,
    winRate,
    traderType,
    trades,
    pnlSeries,
    recentTrades,
    mostUsedNetwork,
    tokensPerformance: [],
  };
}
