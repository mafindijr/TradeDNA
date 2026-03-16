import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import type { TraderClassification } from "../lib/analytics/types";

export function TraderProfileCard({
  isLoading = false,
  classification,
}: {
  isLoading?: boolean;
  classification?: TraderClassification | null;
}) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Trader Profile</CardTitle>
        <Badge tone="neutral">
          {classification?.riskLevel ?? "Unknown"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted">
              Trader Type
            </p>
            <p className="mt-2 text-lg text-white">
              {isLoading ? "--" : classification?.type ?? "--"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted">
              Risk Level
            </p>
            <p className="mt-2 text-lg text-white">
              {isLoading ? "--" : classification?.riskLevel ?? "--"}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-muted">
          {isLoading
            ? "Analyzing trading behavior..."
            : classification?.description ??
              "Trading behavior summary will appear once wallet analytics are connected."}
        </div>
      </CardContent>
    </Card>
  );
}
