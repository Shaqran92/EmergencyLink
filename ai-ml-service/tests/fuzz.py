"""Random fictional request generator for property/invariant testing and benchmarks."""
from __future__ import annotations

import random
from datetime import datetime, timedelta, timezone

RESOURCES = ["er_bed", "icu_bed", "ventilator", "ct_scanner", "cath_lab", "operating_theatre",
             "blood_bank", "trauma_team", "neurosurgeon", "cardiologist", "burn_bed", "obstetrician"]
SPECIALTIES = ["cardiology", "neurosurgery", "trauma surgery", "obstetrics", "pediatrics", "burns", "general medicine"]
REF = datetime(2026, 10, 13, 9, 0, tzinfo=timezone.utc)


def _iso(dt):
    return dt.isoformat().replace("+00:00", "Z")


def random_request(rng: random.Random, n_hospitals: int | None = None) -> dict:
    n = n_hospitals or rng.randint(1, 15)
    req_rt = rng.sample(RESOURCES, rng.randint(1, 4))
    case = {
        "caseId": f"FUZZ-{rng.randint(0, 10**9)}",
        "requiredResources": [{"resourceType": r, "minCount": rng.choice([1, 1, 1, 2, 3])} for r in req_rt],
        "requiredSpecialties": rng.sample(SPECIALTIES, rng.choice([0, 0, 1])),
        "preferredResources": rng.sample([r for r in RESOURCES if r not in req_rt], rng.choice([0, 1, 2])),
        "location": None if rng.random() < 0.05 else {"lat": 24.85 + rng.random() * 0.15, "lng": 66.98 + rng.random() * 0.2},
    }
    hospitals, snaps, travel = [], [], []
    for i in range(n):
        hid = f"H{i:03d}"
        hospitals.append({
            "hospitalId": hid, "name": f"Fictional Hospital {i}",
            "location": None if rng.random() < 0.05 else {"lat": 24.80 + rng.random() * 0.25, "lng": 66.95 + rng.random() * 0.25},
            "specialties": rng.sample(SPECIALTIES, rng.randint(1, 5)),
            "status": rng.choices(["operational", "diverting", "closed"], [0.9, 0.05, 0.05])[0],
        })
        for rt in RESOURCES:
            if rng.random() < 0.25:
                continue  # unknown — no report
            for k in range(rng.choice([1, 1, 2, 3])):
                tot = rng.randint(1, 20)
                age = rng.choice([rng.uniform(0, 30), rng.uniform(30, 150), rng.uniform(150, 600), -rng.uniform(10, 120) if rng.random() < 0.02 else 5])
                t = REF - timedelta(minutes=age)
                snaps.append({
                    "hospitalId": hid, "resourceType": rt,
                    "availableCount": None if rng.random() < 0.03 else rng.randint(0, tot),
                    "totalCount": None if rng.random() < 0.1 else tot,
                    "reportedAt": _iso(t), "verifiedAt": _iso(t) if rng.random() < 0.7 else None,
                    "reportedBy": rng.choice([f"{hid}.ops", f"{hid}.er", None]),
                })
                # keep available ≤ total
                s = snaps[-1]
                if s["availableCount"] is not None and s["totalCount"] is not None and s["availableCount"] > s["totalCount"]:
                    s["availableCount"] = s["totalCount"]
        if rng.random() < 0.6:
            lo = rng.uniform(2, 50)
            if rng.random() < 0.5:
                travel.append({"hospitalId": hid, "etaMinutes": lo, "source": rng.choice(["live_traffic", "map_routing", "manual"]),
                               "estimatedAt": _iso(REF - timedelta(minutes=rng.uniform(0, 30)))})
            else:
                travel.append({"hospitalId": hid, "etaMinMinutes": lo, "etaMaxMinutes": lo + rng.uniform(0, 15),
                               "source": "live_traffic", "estimatedAt": _iso(REF)})
    hist = []
    if rng.random() < 0.3:
        hist.append({"hospitalId": f"H{rng.randrange(n):03d}", "requestStatus": "rejected",
                     "requestedAt": _iso(REF - timedelta(minutes=10)), "responseAt": _iso(REF - timedelta(minutes=6))})
    return {"emergency": case, "hospitals": hospitals, "resourceSnapshots": snaps, "travelEstimates": travel,
            "referralHistory": hist, "referenceTime": _iso(REF), "maxCandidates": 100}


def check_invariants(req: dict, res: dict) -> list[str]:
    """Safety/consistency properties that must hold for EVERY input."""
    v = []
    case = req["emergency"]
    cands = res["candidates"]
    rejected = {r["hospitalId"] for r in req.get("referralHistory", []) if r["requestStatus"] == "rejected"}
    status = {h["hospitalId"]: h["status"] for h in req["hospitals"]}
    specs = {h["hospitalId"]: {s.lower() for s in h["specialties"]} for h in req["hospitals"]}

    ids = [c["hospitalId"] for c in cands] + [c["hospitalId"] for c in res["needsConfirmation"]] + \
          [c["hospitalId"] for c in res["excluded"]]
    if sorted(ids) != sorted(status):  # every hospital lands in exactly one bucket
        v.append("partition: hospitals missing or duplicated across buckets")
    for c in cands:
        hid = c["hospitalId"]
        if status[hid] != "operational":
            v.append(f"{hid}: non-operational hospital ranked")
        if hid in rejected:
            v.append(f"{hid}: rejected hospital ranked")
        for sp in case["requiredSpecialties"]:
            if sp.lower() not in specs[hid]:
                v.append(f"{hid}: ranked without required specialty")
        if any(hc["result"] != "Pass" for hc in c["hardConstraints"]):
            v.append(f"{hid}: ranked with non-passing hard constraint")
        for rr in case["requiredResources"]:
            p = c["resources"].get(rr["resourceType"])
            if p is None or p.get("freshness") not in ("Fresh", "Stale") or p.get("state") == "Conflicting":
                v.append(f"{hid}: ranked on unknown/expired/conflicting {rr['resourceType']}")
        if not (0 <= c["matchScore"] <= 100):
            v.append(f"{hid}: score out of range")
        s = sum(f["contribution"] for f in c["factors"])
        if abs(s - c["matchScore"]) > 0.15:
            v.append(f"{hid}: contributions {s:.2f} != score {c['matchScore']}")
        if c["scoreComplete"] != all(f["value"] is not None for f in c["factors"]):
            v.append(f"{hid}: scoreComplete inconsistent with factors")
    for c in res["needsConfirmation"] + res["excluded"]:
        if c["matchScore"] is not None:
            v.append(f"{c['hospitalId']}: non-eligible hospital received a score")
    # ordering: complete before incomplete; scores non-increasing within each group
    seen_incomplete = False
    for a, b in zip(cands, cands[1:]):
        if not a["scoreComplete"]:
            seen_incomplete = True
        if seen_incomplete and b["scoreComplete"]:
            v.append("ordering: complete score ranked after incomplete")
        if a["scoreComplete"] == b["scoreComplete"] and a["matchScore"] < b["matchScore"]:
            v.append("ordering: scores not sorted")
    if [c["rank"] for c in cands] != list(range(1, len(cands) + 1)):
        v.append("ranks not contiguous")
    return v
