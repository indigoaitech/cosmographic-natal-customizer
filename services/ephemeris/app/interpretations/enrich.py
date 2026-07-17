from __future__ import annotations

from app.interpretations.dictionary import (
    PLANET_LABELS,
    lookup_house_in_sign,
    lookup_planet_in_house,
    lookup_planet_in_sign,
)
from app.models.schemas import (
    ChartPayload,
    HouseCusp,
    InterpretationRow,
    PlanetPosition,
)


def build_interpretations(
    planets: list[PlanetPosition],
    houses: list[HouseCusp],
) -> list[InterpretationRow]:
    """Attach conversion-friendly placement summaries for the customizer table."""
    rows: list[InterpretationRow] = []

    # Priority order: luminaries + personal planets first, then social/outer
    priority = [
        "sun",
        "moon",
        "mercury",
        "venus",
        "mars",
        "jupiter",
        "saturn",
        "uranus",
        "neptune",
        "pluto",
        "true_node",
        "chiron",
    ]
    by_id = {p.id: p for p in planets}

    for pid in priority:
        p = by_id.get(pid)
        if not p:
            continue
        label = PLANET_LABELS.get(p.id, p.name)
        rows.append(
            InterpretationRow(
                kind="planet_sign",
                key=f"{p.id}|{p.sign}",
                label=f"{label} in {p.sign}",
                summary=lookup_planet_in_sign(p.id, p.sign),
            )
        )
        if p.house is not None:
            rows.append(
                InterpretationRow(
                    kind="planet_house",
                    key=f"{p.id}|H{p.house}",
                    label=f"{label} in {p.house}H",
                    summary=lookup_planet_in_house(p.id, p.house),
                )
            )

    # Angular houses first for purchase-page impact, then the rest
    house_order = [1, 10, 7, 4, 2, 3, 5, 6, 8, 9, 11, 12]
    house_map = {h.house: h for h in houses}
    for num in house_order:
        h = house_map.get(num)
        if not h:
            continue
        ordinal = {1: "1st", 2: "2nd", 3: "3rd"}.get(num, f"{num}th")
        rows.append(
            InterpretationRow(
                kind="house_sign",
                key=f"H{h.house}|{h.sign}",
                label=f"{ordinal} House in {h.sign}",
                summary=lookup_house_in_sign(h.house, h.sign),
            )
        )

    return rows


def enrich_chart(payload: ChartPayload) -> ChartPayload:
    payload.interpretations = build_interpretations(payload.planets, payload.houses)
    return payload
