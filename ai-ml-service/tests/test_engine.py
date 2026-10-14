import copy
import json
import random
from pathlib import Path

import pytest

from app.config import get_config
from app.engine import recommend
from scenario_loader import check, load_scenarios
from fuzz import check_invariants, random_request

SCENARIOS = load_scenarios()
DATA = (Path(__file__).resolve().parents[1] / "data" / "sample-data") if (Path(__file__).resolve().parents[1] / "data" / "sample-data").exists() else (Path(__file__).resolve().parents[2] / "data" / "sample-data")


# ---------------------------------------------------------------- scenarios
@pytest.mark.parametrize("sc,req", SCENARIOS, ids=[s["id"] for s, _ in SCENARIOS])
def test_predefined_scenario(sc, req):
    res = recommend(req)
    assert check(sc, res) == []


# ------------------------------------------------------------ demo scenario
def test_demo_step1_initial_ranking():
    demo = json.loads((DATA / "demo-scenario.json").read_text())
    r = recommend(demo["step1_initialRanking"])
    assert [c["hospitalId"] for c in r["candidates"]] == ["H01", "H02"]
    assert [c["hospitalId"] for c in r["needsConfirmation"]] == ["H04"]
    assert [c["hospitalId"] for c in r["excluded"]] == ["H03"]
    h02 = r["candidates"][1]
    assert {f["code"] for f in h02["flags"]} >= {"STALE", "UNCONFIRMED"}
    assert r["candidates"][0]["matchScore"] == pytest.approx(77.5, abs=0.2)  # hand-calculated in docs


def test_demo_step2_after_rejection():
    demo = json.loads((DATA / "demo-scenario.json").read_text())
    r = recommend(demo["step2_afterRejectionByH01"])
    assert [c["hospitalId"] for c in r["candidates"]] == ["H02"]
    ex = {c["hospitalId"]: c for c in r["excluded"]}
    assert "Rejected this referral" in ex["H01"]["reasons"][0]
    assert any("Only one eligible" in w for w in r["warnings"])


# --------------------------------------------------------------- properties
@pytest.mark.parametrize("seed", range(300))
def test_invariants_random(seed):
    req = random_request(random.Random(seed))
    res = recommend(req)
    assert check_invariants(req, res) == []


def test_reproducible():
    req = random_request(random.Random(7), n_hospitals=20)
    a, b = recommend(copy.deepcopy(req)), recommend(copy.deepcopy(req))
    for k in ("generatedAt",):
        a.pop(k), b.pop(k)
    assert a == b


def test_input_order_does_not_change_ranking():
    req = random_request(random.Random(11), n_hospitals=25)
    base = [c["hospitalId"] for c in recommend(req)["candidates"]]
    for s in range(5):
        r2 = copy.deepcopy(req)
        random.Random(s).shuffle(r2["hospitals"])
        random.Random(s).shuffle(r2["resourceSnapshots"])
        assert [c["hospitalId"] for c in recommend(r2)["candidates"]] == base


def test_monotonic_in_travel_time():
    """Making one eligible hospital's ETA shorter must never lower its score."""
    sc, req = next((s, r) for s, r in SCENARIOS if s["id"] == "S01")
    base = {c["hospitalId"]: c["matchScore"] for c in recommend(req)["candidates"]}
    faster = copy.deepcopy(req)
    for t in faster["travelEstimates"]:
        if t["hospitalId"] == "B":
            t["etaMinMinutes"], t["etaMaxMinutes"] = 15, 18
    new = {c["hospitalId"]: c["matchScore"] for c in recommend(faster)["candidates"]}
    assert new["B"] >= base["B"]


def test_custom_weights_must_sum_to_one():
    with pytest.raises(ValueError):
        get_config({"matchWeights": {"travelSuitability": 0.9}})


def test_weights_change_ranking_as_expected():
    """Freshness-heavy weights should prefer the fresher (farther) hospital."""
    req = load_scenarios()[0][1]
    req = copy.deepcopy(req)
    req["resourceSnapshots"][0]["reportedAt"] = "2026-10-13T07:40:00Z"   # A stale (80 min)
    req["resourceSnapshots"][0]["verifiedAt"] = "2026-10-13T07:40:00Z"
    default = [c["hospitalId"] for c in recommend(req)["candidates"]]
    fresh_cfg = get_config({"matchWeights": {"travelSuitability": 0.1, "resourceFreshness": 0.7,
                                             "capacitySuitability": 0.1, "capabilityMatch": 0.1}})
    fresh = [c["hospitalId"] for c in recommend(req, fresh_cfg)["candidates"]]
    assert fresh[0] == "B"
    assert default != fresh or default[0] == "B"


# --------------------------------------------------------------- validation
def _minimal():
    return {"emergency": {"caseId": "X", "requiredResources": [{"resourceType": "er_bed"}]},
            "hospitals": [{"hospitalId": "H", "name": "H"}], "referenceTime": "2026-10-13T09:00:00Z"}


@pytest.mark.parametrize("mutate,msg", [
    (lambda r: r["emergency"].pop("caseId"), "caseId"),
    (lambda r: r["emergency"].update(requiredResources=[]), "requiredResources"),
    (lambda r: r["emergency"]["requiredResources"][0].update(minCount=0), "minCount"),
    (lambda r: r["emergency"].update(requiredResources=[{"resourceType": "er_bed"}, {"resourceType": "er_bed"}]), "duplicate"),
    (lambda r: r.update(hospitals=[]), "hospitals"),
    (lambda r: r.update(hospitals=[{"hospitalId": "H", "name": "a"}, {"hospitalId": "H", "name": "b"}]), "duplicate"),
    (lambda r: r.update(resourceSnapshots=[{"hospitalId": "H", "resourceType": "er_bed", "availableCount": -1,
                                            "reportedAt": "2026-10-13T08:00:00Z"}]), "availableCount"),
    (lambda r: r.update(resourceSnapshots=[{"hospitalId": "H", "resourceType": "er_bed", "availableCount": 5, "totalCount": 2,
                                            "reportedAt": "2026-10-13T08:00:00Z"}]), "exceeds"),
    (lambda r: r["hospitals"][0].update(status="maybe"), "status"),
    (lambda r: r.update(travelEstimates=[{"hospitalId": "H", "source": "live_traffic"}]), "etaMinutes"),
    (lambda r: r["emergency"].update(location={"lat": 123, "lng": 0}), "lat"),
])
def test_invalid_inputs_rejected(mutate, msg):
    from pydantic import ValidationError
    r = _minimal()
    mutate(r)
    with pytest.raises(ValidationError) as e:
        recommend(r)
    assert msg.lower() in str(e.value).lower()


def test_naive_timestamps_treated_as_utc():
    r = _minimal()
    r["resourceSnapshots"] = [{"hospitalId": "H", "resourceType": "er_bed", "availableCount": 2,
                               "reportedAt": "2026-10-13T08:55:00", "verifiedAt": "2026-10-13T08:55:00"}]
    res = recommend(r)
    assert res["candidates"][0]["resources"]["er_bed"]["ageMinutes"] == 5.0


def test_disclaimer_and_human_review_always_present():
    res = recommend(_minimal())
    assert res["requiresHumanReview"] is True
    assert "not a probability" in res["disclaimer"]
    for c in res["candidates"]:
        assert "acceptance required" in c["referralStatus"]
