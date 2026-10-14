"""
Referral response timers (README §7.12) and operational risk & escalation
(README §7.16).

This is an OPERATIONAL work queue, not a medical severity score. Every warning
carries a rule id, reason and timestamp. There is deliberately NO aggregate
risk number: the overall level is the worst individual item, and every
blocker is listed so none can be hidden by an average.
"""
from __future__ import annotations

from datetime import datetime, timezone
from statistics import median
from typing import Optional

from .config import get_config

LEVEL_ORDER = {"Resolved": 0, "OK": 0, "Attention needed": 1, "Escalation due": 2}


def _p(ts):
    if ts is None or isinstance(ts, datetime):
        return ts if ts is None or ts.tzinfo else ts.replace(tzinfo=timezone.utc)
    return datetime.fromisoformat(str(ts).replace("Z", "+00:00"))


def _mins(a: datetime, b: datetime) -> float:
    return (b - a).total_seconds() / 60.0


def referral_timer(referral: dict, now: datetime, cfg: Optional[dict] = None) -> dict:
    cfg = cfg or get_config()
    e = cfg["escalation"]
    status = referral.get("requestStatus", "sent")
    req_at = _p(referral.get("requestedAt"))
    resp_at = _p(referral.get("responseAt"))
    labels = {"sent": "Sent", "viewed": "Viewed", "accepted": "Accepted", "rejected": "Rejected",
              "clarification_requested": "Clarification requested", "timed_out": "Timed out",
              "cancelled": "Cancelled"}
    out = {"referralId": referral.get("referralId"), "hospitalId": referral.get("hospitalId"),
           "state": labels.get(status, status), "requestedAt": req_at.isoformat() if req_at else None,
           "lastResponseAt": resp_at.isoformat() if resp_at else None}
    if req_at is None:
        out.update(elapsedMinutes=None, level="Attention needed", label="Request time missing")
        return out
    if status in ("accepted", "rejected", "cancelled") and resp_at:
        rt = _mins(req_at, resp_at)
        out.update(elapsedMinutes=round(rt, 1), responseMinutes=round(rt, 1), level="Resolved",
                   label=f"{out['state']} after {rt:.0f} min")
        return out
    waited = _mins(req_at, now)
    if waited >= e["referralTimeoutMinutes"] or status == "timed_out":
        level, extra = "Escalation due", "timed out — escalate / try next candidate"
        out["state"] = "Timed out"
    elif waited >= e["referralEscalationMinutes"]:
        level, extra = "Escalation due", "no response — escalate to coordinator"
    elif waited >= e["referralAttentionMinutes"]:
        level, extra = "Attention needed", "awaiting response"
    else:
        level, extra = "OK", "awaiting response"
    out.update(elapsedMinutes=round(waited, 1), level=level,
               label=f"{out['state']} · waiting {waited:.0f} min · {extra}")
    return out


def historical_response_summary(referrals: list[dict], hospital_id: str, min_samples: int = 10) -> dict:
    """Median response time — only shown when enough comparable records exist (README §7.12)."""
    times, dates = [], []
    for r in referrals:
        if r.get("hospitalId") != hospital_id:
            continue
        a, b = _p(r.get("requestedAt")), _p(r.get("responseAt"))
        if a and b and r.get("requestStatus") in ("accepted", "rejected"):
            times.append(_mins(a, b))
            dates.append(a)
    if len(times) < min_samples:
        return {"hospitalId": hospital_id, "available": False, "sampleSize": len(times),
                "label": f"Insufficient history (n={len(times)}, need ≥{min_samples})"}
    return {"hospitalId": hospital_id, "available": True, "sampleSize": len(times),
            "medianResponseMinutes": round(median(times), 1),
            "period": {"from": min(dates).isoformat(), "to": max(dates).isoformat()},
            "label": f"Median response {median(times):.0f} min (n={len(times)}, "
                     f"{min(dates).date()}–{max(dates).date()}) · past speed does not predict acceptance"}


def evaluate_case(case_state: dict, now: datetime, cfg: Optional[dict] = None) -> dict:
    """
    case_state = {
      caseId, status, requiredResourceStates: {resourceType: "Fresh"|"Stale"|"Expired"|"Unknown"|"Conflicting"},
      referrals: [...], destinationConfirmedAt, assignment: {assignedAt, status} | None,
      arrivedAt, handoverStatus, offlineQueue: [{clientEventId, queuedAt}]
    }
    """
    cfg = cfg or get_config()
    e = cfg["escalation"]
    items = []

    def add(level, rule, reason, since=None, record=None):
        items.append({"level": level, "rule": rule, "reason": reason,
                      "since": since.isoformat() if isinstance(since, datetime) else since,
                      "recordId": record})

    for r in case_state.get("referrals", []):
        t = referral_timer(r, now, cfg)
        if t["level"] in ("Attention needed", "Escalation due"):
            add(t["level"], "REFERRAL_UNANSWERED", f"Referral to {r.get('hospitalId')}: {t['label']}",
                t["requestedAt"], r.get("referralId"))

    for rt, state in (case_state.get("requiredResourceStates") or {}).items():
        if state in ("Unknown", "Expired", "Conflicting"):
            add("Escalation due" if state == "Conflicting" else "Attention needed", "RESOURCE_UNCERTAIN",
                f"Required resource '{rt}' is {state.lower()} at the intended destination", None, rt)
        elif state == "Stale":
            add("Attention needed", "RESOURCE_STALE", f"Required resource '{rt}' report is stale — reconfirm", None, rt)

    conf = _p(case_state.get("destinationConfirmedAt"))
    asg = case_state.get("assignment")
    if conf and not asg:
        m = _mins(conf, now)
        if m >= e["assignmentAfterConfirmationMinutes"]:
            add("Escalation due", "NO_AMBULANCE_ASSIGNED",
                f"Destination confirmed {m:.0f} min ago but no ambulance assignment recorded", conf)

    arrived = _p(case_state.get("arrivedAt"))
    if arrived and not case_state.get("handoverStatus"):
        m = _mins(arrived, now)
        if m >= e["handoverMissingAfterArrivalMinutes"]:
            add("Attention needed", "HANDOVER_MISSING", f"Arrived {m:.0f} min ago, handover status not recorded", arrived)

    q = case_state.get("offlineQueue") or []
    if q:
        oldest = min(_p(x["queuedAt"]) for x in q)
        m = _mins(oldest, now)
        if m >= e["offlineQueueAgeMinutes"]:
            add("Attention needed", "OFFLINE_UNSYNCED", f"{len(q)} offline update(s) unsynchronised for {m:.0f} min", oldest)

    level = max((i["level"] for i in items), key=lambda l: LEVEL_ORDER[l], default="OK")
    items.sort(key=lambda i: -LEVEL_ORDER[i["level"]])
    return {"caseId": case_state.get("caseId"), "overallLevel": level, "items": items,
            "blockerCount": sum(1 for i in items if i["level"] == "Escalation due"),
            "evaluatedAt": now.isoformat(),
            "note": "Operational queue only — not a medical severity score."}
