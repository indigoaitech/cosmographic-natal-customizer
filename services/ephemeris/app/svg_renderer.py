"""
Advanced SVG Natal Chart Renderer - Astrotheme-inspired styling
Generates professional, print-ready natal charts with Astrotheme visual fidelity.
"""

from dataclasses import dataclass
from math import cos, sin, pi, atan2, sqrt
from typing import List, Tuple, Dict, Optional
from app.models.schemas import ChartPayload, PlanetPosition, HouseCusp, Aspect


@dataclass
class SVGConfig:
    """SVG rendering configuration matching Astrotheme aesthetic."""
    width: int = 1000
    height: int = 1000
    center_x: int = 500
    center_y: int = 500
    outer_radius: int = 420        # Zodiac wheel outer edge
    inner_radius: int = 340        # Zodiac wheel inner edge
    planet_circle_radius: int = 290 # Where planets sit
    house_line_width: float = 2.0
    planet_symbol_size: int = 28
    aspect_line_opacity: float = 0.7
    aspect_inner_radius: int = 200  # Inner radius for aspect web


class NatalChartSVGRenderer:
    """Professional SVG natal chart generator with Astrotheme-style rendering."""

    # Zodiac sign glyphs (unicode)
    ZODIAC_GLYPHS = [
        ("♈", "Aries"),       # 0-30°
        ("♉", "Taurus"),      # 30-60°
        ("♊", "Gemini"),      # 60-90°
        ("♋", "Cancer"),      # 90-120°
        ("♌", "Leo"),         # 120-150°
        ("♍", "Virgo"),       # 150-180°
        ("♎", "Libra"),       # 180-210°
        ("♏", "Scorpio"),     # 210-240°
        ("♐", "Sagittarius"), # 240-270°
        ("♑", "Capricorn"),   # 270-300°
        ("♒", "Aquarius"),    # 300-330°
        ("♓", "Pisces"),      # 330-360°
    ]

    # Planet glyphs
    PLANET_GLYPHS = {
        "sun": "☉",
        "moon": "☽",
        "mercury": "☿",
        "venus": "♀",
        "mars": "♂",
        "jupiter": "♃",
        "saturn": "♄",
        "uranus": "♅",
        "neptune": "♆",
        "pluto": "♇",
        "north_node": "☊",
        "south_node": "☋",
    }

    # Aspect styling (Astrotheme-inspired)
    ASPECT_STYLES = {
        "conjunction": {"color": "#FF0000", "width": 2.5, "dash": ""},          # Red, solid
        "opposition": {"color": "#FF0000", "width": 2.5, "dash": ""},           # Red, solid
        "trine": {"color": "#00AA00", "width": 2.0, "dash": "5,5"},             # Green, dashed
        "square": {"color": "#0066FF", "width": 2.0, "dash": ""},               # Blue, solid
        "sextile": {"color": "#00AA00", "width": 1.5, "dash": "5,5"},           # Green, dashed
    }

    def __init__(self, config: SVGConfig = None):
        self.config = config or SVGConfig()
        self.svg_lines: List[str] = []

    def degree_to_radians(self, degrees: float) -> float:
        """Convert astrology degrees (0° East, counter-clockwise) to standard radians."""
        # In astrology: 0° is at the East (3 o'clock), increases counter-clockwise
        # In SVG: 0° is at the East, but math uses standard angle convention
        # Adjustment: subtract 90 to shift from East to North as the starting point
        return (degrees - 90) * pi / 180

    def polar_to_cartesian(
        self, degrees: float, radius: int
    ) -> Tuple[float, float]:
        """Convert polar coordinates (degrees, radius) to Cartesian (x, y)."""
        rad = self.degree_to_radians(degrees)
        x = self.config.center_x + radius * cos(rad)
        y = self.config.center_y + radius * sin(rad)
        return x, y

    def add_line(
        self,
        x1: float,
        y1: float,
        x2: float,
        y2: float,
        stroke: str = "#000000",
        width: float = 1.0,
        dash: str = "",
        opacity: float = 1.0,
    ):
        """Add a line element to SVG."""
        stroke_dasharray = f' stroke-dasharray="{dash}"' if dash else ""
        opacity_attr = f' opacity="{opacity}"' if opacity < 1.0 else ""
        self.svg_lines.append(
            f'  <line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" '
            f'stroke="{stroke}" stroke-width="{width}"{stroke_dasharray}{opacity_attr} />'
        )

    def add_circle(
        self,
        cx: float,
        cy: float,
        r: float,
        fill: str = "none",
        stroke: str = "#000000",
        width: float = 1.0,
        opacity: float = 1.0,
    ):
        """Add a circle element to SVG."""
        opacity_attr = f' opacity="{opacity}"' if opacity < 1.0 else ""
        self.svg_lines.append(
            f'  <circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.1f}" '
            f'fill="{fill}" stroke="{stroke}" stroke-width="{width}"{opacity_attr} />'
        )

    def add_text(
        self,
        x: float,
        y: float,
        text: str,
        size: int = 14,
        anchor: str = "middle",
        fill: str = "#000000",
        weight: str = "normal",
        opacity: float = 1.0,
    ):
        """Add text element to SVG."""
        opacity_attr = f' opacity="{opacity}"' if opacity < 1.0 else ""
        self.svg_lines.append(
            f'  <text x="{x:.1f}" y="{y:.1f}" font-size="{size}" '
            f'text-anchor="{anchor}" fill="{fill}" font-weight="{weight}"{opacity_attr}>{text}</text>'
        )

    def add_path(
        self,
        d: str,
        stroke: str = "#000000",
        width: float = 1.0,
        fill: str = "none",
        dash: str = "",
        opacity: float = 1.0,
    ):
        """Add a path element to SVG."""
        stroke_dasharray = f' stroke-dasharray="{dash}"' if dash else ""
        opacity_attr = f' opacity="{opacity}"' if opacity < 1.0 else ""
        self.svg_lines.append(
            f'  <path d="{d}" stroke="{stroke}" stroke-width="{width}" fill="{fill}"{stroke_dasharray}{opacity_attr} />'
        )

    def render_zodiac_wheel(self):
        """Render the 12-sign zodiac wheel with labels."""
        # Outer boundary circle
        self.add_circle(
            self.config.center_x,
            self.config.center_y,
            self.config.outer_radius,
            stroke="#1a1a1a",
            width=2.5,
        )

        # Inner boundary circle
        self.add_circle(
            self.config.center_x,
            self.config.center_y,
            self.config.inner_radius,
            stroke="#1a1a1a",
            width=2.0,
        )

        # Planet circle (dashed for reference)
        self.add_circle(
            self.config.center_x,
            self.config.center_y,
            self.config.planet_circle_radius,
            stroke="#E8E8E8",
            width=1.0,
            dash="3,3",
        )

        # Draw 12 zodiac sections with dividers and labels
        for i, (glyph, sign_name) in enumerate(self.ZODIAC_GLYPHS):
            angle_start = i * 30
            angle_mid = angle_start + 15
            angle_end = angle_start + 30

            # Radial divider lines
            x1, y1 = self.polar_to_cartesian(angle_start, self.config.inner_radius)
            x2, y2 = self.polar_to_cartesian(angle_start, self.config.outer_radius)
            self.add_line(x1, y1, x2, y2, stroke="#CCCCCC", width=1.5)

            # Zodiac sign glyph (outside wheel)
            label_x, label_y = self.polar_to_cartesian(
                angle_mid, self.config.outer_radius + 40
            )
            self.add_text(
                label_x, label_y, glyph, size=24, weight="bold", fill="#333333"
            )

            # Degree markers (small ticks every 5°)
            for deg_offset in [5, 10, 15, 20, 25]:
                tick_angle = angle_start + deg_offset
                x_inner, y_inner = self.polar_to_cartesian(
                    tick_angle, self.config.inner_radius - 8
                )
                x_outer, y_outer = self.polar_to_cartesian(
                    tick_angle, self.config.inner_radius
                )
                self.add_line(
                    x_inner, y_inner, x_outer, y_outer, stroke="#DCDCDC", width=0.8
                )

    def render_houses(self, houses: List[HouseCusp]):
        """Render house cusps as radial lines with house numbers."""
        for house in houses:
            angle = house.cusp

            # House cusp line (prominent)
            x1, y1 = self.polar_to_cartesian(angle, self.config.inner_radius)
            x2, y2 = self.polar_to_cartesian(angle, self.config.outer_radius)
            self.add_line(x1, y1, x2, y2, stroke="#333333", width=2.5)

            # House number label (inside wheel, rotated for readability)
            label_x, label_y = self.polar_to_cartesian(
                angle, self.config.inner_radius - 35
            )
            # Note: actual rotation would need transform attribute; simplified version:
            self.add_text(
                label_x, label_y, str(house.house), size=13, fill="#333333", weight="bold"
            )

    def render_aspects(self, planets: List[PlanetPosition], aspects: List[Aspect]):
        """Render aspect lines between planets (web diagram)."""
        for aspect in aspects:
            # Locate the two planets
            p1 = next((p for p in planets if p.id == aspect.a), None)
            p2 = next((p for p in planets if p.id == aspect.b), None)

            if not p1 or not p2:
                continue

            # Get planet positions on the aspect inner circle
            x1, y1 = self.polar_to_cartesian(
                p1.lon, self.config.aspect_inner_radius
            )
            x2, y2 = self.polar_to_cartesian(
                p2.lon, self.config.aspect_inner_radius
            )

            # Get aspect styling
            style = self.ASPECT_STYLES.get(
                aspect.type,
                {"color": "#999999", "width": 1.0, "dash": ""},
            )

            # Draw aspect line
            self.add_line(
                x1,
                y1,
                x2,
                y2,
                stroke=style["color"],
                width=style["width"],
                dash=style["dash"],
                opacity=self.config.aspect_line_opacity,
            )

    def render_planets(self, planets: List[PlanetPosition]):
        """Render planet symbols at their calculated longitudes."""
        # Sort planets by longitude for consistent rendering
        sorted_planets = sorted(planets, key=lambda p: p.lon)

        for planet in sorted_planets:
            angle = planet.lon

            # Get planet symbol/glyph
            planet_id = planet.id.lower()
            symbol = self.PLANET_GLYPHS.get(planet_id, "●")

            # Position on planet circle
            px, py = self.polar_to_cartesian(angle, self.config.planet_circle_radius)

            # Draw planet background circle
            self.add_circle(
                px, py, 14, fill="#FFFFFF", stroke="#333333", width=1.5
            )

            # Add planet symbol
            self.add_text(
                px,
                py,
                symbol,
                size=self.config.planet_symbol_size,
                fill="#000000",
                weight="bold",
            )

            # Retrograde indicator (small ℞ symbol)
            if planet.retrograde:
                rx, ry = self.polar_to_cartesian(
                    angle, self.config.planet_circle_radius + 22
                )
                self.add_text(rx, ry, "℞", size=10, fill="#FF3333", weight="bold")

            # Planet name and degree label (optional, for detailed charts)
            name_x, name_y = self.polar_to_cartesian(
                angle, self.config.planet_circle_radius + 50
            )
            degree_str = f"{planet.sign} {planet.sign_degree:.0f}°"
            self.add_text(
                name_x,
                name_y,
                f"{planet.name}\n{degree_str}",
                size=9,
                fill="#555555",
                anchor="middle",
            )

    def render_angles(self, chart: ChartPayload):
        """Highlight Ascendant, MC, Descendant, IC with special markers."""
        angles_config = [
            (chart.angles.asc, "ASC", "#FF6B6B"),  # Ascendant - red
            (chart.angles.mc, "MC", "#4ECDC4"),    # Midheaven - teal
            (chart.angles.dsc, "DSC", "#FF6B6B"),  # Descendant - red
            (chart.angles.ic, "IC", "#4ECDC4"),    # Imum Coeli - teal
        ]

        for angle_degree, label, color in angles_config:
            # Small marker on the planet circle
            ax, ay = self.polar_to_cartesian(angle_degree, self.config.planet_circle_radius)
            self.add_circle(ax, ay, 6, fill=color, stroke=color, width=1)

            # Label with angle marker
            label_x, label_y = self.polar_to_cartesian(
                angle_degree, self.config.planet_circle_radius - 35
            )
            self.add_text(
                label_x, label_y, label, size=10, fill=color, weight="bold"
            )

    def render_metadata(self, chart: ChartPayload):
        """Render birth data and chart metadata."""
        # Background box for metadata
        meta_y_start = self.config.height - 90
        self.add_line(0, meta_y_start, self.config.width, meta_y_start, stroke="#E0E0E0", width=1)

        # Birth info
        birth_info = f"Birth: {chart.meta.place_label} | UTC: {chart.meta.utc}"
        self.add_text(
            self.config.center_x,
            meta_y_start + 15,
            birth_info,
            size=11,
            fill="#333333",
            weight="normal",
        )

        # Coordinates and timezone
        coord_info = f"Lat: {chart.meta.lat:.4f} | Lon: {chart.meta.lon:.4f} | TZ: {chart.meta.timezone} ({chart.meta.utc_offset_hours:+.1f}h)"
        self.add_text(
            self.config.center_x,
            meta_y_start + 32,
            coord_info,
            size=10,
            fill="#666666",
        )

        # House system
        self.add_text(
            self.config.center_x,
            meta_y_start + 50,
            f"House System: {chart.meta.house_system.value}",
            size=10,
            fill="#666666",
        )

    def render_title(self):
        """Render chart title."""
        self.add_text(
            self.config.center_x,
            30,
            "Natal Chart",
            size=20,
            weight="bold",
            fill="#000000",
        )

    def generate(self, chart: ChartPayload) -> str:
        """Generate the complete SVG natal chart."""
        self.svg_lines = []

        # SVG header with styles
        svg_start = (
            f'<?xml version="1.0" encoding="UTF-8"?>\n'
            f'<svg width="{self.config.width}" height="{self.config.height}" '
            f'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.config.width} {self.config.height}">\n'
            f'  <defs>\n'
            f'    <style>\n'
            f'      text {{ font-family: "Segoe UI", Arial, sans-serif; }}\n'
            f'      @media print {{\n'
            f'        svg {{ background: white; }}\n'
            f'        line, circle, path {{ -webkit-print-color-adjust: exact; print-color-adjust: exact; }}\n'
            f'      }}\n'
            f'    </style>\n'
            f'  </defs>\n'
            f'  <!-- Background -->\n'
            f'  <rect width="{self.config.width}" height="{self.config.height}" fill="white" />\n'
        )

        # Render all chart components in order
        self.render_title()
        self.render_zodiac_wheel()
        self.render_houses(chart.houses)
        self.render_aspects(chart.planets, chart.aspects)
        self.render_planets(chart.planets)
        self.render_angles(chart)
        self.render_metadata(chart)

        # SVG footer
        svg_end = '</svg>'

        return svg_start + '\n'.join(self.svg_lines) + '\n' + svg_end
