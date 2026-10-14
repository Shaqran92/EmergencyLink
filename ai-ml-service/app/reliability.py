"""
Resource freshness, provenance and the heuristic Resource-Data Reliability score.

README §7.8 (reliability = 40% freshness + 30% confirmation + 20% completeness
+ 10% consistency) and §7.9 (freshness & provenance labels).

The reliability score is a TRANSPARENT HEURISTIC, not a probability.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from .schemas import ResourceSnapshot

FUTURE_SKEW_MINUTES = 5  # tolerate small clock skew between devices


def window_for(resource_type: str, cfg: dict) -> dict:
    return cfg["freshnessWindows"].get(resource_type, cfg["defaultFreshnessWindow"])


def age_minutes(ts: datetime, now: datetime) -> float:
    return (now - ts).total_seconds() / 60.0


def freshness_state(age: float, window: dict) -> str:
    if age <= window["freshMinutes"]:
        return "Fresh"
    if age <= window["staleMinutes"]:
        return "Stale"
    return "Expired"


def freshness_curve(age: float, window: dict) -> float:
    """Piecewise-linear 0–100: 100 @0 → 70 @fresh limit → 10 @stale limit → 0 beyond."""
    from .config import FRESH_EDGE_SCORE, STALE_EDGE_SCORE

    f, s = window["freshMinutes"], window["staleMinutes"]
    age = max(0.0, age)
    if age <= f:
        return 100.0 - (100.0 - FRESH_EDGE_SCORE) * (age / f)
    if age <= s:
        return FRESH_EDGE_SCORE - (FRESH_EDGE_SCORE - STALE_EDGE_SCORE) * ((age - f) / (s - f))
    return 0.0


def humanize_age(age: float) -> str:
    if age < 1:
        return "just now"
    if age < 60:
        return f"{int(round(age))} min ago"
    h = age / 60
    if h < 24:
        return f"{h:.1f} h ago".replace(".0 h", " h")
    return f"{h / 24:.1f} days ago".replace(".0 days", " days")


def pretty_resource(rt: str) -> str:
    special = {"er_bed": "ER bed", "icu_bed": "ICU bed", "nicu_bed": "NICU bed", "ct_scanner": "CT scanner",
               "mri_scanner": "MRI scanner"}
    return special.get(rt, rt.replace("_", " "))


def split_snapshots(snaps: list[ResourceSnapshot], now: datetime) -> tuple[list, list]:
    """Return (usable, future) — future-dated snapshots are data-quality errors and are ignored."""
    usable, future = [], []
    for s in snaps:
        if age_minutes(s.reportedAt, now) < -FUTURE_SKEW_MINUTES:
            future.append(s)
        else:
            usable.append(s)
    return usable, future


def latest(snaps: list[ResourceSnapshot]) -> Optional[ResourceSnapshot]:
    if not snaps:
        return None
    return sorted(
        snaps, key=lambda s: (s.reportedAt, s.version or 0, s.snapshotId or ""), reverse=True
    )[0]


def detect_conflict(
    snaps: list[ResourceSnapshot], latest_snap: ResourceSnapshot, min_count: int, cfg: dict
) -> Optional[dict]:
    """
    Conflict = another snapshot from a DIFFERENT reporter within the conflict
    window of the latest one that disagrees on whether the requirement is met.
    """
    win = cfg["conflictWindowMinutes"]
    l_ok = _meets(latest_snap, min_count)
    for s in snaps:
        if s is latest_snap:
            continue
        if abs(age_minutes(s.reportedAt, latest_snap.reportedAt)) > win:
            continue
        if s.reportedBy and latest_snap.reportedBy and s.reportedBy == latest_snap.reportedBy:
            continue  # same reporter correcting themselves is an update, not a conflict
        s_ok = _meets(s, min_count)
        if s_ok is not None and l_ok is not None and s_ok != l_ok:
            return {
                "otherSnapshotId": s.snapshotId,
                "otherReportedBy": s.reportedBy,
                "otherAvailableCount": s.effective_available(),
                "latestAvailableCount": latest_snap.effective_available(),
            }
    return None


def _meets(s: ResourceSnapshot, min_count: int) -> Optional[bool]:
    a = s.effective_available()
    return None if a is None else a >= min_count


def consistency_component(
    snaps: list[ResourceSnapshot], latest_snap: ResourceSnapshot, cfg: dict
) -> Optional[float]:
    """100 if other recent independent reports agree (same available/unavailable side and ±1 unit), 0 if they disagree,
    None (= not assessable, re-normalised away) when there is nothing to compare."""
    win = cfg["conflictWindowMinutes"]
    others = [
        s for s in snaps
        if s is not latest_snap
        and abs(age_minutes(s.reportedAt, latest_snap.reportedAt)) <= win
        and not (s.reportedBy and s.reportedBy == latest_snap.reportedBy)
        and s.effective_available() is not None
    ]
    la = latest_snap.effective_available()
    if not others or la is None:
        return None
    # agree = same side of zero (available vs unavailable) AND within ±1 unit
    agree = sum(1 for s in others
                if (s.effective_available() > 0) == (la > 0) and abs(s.effective_available() - la) <= 1)
    return 100.0 * agree / len(others)


def reliability_for_snapshot(
    snap: ResourceSnapshot, all_snaps: list[ResourceSnapshot], now: datetime, cfg: dict
) -> dict:
    """Heuristic reliability (0–100) for one resource report, with components."""
    w = cfg["reliabilityWeights"]
    window = window_for(snap.resourceType, cfg)
    age = age_minutes(snap.reportedAt, now)

    comp: dict[str, Optional[float]] = {}
    comp["freshness"] = freshness_curve(age, window)

    if snap.verifiedAt is not None:
        v_age = age_minutes(snap.verifiedAt, now)
        if v_age <= window["freshMinutes"]:
            comp["confirmation"] = 100.0
        elif v_age <= window["staleMinutes"]:
            comp["confirmation"] = 50.0
        else:
            comp["confirmation"] = 0.0
    else:
        comp["confirmation"] = 0.0

    fields = {
        "availableCount": snap.availableCount is not None,
        "totalCount": snap.totalCount is not None,
        "reportedBy": bool(snap.reportedBy),
    }
    comp["completeness"] = 100.0 * sum(fields.values()) / len(fields)
    comp["consistency"] = consistency_component(all_snaps, snap, cfg)

    avail = {k: v for k, v in comp.items() if v is not None}
    wsum = sum(w[k] for k in avail)
    score = sum(w[k] * avail[k] for k in avail) / wsum if wsum else 0.0
    notes = []
    if comp["consistency"] is None:
        notes.append("Consistency not assessed (no comparable recent reports) — weights re-normalised")
    missing = [k for k, ok in fields.items() if not ok]
    if missing:
        notes.append("Missing fields: " + ", ".join(missing))
    if snap.verifiedAt is None:
        notes.append("Not explicitly confirmed by an authorised hospital user")

    return {
        "resourceType": snap.resourceType,
        "score": round(score, 1),
        "level": level_for(score),
        "components": {k: (None if v is None else round(v, 1)) for k, v in comp.items()},
        "weightsApplied": {k: round(w[k] / wsum, 3) for k in avail} if wsum else {},
        "notes": notes,
    }


def level_for(score: float) -> str:
    from .config import RELIABILITY_LEVELS

    for threshold, label in RELIABILITY_LEVELS:
        if score >= threshold:
            return label
    return "Low"


def provenance_label(snap: Optional[ResourceSnapshot], now: datetime, cfg: dict,
                     conflict: Optional[dict] = None) -> dict:
    """README §7.9 display object for one resource value."""
    if snap is None:
        return {"state": "Unknown", "label": "Unknown — no report on record", "statusText": "Unknown"}
    window = window_for(snap.resourceType, cfg)
    age = age_minutes(snap.reportedAt, now)
    fstate = freshness_state(age, window)
    if conflict:
        state = "Conflicting"
    elif fstate == "Expired":
        state = "Needs reconfirmation"
    elif fstate == "Stale":
        state = "Stale"
    elif snap.verifiedAt is None:
        state = "Unconfirmed"
    else:
        state = "Confirmed"

    if fstate == "Expired":
        status_text = "Unknown (report expired)"  # never silently keep an old 'Available'
    elif snap.status == "available":
        n = snap.availableCount
        status_text = f"Reported available{f' ({n})' if n is not None else ''}"
    elif snap.status == "unavailable":
        status_text = "Reported unavailable"
    else:
        status_text = "Unknown"

    return {
        "state": state,
        "freshness": fstate,
        "statusText": status_text,
        "label": f"{status_text} · Updated {humanize_age(age)}" + (f" · {state}" if state != "Confirmed" else ""),
        "reportedAt": snap.reportedAt.isoformat(),
        "verifiedAt": snap.verifiedAt.isoformat() if snap.verifiedAt else None,
        "reportedBy": snap.reportedBy,
        "version": snap.version,
        "ageMinutes": round(age, 1),
        "freshWindowMinutes": window["freshMinutes"],
        "staleWindowMinutes": window["staleMinutes"],
    }
