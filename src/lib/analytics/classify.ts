import type { TradeEvent, TraderClassification } from "./types";

function daysBetween(start: Date, end: Date) {
  const diff = Math.max(end.getTime() - start.getTime(), 0);
  return diff / (1000 * 60 * 60 * 24);
}

export function classifyTrader(trades: TradeEvent[]): TraderClassification {
  if (trades.length === 0) {
    return {
      type: "Inactive",
      riskLevel: "Low",
      description: "No recent trading activity detected.",
    };
  }

  const sorted = [...trades].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  const start = new Date(sorted[0].timestamp);
  const end = new Date(sorted[sorted.length - 1].timestamp);
  const spanDays = Math.max(daysBetween(start, end), 1);
  const tradesPerDay = trades.length / spanDays;

  const totalVolume = trades.reduce((acc, trade) => acc + trade.valueUsd, 0);
  const avgVolume = totalVolume / trades.length;
  const winRate = trades.filter((trade) => trade.pnlUsd > 0).length / trades.length;

  if (avgVolume > 100000) {
    return {
      type: "Whale",
      riskLevel: "High",
      description: "Large trade sizes with significant capital deployment.",
    };
  }

  if (tradesPerDay >= 10 && winRate < 0.45) {
    return {
      type: "Degen",
      riskLevel: "High",
      description: "Very frequent trading with speculative risk exposure.",
    };
  }

  if (tradesPerDay >= 8) {
    return {
      type: "Scalper",
      riskLevel: "High",
      description: "High trade velocity with short-term positioning.",
    };
  }

  if (tradesPerDay >= 2) {
    return {
      type: "Swing Trader",
      riskLevel: "Medium",
      description: "Moderate frequency with mid-term holding strategy.",
    };
  }

  return {
    type: "Long Term Holder",
    riskLevel: "Low",
    description: "Low turnover with longer-term conviction holds.",
  };
}
