"""
ETA range, route reliability and travel suitability (README §7.10).

Resolution order for each hospital:
  1. A routing-provider / manual estimate supplied by the backend
     (best source wins: live_traffic > map_routing > manual; newest first).
  2. Straight-line fallback (haversine × detour factor ÷ urban speed range)
     when both case and hospital locations are known.
  3. Unknown — "Route unavailable" / "Location unavailable".

No numeric "confidence %" is ever produced: only a High / Medium / Low label
derived from the SOURCE of the estimate.
"""
from __future__ import annotations

import math
from datetime import datetime
from typing import Optional

from .schemas import GeoPoint, Hospital, TravelEstimate

SOURCE_RANK = {"live_traffic": 3, "map_routing": 2, "manual": 1}
SOURCE_TEXT = {
    "live_traffic": "live traffic",
    "map_routing": "map routing · live traffic unavailable",
    "manual": "manually entered estimate",
    "straight_line_estimate": "straight-line estimate · no routing service",
}
ESTIMATE_STALE_MINUTES = 15
_DOWNGRADE = {"High": "Medium", "Medium": "Low", "Low": "Low"}


def haversine_km(a: GeoPoint, b: GeoPoint) -> float:
    r = 6371.0088
    p1, p2 = math.radians(a.lat), math.radians(b.lat)
    dp, dl = p2 - p1, math.radians(b.lng - a.lng)
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


def resolve_eta(
    hospital: Hospital,
    case_location: Optional[GeoPoint],
    estimates: list[TravelEstimate],
    now: datetime,
    cfg: dict,
) -> dict:
    t = cfg["travel"]
    from .config import ETA_RELIABILITY_BY_SOURCE

    mine = [e for e in estimates if e.hospitalId == hospital.hospitalId]
    if mine:
        e = sorted(
            mine,
            key=lambda x: (SOURCE_RANK[x.source], x.estimatedAt.timestamp() if x.estimatedAt else 0),
            reverse=True,
        )[0]
        factor = {
            "live_traffic": t["liveTrafficRangeFactor"],
            "map_routing": t["noTrafficRangeFactor"],
            "manual": t["manualRangeFactor"],
        }[e.source]
        if e.etaMinMinutes is not None and e.etaMaxMinutes is not None:
            lo, hi = e.etaMinMinutes, e.etaMaxMinutes
        else:
            lo, hi = e.etaMinutes, e.etaMinutes * factor
        reliability = ETA_RELIABILITY_BY_SOURCE[e.source]
        notes = []
        if e.estimatedAt is not None and (now - e.estimatedAt).total_seconds() / 60 > ESTIMATE_STALE_MINUTES:
            reliability = _DOWNGRADE[reliability]
            notes.append(f"Estimate older than {ESTIMATE_STALE_MINUTES} min — refresh route")
        return _pack(lo, hi, e.source, reliability, notes, e.estimatedAt)

    if case_location is None or hospital.location is None:
        reason = "Location unavailable" if case_location is None else "Hospital location unavailable"
        return {
            "known": False, "minMinutes": None, "maxMinutes": None, "source": None,
            "reliability": "Unknown", "label": f"Estimated travel: unknown · {reason}",
            "notes": [reason], "distanceKm": None,
        }

    d_road = haversine_km(case_location, hospital.location) * t["roadDetourFactor"]
    lo = t["dispatchOverheadMinutes"] + d_road / t["fallbackSpeedKmhFast"] * 60
    hi = t["dispatchOverheadMinutes"] + d_road / t["fallbackSpeedKmhSlow"] * 60
    out = _pack(lo, hi, "straight_line_estimate", ETA_RELIABILITY_BY_SOURCE["straight_line_estimate"],
                ["No routing service — range derived from straight-line distance"], None)
    out["distanceKm"] = round(d_road, 2)
    return out


def _pack(lo, hi, source, reliability, notes, estimated_at) -> dict:
    lo_r, hi_r = int(math.floor(lo)), int(math.ceil(hi))
    if hi_r == lo_r:
        hi_r = lo_r + 1
    return {
        "known": True,
        "minMinutes": round(lo, 1),
        "maxMinutes": round(hi, 1),
        "source": source,
        "reliability": reliability,
        "label": f"Estimated travel: {lo_r}–{hi_r} min · {SOURCE_TEXT[source]}",
        "notes": notes,
        "estimatedAt": estimated_at.isoformat() if estimated_at else None,
        "distanceKm": None,
    }


def travel_suitability(eta: dict, cfg: dict) -> Optional[float]:
    """0–100 from the CONSERVATIVE upper bound of the ETA range. None if unknown."""
    if not eta["known"]:
        return None
    t = cfg["travel"]
    best, worst = t["bestMinutes"], t["worstMinutes"]
    x = eta["maxMinutes"]
    if x <= best:
        return 100.0
    if x >= worst:
        return 0.0
    return 100.0 * (worst - x) / (worst - best)
