"""
EmergencyLink — explainable hospital recommendation engine (README §8.1, §16).

Pipeline:
    Input validation → Eligibility filtering (hard constraints) →
    Candidate scoring (eligible only) → Explanation generation →
    [Human review → Hospital confirmation happen OUTSIDE this engine]

Three outcomes per hospital:
    ELIGIBLE            every hard constraint passes on current (fresh or stale) data → ranked
    NEEDS_CONFIRMATION  no constraint FAILS, but ≥1 required resource is unknown,
                        expired, or conflicting → listed separately, NOT scored
    EXCLUDED            ≥1 hard constraint fails → listed with operational reason

Safety properties (enforced by tests):
  * A high score can never compensate for a failed hard constraint
    (constraints are checked before scoring; excluded hospitals never get a score).
  * Unknown / expired / conflicting data is never treated as available.
  * Missing travel data never raises a hospital above complete-data candidates.
  * Deterministic: same input + same referenceTime ⇒ identical ranking.
  * Factor contributions always sum to the reported score.
"""
from __future__ import annotations

import hashlib
import json
from collections import defaultdict
from datetime import datetime, timezone
from typing import Optional

from . import config as C
from .eta import resolve_eta, travel_suitability
from .reliability import (
    age_minutes, detect_conflict, freshness_curve, freshness_state, humanize_age,
    latest, pretty_resource, provenance_label, reliability_for_snapshot,
    split_snapshots, window_for,
)
from .schemas import Hospital, RecommendationRequest, ResourceSnapshot

FACTOR_LABELS = {
    "travelSuitability": "Travel suitability",
    "resourceFreshness": "Resource freshness",
    "capacitySuitability": "Capacity suitability",
    "capabilityMatch": "Capability match",
}


# ---------------------------------------------------------------------------
# public API
# ---------------------------------------------------------------------------
def recommend(req: RecommendationRequest | dict, cfg: Optional[dict] = None) -> dict:
    if isinstance(req, dict):
        req = RecommendationRequest.model_validate(req)
    cfg = cfg or C.get_config()
    now = req.referenceTime or datetime.now(timezone.utc)

    snaps_by_hr: dict[tuple[str, str], list[ResourceSnapshot]] = defaultdict(list)
    for s in req.resourceSnapshots:
        snaps_by_hr[(s.hospitalId, s.resourceType)].append(s)

    rejected = {r.hospitalId: r for r in req.referralHistory if r.requestStatus == "rejected"}
    pending = {r.hospitalId: r for r in req.referralHistory
               if r.requestStatus in ("sent", "viewed", "clarification_requested")}

    eligible, needs_conf, excluded, warnings = [], [], [], []
    known_hospitals = {h.hospitalId for h in req.hospitals}
    orphan = {s.hospitalId for s in req.resourceSnapshots} - known_hospitals
    if orphan:
        warnings.append(f"Ignored resource snapshots for {len(orphan)} unknown hospital id(s)")

    for h in req.hospitals:
        ev = _evaluate_hospital(h, req, snaps_by_hr, rejected, pending, now, cfg)
        if ev["eligibility"] == "EXCLUDED":
            excluded.append(ev)
        elif ev["eligibility"] == "NEEDS_CONFIRMATION":
            needs_conf.append(ev)
        else:
            eligible.append(ev)
        warnings.extend(ev.pop("_warnings", []))

    # ---- score eligible candidates ----------------------------------------
    for ev in eligible:
        _score(ev, cfg, now)

    # Complete scores first, then incomplete; within each: score desc,
    # conservative ETA asc, hospitalId asc (deterministic tie-break).
    eligible.sort(key=lambda e: (
        0 if e["scoreComplete"] else 1,
        -e["matchScore"],
        e["eta"]["maxMinutes"] if e["eta"]["known"] else float("inf"),
        e["hospitalId"],
    ))
    total_eligible = len(eligible)
    eligible = eligible[: req.maxCandidates]
    for i, ev in enumerate(eligible, start=1):
        ev["rank"] = i
    _near_ties(eligible, cfg)
    _explain_relative(eligible)

    needs_conf.sort(key=lambda e: (e["eta"]["maxMinutes"] if e["eta"]["known"] else float("inf"),
                                   e["hospitalId"]))
    excluded.sort(key=lambda e: e["hospitalId"])

    if total_eligible == 0:
        warnings.insert(0, "No eligible candidate on current data — contact 'needs confirmation' "
                           "hospitals directly or widen the search area")
    elif total_eligible == 1:
        warnings.insert(0, "Only one eligible candidate — consider confirming a backup option")
    if any(e["flags"] for e in eligible[:1]):
        warnings.append("Top candidate carries data-quality flags — review before requesting referral")

    return {
        "engineVersion": cfg["engineVersion"],
        "scoreVersion": cfg["scoreVersion"],
        "reliabilityVersion": cfg["reliabilityVersion"],
        "caseId": req.emergency.caseId,
        "referenceTime": now.isoformat(),
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "inputHash": _input_hash(req),
        "weights": cfg["matchWeights"],
        "summary": {
            "hospitalsEvaluated": len(req.hospitals),
            "eligible": total_eligible,
            "needsConfirmation": len(needs_conf),
            "excluded": len(excluded),
            "returned": len(eligible),
        },
        "candidates": [_public(e) for e in eligible],
        "needsConfirmation": [_public_nc(e) for e in needs_conf],
        "excluded": [_public_ex(e) for e in excluded],
        "warnings": list(dict.fromkeys(warnings)),
        "requiresHumanReview": True,
        "disclaimer": C.DISCLAIMER,
    }


# ---------------------------------------------------------------------------
# hard constraints
# ---------------------------------------------------------------------------
def _evaluate_hospital(h: Hospital, req, snaps_by_hr, rejected, pending, now, cfg) -> dict:
    case = req.emergency
    ev = {
        "hospitalId": h.hospitalId, "name": h.name, "status": h.status,
        "hardConstraints": [], "exclusionReasons": [], "confirmationReasons": [],
        "flags": [], "resources": {}, "_warnings": [], "_req_snaps": {},
    }
    ev["eta"] = resolve_eta(h, case.location, req.travelEstimates, now, cfg)

    # 1. hospital operating status
    if h.status in C.EXCLUDING_HOSPITAL_STATUSES:
        msg = C.EXCLUDING_HOSPITAL_STATUSES[h.status]
        ev["hardConstraints"].append({"requirement": "Hospital accepting emergencies", "result": "Fail", "detail": msg})
        ev["exclusionReasons"].append(msg)
    else:
        ev["hardConstraints"].append({"requirement": "Hospital accepting emergencies", "result": "Pass",
                                      "detail": "Status: operational"})

    # 2. referral already rejected for this case
    if h.hospitalId in rejected:
        r = rejected[h.hospitalId]
        when = f" ({humanize_age(age_minutes(r.responseAt, now))})" if r.responseAt else ""
        msg = f"Rejected this referral{when}"
        ev["hardConstraints"].append({"requirement": "Not previously rejected for this case", "result": "Fail", "detail": msg})
        ev["exclusionReasons"].append(msg)
    if h.hospitalId in pending:
        ev["flags"].append({"code": "REFERRAL_PENDING", "label": "Referral already pending with this hospital"})

    # 3. required specialties (directory data)
    have = {s.lower() for s in h.specialties}
    for sp in case.requiredSpecialties:
        if sp.lower() in have:
            ev["hardConstraints"].append({"requirement": f"Specialty: {sp}", "result": "Pass", "detail": "Reported in directory"})
        else:
            msg = f"Required service not reported: {sp}"
            ev["hardConstraints"].append({"requirement": f"Specialty: {sp}", "result": "Fail", "detail": msg})
            ev["exclusionReasons"].append(msg)

    # 4. required resources
    for rr in case.requiredResources:
        rt, need = rr.resourceType, rr.minCount
        name = pretty_resource(rt)
        all_snaps, future = split_snapshots(snaps_by_hr.get((h.hospitalId, rt), []), now)
        if future:
            ev["_warnings"].append(f"{h.name}: ignored {len(future)} future-dated {name} report(s)")
            ev["flags"].append({"code": "FUTURE_TIMESTAMP", "label": f"{name}: future-dated report ignored"})
        snap = latest(all_snaps)
        req_label = f"{name} ≥ {need}"

        if snap is None:
            ev["hardConstraints"].append({"requirement": req_label, "result": "Unknown", "detail": "No report on record"})
            ev["confirmationReasons"].append(f"Availability unknown — confirmation needed: {name}")
            ev["resources"][rt] = provenance_label(None, now, cfg)
            continue

        window = window_for(rt, cfg)
        age = age_minutes(snap.reportedAt, now)
        fstate = freshness_state(age, window)
        conflict = detect_conflict(all_snaps, snap, need, cfg) if fstate != "Expired" else None
        ev["resources"][rt] = provenance_label(snap, now, cfg, conflict)
        avail = snap.effective_available()

        if fstate == "Expired":
            ev["hardConstraints"].append({"requirement": req_label, "result": "Unknown",
                                          "detail": f"Last report {humanize_age(age)} — expired"})
            ev["confirmationReasons"].append(f"Needs reconfirmation — {name} report expired ({humanize_age(age)})")
            continue
        if conflict:
            ev["hardConstraints"].append({"requirement": req_label, "result": "Unknown",
                                          "detail": "Conflicting recent reports"})
            ev["confirmationReasons"].append(f"Conflicting reports for {name} — review required")
            ev["flags"].append({"code": "CONFLICTING", "label": f"{name}: conflicting reports"})
            continue
        if avail is None:
            ev["hardConstraints"].append({"requirement": req_label, "result": "Unknown",
                                          "detail": "Reported status unknown / count missing"})
            ev["confirmationReasons"].append(f"Availability unknown — confirmation needed: {name}")
            continue
        if avail < need:
            stale_note = " (report is stale — reconfirm if needed)" if fstate == "Stale" else ""
            msg = (f"Required resource reported unavailable: {name}{stale_note}" if avail == 0
                   else f"Insufficient {name}: {avail} reported, {need} required{stale_note}")
            ev["hardConstraints"].append({"requirement": req_label, "result": "Fail", "detail": msg})
            ev["exclusionReasons"].append(msg)
            continue

        detail = f"{avail} reported · updated {humanize_age(age)}"
        ev["hardConstraints"].append({"requirement": req_label, "result": "Pass", "detail": detail})
        ev["_req_snaps"][rt] = (snap, all_snaps, need)
        if fstate == "Stale":
            ev["flags"].append({"code": "STALE", "label": f"{name}: stale report ({humanize_age(age)}) — reconfirm"})
        if snap.verifiedAt is None:
            ev["flags"].append({"code": "UNCONFIRMED", "label": f"{name}: not confirmed by hospital user"})

    if ev["exclusionReasons"]:
        ev["eligibility"] = "EXCLUDED"
    elif ev["confirmationReasons"]:
        ev["eligibility"] = "NEEDS_CONFIRMATION"
    else:
        ev["eligibility"] = "ELIGIBLE"
    ev["_capability"] = _capability(case, h, snaps_by_hr, now, cfg)
    if not ev["eta"]["known"] and ev["eligibility"] == "ELIGIBLE":
        ev["flags"].append({"code": "ETA_UNKNOWN", "label": "Travel time unknown — score incomplete"})
    return ev


# ---------------------------------------------------------------------------
# scoring
# ---------------------------------------------------------------------------
def _score(ev: dict, cfg: dict, now: datetime) -> None:
    w = cfg["matchWeights"]
    req_snaps = ev["_req_snaps"]

    # Resource freshness — weakest required resource (conservative)
    fresh_scores, fresh_detail = [], []
    rel_items = []
    for rt, (snap, all_snaps, need) in req_snaps.items():
        p = ev["resources"][rt]
        window = window_for(rt, cfg)
        f = freshness_curve(p["ageMinutes"], window)
        if snap.verifiedAt is None:
            f = max(0.0, f - C.UNVERIFIED_FRESHNESS_PENALTY)
        fresh_scores.append((f, rt))
        rel_items.append(reliability_for_snapshot(snap, all_snaps, now, cfg))
    worst_f, worst_rt = min(fresh_scores)
    p_worst = ev["resources"][worst_rt]
    fresh_expl = (f"Weakest required resource: {pretty_resource(worst_rt)} updated "
                  f"{humanize_age(p_worst['ageMinutes'])} ({p_worst['state'].lower()})")

    # Capacity suitability — weakest headroom across required resources
    cap_scores = []
    for rt, (snap, _, need) in req_snaps.items():
        avail = snap.effective_available()
        buf = cfg["capacityBuffer"].get(rt, cfg["defaultCapacityBuffer"])
        head = avail - need
        s = C.CAPACITY_AT_MINIMUM + (100 - C.CAPACITY_AT_MINIMUM) * min(1.0, head / buf)
        cap_scores.append((s, rt, avail, need))
    worst_c = min(cap_scores)
    cap_expl = (f"Tightest resource: {pretty_resource(worst_c[1])} — {worst_c[2]} reported for "
                f"{worst_c[3]} required" + (" (no spare capacity)" if worst_c[2] == worst_c[3] else ""))

    # Capability match — preferred (non-mandatory) resources & specialties
    cap_match, cap_match_expl = ev["_capability"]

    travel = travel_suitability(ev["eta"], cfg)
    travel_expl = (ev["eta"]["label"] + (f" — scored on upper bound {ev['eta']['maxMinutes']:.0f} min"
                                         if ev["eta"]["known"] else ""))

    values = {
        "travelSuitability": (travel, travel_expl),
        "resourceFreshness": (worst_f, fresh_expl),
        "capacitySuitability": (worst_c[0], cap_expl),
        "capabilityMatch": (cap_match, cap_match_expl),
    }
    avail_w = {k: w[k] for k, (v, _) in values.items() if v is not None}
    wsum = sum(avail_w.values())
    factors = []
    total = 0.0
    for k in ("travelSuitability", "resourceFreshness", "capacitySuitability", "capabilityMatch"):
        v, expl = values[k]
        if v is None:
            factors.append({"factor": k, "label": FACTOR_LABELS[k], "value": None, "weight": w[k],
                            "effectiveWeight": 0.0, "contribution": 0.0, "effect": "unknown",
                            "explanation": expl + " — excluded from score; score marked incomplete"})
            continue
        ew = w[k] / wsum
        contrib = ew * v
        total += contrib
        effect = "raised" if v >= C.FACTOR_STRONG else ("lowered" if v < C.FACTOR_WEAK else "neutral")
        factors.append({"factor": k, "label": FACTOR_LABELS[k], "value": round(v, 1), "weight": w[k],
                        "effectiveWeight": round(ew, 4), "contribution": round(contrib, 2),
                        "effect": effect, "explanation": expl})

    score = round(total, 1)
    ev["matchScore"] = score
    ev["scoreComplete"] = len(avail_w) == len(w)
    ev["factors"] = factors

    worst_rel = min(rel_items, key=lambda r: r["score"])
    ev["resourceReliability"] = {
        "score": worst_rel["score"],
        "level": worst_rel["level"],
        "label": f"Resource data: {worst_rel['level']} reliability",
        "basis": "Weakest required resource (heuristic, not a probability)",
        "perResource": rel_items,
    }


def _capability(case, h: Hospital, snaps_by_hr, now, cfg) -> tuple[float, str]:
    prefs = [("resource", r) for r in case.preferredResources] + \
            [("specialty", s) for s in case.preferredSpecialties]
    if not prefs:
        return 100.0, "No preferred capabilities specified — all required capabilities met"
    have_sp = {s.lower() for s in h.specialties}
    matched, missing, unknown = [], [], []
    for kind, p in prefs:
        if kind == "specialty":
            (matched if p.lower() in have_sp else missing).append(p)
            continue
        snaps, _ = split_snapshots(snaps_by_hr.get((h.hospitalId, p), []), now)
        s = latest(snaps)
        if s is None or freshness_state(age_minutes(s.reportedAt, now), window_for(p, cfg)) == "Expired":
            unknown.append(pretty_resource(p))
        elif (s.effective_available() or 0) >= 1:
            matched.append(pretty_resource(p))
        else:
            missing.append(pretty_resource(p))
    score = 100.0 * len(matched) / len(prefs)
    parts = [f"{len(matched)} of {len(prefs)} preferred capabilities reported"]
    if missing:
        parts.append("not available: " + ", ".join(missing))
    if unknown:
        parts.append("unknown (not counted): " + ", ".join(unknown))
    return score, "; ".join(parts)


# ---------------------------------------------------------------------------
# relative explanations
# ---------------------------------------------------------------------------
def _near_ties(cands: list[dict], cfg: dict) -> None:
    for a, b in zip(cands, cands[1:]):
        if a["scoreComplete"] and b["scoreComplete"] and abs(a["matchScore"] - b["matchScore"]) < cfg["nearTiePoints"]:
            for x, y in ((a, b), (b, a)):
                x["flags"].append({"code": "NEAR_TIE",
                                   "label": f"Near-tie with {y['name']} ({y['matchScore']:.0f}) — compare factors manually"})


def _explain_relative(cands: list[dict]) -> None:
    top = cands[0] if cands else None
    for c in cands:
        raised = [f["label"].lower() for f in c["factors"] if f["effect"] == "raised"]
        lowered = [f["label"].lower() for f in c["factors"] if f["effect"] == "lowered"]
        s = f"Rank #{c['rank']} · Match score {c['matchScore']:.0f}/100"
        if not c["scoreComplete"]:
            s += " (incomplete — ranked after complete scores)"
        s += "."
        if raised:
            s += " Raised by " + ", ".join(raised) + "."
        if lowered:
            s += " Lowered by " + ", ".join(lowered) + "."
        if top is not None and c is not top:
            diffs = []
            for f_top, f_c in zip(top["factors"], c["factors"]):
                if f_top["value"] is not None and f_c["value"] is not None:
                    d = (f_c["value"] - f_top["value"]) * f_c["effectiveWeight"]
                    diffs.append((d, f_c["label"].lower()))
            diffs.sort()
            if diffs and diffs[0][0] < 0:
                s += f" Main gap vs #1: {diffs[0][1]} ({diffs[0][0]:+.1f} pts)."
        c["explanationSummary"] = s


# ---------------------------------------------------------------------------
# output shaping
# ---------------------------------------------------------------------------
def _last_updated(ev):
    ts = [p["reportedAt"] for p in ev["resources"].values() if p.get("reportedAt")]
    return min(ts) if ts else None  # oldest required report = what the decision rests on


def _public(ev: dict) -> dict:
    return {
        "rank": ev["rank"],
        "hospitalId": ev["hospitalId"],
        "name": ev["name"],
        "eligibility": "ELIGIBLE",
        "matchScore": ev["matchScore"],
        "matchScoreLabel": f"Match score: {ev['matchScore']:.0f}/100" + ("" if ev["scoreComplete"] else " (incomplete)"),
        "scoreComplete": ev["scoreComplete"],
        "factors": ev["factors"],
        "hardConstraints": ev["hardConstraints"],
        "resourceReliability": ev["resourceReliability"],
        "eta": ev["eta"],
        "etaReliabilityLabel": f"ETA confidence: {ev['eta']['reliability']}",
        "resources": ev["resources"],
        "flags": ev["flags"],
        "oldestRequiredReportAt": _last_updated(ev),
        "explanationSummary": ev["explanationSummary"],
        "referralStatus": "Referral pending" if any(f["code"] == "REFERRAL_PENDING" for f in ev["flags"])
                          else "Not requested — hospital acceptance required",
    }


def _public_nc(ev: dict) -> dict:
    return {
        "hospitalId": ev["hospitalId"], "name": ev["name"], "eligibility": "NEEDS_CONFIRMATION",
        "matchScore": None, "matchScoreLabel": "Insufficient data — not scored",
        "reasons": ev["confirmationReasons"], "hardConstraints": ev["hardConstraints"],
        "eta": ev["eta"], "resources": ev["resources"], "flags": ev["flags"],
    }


def _public_ex(ev: dict) -> dict:
    return {
        "hospitalId": ev["hospitalId"], "name": ev["name"], "eligibility": "EXCLUDED",
        "matchScore": None, "reasons": ev["exclusionReasons"], "hardConstraints": ev["hardConstraints"],
    }


def _input_hash(req: RecommendationRequest) -> str:
    payload = req.model_dump(mode="json")
    blob = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()
    return "sha256:" + hashlib.sha256(blob).hexdigest()[:32]
