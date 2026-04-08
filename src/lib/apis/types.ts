export type ChainConfig = {
  id: number;
  name: string;
};

// Represents a raw log from Ethers.js
export type RawLog = {
  transactionHash: string;
  blockHash: string;
  blockNumber: number;
  transactionIndex: number;
  address: string;
  data: string;
  topics: readonly string[];
  index: number;
  removed: boolean;
};

export type NormalizedTransaction = {
  hash: string;
  successful: boolean;
  timestamp: string;
  from: string;
  to: string | null;
  value: bigint;   // in wei
  valueUsd: number | null; // estimated usd value of native token transferred
  logs: RawLog[];
};
