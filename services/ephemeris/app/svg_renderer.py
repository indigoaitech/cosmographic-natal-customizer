"""
Astrotheme-format SVG natal chart renderer.

Reproduces the classic Astrotheme wheel layout:
  center aspect web → narrow house-number band → zodiac band (element-colored
  glyphs) → graduated 1° degree ruler → bold outer ring → exterior planets with
  colored glyphs, degree labels, pointer arrows. Ascendant fixed at left
  (9 o'clock), zodiac running counter-clockwise.
"""

from dataclasses import dataclass
from math import cos, sin, radians
from typing import List, Tuple

from app.models.schemas import Aspect, ChartPayload, HouseCusp, PlanetPosition


@dataclass
class SVGConfig:
    """Radii follow the Astrotheme reference proportions (outer ring = 330)."""

    width: int = 1000
    height: int = 1000
    center_x: float = 500.0
    center_y: float = 500.0

    aspect_radius: float = 162.0        # center aspect circle
    house_num_radius: float = 176.0     # house numbers inside narrow band
    zodiac_inner_radius: float = 190.0  # house band outer / zodiac inner
    zodiac_outer_radius: float = 289.0  # zodiac band outer / ruler inner
    tick_outer_radius: float = 322.0    # graduated ruler outer
    outer_radius: float = 330.0         # bold outer boundary ring

    planet_radius: float = 375.0        # exterior planet glyphs
    planet_alt_radius: float = 424.0    # staggered row for crowded areas
    degree_label_offset: float = 46.0   # radial offset glyph → degree text
    angle_label_radius: float = 398.0   # AC / MC markers

    sign_glyph_size: int = 56
    planet_glyph_size: int = 40
    degree_size: int = 20
    minute_size: int = 15
    house_num_size: int = 15

    aspect_line_opacity: float = 0.9
    min_planet_gap_deg: float = 8.0


# Element color scheme (Astrotheme): fire red, earth olive, air teal, water blue
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
    "jupiter": "#E8862D",
    "saturn": "#A0522D",
    "uranus": "#8B1A1A",
    "neptune": "#0E9E97",
    "pluto": "#9C2C13",
    "true_node": "#555555",
    "mean_node": "#555555",
    "north_node": "#555555",
    "south_node": "#555555",
    "chiron": "#777777",
    "lilith": "#444444",
}

INK = "#1A1A1A"
RULER_TICK = "#333333"

FONT_STACK = '"Segoe UI Symbol","Noto Sans Symbols 2","Noto Sans Symbols","Segoe UI",Arial,sans-serif'


class NatalChartSVGRenderer:
    """Astrotheme-format SVG natal chart generator."""

    # "&#xFE0E;" forces text presentation (prevents emoji rendering)
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

    # Astrotheme aspect convention: red = hard, blue = soft; dashed = wide orb
    ASPECT_STYLES = {
        "opposition": {"color": "#E53935", "width": 1.8},
        "square": {"color": "#E53935", "width": 1.8},
        "trine": {"color": "#1E88E5", "width": 1.8},
        "sextile": {"color": "#1E88E5", "width": 1.4},
        "conjunction": {"color": "#3BA13B", "width": 1.4},
    }
    WIDE_ORB_DEG = 5.0

    def __init__(self, config: SVGConfig = None):
        self.config = config or SVGConfig()
        self.svg_lines: List[str] = []
        self.asc: float = 0.0

    # ------------------------------------------------------------------ #
    # Geometry: ASC fixed at left, zodiac counter-clockwise
    # ------------------------------------------------------------------ #

    def lon_to_point(self, lon: float, radius: float) -> Tuple[float, float]:
        """ASC at left; increasing longitude runs counter-clockwise
        (house 1 below the AC, traditional wheel orientation)."""
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
        """Fan overlapping bodies apart. Returns (id, true_lon, display_lon)."""
        items = sorted(
            [(pid, self.norm360(lon)) for pid, lon in bodies], key=lambda t: t[1]
        )
        n = len(items)
        if n == 0:
            return []
        display = [lon for _, lon in items]
        gap = min(min_gap, 350.0 / n)

        for _ in range(14):
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

        return [
            (items[i][0], items[i][1], display[i]) for i in range(n)
        ]

    # ------------------------------------------------------------------ #
    # SVG primitives
    # ------------------------------------------------------------------ #

    def add_line(self, x1, y1, x2, y2, stroke=INK, width=1.0, dash="", opacity=1.0):
        dash_attr = f' stroke-dasharray="{dash}"' if dash else ""
        op = f' opacity="{opacity}"' if opacity < 1.0 else ""
        self.svg_lines.append(
            f'  <line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" '
            f'stroke="{stroke}" stroke-width="{width}"{dash_attr}{op} />'
        )

    def add_circle(self, cx, cy, r, fill="none", stroke=INK, width=1.0, dash=""):
        dash_attr = f' stroke-dasharray="{dash}"' if dash else ""
        self.svg_lines.append(
            f'  <circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.1f}" '
            f'fill="{fill}" stroke="{stroke}" stroke-width="{width}"{dash_attr} />'
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

    def add_degree_label(
        self, x, y, degrees: int, minutes: int, color: str
    ):
        """Degree number with smaller minutes, e.g. 17°28'."""
        self.svg_lines.append(
            f'  <text x="{x:.1f}" y="{y:.1f}" text-anchor="middle" '
            f'dominant-baseline="central" fill="{color}">'
            f'<tspan font-size="{self.config.degree_size}" font-weight="700">{degrees}°</tspan>'
            f'<tspan font-size="{self.config.minute_size}" font-weight="600" dx="1">{minutes:02d}\'</tspan>'
            f"</text>"
        )

    # ------------------------------------------------------------------ #
    # Chart layers
    # ------------------------------------------------------------------ #

    def render_rings(self):
        c = self.config
        cx, cy = c.center_x, c.center_y
        self.add_circle(cx, cy, c.aspect_radius, width=2.0)
        self.add_circle(cx, cy, c.zodiac_inner_radius, width=1.2)
        self.add_circle(cx, cy, c.zodiac_outer_radius, width=1.2)
        self.add_circle(cx, cy, c.tick_outer_radius, width=1.2)
        self.add_circle(cx, cy, c.outer_radius, width=3.0)

    def render_degree_ruler(self):
        """1° graduated ruler between zodiac outer edge and ruler outer ring."""
        c = self.config
        for d in range(360):
            if d % 10 == 0:
                length, w = 24.0, 1.6
            elif d % 5 == 0:
                length, w = 16.0, 1.2
            else:
                length, w = 9.0, 0.7
            x1, y1 = self.lon_to_point(d, c.tick_outer_radius - length)
            x2, y2 = self.lon_to_point(d, c.tick_outer_radius)
            self.add_line(x1, y1, x2, y2, stroke=RULER_TICK, width=w)

    def render_zodiac(self):
        c = self.config
        mid_r = (c.zodiac_inner_radius + c.zodiac_outer_radius) / 2.0
        for i, (glyph, sign) in enumerate(self.ZODIAC_GLYPHS):
            start = i * 30.0
            # Sign boundary dividers across the zodiac band
            x1, y1 = self.lon_to_point(start, c.zodiac_inner_radius)
            x2, y2 = self.lon_to_point(start, c.zodiac_outer_radius)
            self.add_line(x1, y1, x2, y2, stroke=INK, width=1.2)

            gx, gy = self.lon_to_point(start + 15.0, mid_r)
            color = SIGN_COLORS.get(sign, INK)
            self.add_text(
                gx, gy, glyph, size=c.sign_glyph_size, fill=color, weight="bold"
            )

    def render_houses(self, houses: List[HouseCusp]):
        """Cusp lines through house band + zodiac band, small numbers inside."""
        c = self.config
        cusps = {h.house: h.cusp for h in houses}
        for h in houses:
            angular = h.house in (1, 4, 7, 10)
            x1, y1 = self.lon_to_point(h.cusp, c.aspect_radius)
            x2, y2 = self.lon_to_point(h.cusp, c.zodiac_outer_radius)
            self.add_line(
                x1, y1, x2, y2,
                stroke=INK,
                width=2.4 if angular else 1.1,
            )
            # House number centered in its house, inside the narrow band
            nxt = cusps.get(h.house % 12 + 1, self.norm360(h.cusp + 30.0))
            mid = self.mid_longitude(h.cusp, nxt)
            nx, ny = self.lon_to_point(mid, c.house_num_radius)
            self.add_text(
                nx, ny, str(h.house),
                size=c.house_num_size, fill="#333333", weight="bold",
            )

    def render_axes(self, chart: ChartPayload):
        """Bold AC/MC/DC/IC axes with arrowheads outside the wheel."""
        c = self.config
        for lon, label in (
            (chart.angles.asc, "AC"),
            (chart.angles.mc, "MC"),
            (chart.angles.dsc, ""),
            (chart.angles.ic, ""),
        ):
            x1, y1 = self.lon_to_point(lon, c.aspect_radius)
            x2, y2 = self.lon_to_point(lon, c.outer_radius + 14.0)
            self.add_line(x1, y1, x2, y2, stroke=INK, width=3.0)
            # Arrowhead pointing outward
            tip = self.lon_to_point(lon, c.outer_radius + 30.0)
            base_l = self.lon_to_point(lon + 1.8, c.outer_radius + 8.0)
            base_r = self.lon_to_point(lon - 1.8, c.outer_radius + 8.0)
            self.add_polygon([tip, base_l, base_r], fill=INK)

            if not label:
                continue
            sign_deg = lon % 30.0
            deg, minutes = int(sign_deg), int(round((sign_deg % 1) * 60)) % 60
            lx, ly = self.lon_to_point(lon, c.angle_label_radius)
            if label == "MC":
                self.add_circle(lx, ly, 26, fill="#FFFFFF", stroke=INK, width=2.2)
                self.add_text(lx, ly, "MC", size=22, weight="bold")
            else:
                self.add_text(lx, ly, "AC", size=30, weight="bold")
            dx, dy = self.lon_to_point(lon, c.angle_label_radius + 52.0)
            self.add_degree_label(dx, dy, deg, minutes, INK)

    def render_aspects(self, planets: List[PlanetPosition], aspects: List[Aspect]):
        """Aspect web inside the center circle (true longitudes)."""
        c = self.config
        lon_by_id = {p.id: p.lon for p in planets}
        for aspect in aspects:
            if aspect.type == "conjunction":
                continue  # Astrotheme does not draw conjunction chords
            lon_a = lon_by_id.get(aspect.a)
            lon_b = lon_by_id.get(aspect.b)
            if lon_a is None or lon_b is None:
                continue
            x1, y1 = self.lon_to_point(lon_a, c.aspect_radius)
            x2, y2 = self.lon_to_point(lon_b, c.aspect_radius)
            style = self.ASPECT_STYLES.get(
                aspect.type, {"color": "#3BA13B", "width": 1.2}
            )
            dash = "5,5" if abs(aspect.orb) > self.WIDE_ORB_DEG else ""
            self.add_line(
                x1, y1, x2, y2,
                stroke=style["color"],
                width=style["width"],
                dash=dash,
                opacity=c.aspect_line_opacity,
            )

    def render_planets(self, planets: List[PlanetPosition]):
        """Exterior colored glyphs + degree labels + pointer arrows on the ring."""
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

            # Pointer arrow on the outer ring at the true longitude
            tip = self.lon_to_point(true_lon, c.tick_outer_radius + 2.0)
            base_l = self.lon_to_point(true_lon + 1.3, c.outer_radius + 6.0)
            base_r = self.lon_to_point(true_lon - 1.3, c.outer_radius + 6.0)
            self.add_polygon([tip, base_l, base_r], fill=INK)

            # Thin leader from ring to glyph
            lx1, ly1 = self.lon_to_point(true_lon, c.outer_radius + 8.0)
            gx, gy = self.lon_to_point(display_lon, radius)
            self.add_line(lx1, ly1, gx, gy, stroke="#999999", width=1.0)

            self.add_text(
                gx, gy, glyph, size=c.planet_glyph_size, fill=color, weight="bold"
            )

            if planet.retrograde:
                self.add_text(
                    gx + c.planet_glyph_size * 0.55,
                    gy + c.planet_glyph_size * 0.4,
                    "R",
                    size=14,
                    fill="#E53935",
                    weight="bold",
                )

            deg = int(planet.sign_degree)
            minutes = int(round((planet.sign_degree % 1) * 60)) % 60
            dx, dy = self.lon_to_point(display_lon, radius + c.degree_label_offset)
            self.add_degree_label(dx, dy, deg, minutes, color)

    # ------------------------------------------------------------------ #

    def generate(self, chart: ChartPayload) -> str:
        """Generate the complete Astrotheme-format SVG natal chart."""
        self.svg_lines = []
        self.asc = chart.angles.asc

        c = self.config
        svg_start = (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            f'<svg width="{c.width}" height="{c.height}" '
            f'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {c.width} {c.height}" '
            f'data-chart-type="natal" data-utc="{chart.meta.utc}">\n'
            "  <defs>\n"
            "    <style>\n"
            f"      text {{ font-family: {FONT_STACK}; }}\n"
            "      @media print {\n"
            "        svg { background: white; }\n"
            "        line, circle, path, polygon { -webkit-print-color-adjust: exact; print-color-adjust: exact; }\n"
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

        return svg_start + "\n".join(self.svg_lines) + "\n</svg>"
