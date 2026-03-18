import type { ChainConfig, CovalentTransaction } from "../blockchain/types";
import type { TradeEvent, WalletAnalytics } from "./types";

function normalizeAddress(address: string) {
  return address.toLowerCase();
}

function isSwap(tx: CovalentTransaction) {
  const decoded = tx.log_events ?? [];
  return decoded.some((event) => event.decoded?.name?.toLowerCase() === "swap");
}

function extractTokenAddresses(tx: CovalentTransaction, wallet: string) {
  const walletAddress = normalizeAddress(wallet);
  const tokens = new Set<string>();

  (tx.log_events ?? []).forEach((event) => {
    const sender = event.sender_address?.toLowerCase();
    if (sender && sender !== walletAddress) return;
    const params = event.decoded?.params ?? [];
    params.forEach((param) => {
      if (param.name.toLowerCase().includes("token") && typeof param.value === "string") {
        tokens.add(param.value.toLowerCase());
      }
    });
  });

  return Array.from(tokens);
}

function estimatePnl(tx: CovalentTransaction, wallet: string) {
  const walletAddress = normalizeAddress(wallet);
  const from = tx.from_address?.toLowerCase();
  const to = tx.to_address?.toLowerCase();
  const value = tx.value_quote ?? 0;

  if (from === walletAddress) {
    return -Math.abs(value);
  }

  if (to === walletAddress) {
    return Math.abs(value);
  }

  return 0;
}

export function buildTradeEvents(
  address: string,
  chain: ChainConfig,
  transactions: CovalentTransaction[]
): TradeEvent[] {
  return transactions
    .filter((tx) => tx.successful)
    .filter((tx) => isSwap(tx))
    .map((tx) => {
      const pnlUsd = estimatePnl(tx, address);
      const direction = pnlUsd >= 0 ? "buy" : "sell";

      return {
        hash: tx.tx_hash,
        timestamp: tx.block_signed_at,
        chainId: chain.id,
        chainName: chain.name,
        pnlUsd,
        valueUsd: Math.abs(tx.value_quote ?? 0),
        direction,
        tokenAddresses: extractTokenAddresses(tx, address),
      };
    });
}

export function computeAnalytics(trades: TradeEvent[]): WalletAnalytics {
  const totalTrades = trades.length;
  const totalPnlUsd = trades.reduce((acc, trade) => acc + trade.pnlUsd, 0);
  const wins = trades.filter((trade) => trade.pnlUsd > 0).length;
  const winRate = totalTrades === 0 ? 0 : (wins / totalTrades) * 100;

  const tokens = new Set<string>();
  const networkCounts = new Map<string, number>();

  trades.forEach((trade) => {
    trade.tokenAddresses.forEach((token) => tokens.add(token));
    networkCounts.set(
      trade.chainName,
      (networkCounts.get(trade.chainName) ?? 0) + 1
    );
  });

  const mostUsedNetwork =
    Array.from(networkCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    "Unknown";

  const sortedTrades = [...trades].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const recentTrades = sortedTrades.slice(0, 6);

  const pnlSeries = sortedTrades
    .slice()
    .reverse()
    .reduce<Array<{ date: string; pnl: number }>>((acc, trade) => {
      const date = new Date(trade.timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
      });
      const last = acc[acc.length - 1];
      const next = (last?.pnl ?? 0) + trade.pnlUsd;
      acc.push({ date, pnl: Number(next.toFixed(2)) });
      return acc;
    }, []);

  return {
    totalTrades,
    totalPnlUsd: Number(totalPnlUsd.toFixed(2)),
    winRate: Number(winRate.toFixed(1)),
    tokensTraded: tokens.size,
    mostUsedNetwork,
    recentTrades,
    pnlSeries,
  };
}
