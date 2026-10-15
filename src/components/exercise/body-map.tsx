import type { MuscleGroup } from "@/lib/types";
import { MUSCLES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Shape =
  | { kind: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  | { kind: "rect"; x: number; y: number; w: number; h: number; r?: number }
  | { kind: "path"; d: string };

/** Simplified front (left) and back (right) figure, split into muscle regions. */
const REGIONS: { muscle: MuscleGroup | null; shapes: Shape[] }[] = [
  // Neutral body parts
  {
    muscle: null,
    shapes: [
      { kind: "ellipse", cx: 50, cy: 15, rx: 9, ry: 10 },
      { kind: "rect", x: 46, y: 24, w: 8, h: 7, r: 2 },
      { kind: "path", d: "M38 92 h24 l2 10 h-28 z" },
      { kind: "rect", x: 14, y: 100, w: 7, h: 10, r: 3 },
      { kind: "rect", x: 79, y: 100, w: 7, h: 10, r: 3 },
      { kind: "ellipse", cx: 160, cy: 15, rx: 9, ry: 10 },
      { kind: "rect", x: 156, y: 24, w: 8, h: 7, r: 2 },
      { kind: "rect", x: 124, y: 100, w: 7, h: 10, r: 3 },
      { kind: "rect", x: 189, y: 100, w: 7, h: 10, r: 3 },
      { kind: "rect", x: 38, y: 178, w: 9, h: 6, r: 2 },
      { kind: "rect", x: 53, y: 178, w: 9, h: 6, r: 2 },
      { kind: "rect", x: 148, y: 178, w: 9, h: 6, r: 2 },
      { kind: "rect", x: 163, y: 178, w: 9, h: 6, r: 2 },
    ],
  },
  {
    muscle: "shoulders",
    shapes: [
      { kind: "ellipse", cx: 30, cy: 38, rx: 8, ry: 7 },
      { kind: "ellipse", cx: 70, cy: 38, rx: 8, ry: 7 },
      { kind: "ellipse", cx: 140, cy: 38, rx: 8, ry: 7 },
      { kind: "ellipse", cx: 180, cy: 38, rx: 8, ry: 7 },
    ],
  },
  {
    muscle: "chest",
    shapes: [
      { kind: "rect", x: 39, y: 34, w: 10.5, h: 15, r: 5 },
      { kind: "rect", x: 50.5, y: 34, w: 10.5, h: 15, r: 5 },
    ],
  },
  {
    muscle: "core",
    shapes: [{ kind: "rect", x: 41, y: 52, w: 18, h: 38, r: 5 }],
  },
  {
    muscle: "arms",
    shapes: [
      { kind: "rect", x: 21, y: 46, w: 8, h: 24, r: 4 },
      { kind: "rect", x: 71, y: 46, w: 8, h: 24, r: 4 },
      { kind: "rect", x: 17, y: 72, w: 7, h: 26, r: 3.5 },
      { kind: "rect", x: 76, y: 72, w: 7, h: 26, r: 3.5 },
      { kind: "rect", x: 131, y: 46, w: 8, h: 24, r: 4 },
      { kind: "rect", x: 181, y: 46, w: 8, h: 24, r: 4 },
      { kind: "rect", x: 127, y: 72, w: 7, h: 26, r: 3.5 },
      { kind: "rect", x: 186, y: 72, w: 7, h: 26, r: 3.5 },
    ],
  },
  {
    muscle: "quads",
    shapes: [
      { kind: "rect", x: 37, y: 104, w: 12, h: 40, r: 6 },
      { kind: "rect", x: 51, y: 104, w: 12, h: 40, r: 6 },
    ],
  },
  {
    muscle: "calves",
    shapes: [
      { kind: "rect", x: 38.5, y: 148, w: 9, h: 28, r: 4.5 },
      { kind: "rect", x: 52.5, y: 148, w: 9, h: 28, r: 4.5 },
      { kind: "ellipse", cx: 153, cy: 160, rx: 5.5, ry: 15 },
      { kind: "ellipse", cx: 167, cy: 160, rx: 5.5, ry: 15 },
    ],
  },
  {
    muscle: "back",
    shapes: [{ kind: "path", d: "M146 32 h28 l-3 30 l-5 24 h-12 l-5 -24 z" }],
  },
  {
    muscle: "glutes",
    shapes: [
      { kind: "ellipse", cx: 153.5, cy: 98, rx: 7, ry: 8 },
      { kind: "ellipse", cx: 166.5, cy: 98, rx: 7, ry: 8 },
    ],
  },
  {
    muscle: "hamstrings",
    shapes: [
      { kind: "rect", x: 147, y: 108, w: 12, h: 34, r: 6 },
      { kind: "rect", x: 161, y: 108, w: 12, h: 34, r: 6 },
    ],
  },
];

function renderShape(s: Shape, key: number) {
  if (s.kind === "ellipse") return <ellipse key={key} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} />;
  if (s.kind === "rect") return <rect key={key} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.r ?? 0} />;
  return <path key={key} d={s.d} />;
}

/** Consistent illustration showing which muscle groups an exercise targets. */
export function BodyMap({ muscles, className }: { muscles: MuscleGroup[]; className?: string }) {
  const label = `Target muscles: ${muscles.map((m) => MUSCLES[m]).join(", ")}`;
  return (
    <svg viewBox="0 0 210 190" role="img" aria-label={label} className={cn("h-auto w-full", className)}>
      <title>{label}</title>
      {REGIONS.map((region, i) => {
        const on = region.muscle !== null && muscles.includes(region.muscle);
        return (
          <g
            key={i}
            fill={on ? "var(--primary)" : region.muscle ? "var(--surface-3)" : "var(--border-strong)"}
            stroke="var(--surface)"
            strokeWidth={1}
          >
            {region.shapes.map(renderShape)}
          </g>
        );
      })}
      <text x="50" y="189" textAnchor="middle" fontSize="7" fill="var(--subtle)">FRONT</text>
      <text x="160" y="189" textAnchor="middle" fontSize="7" fill="var(--subtle)">BACK</text>
    </svg>
  );
}
