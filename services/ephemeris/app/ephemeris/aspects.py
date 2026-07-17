from __future__ import annotations

from app.ephemeris.constants import MAJOR_ASPECTS
from app.models.schemas import Aspect, PlanetPosition


def _norm360(deg: float) -> float:
    return deg % 360.0


def angular_distance(a: float, b: float) -> float:
    """Smallest arc between two longitudes (0–180)."""
    d = abs(_norm360(a) - _norm360(b)) % 360.0
    return d if d <= 180.0 else 360.0 - d


def compute_aspects(planets: list[PlanetPosition]) -> list[Aspect]:
    aspects: list[Aspect] = []
    for i, pa in enumerate(planets):
        for pb in planets[i + 1 :]:
            # Skip luminaries vs same? No — all pairs among catalog bodies.
            sep = angular_distance(pa.lon, pb.lon)
            for name, exact, orb_limit in MAJOR_ASPECTS:
                orb = abs(sep - exact)
                if orb <= orb_limit:
                    closing = _is_applying(pa, pb, exact)
                    aspects.append(
                        Aspect(
                            a=pa.id,
                            b=pb.id,
                            type=name,  # type: ignore[arg-type]
                            angle=round(exact, 4),
                            orb=round(orb, 4),
                            applying=closing,
                        )
                    )
                    break
    aspects.sort(key=lambda x: (x.orb, x.a, x.b))
    return aspects


def _is_applying(pa: PlanetPosition, pb: PlanetPosition, exact: float) -> bool:
    """Heuristic: if relative speed reduces distance-to-exact, aspect is applying."""
    future_a = _norm360(pa.lon + pa.speed / 24.0)  # ~1 hour
    future_b = _norm360(pb.lon + pb.speed / 24.0)
    now_dist = abs(angular_distance(pa.lon, pb.lon) - exact)
    fut_dist = abs(angular_distance(future_a, future_b) - exact)
    return fut_dist < now_dist
