"""
SVG Natal Chart Renderer
Generates print-ready SVG natal charts with zodiac wheel, planets, aspects, and houses.
"""

from dataclasses import dataclass
from math import cos, sin, pi
from typing import List, Tuple
from app.models import ChartPayload, PlanetPosition, HouseCusp, Aspect


@dataclass
class SVGConfig:
    """SVG rendering configuration."""
    width: int = 800
    height: int = 800
    outer_radius: int = 350
    inner_radius: int = 280
    center_x: int = 400
    center_y: int = 400
    planet_circle_radius: int = 250
    house_line_width: float = 1.5
    planet_symbol_size: int = 24


class NatalChartSVG:
    """Generate SVG natal charts."""

    # Zodiac signs with their symbols
    ZODIAC_SIGNS = {
        "♈": "Aries",       # 0-30
        "♉": "Taurus",      # 30-60
        "♊": "Gemini",      # 60-90
        "♋": "Cancer",      # 90-120
        "♌": "Leo",         # 120-150
        "♍": "Virgo",       # 150-180
        "♎": "Libra",       # 180-210
        "♏": "Scorpio",     # 210-240
        "♐": "Sagittarius", # 240-270
        "♑": "Capricorn",   # 270-300
        "♒": "Aquarius",    # 300-330
        "♓": "Pisces",      # 330-360
    }

    # Planet symbols
    PLANET_SYMBOLS = {
        "Sun": "☉",
        "Moon": "☽",
        "Mercury": "☿",
        "Venus": "♀",
        "Mars": "♂",
        "Jupiter": "♃",
        "Saturn": "♄",
        "Uranus": "♅",
        "Neptune": "♆",
        "Pluto": "♇",
        "Node": "☊",
        "SouthNode": "☋",
    }

    # Aspect colors and styles
    ASPECT_STYLES = {
        "conjunction": {"color": "#FF0000", "stroke_width": 2.5},      # Red
        "opposition": {"color": "#FF0000", "stroke_width": 2.5},       # Red
        "trine": {"color": "#00AA00", "stroke_width": 2},              # Green
        "square": {"color": "#0066FF", "stroke_width": 2},             # Blue
        "sextile": {"color": "#00AA00", "stroke_width": 1.5},          # Green
    }

    def __init__(self, config: SVGConfig = None):
        self.config = config or SVGConfig()
        self.svg_lines: List[str] = []

    def degree_to_radians(self, degrees: float) -> float:
        """Convert degrees (0-360, starting from East) to radians."""
        # Astrology: 0° at East, increases counter-clockwise
        # SVG: 0° at East, but we use standard math convention
        return (degrees - 90) * pi / 180

    def polar_to_cartesian(
        self, degrees: float, radius: int
    ) -> Tuple[float, float]:
        """Convert polar coords (degrees, radius) to Cartesian (x, y)."""
        rad = self.degree_to_radians(degrees)
        x = self.config.center_x + radius * cos(rad)
        y = self.config.center_y + radius * sin(rad)
        return x, y

    def add_line(self, x1: float, y1: float, x2: float, y2: float, 
                 stroke: str = "#000000", width: float = 1):
        """Add a line to SVG."""
        self.svg_lines.append(
            f'  <line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" '
            f'stroke="{stroke}" stroke-width="{width}" />'
        )

    def add_circle(self, cx: float, cy: float, r: float, 
                   fill: str = "none", stroke: str = "#000000", width: float = 1):
        """Add a circle to SVG."""
        self.svg_lines.append(
            f'  <circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.1f}" '
            f'fill="{fill}" stroke="{stroke}" stroke-width="{width}" />'
        )

    def add_text(self, x: float, y: float, text: str, size: int = 14, 
                 anchor: str = "middle", fill: str = "#000000", weight: str = "normal"):
        """Add text to SVG."""
        self.svg_lines.append(
            f'  <text x="{x:.1f}" y="{y:.1f}" font-size="{size}" '
            f'text-anchor="{anchor}" fill="{fill}" font-weight="{weight}">{text}</text>'
        )

    def add_path(self, d: str, stroke: str = "#000000", width: float = 1, fill: str = "none"):
        """Add a path to SVG."""
        self.svg_lines.append(
            f'  <path d="{d}" stroke="{stroke}" stroke-width="{width}" fill="{fill}" />'
        )

    def render_wheel_background(self):
        """Render zodiac wheel background (12 sections with signs)."""
        # Outer circle
        self.add_circle(
            self.config.center_x, self.config.center_y,
            self.config.outer_radius,
            stroke="#000000", width=2
        )
        
        # Inner circle
        self.add_circle(
            self.config.center_x, self.config.center_y,
            self.config.inner_radius,
            stroke="#000000", width=1
        )

        # Draw 12 zodiac sections
        for i in range(12):
            angle_start = i * 30
            angle_mid = angle_start + 15
            angle_end = angle_start + 30

            # Radial lines for each sign boundary
            x1, y1 = self.polar_to_cartesian(angle_start, self.config.inner_radius)
            x2, y2 = self.polar_to_cartesian(angle_start, self.config.outer_radius)
            self.add_line(x1, y1, x2, y2, stroke="#CCCCCC", width=1)

            # Zodiac sign label (outside wheel)
            label_x, label_y = self.polar_to_cartesian(angle_mid, self.config.outer_radius + 30)
            sign_symbol = list(self.ZODIAC_SIGNS.keys())[i]
            self.add_text(label_x, label_y, sign_symbol, size=18, weight="bold")

    def render_houses(self, houses: List[HouseCusp]):
        """Render house cusps as lines and labels."""
        for house in houses:
            angle = house.cusp
            x1, y1 = self.polar_to_cartesian(angle, self.config.inner_radius)
            x2, y2 = self.polar_to_cartesian(angle, self.config.outer_radius)
            
            # House line (thicker than zodiac lines)
            self.add_line(x1, y1, x2, y2, stroke="#333333", width=self.config.house_line_width)
            
            # House number label (inside wheel)
            label_x, label_y = self.polar_to_cartesian(angle, self.config.inner_radius - 20)
            self.add_text(label_x, label_y, str(house.house), size=12, fill="#666666")

    def render_planets(self, planets: List[PlanetPosition]):
        """Render planet symbols at their calculated positions."""
        for planet in planets:
            angle = planet.lon  # Longitude in degrees (0-360)
            
            # Get planet symbol
            symbol = self.PLANET_SYMBOLS.get(planet.name, "●")
            
            # Position on planet circle
            px, py = self.polar_to_cartesian(angle, self.config.planet_circle_radius)
            
            # Draw small circle for planet
            self.add_circle(px, py, 8, fill="#FFFFFF", stroke="#000000", width=1)
            
            # Add planet symbol
            self.add_text(px, py, symbol, size=self.config.planet_symbol_size)
            
            # Add retrograde indicator (R) if applicable
            if planet.retrograde:
                rx, ry = self.polar_to_cartesian(angle, self.config.planet_circle_radius + 15)
                self.add_text(rx, ry, "℞", size=10, fill="#FF0000")

    def render_aspects(self, planets: List[PlanetPosition], aspects: List[Aspect]):
        """Draw aspect lines between planets."""
        for aspect in aspects:
            # Find planet positions
            p1 = next((p for p in planets if p.id == aspect.a), None)
            p2 = next((p for p in planets if p.id == aspect.b), None)
            
            if not p1 or not p2:
                continue
            
            # Get coordinates
            x1, y1 = self.polar_to_cartesian(p1.lon, self.config.planet_circle_radius)
            x2, y2 = self.polar_to_cartesian(p2.lon, self.config.planet_circle_radius)
            
            # Get aspect style
            style = self.ASPECT_STYLES.get(aspect.type, {"color": "#999999", "stroke_width": 1})
            
            # Draw line (slightly inside to avoid overlap with planets)
            self.add_line(x1, y1, x2, y2, stroke=style["color"], width=style["stroke_width"])

    def render_metadata(self, chart: ChartPayload):
        """Add chart metadata text."""
        y_offset = 20
        
        # Title
        self.add_text(
            self.config.center_x, y_offset, 
            "Natal Chart", 
            size=16, weight="bold"
        )
        
        # Metadata
        metadata_text = (
            f"{chart.meta.placeLabel} | "
            f"UTC: {chart.meta.utc} | "
            f"House: {chart.meta.houseSystem}"
        )
        self.add_text(
            self.config.center_x, y_offset + 25,
            metadata_text,
            size=10, fill="#666666"
        )

    def generate(self, chart: ChartPayload) -> str:
        """Generate complete SVG natal chart."""
        self.svg_lines = []
        
        # SVG header
        svg_start = (
            f'<?xml version="1.0" encoding="UTF-8"?>\n'
            f'<svg width="{self.config.width}" height="{self.config.height}" '
            f'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.config.width} {self.config.height}">\n'
            f'  <style>\n'
            f'    text {{ font-family: Arial, sans-serif; }}\n'
            f'    @media print {{\n'
            f'      svg {{ background: white; }}\n'
            f'    }}\n'
            f'  </style>\n'
            f'  <rect width="{self.config.width}" height="{self.config.height}" fill="white" />\n'
        )
        
        # Render all components
        self.render_wheel_background()
        self.render_houses(chart.houses)
        self.render_aspects(chart.planets, chart.aspects)
        self.render_planets(chart.planets)
        self.render_metadata(chart)
        
        # SVG footer
        svg_end = '</svg>'
        
        return svg_start + '\n'.join(self.svg_lines) + '\n' + svg_end
