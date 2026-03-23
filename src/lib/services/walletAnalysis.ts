import { formatUnits } from "ethers";
import { DEFAULT_CHAINS, fetchWalletTransactions } from "../apis/covalent";
import { fetchTokenPrices } from "../apis/dexscreener";
import { decodeErc20Transfer } from "../apis/ethers";
import type { ChainConfig, CovalentTransaction } from "../apis/types";
import { buildPnlSeries, calculateTotalPnl } from "../analytics/pnl";
import { calculateWinRate } from "../analytics/winrate";
import { classifyTrader } from "../analytics/traderType";
import type { SwapTrade, TokenPerformance, WalletAnalytics } from "../analytics/types";

type Transfer = {
  txHash: string;
  timestamp: string;
  chain: ChainConfig;
  tokenAddress: string;
  symbol?: string;
  decimals: number;
  amount: number;
  from: string;
  to: string;
};

const NATIVE_SYMBOL_BY_CHAIN: Record<number, string> = {
  1: "ETH",
};

function isNativeAddress(address: string | undefined) {
  return Boolean(address && address.startsWith("native:"));
}

function normalizeAddress(address: string) {
  return address.toLowerCase();
}

function parseTransferAmount(value: string, decimals: number) {
  try {
    return Number(formatUnits(BigInt(value), decimals));
  } catch {
    return 0;
  }
}

function extractTransfers(
  walletAddress: string,
  chain: ChainConfig,
  tx: CovalentTransaction
): Transfer[] {
  const normalizedWallet = normalizeAddress(walletAddress);
  const logEvents = tx.log_events ?? [];

  return logEvents
    .map((event) => decodeErc20Transfer(event))
    .filter((transfer): transfer is NonNullable<typeof transfer> => Boolean(transfer))
    .map((transfer) => {
      const decimals = transfer.decimals ?? 18;
      const tokenAddress = transfer.tokenAddress ?? "";
      const amount = parseTransferAmount(transfer.value, decimals);

      return {
        txHash: tx.tx_hash,
        timestamp: tx.block_signed_at,
        chain,
        tokenAddress,
        symbol: transfer.symbol,
        decimals,
        amount,
        from: transfer.from,
        to: transfer.to,
      };
    })
    .filter(
      (transfer) =>
        transfer.tokenAddress &&
        (normalizeAddress(transfer.from) === normalizedWallet ||
          normalizeAddress(transfer.to) === normalizedWallet)
    );
}

function buildNativeToken(chain: ChainConfig, valueUsd: number) {
  return {
    address: `native:${chain.id}`,
    symbol: NATIVE_SYMBOL_BY_CHAIN[chain.id] ?? "NATIVE",
    amount: 1,
    decimals: 18,
    valueUsd,
  };
}

function buildSwapTrade(
  walletAddress: string,
  transfers: Transfer[],
  tx: CovalentTransaction,
  chain: ChainConfig
): SwapTrade | null {
  const normalizedWallet = normalizeAddress(walletAddress);
  const incoming = transfers.filter(
    (transfer) => normalizeAddress(transfer.to) === normalizedWallet
  );
  const outgoing = transfers.filter(
    (transfer) => normalizeAddress(transfer.from) === normalizedWallet
  );

  // Heuristic: treat any tx with both outgoing and incoming ERC20 transfers as a swap,
  // then pick the largest transfer on each side to represent the trade.
  const pickLargest = (items: Transfer[]) =>
    items.reduce((best, current) =>
      current.amount > best.amount ? current : best
    );

  const hasValueQuote =
    typeof tx.value_quote === "number" && Number.isFinite(tx.value_quote) && tx.value_quote > 0;

  if (incoming.length === 0 || outgoing.length === 0) {
    if (!hasValueQuote) return null;

    if (incoming.length > 0 && outgoing.length === 0) {
      const buyTransfer = pickLargest(incoming);
      const sellToken = buildNativeToken(chain, tx.value_quote ?? 0);

      return {
        hash: tx.tx_hash,
        timestamp: tx.block_signed_at,
        chainId: chain.id,
        chainName: chain.name,
        buyToken: {
          address: buyTransfer.tokenAddress,
          symbol: buyTransfer.symbol,
          amount: buyTransfer.amount,
          decimals: buyTransfer.decimals,
        },
        sellToken,
        pnlUsd: 0,
        valueUsd: 0,
        direction: "buy",
      };
    }

    if (outgoing.length > 0 && incoming.length === 0) {
      const sellTransfer = pickLargest(outgoing);
      const buyToken = buildNativeToken(chain, tx.value_quote ?? 0);

      return {
        hash: tx.tx_hash,
        timestamp: tx.block_signed_at,
        chainId: chain.id,
        chainName: chain.name,
        buyToken,
        sellToken: {
          address: sellTransfer.tokenAddress,
          symbol: sellTransfer.symbol,
          amount: sellTransfer.amount,
          decimals: sellTransfer.decimals,
        },
        pnlUsd: 0,
        valueUsd: 0,
        direction: "buy",
      };
    }

    return null;
  }

  const buyTransfer = pickLargest(incoming);
  const sellTransfer = pickLargest(outgoing);

  return {
    hash: tx.tx_hash,
    timestamp: tx.block_signed_at,
    chainId: chain.id,
    chainName: chain.name,
    buyToken: {
      address: buyTransfer.tokenAddress,
      symbol: buyTransfer.symbol,
      amount: buyTransfer.amount,
      decimals: buyTransfer.decimals,
    },
    sellToken: {
      address: sellTransfer.tokenAddress,
      symbol: sellTransfer.symbol,
      amount: sellTransfer.amount,
      decimals: sellTransfer.decimals,
    },
    pnlUsd: 0,
    valueUsd: 0,
    direction: "buy",
  };
}

function hydrateTradesWithPrices(
  trades: SwapTrade[],
  priceMap: Record<string, { priceUsd: number; symbol?: string }>
) {
  return trades.map<SwapTrade>((trade) => {
    const buyAddress = trade.buyToken?.address?.toLowerCase();
    const sellAddress = trade.sellToken?.address?.toLowerCase();
    const buyInfo = buyAddress ? priceMap[buyAddress] : undefined;
    const sellInfo = sellAddress ? priceMap[sellAddress] : undefined;

    const buyPrice = buyInfo?.priceUsd ?? trade.buyToken?.priceUsd ?? 0;
    const sellPrice = sellInfo?.priceUsd ?? trade.sellToken?.priceUsd ?? 0;

    const buyValue =
      trade.buyToken?.valueUsd ??
      (trade.buyToken?.amount ?? 0) * buyPrice;
    const sellValue =
      trade.sellToken?.valueUsd ??
      (trade.sellToken?.amount ?? 0) * sellPrice;

    if (trade.buyToken) {
      trade.buyToken.priceUsd = buyPrice;
      trade.buyToken.valueUsd = buyValue;
      trade.buyToken.symbol = trade.buyToken.symbol ?? buyInfo?.symbol;
    }

    if (trade.sellToken) {
      trade.sellToken.priceUsd = sellPrice;
      trade.sellToken.valueUsd = sellValue;
      trade.sellToken.symbol = trade.sellToken.symbol ?? sellInfo?.symbol;
    }

    const pnlUsd = Number((buyValue - sellValue).toFixed(2));
    const valueUsd = Number(Math.max(buyValue, sellValue).toFixed(2));

    return {
      ...trade,
      pnlUsd,
      valueUsd,
      direction: buyValue >= sellValue ? "buy" : "sell",
    };
  });
}

function buildTokenPerformance(trades: SwapTrade[]) {
  const stats = new Map<string, TokenPerformance>();

  trades.forEach((trade) => {
    const timestamp = trade.timestamp;

    if (trade.buyToken?.address) {
      const key = trade.buyToken.address.toLowerCase();
      const existing = stats.get(key) ?? {
        token: trade.buyToken.address,
        symbol: trade.buyToken.symbol,
        buyVolumeUsd: 0,
        sellVolumeUsd: 0,
        pnlUsd: 0,
        lastTradeAt: timestamp,
      };

      // Net flow: buys reduce token PnL, sells increase token PnL.
      const buyValue = trade.buyToken.valueUsd ?? 0;
      existing.buyVolumeUsd += buyValue;
      existing.pnlUsd -= buyValue;
      existing.lastTradeAt =
        new Date(timestamp) > new Date(existing.lastTradeAt)
          ? timestamp
          : existing.lastTradeAt;
      existing.symbol = existing.symbol ?? trade.buyToken.symbol;
      stats.set(key, existing);
    }

    if (trade.sellToken?.address) {
      const key = trade.sellToken.address.toLowerCase();
      const existing = stats.get(key) ?? {
        token: trade.sellToken.address,
        symbol: trade.sellToken.symbol,
        buyVolumeUsd: 0,
        sellVolumeUsd: 0,
        pnlUsd: 0,
        lastTradeAt: timestamp,
      };

      const sellValue = trade.sellToken.valueUsd ?? 0;
      existing.sellVolumeUsd += sellValue;
      existing.pnlUsd += sellValue;
      existing.lastTradeAt =
        new Date(timestamp) > new Date(existing.lastTradeAt)
          ? timestamp
          : existing.lastTradeAt;
      existing.symbol = existing.symbol ?? trade.sellToken.symbol;
      stats.set(key, existing);
    }
  });

  return Array.from(stats.values()).map((item) => ({
    ...item,
    buyVolumeUsd: Number(item.buyVolumeUsd.toFixed(2)),
    sellVolumeUsd: Number(item.sellVolumeUsd.toFixed(2)),
    pnlUsd: Number(item.pnlUsd.toFixed(2)),
  }));
}

export async function analyzeWallet(
  address: string,
  chains: ChainConfig[] = DEFAULT_CHAINS
): Promise<WalletAnalytics> {
  const normalized = normalizeAddress(address);
  const results = await fetchWalletTransactions(address, chains);

  const trades: SwapTrade[] = [];
  const tokenAddresses: string[] = [];
  let totalTransactions = 0;

  results.forEach((result) => {
    result.items.forEach((tx) => {
      if (!tx.successful) return;
      totalTransactions += 1;

      const transfers = extractTransfers(normalized, result.chain, tx);
      const trade = buildSwapTrade(normalized, transfers, tx, result.chain);
      if (!trade) return;

      if (trade.buyToken?.address && !isNativeAddress(trade.buyToken.address)) {
        tokenAddresses.push(trade.buyToken.address);
      }
      if (trade.sellToken?.address && !isNativeAddress(trade.sellToken.address)) {
        tokenAddresses.push(trade.sellToken.address);
      }

      trades.push(trade);
    });
  });

  const priceMap = await fetchTokenPrices(tokenAddresses);
  const pricedTrades = hydrateTradesWithPrices(trades, priceMap);

  const totalPnl = calculateTotalPnl(pricedTrades);
  const winRate = calculateWinRate(pricedTrades);
  const pnlSeries = buildPnlSeries(pricedTrades);
  const traderType = classifyTrader(pricedTrades, winRate, totalPnl);

  const recentTrades = [...pricedTrades]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 6);

  const networkCounts = new Map<string, number>();
  pricedTrades.forEach((trade) => {
    networkCounts.set(
      trade.chainName,
      (networkCounts.get(trade.chainName) ?? 0) + 1
    );
  });

  const mostUsedNetwork =
    Array.from(networkCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    "Unknown";

  const tokensPerformance = buildTokenPerformance(pricedTrades);

  return {
    totalTransactions,
    totalTrades: pricedTrades.length,
    pnl: totalPnl,
    winRate,
    traderType,
    trades: pricedTrades,
    pnlSeries,
    recentTrades,
    mostUsedNetwork,
    tokensPerformance,
  };
}
