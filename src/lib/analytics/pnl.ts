import type { SwapTrade } from "./types";

export function calculateTotalPnl(trades: SwapTrade[]) {
  return Number(
    trades.reduce((acc, trade) => acc + trade.pnlUsd, 0).toFixed(2)
  );
}

export function buildPnlSeries(trades: SwapTrade[]) {
  const sorted = [...trades].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return sorted.reduce<Array<{ date: string; pnl: number }>>((acc, trade) => {
    const date = new Date(trade.timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
    });
    const last = acc[acc.length - 1];
    const next = (last?.pnl ?? 0) + trade.pnlUsd;
    acc.push({ date, pnl: Number(next.toFixed(2)) });
    return acc;
  }, []);
}
