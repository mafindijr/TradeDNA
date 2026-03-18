"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DEFAULT_CHAINS, fetchWalletTransactions } from "../blockchain/covalent";
import type { ChainConfig, CovalentTransaction } from "../blockchain/types";
import { buildTradeEvents, computeAnalytics } from "./metrics";
import { classifyTrader } from "./classify";
import type { TraderClassification, WalletAnalytics } from "./types";

type AnalyticsState = {
  isLoading: boolean;
  analytics: WalletAnalytics | null;
  classification: TraderClassification | null;
};

export function useWalletAnalytics(
  address: string | null,
  chains: ChainConfig[] = DEFAULT_CHAINS
) {
  const [state, setState] = useState<AnalyticsState>({
    isLoading: false,
    analytics: null,
    classification: null,
  });

  useEffect(() => {
    let isMounted = true;

    async function run() {
      if (!address) {
        setState({ isLoading: false, analytics: null, classification: null });
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        const results = await fetchWalletTransactions(address, chains);
        const trades = results.flatMap((result) =>
          buildTradeEvents(address, result.chain, result.items)
        );
        const analytics = computeAnalytics(trades);
        const classification = classifyTrader(trades);

        if (isMounted) {
          setState({ isLoading: false, analytics, classification });
        }
      } catch (error) {
        if (isMounted) {
          setState({ isLoading: false, analytics: null, classification: null });
        }
        toast.error("Analytics failed", {
          description:
            error instanceof Error ? error.message : "Unable to load wallet data.",
        });
      }
    }

    run();

    return () => {
      isMounted = false;
    };
  }, [address, chains]);

  return useMemo(() => state, [state]);
}
