"""
Professional Astrotheme-style SVG natal chart renderer.

Exact concentric proportional layout (840×840 canvas, center 420,420):

  Ring 1  Outer boundary ................ r = 410
  Ring 2  Degree-number band ............ 390 – 410
  Ring 3  Degree-tick band .............. 380 – 390
  Ring 4  Zodiac signs wheel ............ 310 – 380  (glyphs @ ~345)
  Ring 5  House cusp numbers ............ 270 – 310
  Ring 6  Planet / aspect core .......... r ≤ 270
            planet band ................. 210 – 240
            aspect grid ................. r ≤ 200
            center void ................. r < 60

Orientation: Ascendant fixed at left (9 o'clock); ecliptic longitude
increases counter-clockwise (house 1 below the AC).
"""

from __future__ import annotations

from dataclasses import dataclass
from math import cos, radians, sin
from typing import List, Optional, Tuple

from app.models.schemas import Aspect, ChartPayload, HouseCusp, PlanetPosition


@dataclass(frozen=True)
class SVGConfig:
    """Exact Astrotheme proportional radii (px) on an 840×840 canvas."""

    width: int = 840
    height: int = 840
    cx: float = 420.0
    cy: float = 420.0

    # Ring 1 — outer boundary
    outer_radius: float = 410.0

    # Ring 2 — degree numbers
    degree_num_outer: float = 410.0
    degree_num_inner: float = 390.0

    # Ring 3 — degree ticks
    tick_outer: float = 390.0
    tick_inner: float = 380.0

    # Ring 4 — zodiac wheel
    zodiac_outer: float = 380.0
    zodiac_inner: float = 310.0
    zodiac_glyph_radius: float = 345.0

    # Ring 5 — house numbers
    house_outer: float = 310.0
    house_inner: float = 270.0
    house_num_radius: float = 290.0

    # Ring 6 — core
    core_radius: float = 270.0
    planet_outer: float = 240.0
    planet_inner: float = 210.0
    aspect_radius: float = 200.0
    void_radius: float = 60.0

    # Typography
    sign_glyph_size: int = 42
    planet_glyph_size: int = 22
    degree_label_size: int = 11
    house_num_size: int = 14
    degree_num_size: int = 10
    angle_label_size: int = 13

    min_planet_gap_deg: float = 8.0


# ---------------------------------------------------------------------------
# Palette
# ---------------------------------------------------------------------------

INK = "#1A1A1A"
RING = "#222222"
TICK = "#333333"
MUTED = "#555555"

SIGN_COLORS = {
    "aries": "#C62828",
    "leo": "#C62828",
    "sagittarius": "#C62828",
    "taurus": "#6D4C00",
    "virgo": "#6D4C00",
    "capricorn": "#6D4C00",
    "gemini": "#00695C",
    "libra": "#00695C",
    "aquarius": "#00695C",
    "cancer": "#1565C0",
    "scorpio": "#1565C0",
    "pisces": "#1565C0",
}

PLANET_COLORS = {
    "sun": "#E65100",
    "moon": "#546E7A",
    "mercury": "#6A1B9A",
    "venus": "#C2185B",
    "mars": "#C62828",
    "jupiter": "#2E7D32",
    "saturn": "#5D4037",
    "uranus": "#AD1457",
    "neptune": "#00838F",
    "pluto": "#4E342E",
    "true_node": "#424242",
    "mean_node": "#424242",
    "north_node": "#424242",
    "south_node": "#424242",
    "chiron": "#757575",
    "lilith": "#37474F",
}

# Spec §2 Ring 6 aspect coding
ASPECT_STYLES = {
    "conjunction": {"color": "#FF0000", "width": 2.5, "dash": ""},
    "opposition": {"color": "#FF0000", "width": 2.5, "dash": ""},
    "square": {"color": "#0066FF", "width": 2.0, "dash": ""},
    "trine": {"color": "#00AA00", "width": 1.5, "dash": "5,4"},
    "sextile": {"color": "#00AA00", "width": 1.5, "dash": "5,4"},
}

FONT = "Arial, system-ui, sans-serif"

# VS15 forces text presentation (no emoji squares)
ZODIAC = [
    ("♈\ufe0e", "aries"),
    ("♉\ufe0e", "taurus"),
    ("♊\ufe0e", "gemini"),
    ("♋\ufe0e", "cancer"),
    ("♌\ufe0e", "leo"),
    ("♍\ufe0e", "virgo"),
    ("♎\ufe0e", "libra"),
    ("♏\ufe0e", "scorpio"),
    ("♐\ufe0e", "sagittarius"),
    ("♑\ufe0e", "capricorn"),
    ("♒\ufe0e", "aquarius"),
    ("♓\ufe0e", "pisces"),
]

PLANET_GLYPHS = {
    "sun": "☉\ufe0e",
    "moon": "☽\ufe0e",
    "mercury": "☿\ufe0e",
    "venus": "♀\ufe0e",
    "mars": "♂\ufe0e",
    "jupiter": "♃\ufe0e",
    "saturn": "♄\ufe0e",
    "uranus": "♅\ufe0e",
    "neptune": "♆\ufe0e",
    "pluto": "♇\ufe0e",
    "true_node": "☊\ufe0e",
    "mean_node": "☊\ufe0e",
    "north_node": "☊\ufe0e",
    "south_node": "☋\ufe0e",
    "chiron": "⚷\ufe0e",
    "lilith": "⚸\ufe0e",
}


class NatalChartSVGRenderer:
    """Astrotheme-style SVG natal chart with exact concentric proportions."""

    def __init__(self, config: Optional[SVGConfig] = None):
        self.cfg = config or SVGConfig()
        self.parts: List[str] = []
        self.asc: float = 0.0

    # ------------------------------------------------------------------
    # Geometry — ASC at left, longitude CCW
    # ------------------------------------------------------------------

    def polar(self, lon: float, radius: float) -> Tuple[float, float]:
        """Ecliptic longitude → SVG (x, y). lon == asc → left (9 o'clock)."""
        theta = radians(self.asc - lon)
        x = self.cfg.cx - radius * cos(theta)
        y = self.cfg.cy - radius * sin(theta)
        return x, y

    @staticmethod
    def norm360(deg: float) -> float:
        n = deg % 360.0
        return n + 360.0 if n < 0 else n

    def mid_lon(self, a: float, b: float) -> float:
        span = self.norm360(b - a) or 30.0
        return self.norm360(a + span / 2.0)

    def spread(
        self, bodies: List[Tuple[str, float]], min_gap: float
    ) -> List[Tuple[str, float, float]]:
        """Collision-avoidance fan. Returns (id, true_lon, display_lon)."""
        items = sorted(
            ((pid, self.norm360(lon)) for pid, lon in bodies),
            key=lambda t: t[1],
        )
        n = len(items)
        if n == 0:
            return []
        display = [lon for _, lon in items]
        gap = min(min_gap, 350.0 / n)
        for _ in range(16):
            for i in range(1, n):
                d = self.norm360(display[i] - display[i - 1])
                if d < gap:
                    push = (gap - d) / 2.0
                    display[i - 1] = self.norm360(display[i - 1] - push)
                    display[i] = self.norm360(display[i] + push)
            wrap = self.norm360(display[0] + 360.0 - display[n - 1])
            if wrap < gap:
                push = (gap - wrap) / 2.0
                display[n - 1] = self.norm360(display[n - 1] - push)
                display[0] = self.norm360(display[0] + push)
        return [(items[i][0], items[i][1], display[i]) for i in range(n)]

    # ------------------------------------------------------------------
    # Primitives
    # ------------------------------------------------------------------

    def line(
        self,
        x1: float,
        y1: float,
        x2: float,
        y2: float,
        stroke: str = INK,
        width: float = 1.0,
        dash: str = "",
        opacity: float = 1.0,
    ) -> None:
        dash_a = f' stroke-dasharray="{dash}"' if dash else ""
        op = f' opacity="{opacity}"' if opacity < 1.0 else ""
        self.parts.append(
            f'<line x1="{x1:.2f}" y1="{y1:.2f}" x2="{x2:.2f}" y2="{y2:.2f}" '
            f'stroke="{stroke}" stroke-width="{width}" stroke-linecap="round"'
            f"{dash_a}{op}/>"
        )

    def circle(
        self,
        r: float,
        fill: str = "none",
        stroke: str = RING,
        width: float = 1.0,
    ) -> None:
        c = self.cfg
        self.parts.append(
            f'<circle cx="{c.cx:.1f}" cy="{c.cy:.1f}" r="{r:.2f}" '
            f'fill="{fill}" stroke="{stroke}" stroke-width="{width}"/>'
        )

    def text(
        self,
        x: float,
        y: float,
        content: str,
        size: int,
        fill: str = INK,
        weight: str = "normal",
        anchor: str = "middle",
        baseline: str = "central",
    ) -> None:
        self.parts.append(
            f'<text x="{x:.2f}" y="{y:.2f}" font-size="{size}" '
            f'font-weight="{weight}" text-anchor="{anchor}" '
            f'dominant-baseline="{baseline}" fill="{fill}">{content}</text>'
        )

    # ------------------------------------------------------------------
    # Layers
    # ------------------------------------------------------------------

    def render_rings(self) -> None:
        c = self.cfg
        self.parts.append('<g id="rings" fill="none">')
        self.circle(c.outer_radius, width=2.0)          # Ring 1
        self.circle(c.degree_num_inner, width=1.0)      # Ring 2 inner
        self.circle(c.tick_inner, width=1.0)            # Ring 3 inner / zodiac outer
        self.circle(c.zodiac_inner, width=1.2)          # Ring 4 inner / house outer
        self.circle(c.house_inner, width=1.5)           # Ring 5 inner / core
        self.circle(c.aspect_radius, width=1.0)         # aspect grid rim
        self.circle(c.void_radius, width=0.8)           # center void
        self.parts.append("</g>")

    def render_degree_ticks(self) -> None:
        """Ring 3 — inward ticks between tick_outer (390) and tick_inner (380)."""
        c = self.cfg
        self.parts.append('<g id="degree-ticks">')
        for d in range(360):
            if d % 10 == 0:
                length, sw = 10.0, 1.5
            elif d % 5 == 0:
                length, sw = 10.0, 1.5
            else:
                length, sw = 5.0, 1.0
            # Inward from tick_outer toward tick_inner
            x1, y1 = self.polar(float(d), c.tick_outer)
            x2, y2 = self.polar(float(d), c.tick_outer - length)
            self.line(x1, y1, x2, y2, stroke=TICK, width=sw)
        self.parts.append("</g>")

    def render_degree_numbers(self) -> None:
        """Ring 2 — absolute degree markers at each 30° sign boundary."""
        c = self.cfg
        mid_r = (c.degree_num_outer + c.degree_num_inner) / 2.0
        self.parts.append('<g id="degree-numbers">')
        for i in range(12):
            lon = float(i * 30)
            # Offset slightly into the sign so the label clears the divider
            x, y = self.polar(lon + 2.0, mid_r)
            self.text(
                x, y, f"{i * 30}",
                c.degree_num_size, fill=MUTED, weight="600",
            )
        self.parts.append("</g>")

    def render_zodiac(self) -> None:
        """Ring 4 — 12×30° sectors with large glyphs at mean radius ~345."""
        c = self.cfg
        self.parts.append('<g id="zodiac">')
        for i, (glyph, sign) in enumerate(ZODIAC):
            start = float(i * 30)
            # Radial divider across the zodiac band
            x1, y1 = self.polar(start, c.zodiac_inner)
            x2, y2 = self.polar(start, c.zodiac_outer)
            self.line(x1, y1, x2, y2, stroke=RING, width=1.1)

            gx, gy = self.polar(start + 15.0, c.zodiac_glyph_radius)
            color = SIGN_COLORS.get(sign, INK)
            self.text(
                gx, gy, glyph,
                size=c.sign_glyph_size,
                fill=color,
                weight="bold",
            )
        self.parts.append("</g>")

    def render_houses(self, houses: List[HouseCusp]) -> None:
        """Ring 5 — cusp spokes + house numbers 1–12 at calculated angles."""
        c = self.cfg
        cusps = {h.house: h.cusp for h in houses}
        self.parts.append('<g id="houses">')
        for h in houses:
            angular = h.house in (1, 4, 7, 10)
            # Spoke from core rim through house band into zodiac
            x1, y1 = self.polar(h.cusp, c.house_inner)
            x2, y2 = self.polar(h.cusp, c.zodiac_outer)
            self.line(
                x1, y1, x2, y2,
                stroke=INK,
                width=2.2 if angular else 1.0,
            )

            nxt = cusps.get(h.house % 12 + 1, self.norm360(h.cusp + 30.0))
            mid = self.mid_lon(h.cusp, nxt)
            nx, ny = self.polar(mid, c.house_num_radius)
            self.text(
                nx, ny, str(h.house),
                size=c.house_num_size,
                fill=INK,
                weight="bold",
            )
        self.parts.append("</g>")

    def render_angles(self, chart: ChartPayload) -> None:
        """ASC / MC markers on the outer boundary."""
        c = self.cfg
        self.parts.append('<g id="angles">')
        for lon, label in (
            (chart.angles.asc, "ASC"),
            (chart.angles.mc, "MC"),
            (chart.angles.dsc, "DSC"),
            (chart.angles.ic, "IC"),
        ):
            # Tick mark on outer ring
            x1, y1 = self.polar(lon, c.outer_radius - 4)
            x2, y2 = self.polar(lon, c.outer_radius + 8)
            self.line(x1, y1, x2, y2, stroke=INK, width=2.0)
            if label in ("ASC", "MC"):
                lx, ly = self.polar(lon, c.outer_radius + 22)
                self.text(lx, ly, label, c.angle_label_size, fill=INK, weight="bold")
        self.parts.append("</g>")

    def render_aspects(
        self, planets: List[PlanetPosition], aspects: List[Aspect]
    ) -> None:
        """Aspect grid inside r ≤ 200 (Ring 6)."""
        c = self.cfg
        lon_by = {p.id: p.lon for p in planets}
        self.parts.append('<g id="aspects">')
        for asp in aspects:
            style = ASPECT_STYLES.get(asp.type)
            if not style:
                continue
            la = lon_by.get(asp.a)
            lb = lon_by.get(asp.b)
            if la is None or lb is None:
                continue
            x1, y1 = self.polar(la, c.aspect_radius)
            x2, y2 = self.polar(lb, c.aspect_radius)
            self.line(
                x1, y1, x2, y2,
                stroke=style["color"],
                width=style["width"],
                dash=style["dash"],
                opacity=0.9,
            )
        self.parts.append("</g>")

    def render_planets(self, planets: List[PlanetPosition]) -> None:
        """Planet glyphs in the 210–240 band with staggered collision avoidance."""
        c = self.cfg
        placed = self.spread(
            [(p.id, p.lon) for p in planets], c.min_planet_gap_deg
        )
        by_id = {p.id: p for p in planets}
        mid_r = (c.planet_outer + c.planet_inner) / 2.0
        alt_r = c.planet_inner + 4.0

        self.parts.append('<g id="planets">')
        for idx, (pid, true_lon, display_lon) in enumerate(placed):
            p = by_id[pid]
            color = PLANET_COLORS.get(pid.lower(), INK)
            glyph = PLANET_GLYPHS.get(pid.lower(), "●")
            radius = alt_r if idx % 2 else mid_r

            # Anchor tick on aspect rim at true longitude
            ax, ay = self.polar(true_lon, c.aspect_radius)
            self.circle_at(ax, ay, 2.2, fill=color)

            # Leader from aspect rim to glyph
            gx, gy = self.polar(display_lon, radius)
            self.line(ax, ay, gx, gy, stroke=color, width=0.9, opacity=0.7)

            self.text(
                gx, gy, glyph,
                size=c.planet_glyph_size,
                fill=color,
                weight="bold",
            )

            if p.retrograde:
                self.text(
                    gx + 10, gy + 9, "R",
                    size=9, fill="#C62828", weight="bold",
                )

            # Compact degree′ under glyph
            deg = int(p.sign_degree)
            minutes = int(round((p.sign_degree % 1) * 60)) % 60
            dx, dy = self.polar(display_lon, radius - 16)
            self.text(
                dx, dy, f"{deg}°{minutes:02d}'",
                size=c.degree_label_size,
                fill=color,
                weight="600",
            )
        self.parts.append("</g>")

    def circle_at(
        self, x: float, y: float, r: float, fill: str = INK, stroke: str = "none"
    ) -> None:
        self.parts.append(
            f'<circle cx="{x:.2f}" cy="{y:.2f}" r="{r:.2f}" '
            f'fill="{fill}" stroke="{stroke}"/>'
        )

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def generate(self, chart: ChartPayload) -> str:
        """Build the complete print-ready Astrotheme SVG string."""
        self.parts = []
        self.asc = chart.angles.asc
        c = self.cfg

        header = (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            f'<svg xmlns="http://www.w3.org/2000/svg" '
            f'width="{c.width}" height="{c.height}" '
            f'viewBox="0 0 {c.width} {c.height}" '
            f'data-chart-type="natal" data-format="astrotheme-proportional" '
            f'data-utc="{chart.meta.utc}">\n'
            "<defs>\n"
            "<style><![CDATA[\n"
            f"  text {{ font-family: {FONT}; }}\n"
            "  @media print {\n"
            "    svg { background: #ffffff; }\n"
            "    line, circle, text {\n"
            "      -webkit-print-color-adjust: exact;\n"
            "      print-color-adjust: exact;\n"
            "    }\n"
            "  }\n"
            "]]></style>\n"
            "</defs>\n"
            f'<rect width="{c.width}" height="{c.height}" fill="#ffffff"/>\n'
        )

        # Draw order: rings → ticks → numbers → zodiac → houses →
        # aspects (under planets) → planets → angles
        self.render_rings()
        self.render_degree_ticks()
        self.render_degree_numbers()
        self.render_zodiac()
        self.render_houses(chart.houses)
        self.render_aspects(chart.planets, chart.aspects)
        self.render_planets(chart.planets)
        self.render_angles(chart)

        return header + "\n".join(self.parts) + "\n</svg>\n"
