import json
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
DATA = (Path(__file__).resolve().parents[1] / "data" / "sample-data") if (Path(__file__).resolve().parents[1] / "data" / "sample-data").exists() else (Path(__file__).resolve().parents[2] / "data" / "sample-data")


def test_health_reports_only_measured_values():
    r = client.get("/health").json()
    assert r["success"] and r["data"]["status"] == "ok"
    assert r["data"]["engineVersion"]


def test_config_is_transparent():
    d = client.get("/config").json()["data"]
    assert abs(sum(d["matchWeights"].values()) - 1) < 1e-9
    assert "disclaimer" in d


def test_recommendations_endpoint_demo():
    demo = json.loads((DATA / "demo-scenario.json").read_text())
    r = client.post("/recommendations", json=demo["step1_initialRanking"])
    assert r.status_code == 200
    d = r.json()["data"]
    assert d["candidates"][0]["hospitalId"] == "H01" and "latencyMs" in d
    h = client.get("/health").json()["data"]
    assert h["calculations"] >= 1 and h["lastSuccessfulCalculationAt"]


def test_validation_error_shape():
    r = client.post("/recommendations", json={"emergency": {"caseId": "X", "requiredResources": []}, "hospitals": []})
    assert r.status_code == 422
    body = r.json()
    assert body["success"] is False and body["error"]["code"] == "VALIDATION_ERROR"
    assert any("requiredResources" in d["field"] for d in body["error"]["details"])


def test_resource_status_endpoint():
    snaps = json.loads((DATA / "resourceSnapshots.json").read_text())
    r = client.post("/resources/status", json={"hospitalId": "H08", "resourceSnapshots": snaps,
                                               "referenceTime": "2026-10-13T09:00:00Z"}).json()["data"]
    ct = next(x for x in r["resources"] if x["resourceType"] == "ct_scanner")
    assert ct["reliability"]["components"]["consistency"] == 0.0  # conflicting reports detected


def test_completeness_and_escalation_endpoints():
    c = client.post("/completeness", json={"workflow": "referral_request", "record": {"caseId": "X"}}).json()["data"]
    assert c["requiredComplete"] == 1
    assert client.post("/completeness", json={"workflow": "bad", "record": {}}).status_code == 400
    e = client.post("/escalations/evaluate", json={"referenceTime": "2026-10-13T09:00:00Z", "caseState": {
        "caseId": "X", "referrals": [{"hospitalId": "H", "requestStatus": "sent", "requestedAt": "2026-10-13T08:45:00Z"}]}}).json()["data"]
    assert e["overallLevel"] == "Escalation due"


def test_shortage_endpoint():
    hs = json.loads((DATA / "hospitals.json").read_text())
    sn = json.loads((DATA / "resourceSnapshots.json").read_text())
    w = client.post("/shortage/warnings", json={"hospitals": hs, "resourceSnapshots": sn,
                                                "referenceTime": "2026-10-13T09:00:00Z"}).json()["data"]
    assert any(x["hospitalId"] == "H07" and x["resourceType"] == "burn_bed" for x in w)
