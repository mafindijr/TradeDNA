export type TokenAmount = {
  address: string;
  symbol?: string;
  amount: number;
  decimals?: number;
  priceUsd?: number;
  valueUsd?: number;
};

export type SwapTrade = {
  hash: string;
  timestamp: string;
  chainId: number;
  chainName: string;
  buyToken?: TokenAmount;
  sellToken?: TokenAmount;
  pnlUsd: number;
  valueUsd: number;
  direction: "buy" | "sell";
};

export type TokenPerformance = {
  token: string;
  symbol?: string;
  buyVolumeUsd: number;
  sellVolumeUsd: number;
  pnlUsd: number;
  lastTradeAt: string;
};

export type TraderClassification = {
  type: "Degen" | "Swing Trader" | "Diamond Hands" | "Pro Trader" | "Inactive";
  riskLevel: "Low" | "Medium" | "High";
  description: string;
};

export type WalletAnalytics = {
  totalTrades: number;
  pnl: number;
  winRate: number;
  traderType: TraderClassification;
  trades: SwapTrade[];
  pnlSeries: Array<{ date: string; pnl: number }>;
  recentTrades: SwapTrade[];
  mostUsedNetwork: string;
  tokensPerformance: TokenPerformance[];
};
