import { cn } from "@/lib/utils";

const toneClass = {
  primary: "bg-primary",
  info: "bg-info",
  warning: "bg-warning",
  danger: "bg-danger",
  violet: "bg-violet",
} as const;

interface ProgressProps {
  value: number;
  label?: string;
  className?: string;
  tone?: keyof typeof toneClass;
}

export function Progress({ value, label, className, tone = "primary" }: ProgressProps) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(v)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-3", className)}
    >
      <div className={cn("h-full rounded-full transition-[width] duration-500", toneClass[tone])} style={{ width: `${v}%` }} />
    </div>
  );
}

interface RingProps {
  value: number;
  size?: number;
  stroke?: number;
  label: string;
  children?: React.ReactNode;
  color?: string;
}

export function ProgressRing({ value, size = 120, stroke = 10, label, children, color = "var(--primary)" }: RingProps) {
  const v = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label}: ${Math.round(v)}%`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v / 100)}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}
