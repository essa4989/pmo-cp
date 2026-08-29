export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-line bg-surface p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function ProgressBar({ value, tone = "brand" }: { value: number; tone?: "brand" | "ok" | "warn" | "bad" }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const colors: Record<string, string> = {
    brand: "linear-gradient(90deg, var(--brand-600), var(--brand-500))",
    ok: "linear-gradient(90deg, var(--ok), #29a56a)",
    warn: "linear-gradient(90deg, var(--warn), #c8891a)",
    bad: "linear-gradient(90deg, var(--bad), #d43a52)",
  };
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${clamped}%`, background: colors[tone] }}
      />
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <Card className="text-center">
      <div className="ltr-num text-3xl font-bold text-brand-700">{value}</div>
      <div className="mt-1 text-xs font-medium text-muted">{label}</div>
      {hint && <div className="mt-0.5 text-[11px] text-muted/80">{hint}</div>}
    </Card>
  );
}

export function Badge({
  children,
  tone = "brand",
}: {
  children: React.ReactNode;
  tone?: "brand" | "ok" | "warn" | "bad" | "muted";
}) {
  const toneClasses: Record<string, string> = {
    brand: "bg-brand-100 text-brand-800",
    ok: "bg-[var(--ok-bg)] text-[var(--ok)]",
    warn: "bg-[var(--warn-bg)] text-[var(--warn)]",
    bad: "bg-[var(--bad-bg)] text-[var(--bad)]",
    muted: "bg-surface-2 text-muted",
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}

export function readinessTone(pct: number): "ok" | "warn" | "bad" {
  if (pct >= 75) return "ok";
  if (pct >= 55) return "warn";
  return "bad";
}
