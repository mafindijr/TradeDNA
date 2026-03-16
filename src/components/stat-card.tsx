import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value?: string;
  helper?: string;
}) {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle className="text-xs uppercase tracking-[0.28em] text-muted">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="text-2xl font-semibold text-white">
          {value ?? "--"}
        </div>
        {helper ? <p className="text-xs text-muted">{helper}</p> : null}
      </CardContent>
    </Card>
  );
}
