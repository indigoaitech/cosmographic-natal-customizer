import { DTG_STROKE, LOCAL_R } from "@/lib/chart/pod";
import {
  projectDiscPoint,
  projectedRingPath,
} from "@/lib/chart/perspective3d";
import { chartTheme } from "@/lib/chart/theme";
import { filterUrl } from "@/components/chart/GalacticFilters";

type GalacticStructuralShellProps = {
  uid: string;
};

/**
 * Permanent Cosmographic structural matrix — polyhedrons + fluid energy lines.
 * Independent of Swiss Ephemeris data (outer aesthetic shell stays locked).
 */
export function GalacticStructuralShell({ uid }: GalacticStructuralShellProps) {
  const f = (name: string) => filterUrl(uid, name);

  // Icosahedron-ish projected vertices on outer shell (fixed angles)
  const shellAngles = [0, 36, 72, 108, 144, 180, 216, 252, 288, 324];
  const verts = shellAngles.map((deg, i) => {
    const r = LOCAL_R * (i % 2 === 0 ? 1.08 : 0.92);
    const a = (deg * Math.PI) / 180;
    return projectDiscPoint(r * Math.cos(a), r * Math.sin(a), i % 2 === 0 ? -30 : 25);
  });

  const hexInner = [0, 60, 120, 180, 240, 300].map((deg) => {
    const a = (deg * Math.PI) / 180;
    const r = LOCAL_R * 0.55;
    return projectDiscPoint(r * Math.cos(a), r * Math.sin(a), 18);
  });

  // Fixed fluid energy arcs (bezier through static control points)
  const energyArcs = [
    [0.15, 0.35, 0.55, 0.75, 0.95].map((t) => {
      const a = t * Math.PI * 2 * 0.7;
      const r = LOCAL_R * (0.7 + 0.15 * Math.sin(t * 9));
      return projectDiscPoint(r * Math.cos(a), r * Math.sin(a), 40 * Math.sin(t * 6));
    }),
    [0.05, 0.28, 0.5, 0.72, 0.9].map((t) => {
      const a = Math.PI + t * Math.PI * 1.4;
      const r = LOCAL_R * (0.82 + 0.1 * Math.cos(t * 7));
      return projectDiscPoint(r * Math.cos(a), r * Math.sin(a), -20 + 30 * t);
    }),
  ];

  function polyPath(pts: { x: number; y: number }[], close = true): string {
    return (
      pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ") +
      (close ? " Z" : "")
    );
  }

  function curvePath(pts: { x: number; y: number }[]): string {
    if (pts.length < 2) return "";
    let d = `M ${pts[0]!.x.toFixed(2)} ${pts[0]!.y.toFixed(2)}`;
    for (let i = 1; i < pts.length - 1; i += 1) {
      const c = pts[i]!;
      const n = pts[i + 1]!;
      d += ` Q ${c.x.toFixed(2)} ${c.y.toFixed(2)} ${((c.x + n.x) / 2).toFixed(2)} ${((c.y + n.y) / 2).toFixed(2)}`;
    }
    const last = pts[pts.length - 1]!;
    d += ` T ${last.x.toFixed(2)} ${last.y.toFixed(2)}`;
    return d;
  }

  return (
    <g id="layer-galactic-structural-shell" data-layer="structural-shell">
      {/* Neon dark blue atmospheric wash (non-shifting) */}
      <ellipse
        cx={projectDiscPoint(0, 0).x}
        cy={projectDiscPoint(0, 0).y}
        rx={POD_RX()}
        ry={POD_RY()}
        fill={`url(#${uid}-void-wash)`}
        opacity={0.9}
      />

      {/* Outer matrix ring (locked) */}
      <path
        d={projectedRingPath(LOCAL_R * 1.12, 120, -35)}
        fill="none"
        stroke={chartTheme.neonDarkBlue}
        strokeWidth={DTG_STROKE.matrix + 4}
        filter={f("glow-dark-blue")}
        opacity={0.9}
      />
      <path
        d={projectedRingPath(LOCAL_R * 1.12, 120, -35)}
        fill="none"
        stroke={chartTheme.electricBlue}
        strokeWidth={DTG_STROKE.matrix}
        filter={f("glow-electric")}
        opacity={0.75}
      />

      {/* Polyhedron wireframe */}
      <path
        d={polyPath(verts)}
        fill="none"
        stroke={chartTheme.electricBlueDim}
        strokeWidth={DTG_STROKE.matrix}
        filter={f("glow-matrix")}
        opacity={0.7}
      />
      {verts.map((v, i) => {
        const n = verts[(i + 3) % verts.length]!;
        return (
          <line
            key={`chord-${i}`}
            x1={v.x}
            y1={v.y}
            x2={n.x}
            y2={n.y}
            stroke={chartTheme.neonDarkBlue}
            strokeWidth={DTG_STROKE.matrix - 1}
            opacity={0.55}
          />
        );
      })}

      {/* Inner hex lock plate */}
      <path
        d={polyPath(hexInner)}
        fill="none"
        stroke={chartTheme.neonPink}
        strokeWidth={DTG_STROKE.matrix}
        filter={f("glow-pink")}
        opacity={0.55}
      />

      {/* Fluid energy lines */}
      {energyArcs.map((arc, i) => (
        <g key={`energy-${i}`}>
          <path
            d={curvePath(arc)}
            fill="none"
            stroke={i === 0 ? chartTheme.electricBlue : chartTheme.neonPink}
            strokeWidth={DTG_STROKE.energy + 6}
            opacity={0.25}
            filter={f(i === 0 ? "glow-electric" : "glow-pink")}
            strokeLinecap="round"
          />
          <path
            d={curvePath(arc)}
            fill="none"
            stroke={i === 0 ? chartTheme.star : chartTheme.neonPinkSoft}
            strokeWidth={DTG_STROKE.energy}
            opacity={0.85}
            strokeLinecap="round"
          />
        </g>
      ))}
    </g>
  );
}

/** Approximate projected ellipse radii for wash (from ring extents). */
function POD_RX(): number {
  const a = projectDiscPoint(LOCAL_R * 1.15, 0);
  const b = projectDiscPoint(-LOCAL_R * 1.15, 0);
  return Math.abs(a.x - b.x) / 2;
}

function POD_RY(): number {
  const a = projectDiscPoint(0, LOCAL_R * 1.15);
  const b = projectDiscPoint(0, -LOCAL_R * 1.15);
  return Math.abs(a.y - b.y) / 2;
}
