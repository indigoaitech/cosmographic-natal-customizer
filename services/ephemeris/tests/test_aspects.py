from __future__ import annotations

"""Lightweight accuracy tests for ephemeris helpers (no network)."""

from app.ephemeris.aspects import angular_distance


def test_angular_distance_opposition() -> None:
    assert angular_distance(0.0, 180.0) == 180.0


def test_angular_distance_wrap() -> None:
    assert abs(angular_distance(359.0, 1.0) - 2.0) < 1e-9


def test_angular_distance_square() -> None:
    assert angular_distance(10.0, 100.0) == 90.0
