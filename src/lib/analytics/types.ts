export type TradeEvent = {
  hash: string;
  timestamp: string;
  chainId: number;
  chainName: string;
  pnlUsd: number;
  valueUsd: number;
  direction: "buy" | "sell";
  tokenAddresses: string[];
};

export type WalletAnalytics = {
  totalTrades: number;
  totalPnlUsd: number;
  winRate: number;
  tokensTraded: number;
  mostUsedNetwork: string;
  recentTrades: TradeEvent[];
  pnlSeries: Array<{ date: string; pnl: number }>;
};

export type TraderClassification = {
  type: string;
  riskLevel: "Low" | "Medium" | "High";
  description: string;
};
