"""Swiss Ephemeris constants, signs, and body catalog."""

from __future__ import annotations

import swisseph as swe

SIGNS = (
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
)

# id → (Swiss Ephemeris body id, display name)
PLANET_CATALOG: dict[str, tuple[int, str]] = {
    "sun": (swe.SUN, "Sun"),
    "moon": (swe.MOON, "Moon"),
    "mercury": (swe.MERCURY, "Mercury"),
    "venus": (swe.VENUS, "Venus"),
    "mars": (swe.MARS, "Mars"),
    "jupiter": (swe.JUPITER, "Jupiter"),
    "saturn": (swe.SATURN, "Saturn"),
    "uranus": (swe.URANUS, "Uranus"),
    "neptune": (swe.NEPTUNE, "Neptune"),
    "pluto": (swe.PLUTO, "Pluto"),
    "true_node": (swe.TRUE_NODE, "True Node"),
    "chiron": (swe.CHIRON, "Chiron"),
}

# Major aspects: (name, exact angle degrees, default orb)
MAJOR_ASPECTS: tuple[tuple[str, float, float], ...] = (
    ("conjunction", 0.0, 8.0),
    ("opposition", 180.0, 8.0),
    ("trine", 120.0, 6.0),
    ("square", 90.0, 6.0),
    ("sextile", 60.0, 4.0),
)

# Flags: Swiss Ephemeris + speed for retrograde detection
CALC_FLAGS = swe.FLG_SWIEPH | swe.FLG_SPEED
