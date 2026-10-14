"""
Generate the FICTIONAL EmergencyLink sample dataset.

All hospitals, ambulances, cases and people are fictional. Coordinates are
placed around Karachi only to make travel estimates realistic for the demo;
names do not refer to real institutions.

Usage:
    python data/generate_data.py                       # fixed reference time (reproducible tests)
    python data/generate_data.py --rebase-to-now       # shift all timestamps so "now" = current UTC (live demo)

Timestamps are relative to REFERENCE_TIME so freshness states are
deterministic: a snapshot generated with age=95 min is always 95 min old at
the reference time.
"""
from __future__ import annotations

import argparse
import json
import random
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "sample-data"
sys.path.insert(0, str(ROOT.parent / "recommendation-service"))

REFERENCE_TIME = datetime(2026, 10, 13, 9, 0, tzinfo=timezone.utc)  # 14:00 PKT

# ---------------------------------------------------------------------------
# Hospitals — each one is engineered to exercise a specific behaviour
# ---------------------------------------------------------------------------
HOSPITALS = [
    ("H01", "Crescent Heart Institute", (24.8607, 67.0420), ["cardiology", "cardiac surgery", "internal medicine"], "operational",
     "Fresh, verified cardiac centre"),
    ("H02", "Seaview Medical Centre", (24.8138, 67.0300), ["emergency medicine", "cardiology", "general surgery", "trauma surgery"], "operational",
     "Closest to Saddar but ICU-bed report is STALE and UNVERIFIED"),
    ("H03", "Northbridge General Hospital", (24.9500, 67.0600), ["general medicine", "general surgery", "orthopedics", "trauma surgery"], "operational",
     "Good capacity, NO cath lab / cardiology (excluded for cardiac cases)"),
    ("H04", "Palm Grove Hospital", (24.9000, 67.1100), ["cardiology", "general medicine"], "operational",
     "ICU-bed report EXPIRED (5 h old) → needs confirmation"),
    ("H05", "Meridian Trauma Centre", (24.8900, 67.0250), ["trauma surgery", "neurosurgery", "orthopedics", "general surgery"], "operational",
     "Dedicated trauma centre, tight ICU/theatre capacity"),
    ("H06", "Lotus Women & Children Hospital", (24.9200, 67.0900), ["obstetrics", "pediatrics", "neonatology"], "operational",
     "Maternal & paediatric specialist"),
    ("H07", "Sunrise Burns & Plastic Surgery Unit", (24.8700, 67.0700), ["burns", "plastic surgery"], "operational",
     "Only 1 burn bed left (shortage warning)"),
    ("H08", "Riverside Neuro Centre", (24.9300, 67.0400), ["neurology", "neurosurgery"], "operational",
     "CONFLICTING CT-scanner reports from two staff members"),
    ("H09", "Greenfield District Hospital", (25.0000, 67.1500), ["general medicine", "obstetrics", "pediatrics"], "operational",
     "Mostly UNVERIFIED reports + a FUTURE-dated record (clock error)"),
    ("H10", "Eastgate Community Hospital", (24.8800, 67.1600), ["general medicine"], "diverting",
     "On DIVERSION (excluded)"),
    ("H11", "Harborline Medical College Hospital", (24.8500, 66.9900),
     ["cardiology", "neurosurgery", "neurology", "trauma surgery", "general surgery", "obstetrics", "pediatrics",
      "burns", "nephrology", "general medicine"], "operational",
     "Large multi-specialty; some stale reports, a missing totalCount, burn beds full"),
    ("H12", "Saffron Valley Hospital", None, ["general medicine", "nephrology"], "operational",
     "LOCATION MISSING → ETA unknown, score incomplete"),
]

# (resourceType, available, total, ageMin, verified, reporter-suffix)
#   verified: True = verifiedAt == reportedAt; False = never verified
SNAPSHOTS = {
    "H01": [("er_bed", 5, 20, 8, True), ("icu_bed", 3, 12, 12, True), ("cath_lab", 1, 2, 20, True),
            ("cardiologist", 2, 3, 15, True), ("ventilator", 4, 10, 40, True), ("ct_scanner", 1, 1, 50, True)],
    "H02": [("er_bed", 6, 25, 5, True), ("icu_bed", 2, 10, 95, False), ("cath_lab", 1, 1, 25, True),
            ("cardiologist", 1, 2, 30, True), ("ct_scanner", 1, 2, 60, True), ("operating_theatre", 2, 6, 20, True),
            ("blood_bank", 1, 1, 100, True), ("trauma_team", 1, 1, 30, True)],
    "H03": [("er_bed", 8, 30, 10, True), ("icu_bed", 4, 15, 18, True), ("ct_scanner", 2, 2, 30, True),
            ("operating_theatre", 3, 8, 15, True), ("blood_bank", 1, 1, 45, True), ("trauma_team", 1, 1, 25, True)],
    "H04": [("er_bed", 4, 15, 12, True), ("icu_bed", 2, 8, 300, True), ("cath_lab", 1, 1, 40, True),
            ("cardiologist", 1, 1, 35, True)],
    "H05": [("er_bed", 3, 18, 6, True), ("icu_bed", 1, 10, 9, True), ("trauma_team", 2, 2, 5, True),
            ("operating_theatre", 1, 5, 7, True), ("ct_scanner", 1, 2, 20, True), ("blood_bank", 1, 1, 30, True),
            ("neurosurgeon", 1, 2, 25, True), ("ventilator", 2, 8, 15, True)],
    "H06": [("er_bed", 5, 12, 14, True), ("nicu_bed", 2, 10, 22, True), ("obstetrician", 2, 3, 10, True),
            ("pediatrician", 2, 4, 12, True), ("operating_theatre", 1, 3, 18, True), ("blood_bank", 1, 1, 50, True),
            ("ventilator", 1, 4, 30, True)],
    "H07": [("er_bed", 2, 6, 20, True), ("burn_bed", 1, 12, 35, True), ("icu_bed", 1, 4, 28, True),
            ("ventilator", 2, 4, 40, True)],
    "H08": [("er_bed", 4, 10, 9, True), ("icu_bed", 2, 8, 15, True), ("ct_scanner", 1, 1, 10, True),
            ("mri_scanner", 1, 1, 60, True), ("neurosurgeon", 1, 2, 20, True)],
    "H09": [("er_bed", 6, 20, 25, False), ("operating_theatre", 1, 3, 40, False), ("obstetrician", 1, 1, 50, False),
            ("pediatrician", 1, 2, 45, True), ("blood_bank", 1, 1, 70, False)],
    "H10": [("er_bed", 0, 10, 10, True), ("icu_bed", 0, 4, 10, True)],
    "H11": [("er_bed", 10, 40, 70, True), ("icu_bed", 3, None, 45, True), ("cath_lab", 1, 2, 30, True),
            ("cardiologist", 1, 4, 40, True), ("trauma_team", 1, 1, 20, True), ("operating_theatre", 2, 10, 25, True),
            ("ct_scanner", 1, 3, 30, True), ("blood_bank", 1, 1, 60, True), ("neurosurgeon", 1, 2, 50, True),
            ("obstetrician", 1, 3, 30, False), ("pediatrician", 1, 3, 30, True), ("burn_bed", 0, 6, 50, True),
            ("mri_scanner", 1, 1, 100, True), ("dialysis", 2, 8, 200, True), ("ventilator", 3, 12, 50, True)],
    "H12": [("er_bed", 3, 10, 15, True), ("dialysis", 3, 6, 40, True)],
}

EMERGENCIES = [
    ("EL-0001", "P1", "Suspected cardiac emergency — needs cath lab", (24.8600, 67.0100),
     [("er_bed", 1), ("cath_lab", 1), ("cardiologist", 1), ("icu_bed", 1)], ["cardiology"], ["ventilator"], []),
    ("EL-0002", "P1", "Major trauma — road traffic collision", (24.9100, 67.0300),
     [("trauma_team", 1), ("operating_theatre", 1), ("ct_scanner", 1), ("blood_bank", 1), ("icu_bed", 1)],
     ["trauma surgery"], ["neurosurgeon"], []),
    ("EL-0003", "P1", "Suspected stroke — needs CT", (24.9400, 67.0800),
     [("er_bed", 1), ("ct_scanner", 1)], ["neurology"], ["mri_scanner", "neurosurgeon"], []),
    ("EL-0004", "P2", "Burn injury", (24.8800, 67.0500),
     [("burn_bed", 1), ("icu_bed", 1)], ["burns"], ["ventilator"], []),
    ("EL-0005", "P1", "Obstetric emergency", (24.9600, 67.1200),
     [("obstetrician", 1), ("operating_theatre", 1), ("blood_bank", 1)], ["obstetrics"], ["nicu_bed"], []),
    ("EL-0006", "P2", "Paediatric respiratory distress", (24.9000, 67.0800),
     [("er_bed", 1), ("pediatrician", 1)], ["pediatrics"], ["ventilator"], []),
    ("EL-0007", "P1", "Multi-patient collision (3 patients)", (24.8700, 67.0300),
     [("er_bed", 3), ("trauma_team", 1), ("blood_bank", 1)], ["trauma surgery"], ["ct_scanner"], []),
    ("EL-0008", "P2", "Cardiac case — caller location not yet known", None,
     [("er_bed", 1), ("cath_lab", 1), ("cardiologist", 1)], ["cardiology"], [], []),
    ("EL-0009", "P3", "Minor injury needing ER assessment", (24.8500, 67.0600),
     [("er_bed", 1)], [], ["ct_scanner"], []),
    ("EL-0010", "P2", "Needs urgent dialysis", (24.8900, 67.0700),
     [("er_bed", 1), ("dialysis", 1)], ["nephrology"], [], []),
]

AMBULANCES = [
    ("AMB-01", "H01", "available", (24.8610, 67.0400), 3),
    ("AMB-02", "H02", "assigned", (24.8200, 67.0310), 2),
    ("AMB-03", "H03", "available", (24.9480, 67.0590), 6),
    ("AMB-04", "H05", "en_route", (24.8950, 67.0280), 1),
    ("AMB-05", "H06", "available", (24.9210, 67.0880), 12),
    ("AMB-06", "H09", "unavailable", (25.0010, 67.1490), 45),
    ("AMB-07", "H11", "available", (24.8520, 66.9920), 4),
    ("AMB-08", None, "available", (24.8800, 67.0500), 8),
]


def iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def build(ref: datetime) -> dict:
    rnd = random.Random(26)
    hospitals = []
    for hid, name, loc, spec, status, note in HOSPITALS:
        hospitals.append({
            "hospitalId": hid, "name": name,
            "location": {"lat": loc[0], "lng": loc[1]} if loc else None,
            "specialties": spec, "status": status, "fictional": True, "_designNote": note,
        })

    snaps, n = [], 0
    for hid, rows in SNAPSHOTS.items():
        for rt, avail, total, age, verified in rows:
            reporter = f"{hid.lower()}.ops"
            # 1–2 older history snapshots from the same reporter (audit trail realism)
            for k in range(rnd.randint(1, 2), 0, -1):
                n += 1
                old_age = age + 60 * k + rnd.randint(5, 40)
                old_avail = max(0, avail + rnd.choice([-1, 0, 1, 1])) if total is None else min(total, max(0, avail + rnd.choice([-1, 0, 1, 1])))
                t = ref - timedelta(minutes=old_age)
                snaps.append({"snapshotId": f"RS-{n:04d}", "hospitalId": hid, "resourceType": rt,
                              "availableCount": old_avail, "totalCount": total, "reportedAt": iso(t),
                              "verifiedAt": iso(t) if verified else None, "reportedBy": reporter,
                              "version": 3 - k})
            n += 1
            t = ref - timedelta(minutes=age)
            snaps.append({"snapshotId": f"RS-{n:04d}", "hospitalId": hid, "resourceType": rt,
                          "availableCount": avail, "totalCount": total, "reportedAt": iso(t),
                          "verifiedAt": iso(t) if verified else None, "reportedBy": reporter, "version": 3})
    # Conflict: H08 CT — ER desk reports CT down 8 minutes after radiology reported it up
    n += 1
    snaps.append({"snapshotId": f"RS-{n:04d}", "hospitalId": "H08", "resourceType": "ct_scanner",
                  "availableCount": 0, "totalCount": 1, "reportedAt": iso(ref - timedelta(minutes=18)),
                  "verifiedAt": None, "reportedBy": "h08.er-desk", "version": 1})
    # Data-quality error: future-dated report from a device with a wrong clock
    n += 1
    snaps.append({"snapshotId": f"RS-{n:04d}", "hospitalId": "H09", "resourceType": "er_bed",
                  "availableCount": 12, "totalCount": 20, "reportedAt": iso(ref + timedelta(minutes=90)),
                  "verifiedAt": None, "reportedBy": "h09.tablet-clock-error", "version": 9})

    emergencies = []
    for cid, prio, desc, loc, req, req_sp, pref, pref_sp in EMERGENCIES:
        emergencies.append({
            "caseId": cid, "priorityCategory": prio, "operationalSummary": desc,
            "location": {"lat": loc[0], "lng": loc[1]} if loc else None,
            "requiredResources": [{"resourceType": r, "minCount": c} for r, c in req],
            "requiredSpecialties": req_sp, "preferredResources": pref, "preferredSpecialties": pref_sp,
            "status": "registered", "createdAt": iso(ref - timedelta(minutes=rnd.randint(1, 6))), "fictional": True,
        })

    ambulances = [{"ambulanceId": a, "hospitalId": h, "status": s,
                   "lastKnownLocation": {"lat": l[0], "lng": l[1]},
                   "lastUpdatedAt": iso(ref - timedelta(minutes=m)), "fictional": True}
                  for a, h, s, l, m in AMBULANCES]

    # Historical referrals — enough for H01/H03/H05 medians; H04 deliberately sparse
    referrals, r = [], 0
    for hid, count, med in [("H01", 14, 4), ("H02", 11, 7), ("H03", 12, 5), ("H05", 15, 3), ("H04", 4, 9), ("H11", 10, 11)]:
        for _ in range(count):
            r += 1
            req_at = ref - timedelta(days=rnd.randint(1, 30), minutes=rnd.randint(0, 1440))
            resp = max(0.5, rnd.gauss(med, med * 0.4))
            referrals.append({"referralId": f"RF-{r:04d}", "caseId": f"EL-H{r:04d}", "hospitalId": hid,
                              "requestStatus": "accepted" if rnd.random() < 0.8 else "rejected",
                              "requestedAt": iso(req_at), "responseAt": iso(req_at + timedelta(minutes=resp)),
                              "respondedBy": f"{hid.lower()}.ops", "fictional": True})
    # Live referrals for the escalation demo
    referrals += [
        {"referralId": "RF-LIVE-1", "caseId": "EL-0002", "hospitalId": "H05", "requestStatus": "sent",
         "requestedAt": iso(ref - timedelta(minutes=12)), "responseAt": None, "respondedBy": None, "fictional": True},
        {"referralId": "RF-LIVE-2", "caseId": "EL-0005", "hospitalId": "H06", "requestStatus": "sent",
         "requestedAt": iso(ref - timedelta(minutes=3)), "responseAt": None, "respondedBy": None, "fictional": True},
    ]

    return {"meta": {"referenceTime": iso(ref), "generator": "data/generate_data.py", "seed": 26,
                     "fictional": True, "note": "All records are fictional. Do not use for real decisions."},
            "hospitals": hospitals, "resourceSnapshots": snaps, "emergencies": emergencies,
            "ambulances": ambulances, "referrals": referrals}


def demo_scenario(ds: dict) -> dict:
    """README §22 demo: 3 contrasting hospitals + 1 'needs confirmation', then a rejection."""
    ref = ds["meta"]["referenceTime"]
    ids = {"H01", "H02", "H03", "H04"}
    case = next(e for e in ds["emergencies"] if e["caseId"] == "EL-0001")
    case = {**case, "caseId": "EL-DEMO-001"}
    ref_dt = datetime.fromisoformat(ref.replace("Z", "+00:00"))
    travel = [
        {"hospitalId": "H01", "etaMinMinutes": 14, "etaMaxMinutes": 17, "source": "live_traffic", "estimatedAt": ref},
        {"hospitalId": "H02", "etaMinutes": 8, "source": "map_routing", "estimatedAt": ref},
        {"hospitalId": "H03", "etaMinMinutes": 11, "etaMaxMinutes": 13, "source": "live_traffic", "estimatedAt": ref},
        {"hospitalId": "H04", "etaMinutes": 16, "source": "map_routing", "estimatedAt": ref},
    ]
    base = {
        "emergency": case,
        "hospitals": [{k: v for k, v in h.items() if not k.startswith("_")} for h in ds["hospitals"] if h["hospitalId"] in ids],
        "resourceSnapshots": [s for s in ds["resourceSnapshots"] if s["hospitalId"] in ids],
        "travelEstimates": travel,
        "referenceTime": ref,
    }
    step2 = json.loads(json.dumps(base))
    step2["referralHistory"] = [{"hospitalId": "H01", "requestStatus": "rejected",
                                 "requestedAt": iso(ref_dt + timedelta(minutes=1)),
                                 "responseAt": iso(ref_dt + timedelta(minutes=4))}]
    step2["referenceTime"] = iso(ref_dt + timedelta(minutes=5))
    return {"description": "EmergencyLink demo — fictional cardiac case EL-DEMO-001",
            "step1_initialRanking": base, "step2_afterRejectionByH01": step2}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--rebase-to-now", action="store_true", help="shift timestamps so reference time = now (UTC)")
    a = ap.parse_args()
    ref = datetime.now(timezone.utc).replace(microsecond=0) if a.rebase_to_now else REFERENCE_TIME
    OUT.mkdir(parents=True, exist_ok=True)
    ds = build(ref)
    for key in ("hospitals", "resourceSnapshots", "emergencies", "ambulances", "referrals"):
        (OUT / f"{key}.json").write_text(json.dumps(ds[key], indent=2))
    (OUT / "meta.json").write_text(json.dumps(ds["meta"], indent=2))
    (OUT / "demo-scenario.json").write_text(json.dumps(demo_scenario(ds), indent=2))

    from app.forecasting import synthetic_arrivals
    df = synthetic_arrivals()
    df[["ts", "arrivals"]].assign(ts=df["ts"].dt.strftime("%Y-%m-%dT%H:%M:%SZ")).to_csv(
        OUT / "historical_arrivals_synthetic.csv", index=False)
    print(f"Wrote dataset to {OUT} (reference time {iso(ref)}): "
          f"{len(ds['hospitals'])} hospitals, {len(ds['resourceSnapshots'])} snapshots, "
          f"{len(ds['emergencies'])} cases, {len(ds['ambulances'])} ambulances, {len(ds['referrals'])} referrals, "
          f"{len(df)} hourly arrival rows")


if __name__ == "__main__":
    main()
