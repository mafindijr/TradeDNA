import * as React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "success" | "danger";
}

const tones: Record<NonNullable<BadgeProps["tone"]>, string> = {
  neutral: "border-white/10 text-muted",
  success: "border-emerald-400/30 text-emerald-200",
  danger: "border-rose-400/30 text-rose-200",
};

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, tone = "neutral", ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.2em]",
        tones[tone],
        className
      )}
      {...props}
    />
  )
);
Badge.displayName = "Badge";

export { Badge };
