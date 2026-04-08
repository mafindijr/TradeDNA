import { Interface } from "ethers";
import type { RawLog } from "./types";

export type Erc20Transfer = {
  from: string;
  to: string;
  value: string;
  tokenAddress?: string;
  symbol?: string;
  decimals?: number;
};

const erc20Interface = new Interface([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

export function decodeErc20Transfer(logEvent: RawLog): Erc20Transfer | null {
  if (!logEvent.data || !logEvent.topics?.length) {
    return null;
  }

  try {
    const parsed = erc20Interface.parseLog({
      data: logEvent.data,
      topics: [...logEvent.topics],
    });

    if (!parsed || parsed.name.toLowerCase() !== "transfer") {
      return null;
    }

    return {
      from: String(parsed.args.from),
      to: String(parsed.args.to),
      value: parsed.args.value.toString(),
      tokenAddress: logEvent.address,
      // Since Infura doesn't provide symbol/decimals inside standard log events natively,
      // these will typically be undefined, and we'll fall back to Dexscreener prices
      // later in walletAnalysis.ts.
      symbol: undefined,
      decimals: undefined,
    };
  } catch {
    return null;
  }
}
