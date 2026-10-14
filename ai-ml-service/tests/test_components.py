from datetime import datetime, timedelta, timezone

import pytest

from app import completeness, escalation
from app.config import get_config
from app.eta import haversine_km, resolve_eta, travel_suitability
from app.reliability import freshness_curve, freshness_state, provenance_label, reliability_for_snapshot
from app.schemas import GeoPoint, Hospital, ResourceSnapshot, TravelEstimate
from app.shortage import shortage_warnings, simulate_surge

NOW = datetime(2026, 10, 13, 9, 0, tzinfo=timezone.utc)
CFG = get_config()


def snap(age, a=3, t=10, verified=True, by="x.ops", rt="icu_bed"):
    ts = NOW - timedelta(minutes=age)
    return ResourceSnapshot(hospitalId="H", resourceType=rt, availableCount=a, totalCount=t,
                            reportedAt=ts, verifiedAt=ts if verified else None, reportedBy=by)


# ------------------------------------------------------------ freshness
@pytest.mark.parametrize("age,state", [(0, "Fresh"), (30, "Fresh"), (31, "Stale"), (120, "Stale"), (121, "Expired")])
def test_freshness_state_icu(age, state):
    assert freshness_state(age, CFG["freshnessWindows"]["icu_bed"]) == state


def test_freshness_curve_shape():
    w = {"freshMinutes": 30, "staleMinutes": 120}
    vals = [freshness_curve(a, w) for a in range(0, 200, 5)]
    assert vals[0] == 100 and freshness_curve(30, w) == pytest.approx(70)
    assert freshness_curve(120, w) == pytest.approx(10) and freshness_curve(500, w) == 0
    assert all(x >= y for x, y in zip(vals, vals[1:]))  # monotonic non-increasing


def test_expired_available_is_never_shown_as_available():
    p = provenance_label(snap(500), NOW, CFG)
    assert p["state"] == "Needs reconfirmation" and "Unknown" in p["statusText"]


def test_provenance_label_text():
    p = provenance_label(snap(4), NOW, CFG)
    assert p["label"].startswith("Reported available (3) · Updated 4 min ago")
    assert provenance_label(None, NOW, CFG)["state"] == "Unknown"
    assert provenance_label(snap(4, verified=False), NOW, CFG)["state"] == "Unconfirmed"


# ------------------------------------------------------------ reliability
def test_reliability_weights_and_renormalisation():
    s = snap(0)
    r = reliability_for_snapshot(s, [s], NOW, CFG)
    # no comparison data → consistency None → 0.4/0.3/0.2 re-normalised to 1.0
    assert r["components"]["consistency"] is None
    assert r["score"] == 100.0 and r["level"] == "High"
    assert sum(r["weightsApplied"].values()) == pytest.approx(1.0, abs=2e-3)


def test_reliability_drops_without_confirmation_and_fields():
    s = ResourceSnapshot(hospitalId="H", resourceType="icu_bed", availableCount=3, reportedAt=NOW)
    r = reliability_for_snapshot(s, [s], NOW, CFG)
    # freshness 100*0.4/0.9 + confirmation 0 + completeness 33.3*0.2/0.9
    assert r["score"] == pytest.approx((40 + 0 + 0.2 * 100 / 3) / 0.9, abs=0.2)
    assert r["level"] == "Medium"


def test_consistency_component_agreement():
    a, b = snap(2, a=3, by="x.ops"), snap(5, a=4, by="x.er")
    r = reliability_for_snapshot(a, [a, b], NOW, CFG)
    assert r["components"]["consistency"] == 100.0
    c = snap(5, a=0, by="x.er")
    assert reliability_for_snapshot(a, [a, c], NOW, CFG)["components"]["consistency"] == 0.0


# ------------------------------------------------------------ ETA
def test_haversine_known_distance():
    # ~1 degree latitude ≈ 111 km
    assert haversine_km(GeoPoint(lat=0, lng=0), GeoPoint(lat=1, lng=0)) == pytest.approx(111.2, abs=0.3)


def test_eta_point_estimate_widened_and_labelled():
    h = Hospital(hospitalId="H", name="H")
    e = resolve_eta(h, None, [TravelEstimate(hospitalId="H", etaMinutes=12, source="map_routing", estimatedAt=NOW)], NOW, CFG)
    assert e["minMinutes"] == 12 and e["maxMinutes"] == pytest.approx(16.2)
    assert "live traffic unavailable" in e["label"] and e["reliability"] == "Medium"


def test_eta_best_source_wins_and_stale_downgrades():
    h = Hospital(hospitalId="H", name="H")
    ests = [TravelEstimate(hospitalId="H", etaMinutes=20, source="manual", estimatedAt=NOW),
            TravelEstimate(hospitalId="H", etaMinutes=10, source="live_traffic", estimatedAt=NOW - timedelta(minutes=40))]
    e = resolve_eta(h, None, ests, NOW, CFG)
    assert e["source"] == "live_traffic" and e["reliability"] == "Medium"  # High downgraded (stale estimate)


def test_eta_straight_line_and_unknown():
    h = Hospital(hospitalId="H", name="H", location=GeoPoint(lat=24.90, lng=67.05))
    e = resolve_eta(h, GeoPoint(lat=24.86, lng=67.01), [], NOW, CFG)
    assert e["source"] == "straight_line_estimate" and e["reliability"] == "Low" and e["minMinutes"] < e["maxMinutes"]
    u = resolve_eta(Hospital(hospitalId="H", name="H"), GeoPoint(lat=24.86, lng=67.01), [], NOW, CFG)
    assert u["known"] is False and travel_suitability(u, CFG) is None
    assert "Hospital location unavailable" in u["label"]


@pytest.mark.parametrize("mx,score", [(5, 100), (8, 100), (34, 50), (60, 0), (90, 0)])
def test_travel_suitability_curve(mx, score):
    assert travel_suitability({"known": True, "maxMinutes": mx}, CFG) == pytest.approx(score)


# ------------------------------------------------------------ completeness
def test_completeness_label_and_missing():
    r = completeness.assess({"caseId": "X", "requiredResources": [{"resourceType": "er_bed"}], "location": None,
                             "priorityCategory": "P1", "createdAt": "2026-10-13T09:00:00Z"}, "emergency_registration")
    assert r["label"] == "Required fields: 4 of 5 complete" and r["missingRequired"] == ["location"]
    assert r["percent"] == 80 and r["canSubmit"] is False and r["displayName"] == "Data completeness"


def test_completeness_unknown_workflow():
    with pytest.raises(ValueError):
        completeness.assess({}, "nope")


# ------------------------------------------------------------ escalation
def test_referral_timer_levels():
    base = {"hospitalId": "H", "requestStatus": "sent"}
    lv = lambda m: escalation.referral_timer({**base, "requestedAt": NOW - timedelta(minutes=m)}, NOW)["level"]
    assert lv(2) == "OK" and lv(6) == "Attention needed" and lv(11) == "Escalation due"
    t = escalation.referral_timer({**base, "requestedAt": NOW - timedelta(minutes=16)}, NOW)
    assert t["state"] == "Timed out"
    done = escalation.referral_timer({**base, "requestStatus": "accepted", "requestedAt": NOW - timedelta(minutes=9),
                                      "responseAt": NOW - timedelta(minutes=5)}, NOW)
    assert done["level"] == "Resolved" and done["responseMinutes"] == 4.0


def test_escalation_lists_every_blocker():
    st = {"caseId": "C", "referrals": [{"referralId": "R1", "hospitalId": "H1", "requestStatus": "sent",
                                        "requestedAt": NOW - timedelta(minutes=12)}],
          "requiredResourceStates": {"icu_bed": "Conflicting", "ct_scanner": "Stale"},
          "destinationConfirmedAt": NOW - timedelta(minutes=8), "assignment": None,
          "offlineQueue": [{"clientEventId": "e1", "queuedAt": NOW - timedelta(minutes=20)}]}
    r = escalation.evaluate_case(st, NOW)
    rules = {i["rule"] for i in r["items"]}
    assert rules == {"REFERRAL_UNANSWERED", "RESOURCE_UNCERTAIN", "RESOURCE_STALE", "NO_AMBULANCE_ASSIGNED", "OFFLINE_UNSYNCED"}
    assert r["overallLevel"] == "Escalation due" and r["blockerCount"] == 3
    assert "score" not in r  # no aggregate risk number


def test_historical_summary_requires_sample_size():
    refs = [{"hospitalId": "H", "requestStatus": "accepted", "requestedAt": NOW - timedelta(days=i, minutes=5),
             "responseAt": NOW - timedelta(days=i)} for i in range(1, 5)]
    assert escalation.historical_response_summary(refs, "H")["available"] is False
    refs *= 3
    s = escalation.historical_response_summary(refs, "H")
    assert s["available"] and s["medianResponseMinutes"] == 5.0 and s["sampleSize"] == 12


# ------------------------------------------------------------ shortage & surge
def test_shortage_warning_rules():
    hs = [{"hospitalId": "H", "name": "H"}]
    sn = [{"hospitalId": "H", "resourceType": "burn_bed", "availableCount": 1, "totalCount": 12,
           "reportedAt": (NOW - timedelta(minutes=10)).isoformat()},
          {"hospitalId": "H", "resourceType": "er_bed", "availableCount": 8, "totalCount": 20,
           "reportedAt": (NOW - timedelta(minutes=10)).isoformat()},
          {"hospitalId": "H", "resourceType": "icu_bed", "availableCount": 0, "totalCount": 5,
           "reportedAt": (NOW - timedelta(minutes=900)).isoformat()}]
    w = shortage_warnings(hs, sn, NOW, expected_demand={"er_bed": 9.0})
    by = {x["resourceType"]: x for x in w}
    assert by["burn_bed"]["warning"] == "Potential shortage"
    assert by["er_bed"]["warning"] == "High reported demand"
    assert "icu_bed" not in by  # expired data → no warning claimed
    assert all("not a prediction" in x["note"] for x in w)


def test_surge_simulation_consumes_capacity():
    hosp = [{"hospitalId": f"H{i}", "name": f"H{i}", "location": {"lat": 24.86 + i * 0.01, "lng": 67.0}} for i in range(3)]
    sn = [{"hospitalId": f"H{i}", "resourceType": "er_bed", "availableCount": 2, "totalCount": 10,
           "reportedAt": NOW.isoformat(), "verifiedAt": NOW.isoformat(), "reportedBy": "x"} for i in range(3)]
    base = {"emergency": {"caseId": "B", "requiredResources": [{"resourceType": "er_bed"}]}, "hospitals": hosp,
            "resourceSnapshots": sn, "referenceTime": NOW.isoformat()}
    cases = [{"caseId": f"S{i}", "requiredResources": [{"resourceType": "er_bed"}], "location": {"lat": 24.86, "lng": 67.0},
              "minuteOffset": i} for i in range(8)]
    r = simulate_surge(base, cases, [{"minuteOffset": 3, "type": "hospital_closure", "hospitalId": "H2"}])
    assert r["timeline"][0]["totalRemaining"] == 5
    assert r["unplacedCases"] >= 3  # 6 beds total, H2 closes at minute 3 → capacity runs out
    assert r["timeline"][-1]["eligible"] == 0
