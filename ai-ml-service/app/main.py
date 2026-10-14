"""
EmergencyLink recommendation service (FastAPI).

Internal service — called by the Express backend (RECOMMENDATION_SERVICE_URL),
NOT directly by browsers. The backend is responsible for authentication,
authorisation and for fetching hospital/resource records from MongoDB
server-side (README §14: clients must not supply trusted resource values).

Run:  uvicorn app.main:app --host 0.0.0.0 --port 8000
"""
from __future__ import annotations

import time
from collections import deque
from datetime import datetime, timezone
from statistics import median
from typing import Any, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from . import completeness, escalation
from .config import DISCLAIMER, get_config
from .engine import recommend
from .reliability import latest, provenance_label, reliability_for_snapshot, split_snapshots
from .schemas import RecommendationRequest, ResourceSnapshot
from .shortage import shortage_warnings, simulate_surge

app = FastAPI(
    title="EmergencyLink Recommendation Service",
    version=get_config()["engineVersion"],
    description="Explainable, rules-based candidate-hospital ranking. Decision support only — "
                "requires human review and receiving-hospital acceptance.",
)

# --- README §7.17 — only measured values, never invented -------------------
_METRICS = {"startedAt": datetime.now(timezone.utc), "calculations": 0, "errors": 0,
            "validationErrors": 0, "lastSuccessfulCalculationAt": None, "latenciesMs": deque(maxlen=500)}


def _ok(data: Any) -> dict:
    return {"success": True, "data": data}


@app.exception_handler(RequestValidationError)
async def _validation_handler(request: Request, exc: RequestValidationError):
    _METRICS["validationErrors"] += 1
    errors = [{"field": ".".join(str(p) for p in e["loc"][1:]), "message": e["msg"]} for e in exc.errors()]
    return JSONResponse(status_code=422, content={"success": False, "error": {
        "code": "VALIDATION_ERROR", "message": "Request failed validation", "details": errors}})


@app.exception_handler(Exception)
async def _error_handler(request: Request, exc: Exception):
    _METRICS["errors"] += 1
    # No input echo — avoid sensitive data in error responses / logs (README §14)
    return JSONResponse(status_code=500, content={"success": False, "error": {
        "code": "INTERNAL_ERROR", "message": "Recommendation service error"}})


@app.get("/health")
def health():
    lat = list(_METRICS["latenciesMs"])
    return _ok({
        "status": "ok",
        "engineVersion": get_config()["engineVersion"],
        "scoreVersion": get_config()["scoreVersion"],
        "startedAt": _METRICS["startedAt"].isoformat(),
        "calculations": _METRICS["calculations"],
        "errors": _METRICS["errors"],
        "validationErrors": _METRICS["validationErrors"],
        "lastSuccessfulCalculationAt": _METRICS["lastSuccessfulCalculationAt"],
        "latencyMsMedian": round(median(lat), 2) if lat else "Not measured",
        "latencySampleSize": len(lat),
    })


@app.get("/config")
def config_view():
    """Transparency: weights, freshness windows and thresholds currently in force."""
    cfg = get_config()
    return _ok({**cfg, "disclaimer": DISCLAIMER})


@app.post("/recommend")
@app.post("/recommendations")
def recommendations(req: RecommendationRequest):
    t = time.perf_counter()
    result = recommend(req)
    ms = (time.perf_counter() - t) * 1000
    _METRICS["calculations"] += 1
    _METRICS["latenciesMs"].append(ms)
    _METRICS["lastSuccessfulCalculationAt"] = datetime.now(timezone.utc).isoformat()
    result["latencyMs"] = round(ms, 2)
    return _ok(result)


class ResourceStatusRequest(BaseModel):
    hospitalId: str
    resourceSnapshots: list[ResourceSnapshot]
    referenceTime: Optional[datetime] = None


@app.post("/resources/status")
def resource_status(body: ResourceStatusRequest):
    """Freshness/provenance labels + reliability for a hospital dashboard (README §7.9)."""
    now = body.referenceTime or datetime.now(timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    cfg = get_config()
    by: dict[str, list] = {}
    for s in body.resourceSnapshots:
        if s.hospitalId == body.hospitalId:
            by.setdefault(s.resourceType, []).append(s)
    out = []
    for rt, lst in sorted(by.items()):
        usable, future = split_snapshots(lst, now)
        snap = latest(usable)
        item = {"resourceType": rt, "provenance": provenance_label(snap, now, cfg),
                "ignoredFutureReports": len(future)}
        if snap is not None:
            item["reliability"] = reliability_for_snapshot(snap, usable, now, cfg)
        out.append(item)
    return _ok({"hospitalId": body.hospitalId, "referenceTime": now.isoformat(), "resources": out})


class CompletenessRequest(BaseModel):
    workflow: str
    record: dict


@app.post("/completeness")
def completeness_check(body: CompletenessRequest):
    try:
        return _ok(completeness.assess(body.record, body.workflow))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


class EscalationRequest(BaseModel):
    caseState: dict
    referenceTime: Optional[datetime] = None


@app.post("/escalations/evaluate")
def escalations(body: EscalationRequest):
    now = body.referenceTime or datetime.now(timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    return _ok(escalation.evaluate_case(body.caseState, now))


class ShortageRequest(BaseModel):
    hospitals: list[dict]
    resourceSnapshots: list[dict]
    expectedDemandByResource: dict[str, float] = Field(default_factory=dict)
    horizonHours: int = 4
    referenceTime: Optional[datetime] = None


@app.post("/shortage/warnings")
def shortage(body: ShortageRequest):
    now = body.referenceTime or datetime.now(timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    return _ok(shortage_warnings(body.hospitals, body.resourceSnapshots, now,
                                 body.expectedDemandByResource or None, body.horizonHours))


class SurgeRequest(BaseModel):
    baseRequest: RecommendationRequest
    cases: list[dict] = Field(..., min_length=1, max_length=500)
    events: list[dict] = Field(default_factory=list)


@app.post("/simulate/surge")
def surge(body: SurgeRequest):
    return _ok(simulate_surge(body.baseRequest.model_dump(mode="json"), body.cases, body.events))
