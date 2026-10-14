"""
EmergencyLink recommendation engine — configuration.

Every number in this file is a PROVISIONAL DESIGN ASSUMPTION for the
hackathon prototype. None of them are clinically or operationally validated.
They are kept in one place so they are visible, auditable, versioned and
easy to change after review with operational experts.
"""
from __future__ import annotations

from copy import deepcopy

ENGINE_VERSION = "1.0.0"
SCORE_VERSION = "match-v1.0"
RELIABILITY_VERSION = "reliability-v1.0"

DISCLAIMER = (
    "Match score ranks operational suitability using reported, possibly "
    "incomplete data. It is not a probability of successful treatment, does "
    "not guarantee availability, and requires human review and explicit "
    "receiving-hospital acceptance. Prototype values are illustrative."
)

# ---------------------------------------------------------------------------
# README §8.1 — illustrative ranking formula for ELIGIBLE candidates
#   Score = 0.40 × Travel + 0.30 × Freshness + 0.20 × Capacity + 0.10 × Capability
# ---------------------------------------------------------------------------
MATCH_WEIGHTS = {
    "travelSuitability": 0.40,
    "resourceFreshness": 0.30,
    "capacitySuitability": 0.20,
    "capabilityMatch": 0.10,
}

# ---------------------------------------------------------------------------
# README §7.8 — heuristic resource-data reliability score
# ---------------------------------------------------------------------------
RELIABILITY_WEIGHTS = {
    "freshness": 0.40,
    "confirmation": 0.30,
    "completeness": 0.20,
    "consistency": 0.10,
}
RELIABILITY_LEVELS = [(75, "High"), (50, "Medium"), (0, "Low")]

# ---------------------------------------------------------------------------
# README §7.9 — resource-specific freshness windows (minutes).
#   age <= freshMinutes                 -> "Fresh"
#   freshMinutes < age <= staleMinutes  -> "Stale"   (eligible, flagged, penalised)
#   age > staleMinutes                  -> "Expired" (treated as UNKNOWN —
#                                          "Needs reconfirmation"; never eligible)
# Fast-changing resources (beds) get shorter windows than equipment.
# ---------------------------------------------------------------------------
FRESHNESS_WINDOWS = {
    "er_bed":           {"freshMinutes": 30,  "staleMinutes": 120},
    "icu_bed":          {"freshMinutes": 30,  "staleMinutes": 120},
    "nicu_bed":         {"freshMinutes": 30,  "staleMinutes": 120},
    "burn_bed":         {"freshMinutes": 60,  "staleMinutes": 180},
    "ventilator":       {"freshMinutes": 60,  "staleMinutes": 240},
    "ct_scanner":       {"freshMinutes": 120, "staleMinutes": 480},
    "mri_scanner":      {"freshMinutes": 120, "staleMinutes": 480},
    "cath_lab":         {"freshMinutes": 60,  "staleMinutes": 240},
    "operating_theatre": {"freshMinutes": 30, "staleMinutes": 120},
    "blood_bank":       {"freshMinutes": 120, "staleMinutes": 480},
    "dialysis":         {"freshMinutes": 120, "staleMinutes": 480},
    "trauma_team":      {"freshMinutes": 60,  "staleMinutes": 240},
    "neurosurgeon":     {"freshMinutes": 60,  "staleMinutes": 240},
    "cardiologist":     {"freshMinutes": 60,  "staleMinutes": 240},
    "obstetrician":     {"freshMinutes": 60,  "staleMinutes": 240},
    "pediatrician":     {"freshMinutes": 60,  "staleMinutes": 240},
}
DEFAULT_FRESHNESS_WINDOW = {"freshMinutes": 60, "staleMinutes": 240}

# Freshness score curve: 100 at age 0 -> FRESH_EDGE_SCORE at freshMinutes
# -> STALE_EDGE_SCORE at staleMinutes. Linear inside each segment.
FRESH_EDGE_SCORE = 70.0
STALE_EDGE_SCORE = 10.0

# Unverified (not explicitly confirmed by an authorised hospital user)
# reports lose this many freshness points in the match score.
UNVERIFIED_FRESHNESS_PENALTY = 15.0

# ---------------------------------------------------------------------------
# Travel suitability (0–100) from the conservative (upper) ETA bound.
#   ETA <= best  -> 100
#   ETA >= worst -> 0
#   linear between
# ---------------------------------------------------------------------------
TRAVEL = {
    "bestMinutes": 8.0,
    "worstMinutes": 60.0,
    # Straight-line fallback when no routing service is available:
    "roadDetourFactor": 1.4,       # road distance ≈ 1.4 × great-circle distance
    "fallbackSpeedKmhFast": 40.0,  # optimistic urban ambulance speed
    "fallbackSpeedKmhSlow": 22.0,  # congested urban ambulance speed
    "dispatchOverheadMinutes": 2.0,
    # Range widening applied when a provider gives only a point estimate
    "noTrafficRangeFactor": 1.35,  # map routing without live traffic
    "liveTrafficRangeFactor": 1.15,
    "manualRangeFactor": 1.5,
}
ETA_RELIABILITY_BY_SOURCE = {
    "live_traffic": "High",
    "map_routing": "Medium",
    "manual": "Low",
    "straight_line_estimate": "Low",
}

# ---------------------------------------------------------------------------
# Capacity suitability: per required resource
#   available == required                -> CAPACITY_AT_MINIMUM
#   available >= required + buffer       -> 100
# Hospital-level value = weakest required resource (conservative).
# ---------------------------------------------------------------------------
CAPACITY_AT_MINIMUM = 40.0
CAPACITY_BUFFER = {
    "er_bed": 4, "icu_bed": 3, "nicu_bed": 2, "burn_bed": 2,
    "ventilator": 3, "operating_theatre": 2,
}
DEFAULT_CAPACITY_BUFFER = 1  # equipment/teams: 1 spare unit is "comfortable"

# Conflict detection: two snapshots for the same resource from different
# reporters within this window whose availability disagrees.
CONFLICT_WINDOW_MINUTES = 30

# Ambiguity: candidates whose scores differ by less than this are flagged
# as "near-tie — compare factors manually".
NEAR_TIE_POINTS = 3.0

# Explanation thresholds for "raised" / "lowered" factor labelling
FACTOR_STRONG = 75.0
FACTOR_WEAK = 50.0

# Hospital statuses that exclude a candidate (hard constraint)
EXCLUDING_HOSPITAL_STATUSES = {
    "closed": "Hospital reported closed",
    "diverting": "Hospital on diversion — not accepting emergency arrivals",
    "offline": "Hospital marked offline by administrator",
}

# ---------------------------------------------------------------------------
# README §7.16 / §7.12 — escalation & referral thresholds (minutes)
# ---------------------------------------------------------------------------
ESCALATION = {
    "referralAttentionMinutes": 5,
    "referralEscalationMinutes": 10,
    "referralTimeoutMinutes": 15,
    "assignmentAfterConfirmationMinutes": 5,
    "offlineQueueAgeMinutes": 15,
    "handoverMissingAfterArrivalMinutes": 20,
}

# README §7.15 — shortage early warning thresholds
SHORTAGE = {
    "remainingRatioWarning": 0.20,   # <=20% of total remaining -> Potential shortage
    "remainingAbsoluteWarning": 1,   # <=1 unit left -> Potential shortage
    "demandPressureRatio": 1.0,      # expected arrivals in horizon >= remaining -> High reported demand
    # Only consumable capacity is monitored; singleton equipment/teams (1 CT, 1 cath lab)
    # would otherwise trigger permanent "1 unit remaining" noise.
    "monitoredResources": ["er_bed", "icu_bed", "nicu_bed", "burn_bed", "ventilator", "operating_theatre"],
}


def get_config(overrides: dict | None = None) -> dict:
    """Return a full config dict, optionally deep-merged with overrides."""
    cfg = {
        "engineVersion": ENGINE_VERSION,
        "scoreVersion": SCORE_VERSION,
        "reliabilityVersion": RELIABILITY_VERSION,
        "matchWeights": deepcopy(MATCH_WEIGHTS),
        "reliabilityWeights": deepcopy(RELIABILITY_WEIGHTS),
        "freshnessWindows": deepcopy(FRESHNESS_WINDOWS),
        "defaultFreshnessWindow": deepcopy(DEFAULT_FRESHNESS_WINDOW),
        "travel": deepcopy(TRAVEL),
        "capacityBuffer": deepcopy(CAPACITY_BUFFER),
        "defaultCapacityBuffer": DEFAULT_CAPACITY_BUFFER,
        "conflictWindowMinutes": CONFLICT_WINDOW_MINUTES,
        "nearTiePoints": NEAR_TIE_POINTS,
        "escalation": deepcopy(ESCALATION),
        "shortage": deepcopy(SHORTAGE),
    }
    if overrides:
        _deep_merge(cfg, overrides)
    w = cfg["matchWeights"]
    total = sum(w.values())
    if abs(total - 1.0) > 1e-6:
        raise ValueError(f"matchWeights must sum to 1.0 (got {total:.4f})")
    return cfg


def _deep_merge(base: dict, extra: dict) -> None:
    for k, v in extra.items():
        if isinstance(v, dict) and isinstance(base.get(k), dict):
            _deep_merge(base[k], v)
        else:
            base[k] = v
