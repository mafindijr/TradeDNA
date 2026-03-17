"use client";

import { LineChart, Line, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

export function ChartCard({
  title,
  subtitle,
  isLoading = false,
  data = [],
}: {
  title: string;
  subtitle?: string;
  isLoading?: boolean;
  data?: Array<{ date: string; pnl: number }>;
}) {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle className="text-sm uppercase tracking-[0.28em] text-muted">
          {title}
        </CardTitle>
        {subtitle ? <p className="text-xs text-muted">{subtitle}</p> : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-48 w-full rounded-2xl" />
        ) : (
          <div className="h-56 w-full rounded-2xl border border-white/10 bg-[#0f141c] p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Line type="monotone" dataKey="pnl" stroke="#6366f1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="flex items-center justify-between text-xs text-muted">
          <span>Real-time data pipeline ready</span>
          <span className="text-white/70">Coming soon</span>
        </div>
      </CardContent>
    </Card>
  );
}
