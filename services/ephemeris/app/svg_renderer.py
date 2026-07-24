"""
Astrotheme-format SVG natal chart renderer.

Measured from the Astrotheme reference (510×510 → scaled to 1000 canvas):
  aspect circle r≈85  → 181
  zodiac outer / tick inner r≈142 → 302
  bold outer ring r≈155 → 330
  exterior planets peaking r≈195 → 415

Ring stack (center → out):
  aspect web → narrow house-number band → zodiac band (element-colored glyphs)
  → 1° graduated ruler → bold outer ring → exterior planets with colored
  glyphs, matching leader lines, and degree′ labels.

Orientation: Ascendant fixed at left (9 o'clock), zodiac counter-clockwise,
house 1 below the AC.
"""

from dataclasses import dataclass
from math import cos, sin, radians
from typing import List, Tuple

from app.models.schemas import Aspect, ChartPayload, HouseCusp, PlanetPosition


@dataclass
class SVGConfig:
    """Radii measured from Astrotheme reference, scaled to outer ring = 330."""

    width: int = 1000
    height: int = 1000
    center_x: float = 500.0
    center_y: float = 500.0

    # Wheel (measured 85 / 142 / 155 on 510px ref → ×330/155)
    aspect_radius: float = 181.0
    house_num_radius: float = 190.0   # mid of narrow house band
    zodiac_inner_radius: float = 200.0
    zodiac_outer_radius: float = 302.0
    tick_outer_radius: float = 322.0
    outer_radius: float = 330.0

    # Exterior planets (measured peak ~195, alt ~220 on 510px ref)
    planet_radius: float = 392.0
    planet_alt_radius: float = 438.0
    degree_label_offset: float = 42.0
    angle_label_radius: float = 400.0

    # Glyph sizes (zodiac fills band; planets ~65% of sign size — Astrotheme)
    sign_glyph_size: int = 68
    planet_glyph_size: int = 44
    degree_size: int = 22
    minute_size: int = 15
    house_num_size: int = 14

    aspect_line_opacity: float = 0.92
    min_planet_gap_deg: float = 7.5


SIGN_COLORS = {
    "aries": "#E23B2E",
    "leo": "#E23B2E",
    "sagittarius": "#E23B2E",
    "taurus": "#8B8000",
    "virgo": "#8B8000",
    "capricorn": "#8B8000",
    "gemini": "#0E9E97",
    "libra": "#0E9E97",
    "aquarius": "#0E9E97",
    "cancer": "#1E6FD9",
    "scorpio": "#1E6FD9",
    "pisces": "#1E6FD9",
}

PLANET_COLORS = {
    "sun": "#F2A007",
    "moon": "#C9A227",
    "mercury": "#8E44AD",
    "venus": "#E86AA6",
    "mars": "#E23B2E",
    "jupiter": "#2EB8B0",
    "saturn": "#A0522D",
    "uranus": "#8B1A1A",
    "neptune": "#0E9E97",
    "pluto": "#9C2C13",
    "true_node": "#555555",
    "mean_node": "#555555",
    "north_node": "#555555",
    "south_node": "#555555",
    "chiron": "#888888",
    "lilith": "#444444",
}

INK = "#1A1A1A"
RULER_TICK = "#222222"
FONT_STACK = (
    '"Segoe UI Symbol","Noto Sans Symbols 2","Noto Sans Symbols",'
    '"DejaVu Sans",Arial,sans-serif'
)


class NatalChartSVGRenderer:
    """Astrotheme-format SVG natal chart generator."""

    # VS15 (U+FE0E) forces text presentation — prevents emoji/tofu squares
    ZODIAC_GLYPHS = [
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

    ASPECT_STYLES = {
        "opposition": {"color": "#E53935", "width": 1.7},
        "square": {"color": "#E53935", "width": 1.7},
        "trine": {"color": "#1E88E5", "width": 1.7},
        "sextile": {"color": "#1E88E5", "width": 1.35},
        "conjunction": {"color": "#43A047", "width": 1.3},
    }
    WIDE_ORB_DEG = 5.0

    def __init__(self, config: SVGConfig = None):
        self.config = config or SVGConfig()
        self.svg_lines: List[str] = []
        self.asc: float = 0.0

    # ------------------------------------------------------------------ #
    # Geometry: ASC at left, longitude increases counter-clockwise
    # ------------------------------------------------------------------ #

    def lon_to_point(self, lon: float, radius: float) -> Tuple[float, float]:
        theta = radians(self.asc - lon)
        x = self.config.center_x - radius * cos(theta)
        y = self.config.center_y - radius * sin(theta)
        return x, y

    @staticmethod
    def norm360(deg: float) -> float:
        n = deg % 360.0
        return n + 360.0 if n < 0 else n

    def mid_longitude(self, a: float, b: float) -> float:
        span = self.norm360(b - a)
        if span == 0:
            span = 30.0
        return self.norm360(a + span / 2.0)

    def spread_longitudes(
        self, bodies: List[Tuple[str, float]], min_gap: float
    ) -> List[Tuple[str, float, float]]:
        items = sorted(
            [(pid, self.norm360(lon)) for pid, lon in bodies], key=lambda t: t[1]
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

    # ------------------------------------------------------------------ #
    # Primitives
    # ------------------------------------------------------------------ #

    def add_line(self, x1, y1, x2, y2, stroke=INK, width=1.0, dash="", opacity=1.0):
        dash_attr = f' stroke-dasharray="{dash}"' if dash else ""
        op = f' opacity="{opacity}"' if opacity < 1.0 else ""
        self.svg_lines.append(
            f'  <line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" '
            f'stroke="{stroke}" stroke-width="{width}" stroke-linecap="round"'
            f"{dash_attr}{op} />"
        )

    def add_circle(self, cx, cy, r, fill="none", stroke=INK, width=1.0):
        self.svg_lines.append(
            f'  <circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.1f}" '
            f'fill="{fill}" stroke="{stroke}" stroke-width="{width}" />'
        )

    def add_polygon(self, points: List[Tuple[float, float]], fill=INK):
        pts = " ".join(f"{x:.1f},{y:.1f}" for x, y in points)
        self.svg_lines.append(f'  <polygon points="{pts}" fill="{fill}" />')

    def add_text(
        self,
        x,
        y,
        text,
        size=14,
        fill=INK,
        weight="normal",
        anchor="middle",
        baseline="central",
    ):
        self.svg_lines.append(
            f'  <text x="{x:.1f}" y="{y:.1f}" font-size="{size}" '
            f'text-anchor="{anchor}" dominant-baseline="{baseline}" '
            f'fill="{fill}" font-weight="{weight}">{text}</text>'
        )

    def add_degree_label(self, x, y, degrees: int, minutes: int, color: str):
        self.svg_lines.append(
            f'  <text x="{x:.1f}" y="{y:.1f}" text-anchor="middle" '
            f'dominant-baseline="central" fill="{color}">'
            f'<tspan font-size="{self.config.degree_size}" font-weight="700">'
            f"{degrees}°</tspan>"
            f'<tspan font-size="{self.config.minute_size}" font-weight="600" dx="1">'
            f"{minutes:02d}'</tspan>"
            f"</text>"
        )

    # ------------------------------------------------------------------ #
    # Layers
    # ------------------------------------------------------------------ #

    def render_rings(self):
        c = self.config
        cx, cy = c.center_x, c.center_y
        self.add_circle(cx, cy, c.aspect_radius, width=1.8)
        self.add_circle(cx, cy, c.zodiac_inner_radius, width=1.0)
        self.add_circle(cx, cy, c.zodiac_outer_radius, width=1.0)
        self.add_circle(cx, cy, c.tick_outer_radius, width=1.0)
        self.add_circle(cx, cy, c.outer_radius, width=2.8)

    def render_degree_ruler(self):
        """1° ticks between zodiac outer edge and tick-outer (Astrotheme ruler)."""
        c = self.config
        for d in range(360):
            if d % 10 == 0:
                length, w = 18.0, 1.5
            elif d % 5 == 0:
                length, w = 12.0, 1.1
            else:
                length, w = 7.0, 0.6
            x1, y1 = self.lon_to_point(d, c.tick_outer_radius - length)
            x2, y2 = self.lon_to_point(d, c.tick_outer_radius)
            self.add_line(x1, y1, x2, y2, stroke=RULER_TICK, width=w)

    def render_zodiac(self):
        c = self.config
        mid_r = (c.zodiac_inner_radius + c.zodiac_outer_radius) / 2.0
        for i, (glyph, sign) in enumerate(self.ZODIAC_GLYPHS):
            start = i * 30.0
            x1, y1 = self.lon_to_point(start, c.zodiac_inner_radius)
            x2, y2 = self.lon_to_point(start, c.zodiac_outer_radius)
            self.add_line(x1, y1, x2, y2, stroke=INK, width=1.1)

            gx, gy = self.lon_to_point(start + 15.0, mid_r)
            self.add_text(
                gx, gy, glyph,
                size=c.sign_glyph_size,
                fill=SIGN_COLORS.get(sign, INK),
                weight="bold",
            )

    def render_houses(self, houses: List[HouseCusp]):
        """Cusp spokes + small house numbers in the narrow band (Astrotheme)."""
        c = self.config
        cusps = {h.house: h.cusp for h in houses}
        for h in houses:
            angular = h.house in (1, 4, 7, 10)
            x1, y1 = self.lon_to_point(h.cusp, c.aspect_radius)
            x2, y2 = self.lon_to_point(h.cusp, c.zodiac_outer_radius)
            self.add_line(
                x1, y1, x2, y2,
                stroke=INK,
                width=2.2 if angular else 1.0,
            )
            nxt = cusps.get(h.house % 12 + 1, self.norm360(h.cusp + 30.0))
            mid = self.mid_longitude(h.cusp, nxt)
            nx, ny = self.lon_to_point(mid, c.house_num_radius)
            self.add_text(
                nx, ny, str(h.house),
                size=c.house_num_size, fill="#333333", weight="bold",
            )

    def render_axes(self, chart: ChartPayload):
        """Bold AC/DC and MC/IC axes with arrowheads (Astrotheme style)."""
        c = self.config
        for lon, label in (
            (chart.angles.asc, "AC"),
            (chart.angles.mc, "MC"),
            (chart.angles.dsc, ""),
            (chart.angles.ic, ""),
        ):
            x1, y1 = self.lon_to_point(lon, c.aspect_radius)
            x2, y2 = self.lon_to_point(lon, c.outer_radius + 10.0)
            self.add_line(x1, y1, x2, y2, stroke=INK, width=2.6)

            tip = self.lon_to_point(lon, c.outer_radius + 26.0)
            bl = self.lon_to_point(lon + 1.6, c.outer_radius + 6.0)
            br = self.lon_to_point(lon - 1.6, c.outer_radius + 6.0)
            self.add_polygon([tip, bl, br], fill=INK)

            if not label:
                continue
            sign_deg = lon % 30.0
            deg = int(sign_deg)
            minutes = int(round((sign_deg % 1) * 60)) % 60
            lx, ly = self.lon_to_point(lon, c.angle_label_radius)
            if label == "MC":
                self.add_circle(lx, ly, 24, fill="#FFFFFF", stroke=INK, width=2.0)
                self.add_text(lx, ly, "MC", size=20, weight="bold")
            else:
                self.add_text(lx, ly, "AC", size=28, weight="bold")
            dx, dy = self.lon_to_point(lon, c.angle_label_radius + 48.0)
            self.add_degree_label(dx, dy, deg, minutes, INK)

    def render_aspects(self, planets: List[PlanetPosition], aspects: List[Aspect]):
        c = self.config
        lon_by_id = {p.id: p.lon for p in planets}
        for aspect in aspects:
            if aspect.type == "conjunction":
                continue
            lon_a = lon_by_id.get(aspect.a)
            lon_b = lon_by_id.get(aspect.b)
            if lon_a is None or lon_b is None:
                continue
            x1, y1 = self.lon_to_point(lon_a, c.aspect_radius)
            x2, y2 = self.lon_to_point(lon_b, c.aspect_radius)
            style = self.ASPECT_STYLES.get(
                aspect.type, {"color": "#43A047", "width": 1.2}
            )
            dash = "5,4" if abs(aspect.orb) > self.WIDE_ORB_DEG else ""
            self.add_line(
                x1, y1, x2, y2,
                stroke=style["color"],
                width=style["width"],
                dash=dash,
                opacity=c.aspect_line_opacity,
            )

    def render_planets(self, planets: List[PlanetPosition]):
        """Exterior glyphs + color-matched leaders + degree labels."""
        c = self.config
        placed = self.spread_longitudes(
            [(p.id, p.lon) for p in planets], c.min_planet_gap_deg
        )
        by_id = {p.id: p for p in planets}

        for idx, (pid, true_lon, display_lon) in enumerate(placed):
            planet = by_id[pid]
            color = PLANET_COLORS.get(pid.lower(), INK)
            glyph = self.PLANET_GLYPHS.get(pid.lower(), "●")
            radius = c.planet_alt_radius if idx % 2 else c.planet_radius

            # Tick-mark arrow at the true longitude on the outer ring
            tip = self.lon_to_point(true_lon, c.tick_outer_radius + 1.0)
            bl = self.lon_to_point(true_lon + 1.15, c.outer_radius + 5.0)
            br = self.lon_to_point(true_lon - 1.15, c.outer_radius + 5.0)
            self.add_polygon([tip, bl, br], fill=color)

            # Color-matched leader (Astrotheme hallmark)
            ax, ay = self.lon_to_point(true_lon, c.outer_radius + 6.0)
            gx, gy = self.lon_to_point(display_lon, radius)
            # Elbow when display lon differs from true lon
            gap = min(
                self.norm360(display_lon - true_lon),
                self.norm360(true_lon - display_lon),
            )
            if gap > 1.5:
                ex, ey = self.lon_to_point(display_lon, c.outer_radius + 18.0)
                self.add_line(ax, ay, ex, ey, stroke=color, width=1.15, opacity=0.85)
                self.add_line(ex, ey, gx, gy, stroke=color, width=1.15, opacity=0.85)
            else:
                self.add_line(ax, ay, gx, gy, stroke=color, width=1.15, opacity=0.85)

            self.add_text(
                gx, gy, glyph,
                size=c.planet_glyph_size, fill=color, weight="bold",
            )
            if planet.retrograde:
                self.add_text(
                    gx + c.planet_glyph_size * 0.55,
                    gy + c.planet_glyph_size * 0.35,
                    "R", size=13, fill="#E53935", weight="bold",
                )

            deg = int(planet.sign_degree)
            minutes = int(round((planet.sign_degree % 1) * 60)) % 60
            dx, dy = self.lon_to_point(display_lon, radius + c.degree_label_offset)
            self.add_degree_label(dx, dy, deg, minutes, color)

    # ------------------------------------------------------------------ #

    def generate(self, chart: ChartPayload) -> str:
        self.svg_lines = []
        self.asc = chart.angles.asc
        c = self.config

        header = (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            f'<svg width="{c.width}" height="{c.height}" '
            f'xmlns="http://www.w3.org/2000/svg" '
            f'viewBox="0 0 {c.width} {c.height}" '
            f'data-chart-type="natal" data-format="astrotheme" '
            f'data-utc="{chart.meta.utc}">\n'
            "  <defs>\n"
            "    <style>\n"
            f"      text {{ font-family: {FONT_STACK}; }}\n"
            "      @media print {\n"
            "        svg { background: white; }\n"
            "        line, circle, polygon {\n"
            "          -webkit-print-color-adjust: exact; print-color-adjust: exact;\n"
            "        }\n"
            "      }\n"
            "    </style>\n"
            "  </defs>\n"
            f'  <rect width="{c.width}" height="{c.height}" fill="white" />\n'
        )

        self.render_rings()
        self.render_degree_ruler()
        self.render_zodiac()
        self.render_houses(chart.houses)
        self.render_aspects(chart.planets, chart.aspects)
        self.render_axes(chart)
        self.render_planets(chart.planets)

        return header + "\n".join(self.svg_lines) + "\n</svg>"
