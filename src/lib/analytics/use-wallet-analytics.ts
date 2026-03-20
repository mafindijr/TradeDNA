"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { WalletAnalytics } from "./types";

type AnalyticsState = {
  isLoading: boolean;
  analytics: WalletAnalytics | null;
  error: string | null;
};

export function useWalletAnalytics(address: string | null) {
  const [state, setState] = useState<AnalyticsState>({
    isLoading: false,
    analytics: null,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function run() {
      if (!address) {
        setState({ isLoading: false, analytics: null, error: null });
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const res = await fetch("/api/analyze-wallet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address }),
          signal: controller.signal,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Unable to load wallet data.");
        }

        const analytics = data as WalletAnalytics;

        if (isMounted) {
          setState({ isLoading: false, analytics, error: null });
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        const message =
          error instanceof Error ? error.message : "Unable to load wallet data.";
        if (isMounted) {
          setState({ isLoading: false, analytics: null, error: message });
        }
        toast.error("Analytics failed", {
          description: message,
        });
      }
    }

    run();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [address]);

  return useMemo(() => state, [state]);
}
