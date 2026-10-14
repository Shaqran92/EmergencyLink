"""Expand compact scenario definitions into RecommendationRequests and check expectations."""
from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

SCENARIO_FILE = Path(__file__).parent / "scenarios" / "scenarios.json"


def _iso(dt):
    return dt.isoformat().replace("+00:00", "Z")


def load_scenarios():
    raw = json.loads(SCENARIO_FILE.read_text())
    ref = datetime.fromisoformat(raw["referenceTime"].replace("Z", "+00:00"))
    return [(sc, build_request(sc, ref)) for sc in raw["scenarios"]]


def _snap(hid, rt, spec, ref, n):
    t = ref - timedelta(minutes=spec["age"])
    s = {"snapshotId": f"{hid}-{rt}-{n}", "hospitalId": hid, "resourceType": rt,
         "availableCount": spec.get("a"), "totalCount": spec.get("t"), "reportedAt": _iso(t),
         "verifiedAt": _iso(t) if spec.get("v") else None, "reportedBy": spec.get("by", f"{hid.lower()}.ops")}
    if "s" in spec:
        s["status"] = spec["s"]
    return s


def build_request(sc: dict, ref: datetime) -> dict:
    case = sc["case"]
    hospitals, snaps, travel = [], [], []
    for i, h in enumerate(sc["hospitals"]):
        hid = h["id"]
        hospitals.append({
            "hospitalId": hid, "name": f"Hospital {hid}",
            "location": None if h.get("noLocation") else {"lat": 24.86 + 0.01 * i, "lng": 67.05},
            "specialties": h.get("specialties", case.get("requiredSpecialties", [])),
            "status": h.get("status", "operational"), "fictional": True})
        for n, (rt, spec) in enumerate(h.get("resources", {}).items()):
            snaps.append(_snap(hid, rt, spec, ref, n))
        for n, spec in enumerate(h.get("extraSnapshots", [])):
            snaps.append(_snap(hid, spec["resourceType"], spec, ref, 100 + n))
        if h.get("eta"):
            lo, hi, src = h["eta"]
            e = {"hospitalId": hid, "source": src, "estimatedAt": _iso(ref)}
            if hi is None:
                e["etaMinutes"] = lo
            else:
                e["etaMinMinutes"], e["etaMaxMinutes"] = lo, hi
            travel.append(e)
    return {
        "emergency": {
            "caseId": f"TEST-{sc['id']}",
            "requiredResources": [{"resourceType": r, "minCount": c} for r, c in case["requiredResources"]],
            "requiredSpecialties": case.get("requiredSpecialties", []),
            "preferredResources": case.get("preferredResources", []),
            "location": {"lat": 24.86, "lng": 67.01} if case.get("location", True) else None,
        },
        "hospitals": hospitals, "resourceSnapshots": snaps, "travelEstimates": travel,
        "referralHistory": sc.get("referralHistory", []), "referenceTime": _iso(ref),
    }


def check(sc: dict, res: dict) -> list[str]:
    """Return a list of failed expectation messages (empty = pass)."""
    exp, fails = sc["expect"], []
    cands = {c["hospitalId"]: c for c in res["candidates"]}
    nc = {c["hospitalId"]: c for c in res["needsConfirmation"]}
    ex = {c["hospitalId"]: c for c in res["excluded"]}
    all_ = {**cands, **nc, **ex}

    if "eligible" in exp and set(cands) != set(exp["eligible"]):
        fails.append(f"eligible: expected {sorted(exp['eligible'])}, got {sorted(cands)}")
    if "rankOrder" in exp:
        got = [c["hospitalId"] for c in res["candidates"]]
        if got != exp["rankOrder"]:
            fails.append(f"rankOrder: expected {exp['rankOrder']}, got {got}")
    if "needsConfirmation" in exp and set(nc) != set(exp["needsConfirmation"]):
        fails.append(f"needsConfirmation: expected {sorted(exp['needsConfirmation'])}, got {sorted(nc)}")
    for hid, sub in exp.get("excluded", {}).items():
        if hid not in ex:
            fails.append(f"excluded: {hid} not excluded")
        elif not any(sub.lower() in r.lower() for r in ex[hid]["reasons"]):
            fails.append(f"excluded: {hid} reasons {ex[hid]['reasons']} lack '{sub}'")
    for hid, sub in exp.get("ncReasonContains", {}).items():
        if hid not in nc or not any(sub.lower() in r.lower() for r in nc[hid]["reasons"]):
            fails.append(f"needsConfirmation reason for {hid} lacks '{sub}'")
    for hid, codes in exp.get("flags", {}).items():
        have = {f["code"] for f in all_.get(hid, {}).get("flags", [])}
        for c in codes:
            if c not in have:
                fails.append(f"flags: {hid} missing {c} (has {sorted(have)})")
    for key, n in exp.get("flagCount", {}).items():
        hid, code = key.split(":")
        got = sum(1 for f in all_.get(hid, {}).get("flags", []) if f["code"] == code)
        if got != n:
            fails.append(f"flagCount {key}: expected {n}, got {got}")
    for hid, val in exp.get("scoreComplete", {}).items():
        if hid not in cands or cands[hid]["scoreComplete"] != val:
            fails.append(f"scoreComplete {hid}: expected {val}")
    for sub in exp.get("warningsContain", []):
        if not any(sub.lower() in w.lower() for w in res["warnings"]):
            fails.append(f"warnings lack '{sub}' (got {res['warnings']})")
    return fails
