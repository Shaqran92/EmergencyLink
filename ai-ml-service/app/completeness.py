"""
Data completeness indicator (README §7.14).

Completeness ≠ reliability: complete data can still be old or wrong.
Required fields are defined PER WORKFLOW, not globally. Missing values are
reported as unknown — never filled with optimistic defaults.
"""
from __future__ import annotations

from typing import Any

WORKFLOW_FIELDS: dict[str, dict[str, list[str]]] = {
    "emergency_registration": {
        "required": ["caseId", "priorityCategory", "requiredResources", "location", "createdAt"],
        "optional": ["requiredSpecialties", "preferredResources", "preferredSpecialties", "notes"],
    },
    "hospital_resource_update": {
        "required": ["hospitalId", "resourceType", "availableCount", "reportedAt", "reportedBy"],
        "optional": ["totalCount", "verifiedAt"],
    },
    "hospital_directory": {
        "required": ["hospitalId", "name", "location", "specialties", "status"],
        "optional": ["phone", "address"],
    },
    "referral_request": {
        "required": ["caseId", "hospitalId", "requestStatus", "requestedAt", "requestedBy"],
        "optional": ["notes"],
    },
    "ambulance_assignment": {
        "required": ["caseId", "ambulanceId", "destinationHospitalId", "status", "assignedAt"],
        "optional": ["etaMinutes"],
    },
}


def _present(v: Any) -> bool:
    if v is None:
        return False
    if isinstance(v, str) and not v.strip():
        return False
    if isinstance(v, (list, dict)) and len(v) == 0:
        return False
    return True


def assess(record: dict, workflow: str) -> dict:
    if workflow not in WORKFLOW_FIELDS:
        raise ValueError(f"Unknown workflow '{workflow}'. Known: {sorted(WORKFLOW_FIELDS)}")
    spec = WORKFLOW_FIELDS[workflow]
    req_missing = [f for f in spec["required"] if not _present(_get(record, f))]
    opt_missing = [f for f in spec["optional"] if not _present(_get(record, f))]
    n_req = len(spec["required"])
    done = n_req - len(req_missing)
    pct = round(100 * done / n_req) if n_req else 100
    return {
        "workflow": workflow,
        "requiredComplete": done,
        "requiredTotal": n_req,
        "percent": pct,
        "label": f"Required fields: {done} of {n_req} complete",
        "displayName": "Data completeness",  # never "Confidence"
        "missingRequired": req_missing,
        "missingOptional": opt_missing,
        "canSubmit": not req_missing,
    }


def _get(record: dict, dotted: str):
    cur: Any = record
    for part in dotted.split("."):
        if not isinstance(cur, dict):
            return None
        cur = cur.get(part)
    return cur
