import { AppShell } from "../../components/app-shell";
import { DataTable } from "../../components/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

export default function TrendingPage() {
  return (
    <AppShell
      title="Trending Tokens"
      subtitle="Discover the most active tokens across tracked wallets."
    >
      <Card>
        <CardHeader>
          <CardTitle>Market Pulse</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted">
          Token trends will surface here once data pipelines are connected.
        </CardContent>
      </Card>

      <section>
        <DataTable
          title="Most Traded Tokens"
          columns={["Token", "Volume", "Number of Traders", "Trend"]}
          emptyLabel="No trending data yet"
        />
      </section>
    </AppShell>
  );
}
