"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "../../components/app-shell";
import { ChartCard } from "../../components/chart-card";
import { DataTable } from "../../components/data-table";
import { SearchInput } from "../../components/search-input";
import { StatCard } from "../../components/stat-card";
import { TraderProfileCard } from "../../components/trader-profile-card";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { useWalletAnalytics } from "../../lib/analytics/use-wallet-analytics";

export default function SearchPage() {
  const [input, setInput] = useState("");
  const [activeAddress, setActiveAddress] = useState<string | null>(null);
  const { isLoading, analytics, error } = useWalletAnalytics(activeAddress);
  const emptyLabel = error ?? "No trading data found";

  function handleAnalyze() {
    const trimmed = input.trim();
    if (!trimmed) {
      toast.error("Wallet address required", {
        description: "Paste a wallet address to start analysis.",
      });
      return;
    }

    setActiveAddress(trimmed);
  }

  return (
    <AppShell
      title="Wallet Search"
      subtitle="Paste a wallet address to load analytics once connected."
    >
      <Card>
        <CardHeader>
          <CardTitle>Analyze Wallet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SearchInput
            value={input}
            onChange={setInput}
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
          />
          <p className="text-xs text-muted">
            Results will appear after a wallet connection and data ingestion.
          </p>
        </CardContent>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total PnL"
          helper="Wallet-level performance"
          value={analytics ? `$${analytics.pnl.toLocaleString()}` : undefined}
        />
        <StatCard
          label="Win Rate"
          helper="Performance ratio"
          value={analytics ? `${analytics.winRate}%` : undefined}
        />
        <StatCard
          label="Total Trades"
          helper="Execution history"
          value={analytics ? analytics.totalTrades.toString() : undefined}
        />
        <StatCard
          label="Most Used Network"
          helper="Primary chain"
          value={analytics?.mostUsedNetwork}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="PnL Over Time"
          subtitle="Wallet curve"
          isLoading={isLoading}
          data={analytics?.pnlSeries ?? []}
        />
        <ChartCard
          title="Trades Over Time"
          subtitle="Wallet activity"
          isLoading={isLoading}
          data={analytics?.pnlSeries ?? []}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <TraderProfileCard
          isLoading={isLoading}
          classification={analytics?.traderType}
        />
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <>
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </>
            ) : analytics?.recentTrades.length ? (
              analytics.recentTrades.map((trade) => (
                <div
                  key={trade.hash}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0f141c] px-4 py-3 text-xs text-muted"
                >
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted">
                      {trade.chainName}
                    </p>
                    <p className="text-sm text-white/90">
                      {trade.direction === "buy" ? "Buy" : "Sell"} - $
                      {trade.valueUsd.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted">
                      {new Date(trade.timestamp).toLocaleDateString("en-US")}
                    </p>
                    <p
                      className={`text-sm ${
                        trade.pnlUsd >= 0 ? "text-emerald-300" : "text-rose-300"
                      }`}
                    >
                      {trade.pnlUsd >= 0 ? "+" : "-"}$
                      {Math.abs(trade.pnlUsd).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 bg-[#0f141c] p-6 text-sm text-muted">
                {emptyLabel}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <DataTable
          title="Tokens Performance"
          columns={["Token", "Buy Volume", "Sell Volume", "PnL", "Last Trade"]}
          isLoading={isLoading}
          emptyLabel={emptyLabel}
          rows={
            analytics?.tokensPerformance.map((token) => [
              token.symbol ?? token.token.slice(0, 6),
              `$${token.buyVolumeUsd.toFixed(2)}`,
              `$${token.sellVolumeUsd.toFixed(2)}`,
              `${token.pnlUsd >= 0 ? "+" : "-"}$${Math.abs(token.pnlUsd).toFixed(2)}`,
              new Date(token.lastTradeAt).toLocaleDateString("en-US"),
            ]) ?? []
          }
        />
      </section>
    </AppShell>
  );
}
