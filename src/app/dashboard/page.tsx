"use client";

import { AppShell } from "../../components/app-shell";
import { ChartCard } from "../../components/chart-card";
import { DataTable } from "../../components/data-table";
import { StatCard } from "../../components/stat-card";
import { TraderProfileCard } from "../../components/trader-profile-card";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { useWallet } from "../../components/wallet-provider";
import { useWalletAnalytics } from "../../lib/analytics/use-wallet-analytics";

export default function DashboardPage() {
  const { address } = useWallet();
  const { isLoading, analytics, error } = useWalletAnalytics(address);
  const emptyLabel = error ?? "No trading data found";

  return (
    <AppShell
      title="Performance Overview"
      subtitle="Connect a wallet to populate analytics across networks and tokens."
    >
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total PnL"
          helper="Aggregated across networks"
          value={analytics ? `$${analytics.pnl.toLocaleString()}` : undefined}
        />
        <StatCard
          label="Win Rate"
          helper="Profitable trades ratio"
          value={analytics ? `${analytics.winRate}%` : undefined}
        />
        <StatCard
          label="Total Trades"
          helper="All on-chain executions"
          value={analytics ? analytics.totalTrades.toString() : undefined}
        />
        <StatCard
          label="Most Used Network"
          helper="Dominant chain"
          value={analytics?.mostUsedNetwork}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="PnL Over Time"
          subtitle="Net performance curve"
          isLoading={isLoading}
          data={analytics?.pnlSeries ?? []}
        />
        <ChartCard
          title="Trades Over Time"
          subtitle="Execution volume"
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
