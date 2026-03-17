import { AppShell } from "../../components/app-shell";
import { ChartCard } from "../../components/chart-card";
import { DataTable } from "../../components/data-table";
import { SearchInput } from "../../components/search-input";
import { StatCard } from "../../components/stat-card";
import { TraderProfileCard } from "../../components/trader-profile-card";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

export default function SearchPage() {
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
          <SearchInput />
          <p className="text-xs text-muted">
            Results will appear after a wallet connection and data ingestion.
          </p>
        </CardContent>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total PnL" helper="Wallet-level performance" />
        <StatCard label="Win Rate" helper="Performance ratio" />
        <StatCard label="Total Trades" helper="Execution history" />
        <StatCard label="Most Used Network" helper="Primary chain" />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="PnL Over Time" subtitle="Wallet curve" />
        <ChartCard title="Trades Over Time" subtitle="Wallet activity" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <TraderProfileCard />
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-dashed border-white/10 bg-[#0f141c] p-6 text-sm text-muted">
              No trading data found
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <DataTable
          title="Tokens Performance"
          columns={["Token", "Buy Volume", "Sell Volume", "PnL", "Last Trade"]}
        />
      </section>
    </AppShell>
  );
}
