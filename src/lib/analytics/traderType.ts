import type { SwapTrade, TraderClassification } from "./types";

function daysBetween(start: Date, end: Date) {
  const diff = Math.max(end.getTime() - start.getTime(), 0);
  return diff / (1000 * 60 * 60 * 24);
}

function averageHoldingDays(trades: SwapTrade[]) {
  const sorted = [...trades].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  const lastBuyByToken = new Map<string, Date>();
  const holdingDays: number[] = [];

  sorted.forEach((trade) => {
    if (trade.buyToken?.address) {
      lastBuyByToken.set(trade.buyToken.address.toLowerCase(), new Date(trade.timestamp));
    }

    if (trade.sellToken?.address) {
      const key = trade.sellToken.address.toLowerCase();
      const lastBuy = lastBuyByToken.get(key);
      if (lastBuy) {
        holdingDays.push(daysBetween(lastBuy, new Date(trade.timestamp)));
        lastBuyByToken.delete(key);
      }
    }
  });

  if (holdingDays.length === 0) return 0;
  return holdingDays.reduce((acc, val) => acc + val, 0) / holdingDays.length;
}

export function classifyTrader(
  trades: SwapTrade[],
  winRate: number,
  pnlUsd: number
): TraderClassification {
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
  const avgHoldDays = averageHoldingDays(trades);

  if (tradesPerDay >= 8 && winRate < 45) {
    return {
      type: "Degen",
      riskLevel: "High",
      description: "Very frequent trading with low win rate signals high risk.",
    };
  }

  if (avgHoldDays >= 14 && winRate >= 50) {
    return {
      type: "Diamond Hands",
      riskLevel: "Low",
      description: "Long holding periods with steady performance.",
    };
  }

  if (winRate >= 60 && pnlUsd > 1000 && tradesPerDay >= 1) {
    return {
      type: "Pro Trader",
      riskLevel: "Medium",
      description: "Consistent wins and strong profitability across trades.",
    };
  }

  return {
    type: "Swing Trader",
    riskLevel: "Medium",
    description: "Moderate frequency with balanced risk exposure.",
  };
}
