"""
Static placement copy for Cosmographic natal summaries.

Keys are resolved at import time into flat lookup maps so the natal-chart
endpoint can attach short, objective blurbs without LLM calls.
"""

from __future__ import annotations

SIGNS: tuple[str, ...] = (
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

# Planet id → display label used in customer-facing rows
PLANET_LABELS: dict[str, str] = {
    "sun": "Sun",
    "moon": "Moon",
    "mercury": "Mercury",
    "venus": "Venus",
    "mars": "Mars",
    "jupiter": "Jupiter",
    "saturn": "Saturn",
    "uranus": "Uranus",
    "neptune": "Neptune",
    "pluto": "Pluto",
    "true_node": "North Node",
    "chiron": "Chiron",
}

# Core sign tone (objective, concise)
_SIGN_TONE: dict[str, str] = {
    "Aries": "direct, initiating, and action-first",
    "Taurus": "steady, sensory, and value-driven",
    "Gemini": "curious, adaptable, and communication-led",
    "Cancer": "protective, intuitive, and emotionally bonded",
    "Leo": "expressive, warm, and recognition-seeking",
    "Virgo": "precise, practical, and improvement-oriented",
    "Libra": "relational, balancing, and aesthetic-minded",
    "Scorpio": "intense, focused, and transformation-ready",
    "Sagittarius": "expansive, candid, and meaning-seeking",
    "Capricorn": "disciplined, ambitious, and structure-building",
    "Aquarius": "independent, inventive, and future-facing",
    "Pisces": "imaginative, empathic, and boundary-fluid",
}

# What each body represents in a natal chart
_PLANET_FOCUS: dict[str, str] = {
    "sun": "core identity and vitality",
    "moon": "emotional needs and instinctive comfort",
    "mercury": "thinking style and communication",
    "venus": "attraction, taste, and how you relate",
    "mars": "drive, assertion, and conflict style",
    "jupiter": "growth, optimism, and opportunity",
    "saturn": "responsibility, limits, and mastery",
    "uranus": "disruption, originality, and freedom",
    "neptune": "ideals, imagination, and sensitivity",
    "pluto": "depth, power dynamics, and renewal",
    "true_node": "growth direction and life path pull",
    "chiron": "healing theme and teachable wound",
}

# House life areas (cusp sign colors the approach to that area)
_HOUSE_FOCUS: dict[int, str] = {
    1: "self-presentation and first impressions",
    2: "resources, money habits, and self-worth",
    3: "learning, siblings, and everyday exchange",
    4: "home, roots, and private foundations",
    5: "creativity, pleasure, and self-expression",
    6: "work rhythms, health habits, and service",
    7: "partnerships and one-to-one bonds",
    8: "shared assets, intimacy, and deep change",
    9: "beliefs, travel, and higher learning",
    10: "career, reputation, and public role",
    11: "community, networks, and long-range aims",
    12: "solitude, rest, and unseen patterns",
}

_PLANET_IN_HOUSE_VERB: dict[str, str] = {
    "sun": "shines through",
    "moon": "finds comfort through",
    "mercury": "processes life through",
    "venus": "seeks harmony through",
    "mars": "asserts energy through",
    "jupiter": "expands meaning through",
    "saturn": "builds maturity through",
    "uranus": "awakens change through",
    "neptune": "dreams and dissolves through",
    "pluto": "transforms intensity through",
    "true_node": "grows by leaning into",
    "chiron": "heals and teaches through",
}


def _planet_in_sign_summary(planet_id: str, sign: str) -> str:
    focus = _PLANET_FOCUS.get(planet_id, "this placement")
    tone = _SIGN_TONE.get(sign, "distinctive")
    label = PLANET_LABELS.get(planet_id, planet_id.title())
    return f"Your {label} in {sign} shapes {focus} in a {tone} way."


def _house_in_sign_summary(house: int, sign: str) -> str:
    focus = _HOUSE_FOCUS.get(house, "this life area")
    tone = _SIGN_TONE.get(sign, "distinctive")
    ordinal = _ordinal(house)
    return f"Your {ordinal} House in {sign} approaches {focus} with a {tone} style."


def _planet_in_house_summary(planet_id: str, house: int) -> str:
    label = PLANET_LABELS.get(planet_id, planet_id.title())
    verb = _PLANET_IN_HOUSE_VERB.get(planet_id, "expresses through")
    focus = _HOUSE_FOCUS.get(house, "this life area")
    ordinal = _ordinal(house)
    return f"Your {label} in the {ordinal} House {verb} {focus}."


def _ordinal(n: int) -> str:
    if 10 <= n % 100 <= 20:
        suffix = "th"
    else:
        suffix = {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")
    return f"{n}{suffix}"


# Precomputed static lookup maps (lightweight, O(1) at request time)
PLANET_IN_SIGN: dict[tuple[str, str], str] = {
    (pid, sign): _planet_in_sign_summary(pid, sign)
    for pid in PLANET_LABELS
    for sign in SIGNS
}

HOUSE_IN_SIGN: dict[tuple[int, str], str] = {
    (house, sign): _house_in_sign_summary(house, sign)
    for house in range(1, 13)
    for sign in SIGNS
}

PLANET_IN_HOUSE: dict[tuple[str, int], str] = {
    (pid, house): _planet_in_house_summary(pid, house)
    for pid in PLANET_LABELS
    for house in range(1, 13)
}

# Curated high-conversion overrides (more specific, still objective)
_PLANET_IN_SIGN_OVERRIDES: dict[tuple[str, str], str] = {
    ("sun", "Capricorn"): (
        "Sun in Capricorn favors earned respect, long-range goals, and a calm "
        "drive to turn effort into lasting results."
    ),
    ("sun", "Leo"): (
        "Sun in Leo highlights confident self-expression, creative pride, and a "
        "need to be seen for what you uniquely offer."
    ),
    ("moon", "Cancer"): (
        "Moon in Cancer seeks emotional safety through care, memory, and close "
        "bonds that feel like home."
    ),
    ("moon", "Capricorn"): (
        "Moon in Capricorn steadies feelings with practicality—comfort comes from "
        "competence, reliability, and clear boundaries."
    ),
    ("venus", "Libra"): (
        "Venus in Libra is drawn to balance, beauty, and partnerships that feel "
        "fair, graceful, and mutually affirming."
    ),
    ("mars", "Aries"): (
        "Mars in Aries acts fast and straight—motivation spikes when you can "
        "initiate, compete, and own the first move."
    ),
    ("mercury", "Gemini"): (
        "Mercury in Gemini thrives on variety, quick links between ideas, and "
        "conversations that keep the mind moving."
    ),
    ("jupiter", "Sagittarius"): (
        "Jupiter in Sagittarius expands through honest exploration—belief, travel, "
        "and big-picture truth feel energizing."
    ),
    ("saturn", "Capricorn"): (
        "Saturn in Capricorn strengthens ambition with patience—mastery grows "
        "through structure, duty, and consistent progress."
    ),
}

_HOUSE_IN_SIGN_OVERRIDES: dict[tuple[int, str], str] = {
    (1, "Aries"): (
        "1st House in Aries gives a bold first impression—people meet your initiative, "
        "candor, and ready-to-start presence."
    ),
    (1, "Libra"): (
        "1st House in Libra softens your approach with charm and diplomacy—you "
        "often lead by relating and refining the vibe."
    ),
    (7, "Libra"): (
        "7th House in Libra emphasizes partnership as a craft—fairness, aesthetics, "
        "and mutual regard shape committed bonds."
    ),
    (10, "Capricorn"): (
        "10th House in Capricorn aims your public path toward authority, craft, and "
        "a reputation built on dependable achievement."
    ),
    (4, "Cancer"): (
        "4th House in Cancer roots private life in emotional belonging—home is where "
        "nurture, family memory, and safety gather."
    ),
}


def lookup_planet_in_sign(planet_id: str, sign: str) -> str:
    key = (planet_id, sign)
    return _PLANET_IN_SIGN_OVERRIDES.get(key) or PLANET_IN_SIGN.get(
        key,
        f"{PLANET_LABELS.get(planet_id, planet_id)} in {sign} marks a distinctive life theme.",
    )


def lookup_house_in_sign(house: int, sign: str) -> str:
    key = (house, sign)
    return _HOUSE_IN_SIGN_OVERRIDES.get(key) or HOUSE_IN_SIGN.get(
        key,
        f"House {house} in {sign} colors this life area with a clear stylistic signature.",
    )


def lookup_planet_in_house(planet_id: str, house: int) -> str:
    key = (planet_id, house)
    return PLANET_IN_HOUSE.get(
        key,
        f"{PLANET_LABELS.get(planet_id, planet_id)} in House {house} highlights a focused life arena.",
    )
