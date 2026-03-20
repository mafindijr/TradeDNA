import { Interface } from "ethers";
import type { CovalentLogEvent } from "./types";

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

function getParamValue(params: Array<{ name: string; value: string | number }>, name: string) {
  const param = params.find((item) => item.name.toLowerCase() === name.toLowerCase());
  if (!param) return undefined;
  return String(param.value);
}

export function decodeErc20Transfer(logEvent: CovalentLogEvent): Erc20Transfer | null {
  if (logEvent.decoded?.name?.toLowerCase() === "transfer") {
    const params = logEvent.decoded.params ?? [];
    const from = getParamValue(params, "from");
    const to = getParamValue(params, "to");
    const value = getParamValue(params, "value");

    if (!from || !to || !value) return null;

    return {
      from,
      to,
      value,
      tokenAddress: logEvent.sender_contract_address ?? logEvent.sender_address,
      symbol: logEvent.sender_contract_ticker_symbol,
      decimals: logEvent.sender_contract_decimals,
    };
  }

  if (logEvent.raw_log_data && logEvent.raw_log_topics?.length) {
    try {
      const parsed = erc20Interface.parseLog({
        data: logEvent.raw_log_data,
        topics: logEvent.raw_log_topics,
      });

      if (!parsed || parsed.name.toLowerCase() !== "transfer") return null;

      return {
        from: String(parsed.args.from),
        to: String(parsed.args.to),
        value: parsed.args.value.toString(),
        tokenAddress: logEvent.sender_contract_address ?? logEvent.sender_address,
        symbol: logEvent.sender_contract_ticker_symbol,
        decimals: logEvent.sender_contract_decimals,
      };
    } catch {
      return null;
    }
  }

  return null;
}
