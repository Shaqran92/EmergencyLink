"""
Resource shortage early warning (README §7.15) and emergency surge simulator
(README §7.4).

Language rules: outputs say "Potential shortage" / "High reported demand",
never that a hospital WILL run out. Simulation results use fictional data and
explicit assumptions (every simulated referral is assumed accepted by the #1
candidate and holds the resource for the rest of the horizon).
"""
from __future__ import annotations

from collections import defaultdict
from copy import deepcopy
from datetime import datetime, timedelta
from typing import Optional

from .config import get_config
from .engine import recommend
from .reliability import age_minutes, freshness_state, latest, pretty_resource, split_snapshots, window_for
from .schemas import RecommendationRequest


def shortage_warnings(
    hospitals: list[dict], snapshots: list[dict], now: datetime,
    expected_demand: Optional[dict] = None, horizon_hours: int = 4, cfg: Optional[dict] = None,
) -> list[dict]:
    """
    expected_demand: {(hospitalId, resourceType) or resourceType: expected arrivals in horizon}
    """
    from .schemas import ResourceSnapshot

    cfg = cfg or get_config()
    s_cfg = cfg["shortage"]
    snaps = [ResourceSnapshot.model_validate(s) for s in snapshots]
    by = defaultdict(list)
    for s in snaps:
        by[(s.hospitalId, s.resourceType)].append(s)
    names = {h["hospitalId"]: h["name"] for h in hospitals}
    out = []
    for (hid, rt), lst in sorted(by.items()):
        if hid not in names or rt not in s_cfg["monitoredResources"]:
            continue
        usable, _ = split_snapshots(lst, now)
        s = latest(usable)
        if s is None:
            continue
        age = age_minutes(s.reportedAt, now)
        fstate = freshness_state(age, window_for(rt, cfg))
        avail = s.effective_available()
        reasons, label = [], None
        if fstate == "Expired" or avail is None:
            continue  # no warning on unknown data — the freshness indicator handles it
        if s.totalCount:
            ratio = avail / s.totalCount
            if ratio <= s_cfg["remainingRatioWarning"]:
                reasons.append(f"{avail} of {s.totalCount} remaining ({ratio:.0%} ≤ {s_cfg['remainingRatioWarning']:.0%} threshold)")
        if avail <= s_cfg["remainingAbsoluteWarning"]:
            reasons.append(f"{avail} unit(s) remaining (≤ {s_cfg['remainingAbsoluteWarning']} threshold)")
        if reasons:
            label = "Potential shortage"
        d = None
        if expected_demand:
            d = expected_demand.get((hid, rt), expected_demand.get(rt))
            if d is not None and avail > 0 and d / avail >= s_cfg["demandPressureRatio"]:
                reasons.append(f"Expected demand {d:.1f} in next {horizon_hours} h ≥ {avail} reported available")
                label = "High reported demand" if label is None else label
        if label:
            out.append({
                "hospitalId": hid, "hospitalName": names[hid], "resourceType": rt,
                "resourceName": pretty_resource(rt), "warning": label, "reasons": reasons,
                "inputs": {"availableCount": avail, "totalCount": s.totalCount, "expectedDemand": d,
                           "horizonHours": horizon_hours if d is not None else None},
                "reportedAt": s.reportedAt.isoformat(), "freshness": fstate,
                "note": "Early warning based on reported data and configurable thresholds — not a prediction that resources will run out.",
            })
    return out


def simulate_surge(
    base_request: dict, cases: list[dict], events: Optional[list[dict]] = None,
    cfg: Optional[dict] = None,
) -> dict:
    """
    Sequentially route `cases` (list of EmergencyCase dicts with optional
    'minuteOffset') through the engine. After each case the #1 candidate is
    assumed to accept, and the required resources are decremented by a new
    snapshot at that moment. `events` inject shocks at a minute offset:
        {"minuteOffset": 20, "type": "hospital_closure", "hospitalId": "H03"}
        {"minuteOffset": 30, "type": "equipment_outage", "hospitalId": "H01", "resourceType": "ct_scanner"}
    Returns a timeline for charts.
    """
    cfg = cfg or get_config()
    state = deepcopy(base_request)
    req = RecommendationRequest.model_validate(state)
    t0 = req.referenceTime or datetime.now(timezone.utc)
    events = sorted(events or [], key=lambda e: e["minuteOffset"])
    cases = sorted(cases, key=lambda c: c.get("minuteOffset", 0))
    timeline, ev_i = [], 0
    unplaced = 0
    for i, c in enumerate(cases):
        m = c.get("minuteOffset", i)
        now = t0 + timedelta(minutes=m)
        while ev_i < len(events) and events[ev_i]["minuteOffset"] <= m:
            _apply_event(state, events[ev_i], t0 + timedelta(minutes=events[ev_i]["minuteOffset"]))
            ev_i += 1
        case = {k: v for k, v in c.items() if k != "minuteOffset"}
        state["emergency"] = case
        state["referenceTime"] = now.isoformat()
        res = recommend(state, cfg)
        top = res["candidates"][0] if res["candidates"] else None
        if top:
            _consume(state, top["hospitalId"], case, now)
        else:
            unplaced += 1
        timeline.append({
            "minuteOffset": m, "caseId": case["caseId"],
            "eligible": res["summary"]["eligible"], "needsConfirmation": res["summary"]["needsConfirmation"],
            "excluded": res["summary"]["excluded"],
            "assignedTo": top["hospitalId"] if top else None,
            "topScore": top["matchScore"] if top else None,
            "totalRemaining": _remaining(state, now, cfg),
            "unplacedSoFar": unplaced,
        })
    return {"timeline": timeline, "casesSimulated": len(cases), "unplacedCases": unplaced,
            "assumptions": [
                "Every simulated referral is accepted by the #1 ranked candidate",
                "Assigned resources stay occupied for the whole simulation (no discharges)",
                "Fictional hospitals and demand — illustrative only",
            ]}


def _apply_event(state, ev, at: datetime):
    if ev["type"] == "hospital_closure":
        for h in state["hospitals"]:
            if h["hospitalId"] == ev["hospitalId"]:
                h["status"] = "closed"
    elif ev["type"] == "equipment_outage":
        state["resourceSnapshots"].append({
            "hospitalId": ev["hospitalId"], "resourceType": ev["resourceType"], "availableCount": 0,
            "status": "unavailable", "reportedAt": at.isoformat(), "verifiedAt": at.isoformat(),
            "reportedBy": "simulator"})


def _consume(state, hid, case, now):
    snaps = [s for s in state["resourceSnapshots"] if s["hospitalId"] == hid]
    for rr in case["requiredResources"]:
        rt, need = rr["resourceType"], rr.get("minCount", 1)
        cands = [s for s in snaps if s["resourceType"] == rt]
        last = max(cands, key=lambda s: (_ts(s["reportedAt"]), s.get("version") or 0))
        if rt.endswith("_bed") or rt in ("ventilator", "operating_theatre"):
            new_avail = max(0, (last.get("availableCount") or 0) - need)
            state["resourceSnapshots"].append({
                "hospitalId": hid, "resourceType": rt, "availableCount": new_avail,
                "totalCount": last.get("totalCount"), "reportedAt": now.isoformat(),
                "verifiedAt": now.isoformat(), "reportedBy": "simulator",
                "version": (last.get("version") or 0) + 1})


def _ts(v):
    return v if isinstance(v, datetime) else datetime.fromisoformat(str(v).replace("Z", "+00:00"))


def _remaining(state, now, cfg) -> int:
    from .schemas import ResourceSnapshot
    by = defaultdict(list)
    for s in state["resourceSnapshots"]:
        so = ResourceSnapshot.model_validate(s)
        by[(so.hospitalId, so.resourceType)].append(so)
    closed = {h["hospitalId"] for h in state["hospitals"] if h.get("status", "operational") != "operational"}
    tot = 0
    for (hid, rt), lst in by.items():
        if hid in closed or not rt.endswith("_bed"):
            continue
        s = latest(split_snapshots(lst, now)[0])
        if s and s.effective_available():
            tot += s.effective_available()
    return tot
