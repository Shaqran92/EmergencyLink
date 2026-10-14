"""
Pydantic schemas — the recommendation input/output contract shared with the
MERN backend. Field names follow README §13 (MongoDB collections).
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator

ResourceStatus = Literal["available", "unavailable", "unknown"]
HospitalStatus = Literal["operational", "closed", "diverting", "offline"]
RouteSource = Literal["live_traffic", "map_routing", "manual"]
ReferralStatus = Literal[
    "sent", "viewed", "accepted", "rejected", "clarification_requested", "timed_out", "cancelled"
]


def _utc(v: Optional[datetime]) -> Optional[datetime]:
    """Treat naive datetimes as UTC (README §13: store timestamps in UTC)."""
    if v is None:
        return v
    if v.tzinfo is None:
        return v.replace(tzinfo=timezone.utc)
    return v.astimezone(timezone.utc)


class GeoPoint(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)


class RequiredResource(BaseModel):
    resourceType: str = Field(..., min_length=1, max_length=64)
    minCount: int = Field(1, ge=1, le=1000)


class EmergencyCase(BaseModel):
    caseId: str = Field(..., min_length=1, max_length=64)
    priorityCategory: Optional[str] = Field(
        None, description="Operational category assigned by a human (not computed here)."
    )
    requiredResources: list[RequiredResource] = Field(..., min_length=1)
    requiredSpecialties: list[str] = Field(default_factory=list)
    preferredResources: list[str] = Field(default_factory=list)
    preferredSpecialties: list[str] = Field(default_factory=list)
    location: Optional[GeoPoint] = None
    createdAt: Optional[datetime] = None
    status: Optional[str] = None

    _tz = field_validator("createdAt")(lambda cls, v: _utc(v))

    @model_validator(mode="after")
    def _no_duplicate_required(self):
        types = [r.resourceType for r in self.requiredResources]
        if len(types) != len(set(types)):
            raise ValueError("requiredResources contains duplicate resourceType entries")
        return self


class Hospital(BaseModel):
    hospitalId: str = Field(..., min_length=1, max_length=64)
    name: str = Field(..., min_length=1, max_length=200)
    location: Optional[GeoPoint] = None
    specialties: list[str] = Field(default_factory=list)
    status: HospitalStatus = "operational"
    fictional: Optional[bool] = None


class ResourceSnapshot(BaseModel):
    snapshotId: Optional[str] = None
    hospitalId: str
    resourceType: str
    availableCount: Optional[int] = Field(None, ge=0)
    totalCount: Optional[int] = Field(None, ge=0)
    status: Optional[ResourceStatus] = None
    reportedAt: datetime
    verifiedAt: Optional[datetime] = None
    reportedBy: Optional[str] = None
    version: Optional[int] = None

    _tz = field_validator("reportedAt", "verifiedAt")(lambda cls, v: _utc(v))

    @model_validator(mode="after")
    def _derive_status(self):
        if (
            self.totalCount is not None
            and self.availableCount is not None
            and self.availableCount > self.totalCount
        ):
            raise ValueError(
                f"availableCount ({self.availableCount}) exceeds totalCount ({self.totalCount})"
            )
        if self.status is None:
            if self.availableCount is None:
                self.status = "unknown"
            else:
                self.status = "available" if self.availableCount > 0 else "unavailable"
        return self

    def effective_available(self) -> Optional[int]:
        """Count used for hard-constraint checks. None = unknown."""
        if self.status == "unknown":
            return None
        if self.status == "unavailable":
            return 0
        # status == available
        return self.availableCount if self.availableCount is not None else None


class TravelEstimate(BaseModel):
    hospitalId: str
    etaMinutes: Optional[float] = Field(None, ge=0)
    etaMinMinutes: Optional[float] = Field(None, ge=0)
    etaMaxMinutes: Optional[float] = Field(None, ge=0)
    source: RouteSource = "map_routing"
    estimatedAt: Optional[datetime] = None

    _tz = field_validator("estimatedAt")(lambda cls, v: _utc(v))

    @model_validator(mode="after")
    def _check(self):
        if self.etaMinutes is None and (self.etaMinMinutes is None or self.etaMaxMinutes is None):
            raise ValueError("Provide etaMinutes or both etaMinMinutes and etaMaxMinutes")
        if (
            self.etaMinMinutes is not None
            and self.etaMaxMinutes is not None
            and self.etaMinMinutes > self.etaMaxMinutes
        ):
            raise ValueError("etaMinMinutes cannot exceed etaMaxMinutes")
        return self


class ReferralRecord(BaseModel):
    hospitalId: str
    requestStatus: ReferralStatus
    requestedAt: Optional[datetime] = None
    responseAt: Optional[datetime] = None

    _tz = field_validator("requestedAt", "responseAt")(lambda cls, v: _utc(v))


class RecommendationRequest(BaseModel):
    emergency: EmergencyCase
    hospitals: list[Hospital] = Field(..., min_length=1)
    resourceSnapshots: list[ResourceSnapshot] = Field(default_factory=list)
    travelEstimates: list[TravelEstimate] = Field(default_factory=list)
    referralHistory: list[ReferralRecord] = Field(
        default_factory=list,
        description="Previous referrals for THIS case (rejections exclude the hospital).",
    )
    referenceTime: Optional[datetime] = Field(
        None,
        description="Evaluation clock (UTC). Defaults to server time. Fix it for reproducible tests.",
    )
    maxCandidates: int = Field(10, ge=1, le=100)

    _tz = field_validator("referenceTime")(lambda cls, v: _utc(v))

    @model_validator(mode="after")
    def _unique_hospitals(self):
        ids = [h.hospitalId for h in self.hospitals]
        if len(ids) != len(set(ids)):
            raise ValueError("hospitals contains duplicate hospitalId values")
        return self
