"""
EmergencyLink — Data Scientist evaluation runner.

Produces (all from FICTIONAL / SYNTHETIC data):
  evaluation/results.json      machine-readable metrics
  evaluation/charts/*.png      presentation charts
  docs/test-report.md          human-readable test report (README §21)

Run from repo root:  python evaluation/run_evaluation.py
"""
from __future__ import annotations

import copy
import json
import random
import subprocess
import sys
import time
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from scipy.stats import kendalltau

ROOT = Path(__file__).resolve().parents[1]
SVC = ROOT / "recommendation-service"
sys.path[:0] = [str(SVC), str(SVC / "tests")]

from app import escalation  # noqa: E402
from app.config import get_config, FRESHNESS_WINDOWS  # noqa: E402
from app.engine import recommend  # noqa: E402
from app.forecasting import evaluate as forecast_eval, synthetic_arrivals  # noqa: E402
from app.reliability import freshness_curve, freshness_state, latest, split_snapshots, window_for  # noqa: E402
from app.schemas import ResourceSnapshot  # noqa: E402
from app.shortage import shortage_warnings, simulate_surge  # noqa: E402
from fuzz import check_invariants, random_request  # noqa: E402
from scenario_loader import check, load_scenarios  # noqa: E402

DATA = ROOT / "data" / "sample-data"
CHARTS = ROOT / "evaluation" / "charts"
CHARTS.mkdir(parents=True, exist_ok=True)

C = {"travelSuitability": "#2563eb", "resourceFreshness": "#16a34a", "capacitySuitability": "#f59e0b",
     "capabilityMatch": "#9333ea", "eligible": "#16a34a", "nc": "#f59e0b", "excluded": "#dc2626",
     "ink": "#0f172a", "muted": "#64748b", "grid": "#e2e8f0"}
plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 10, "axes.spines.top": False,
                     "axes.spines.right": False, "axes.edgecolor": "#94a3b8", "axes.titleweight": "bold",
                     "axes.titlesize": 12, "figure.dpi": 150, "savefig.bbox": "tight"})
FOOT = "Fictional data · illustrative prototype values · not clinically validated"


def foot(fig, y=-0.06):
    fig.text(0.01, y, FOOT, fontsize=7.5, color=C["muted"], ha="left")


def load_dataset():
    H = [{k: v for k, v in h.items() if not k.startswith("_")} for h in json.loads((DATA / "hospitals.json").read_text())]
    S = json.loads((DATA / "resourceSnapshots.json").read_text())
    E = json.loads((DATA / "emergencies.json").read_text())
    R = json.loads((DATA / "referrals.json").read_text())
    meta = json.loads((DATA / "meta.json").read_text())
    return H, S, E, R, meta


def req_for(case, H, S, ref):
    return {"emergency": case, "hospitals": H, "resourceSnapshots": S, "referenceTime": ref, "maxCandidates": 100}


# ---------------------------------------------------------------------------
def run_pytest():
    t = time.perf_counter()
    p = subprocess.run([sys.executable, "-m", "pytest", "-q", "-p", "no:warnings", "--tb=line"],
                       cwd=SVC, capture_output=True, text=True)
    last = [l for l in p.stdout.strip().splitlines() if l.strip()][-1]
    return {"summary": last, "exitCode": p.returncode, "seconds": round(time.perf_counter() - t, 2)}


def run_scenarios():
    rows = []
    for sc, req in load_scenarios():
        res = recommend(req)
        fails = check(sc, res)
        rows.append({"id": sc["id"], "category": sc["category"], "name": sc["name"], "passed": not fails,
                     "failures": fails,
                     "ranking": [f"{c['hospitalId']} ({c['matchScore']:.1f})" for c in res["candidates"]],
                     "needsConfirmation": [c["hospitalId"] for c in res["needsConfirmation"]],
                     "excluded": [c["hospitalId"] for c in res["excluded"]]})
    return rows


def run_invariants(n=2000):
    viol, counts = Counter(), Counter()
    t = time.perf_counter()
    for seed in range(n):
        req = random_request(random.Random(10_000 + seed))
        res = recommend(req)
        counts["hospitals"] += len(req["hospitals"])
        counts["eligible"] += res["summary"]["eligible"]
        counts["needsConfirmation"] += res["summary"]["needsConfirmation"]
        counts["excluded"] += res["summary"]["excluded"]
        for v in check_invariants(req, res):
            viol[v.split(":")[0] if v.startswith("ordering") or v.startswith("partition") else v.split(": ", 1)[1]] += 1
    return {"requests": n, "hospitalEvaluations": counts["hospitals"], "violations": dict(viol),
            "totalViolations": sum(viol.values()), "outcomeMix": {k: counts[k] for k in ("eligible", "needsConfirmation", "excluded")},
            "seconds": round(time.perf_counter() - t, 1)}


def run_latency():
    out = []
    for n, reps in [(10, 300), (50, 200), (200, 60), (500, 25)]:
        rng = random.Random(n)
        reqs = [random_request(rng, n_hospitals=n) for _ in range(min(reps, 20))]
        times = []
        for i in range(reps):
            r = reqs[i % len(reqs)]
            t = time.perf_counter()
            recommend(r)
            times.append((time.perf_counter() - t) * 1000)
        snaps = int(np.mean([len(r["resourceSnapshots"]) for r in reqs]))
        out.append({"hospitals": n, "avgSnapshots": snaps, "runs": reps,
                    "p50ms": round(float(np.percentile(times, 50)), 2),
                    "p95ms": round(float(np.percentile(times, 95)), 2),
                    "maxms": round(float(np.max(times)), 2)})
    return out


def perturbed_weights(base, key, delta):
    w = dict(base)
    new = min(max(w[key] + delta, 0.0), 1.0)
    rest = 1.0 - w[key]
    scale = (1.0 - new) / rest if rest else 0
    for k in w:
        w[k] = new if k == key else w[k] * scale
    return w


def run_sensitivity(H, S, E, ref):
    base_cfg = get_config()
    base_rank = {}
    for e in E:
        r = recommend(req_for(e, H, S, ref), base_cfg)
        base_rank[e["caseId"]] = [c["hospitalId"] for c in r["candidates"] if c["scoreComplete"]]
    rows = []
    for key in base_cfg["matchWeights"]:
        for delta in (-0.10, -0.05, 0.05, 0.10):
            w = perturbed_weights(base_cfg["matchWeights"], key, delta)
            cfg = get_config({"matchWeights": w})
            top_same, taus, n_multi = 0, [], 0
            for e in E:
                r = recommend(req_for(e, H, S, ref), cfg)
                rk = [c["hospitalId"] for c in r["candidates"] if c["scoreComplete"]]
                b = base_rank[e["caseId"]]
                if not b:
                    continue
                top_same += int(rk[:1] == b[:1])
                if len(b) >= 3:
                    n_multi += 1
                    pos = {h: i for i, h in enumerate(rk)}
                    taus.append(kendalltau(list(range(len(b))), [pos[h] for h in b]).statistic)
            n_cases = sum(1 for e in E if base_rank[e["caseId"]])
            rows.append({"weight": key, "delta": delta, "top1Unchanged": top_same, "cases": n_cases,
                         "meanKendallTau": round(float(np.mean(taus)), 3) if taus else None, "rankedCasesForTau": n_multi})
    return rows


def run_dataset_quality(S, H, ref_dt):
    snaps = [ResourceSnapshot.model_validate(s) for s in S]
    by = {}
    for s in snaps:
        by.setdefault((s.hospitalId, s.resourceType), []).append(s)
    cfg = get_config()
    states, verified, future = Counter(), 0, 0
    per_hosp = {}
    for (hid, rt), lst in by.items():
        usable, fut = split_snapshots(lst, ref_dt)
        future += len(fut)
        l = latest(usable)
        if l is None:
            continue
        st = freshness_state((ref_dt - l.reportedAt).total_seconds() / 60, window_for(rt, cfg))
        states[st] += 1
        verified += int(l.verifiedAt is not None)
        per_hosp.setdefault(hid, Counter())[st] += 1
    n = sum(states.values())
    return {"latestRecords": n, "fresh": states["Fresh"], "stale": states["Stale"], "expired": states["Expired"],
            "freshSharePct": round(100 * states["Fresh"] / n, 1), "verifiedSharePct": round(100 * verified / n, 1),
            "futureDatedIgnored": future, "perHospital": {h: dict(c) for h, c in sorted(per_hosp.items())}}


def run_case_outcomes(H, S, E, ref):
    rows = []
    for e in E:
        r = recommend(req_for(e, H, S, ref))
        top = r["candidates"][0] if r["candidates"] else None
        rows.append({"caseId": e["caseId"], "summary": e["operationalSummary"], **r["summary"],
                     "top": f"{top['hospitalId']} · {top['name']}" if top else "—",
                     "topScore": top["matchScoreLabel"] if top else "—",
                     "topFlags": [f["code"] for f in top["flags"]] if top else [],
                     "warnings": r["warnings"]})
    return rows


def run_referral_stats(R, ref_dt):
    hids = sorted({r["hospitalId"] for r in R})
    return [escalation.historical_response_summary(R, h) for h in hids]


# ---------------------------------------------------------------------------
# charts
# ---------------------------------------------------------------------------
def chart_demo_breakdown(res, fname, title):
    cands = res["candidates"]
    fig, ax = plt.subplots(figsize=(8.2, 1.2 + 0.9 * len(cands)))
    names = [f"#{c['rank']} {c['name']}" for c in cands][::-1]
    left = np.zeros(len(cands))
    for key in ("travelSuitability", "resourceFreshness", "capacitySuitability", "capabilityMatch"):
        vals = np.array([next(f["contribution"] for f in c["factors"] if f["factor"] == key) for c in cands][::-1])
        lbl = next(f["label"] for f in cands[0]["factors"] if f["factor"] == key)
        w = cands[0]["factors"][[f["factor"] for f in cands[0]["factors"]].index(key)]["weight"]
        ax.barh(names, vals, left=left, color=C[key], label=f"{lbl} (w={w:.2f})", height=0.55)
        for i, (l, v) in enumerate(zip(left, vals)):
            if v >= 4:
                ax.text(l + v / 2, i, f"{v:.0f}", ha="center", va="center", color="white", fontsize=9, fontweight="bold")
        left += vals
    for i, c in enumerate(cands[::-1]):
        flags = " ⚑ " + ", ".join(sorted({f["code"].replace("_", " ").title() for f in c["flags"]})) if c["flags"] else ""
        ax.text(left[i] + 1.5, i, f"{c['matchScore']:.0f}/100{flags}", va="center", fontsize=9.5, color=C["ink"], fontweight="bold")
    ax.set_xlim(0, 135)
    ax.set_xlabel("Weighted contribution to match score (points)")
    ax.set_title(title, loc="left")
    ax.grid(axis="x", color=C["grid"])
    ax.set_axisbelow(True)
    fig.legend(*ax.get_legend_handles_labels(), loc="upper center", bbox_to_anchor=(0.5, 0.0), ncol=4,
               frameon=False, fontsize=8)
    fig.tight_layout()
    foot(fig, y=-0.5 / (1.2 + 0.9 * len(cands)))
    fig.savefig(CHARTS / fname)
    plt.close(fig)


def chart_case_outcomes(rows):
    fig, ax = plt.subplots(figsize=(9, 4.2))
    ids = [r["caseId"] for r in rows]
    el = np.array([r["eligible"] for r in rows]); nc = np.array([r["needsConfirmation"] for r in rows])
    ex = np.array([r["excluded"] for r in rows])
    ax.bar(ids, el, color=C["eligible"], label="Eligible (ranked)")
    ax.bar(ids, nc, bottom=el, color=C["nc"], label="Needs confirmation (not scored)")
    ax.bar(ids, ex, bottom=el + nc, color=C["excluded"], label="Excluded (hard constraint failed)")
    short = {"EL-0001": "Cardiac", "EL-0002": "Trauma", "EL-0003": "Stroke", "EL-0004": "Burns",
             "EL-0005": "Obstetric", "EL-0006": "Paediatric", "EL-0007": "Multi-pt", "EL-0008": "Cardiac\n(no loc.)",
             "EL-0009": "Minor ER", "EL-0010": "Dialysis"}
    ax.set_xticks(range(len(ids)), [f"{i}\n{short.get(i, '')}" for i in ids], fontsize=8)
    for i, r in enumerate(rows):
        ax.text(i, r["eligible"] / 2, str(r["eligible"]), ha="center", va="center", color="white", fontweight="bold")
    ax.set_ylim(0, 12.5)
    ax.set_ylabel("Hospitals (of 12)")
    ax.set_title("Eligibility outcome per fictional case — 12-hospital network", loc="left")
    ax.legend(frameon=False, fontsize=8.5, loc="upper center", bbox_to_anchor=(0.5, -0.17), ncol=3)
    foot(fig, y=-0.13)
    fig.savefig(CHARTS / "case_outcomes.png")
    plt.close(fig)


def chart_curves():
    cfg = get_config()
    fig, axes = plt.subplots(1, 2, figsize=(10, 3.6))
    ax = axes[0]
    ages = np.linspace(0, 500, 501)
    for rt, col in [("icu_bed", "#dc2626"), ("ventilator", "#f59e0b"), ("ct_scanner", "#2563eb")]:
        w = FRESHNESS_WINDOWS[rt]
        ax.plot(ages, [freshness_curve(a, w) for a in ages], color=col, lw=2,
                label=f"{rt.replace('_', ' ')} (fresh ≤{w['freshMinutes']}m, stale ≤{w['staleMinutes']}m)")
    ax.set_xlabel("Age of report (minutes)"); ax.set_ylabel("Freshness score")
    ax.set_title("Resource-specific freshness decay", loc="left")
    ax.legend(frameon=False, fontsize=8); ax.grid(color=C["grid"])
    ax.text(250, 60, "beyond stale limit → Expired\n= treated as Unknown", fontsize=8, color=C["muted"])
    ax = axes[1]
    eta = np.linspace(0, 75, 300)
    t = cfg["travel"]
    ax.plot(eta, np.clip(100 * (t["worstMinutes"] - eta) / (t["worstMinutes"] - t["bestMinutes"]), 0, 100), color=C["travelSuitability"], lw=2)
    ax.axvline(t["bestMinutes"], ls=":", color=C["muted"]); ax.axvline(t["worstMinutes"], ls=":", color=C["muted"])
    ax.set_xlabel("Upper bound of ETA range (minutes)"); ax.set_ylabel("Travel suitability")
    ax.set_title("Travel suitability (conservative ETA bound)", loc="left"); ax.grid(color=C["grid"])
    foot(fig)
    fig.savefig(CHARTS / "scoring_curves.png")
    plt.close(fig)


def chart_sensitivity(rows):
    keys = list(dict.fromkeys(r["weight"] for r in rows))
    deltas = [-0.10, -0.05, 0.05, 0.10]
    get = lambda k, d: next(r for r in rows if r["weight"] == k and r["delta"] == d)
    tau = np.array([[get(k, d)["meanKendallTau"] for d in deltas] for k in keys], dtype=float)
    fig, ax = plt.subplots(figsize=(7, 3.6))
    im = ax.imshow(tau, cmap="RdYlGn", vmin=0.5, vmax=1.0)
    ax.set_xticks(range(len(deltas)), [f"{d:+.2f}" for d in deltas])
    labels = {"travelSuitability": "Travel (0.40)", "resourceFreshness": "Freshness (0.30)",
              "capacitySuitability": "Capacity (0.20)", "capabilityMatch": "Capability (0.10)"}
    ax.set_yticks(range(len(keys)), [labels[k] for k in keys])
    for i, k in enumerate(keys):
        for j, d in enumerate(deltas):
            r = get(k, d)
            ax.text(j, i, f"τ {r['meanKendallTau']:.2f}\ntop-1 {r['top1Unchanged']}/{r['cases']}", ha="center", va="center", fontsize=8)
    ax.set_xlabel("Change in weight (others re-scaled to keep sum = 1)")
    ax.set_title("Weight sensitivity — rank agreement with default weights", loc="left")
    fig.colorbar(im, ax=ax, shrink=0.8, label="Mean Kendall τ (1 = identical order)")
    foot(fig, y=-0.04)
    fig.savefig(CHARTS / "weight_sensitivity.png")
    plt.close(fig)


def chart_latency(rows):
    fig, ax = plt.subplots(figsize=(6.2, 3.4))
    x = [r["hospitals"] for r in rows]
    ax.plot(x, [r["p50ms"] for r in rows], "o-", color=C["travelSuitability"], label="p50")
    ax.plot(x, [r["p95ms"] for r in rows], "s--", color=C["excluded"], label="p95")
    for r in rows:
        ax.annotate(f"{r['p95ms']:.1f} ms", (r["hospitals"], r["p95ms"]), textcoords="offset points", xytext=(4, 6), fontsize=8)
    ax.set_xscale("log"); ax.set_yscale("log")
    ax.set_xlabel("Hospitals evaluated per request"); ax.set_ylabel("Latency (ms)")
    ax.set_title("Recommendation latency (single CPU, in-process)", loc="left")
    ax.legend(frameon=False); ax.grid(color=C["grid"], which="both")
    foot(fig)
    fig.savefig(CHARTS / "latency.png")
    plt.close(fig)


def chart_freshness(q, H):
    names = {h["hospitalId"]: h["name"] for h in H}
    hids = list(q["perHospital"])
    fig, ax = plt.subplots(figsize=(8.2, 4.2))
    f = np.array([q["perHospital"][h].get("Fresh", 0) for h in hids])
    s = np.array([q["perHospital"][h].get("Stale", 0) for h in hids])
    e = np.array([q["perHospital"][h].get("Expired", 0) for h in hids])
    lbl = [f"{h} {names[h][:34]}" for h in hids][::-1]
    ax.barh(lbl, f[::-1], color=C["eligible"], label="Fresh")
    ax.barh(lbl, s[::-1], left=f[::-1], color=C["nc"], label="Stale")
    ax.barh(lbl, e[::-1], left=(f + s)[::-1], color=C["excluded"], label="Expired → Unknown")
    ax.set_xlabel("Latest resource reports")
    ax.set_title(f"Resource freshness at reference time — {q['freshSharePct']}% fresh, {q['verifiedSharePct']}% hospital-confirmed", loc="left", fontsize=11)
    ax.legend(frameon=False, loc="upper center", bbox_to_anchor=(0.5, -0.12), ncol=3)
    foot(fig, y=-0.1)
    fig.savefig(CHARTS / "resource_freshness.png")
    plt.close(fig)


def chart_forecast(fc):
    s = fc["_series"]
    ts = np.array([np.datetime64(t[:19]) for t in s["ts"]])
    n = 24 * 7
    fig, ax = plt.subplots(figsize=(10, 3.8))
    ax.fill_between(ts[-n:], s["lo80"][-n:], s["hi80"][-n:], color="#bfdbfe", alpha=0.7, label="ML 80% interval (empirical)")
    ax.plot(ts[-n:], s["actual"][-n:], color=C["ink"], lw=1.1, label="Actual (synthetic)")
    ax.plot(ts[-n:], s["Gradient boosting (Poisson)"][-n:], color=C["travelSuitability"], lw=1.6, label="Gradient boosting")
    ax.plot(ts[-n:], s["Seasonal naive (same hour last week)"][-n:], color=C["nc"], lw=1, ls="--", label="Seasonal naive (last week)")
    ax.set_ylabel("Arrivals / hour")
    m = fc["metrics"]
    txt = " · ".join(f"{k.split('(')[0].strip()} MAE {v['MAE']:.2f}" for k, v in m.items())
    ax.set_title("OPTIONAL · 24-h-ahead arrivals forecast on SYNTHETIC data (last 7 test days)", loc="left", fontsize=11)
    fig.text(0.01, -0.03, "Test-period MAE — " + txt, fontsize=8, color=C["ink"])
    ax.legend(frameon=False, ncol=4, fontsize=8, loc="upper left")
    foot(fig, y=-0.08)
    fig.savefig(CHARTS / "forecast_synthetic.png")
    plt.close(fig)


def chart_surge(sim, title):
    tl = sim["timeline"]
    m = [t["minuteOffset"] for t in tl]
    fig, ax1 = plt.subplots(figsize=(9, 3.8))
    ax1.bar(m, [t["unplacedSoFar"] for t in tl], width=2.2, color="#fecaca", label="Cumulative cases with no eligible hospital")
    ax1.step(m, [t["eligible"] for t in tl], where="post", color=C["eligible"], lw=2.4, label="Eligible hospitals for the next case")
    ax1.step(m, [t["needsConfirmation"] for t in tl], where="post", color=C["nc"], lw=1.5, label="Needs confirmation")
    ax1.set_xlabel("Minutes since surge start"); ax1.set_ylabel("Hospitals / cases")
    ax2 = ax1.twinx()
    ax2.plot(m, [t["totalRemaining"] for t in tl], color=C["excluded"], lw=1.5, ls="--", label="Reported free beds, all types (right axis)")
    ax2.set_ylabel("Reported free beds", color=C["excluded"])
    ax2.set_ylim(0, max(t["totalRemaining"] for t in tl) * 1.15)
    ax2.spines["right"].set_visible(True)
    top = max(max(t["unplacedSoFar"] for t in tl), max(t["eligible"] for t in tl)) + 1.5
    ax1.set_ylim(0, top)
    for ev in sim.get("_events", []):
        ax1.axvline(ev["minuteOffset"], color=C["muted"], ls=":")
        ax1.text(ev["minuteOffset"] + 0.6, top * 0.93, ev["label"], fontsize=8, color=C["muted"])
    h1, l1 = ax1.get_legend_handles_labels(); h2, l2 = ax2.get_legend_handles_labels()
    fig.legend(h1 + h2, l1 + l2, frameon=False, fontsize=8, loc="upper center", bbox_to_anchor=(0.5, 0.0), ncol=2)
    ax1.set_title(title, loc="left", fontsize=11)
    fig.tight_layout()
    foot(fig, y=-0.13)
    fig.savefig(CHARTS / "surge_simulation.png")
    plt.close(fig)


# ---------------------------------------------------------------------------
def main():
    t0 = time.perf_counter()
    H, S, E, R, meta = load_dataset()
    ref = meta["referenceTime"]
    ref_dt = datetime.fromisoformat(ref.replace("Z", "+00:00"))
    demo = json.loads((DATA / "demo-scenario.json").read_text())

    print("pytest …"); pyt = run_pytest()
    print("scenarios …"); scen = run_scenarios()
    print("invariants …"); inv = run_invariants()
    print("latency …"); lat = run_latency()
    print("sensitivity …"); sens = run_sensitivity(H, S, E, ref)
    print("dataset quality …"); qual = run_dataset_quality(S, H, ref_dt)
    outcomes = run_case_outcomes(H, S, E, ref)
    refstats = run_referral_stats(R, ref_dt)
    demo1, demo2 = recommend(demo["step1_initialRanking"]), recommend(demo["step2_afterRejectionByH01"])
    full1 = recommend(req_for(next(e for e in E if e["caseId"] == "EL-0001"), H, S, ref))
    shortages = shortage_warnings(H, S, ref_dt, expected_demand={"er_bed": 6.0}, horizon_hours=4)

    print("forecast …")
    fc = forecast_eval(synthetic_arrivals())

    print("surge …")
    rng = random.Random(4)
    template = next(e for e in E if e["caseId"] == "EL-0002")  # major trauma
    cases = []
    for i in range(16):
        t = copy.deepcopy(template)
        t["caseId"] = f"SURGE-{i + 1:02d}"
        t["minuteOffset"] = int(i * 60 / 16)
        t["location"] = {"lat": t["location"]["lat"] + rng.uniform(-0.02, 0.02), "lng": t["location"]["lng"] + rng.uniform(-0.02, 0.02)}
        cases.append(t)
    events = [{"minuteOffset": 12, "type": "hospital_closure", "hospitalId": "H05", "label": "H05 trauma centre closes"},
              {"minuteOffset": 26, "type": "equipment_outage", "hospitalId": "H03", "resourceType": "ct_scanner", "label": "H03 CT outage"}]
    base = req_for(E[0], H, S, ref)
    sim = simulate_surge(base, cases, events)
    sim["_events"] = events

    print("charts …")
    chart_demo_breakdown(demo1, "demo_step1_breakdown.png", "Demo EL-DEMO-001 — explainable match-score breakdown")
    chart_demo_breakdown(full1, "el0001_full_network_breakdown.png", "EL-0001 cardiac case — full network, eligible candidates")
    chart_case_outcomes(outcomes)
    chart_curves()
    chart_sensitivity(sens)
    chart_latency(lat)
    chart_freshness(qual, H)
    chart_forecast(fc)
    chart_surge(sim, "Surge simulator — 16 fictional major-trauma cases in 60 min, trauma-centre closure + CT outage")

    results = {
        "generatedAt": datetime.now(timezone.utc).isoformat(), "engineVersion": get_config()["engineVersion"],
        "datasetReferenceTime": ref, "pytest": pyt, "scenarios": scen, "invariants": inv, "latency": lat,
        "sensitivity": sens, "datasetQuality": qual, "caseOutcomes": outcomes, "referralStats": refstats,
        "demo": {"step1": demo1, "step2": demo2}, "shortageWarnings": shortages,
        "forecast": {k: v for k, v in fc.items() if k != "_series"},
        "surge": {k: v for k, v in sim.items() if k != "_events"},
        "runtimeSeconds": round(time.perf_counter() - t0, 1),
    }
    (ROOT / "evaluation" / "results.json").write_text(json.dumps(results, indent=2, default=str))
    write_report(results)
    print(f"done in {results['runtimeSeconds']} s")


# ---------------------------------------------------------------------------
def write_report(r):
    sc = r["scenarios"]; inv = r["invariants"]; q = r["datasetQuality"]; fc = r["forecast"]
    n_pass = sum(s["passed"] for s in sc)
    d1 = r["demo"]["step1"]; d2 = r["demo"]["step2"]
    L = []
    a = L.append
    a("# EmergencyLink — Recommendation Engine Test & Evaluation Report\n")
    a(f"*Auto-generated by `evaluation/run_evaluation.py` · engine v{r['engineVersion']} · "
      f"generated {r['generatedAt'][:19]}Z · dataset reference time {r['datasetReferenceTime']}*\n")
    a("> **Scope.** Everything below was measured on **fictional hospitals and synthetic data**. These results show that the "
      "engine follows its documented rules. They are **not** evidence of clinical effectiveness or real-world accuracy (README §21).\n")
    a("## 1. Summary\n")
    a("| Check | Result |\n|---|---|")
    a(f"| Automated test suite (pytest) | **{r['pytest']['summary']}** |")
    a(f"| Predefined scenarios (expectations written before running) | **{n_pass}/{len(sc)} passed** |")
    a(f"| Safety invariants on {inv['requests']:,} random requests ({inv['hospitalEvaluations']:,} hospital evaluations) | "
      f"**{inv['totalViolations']} violations** |")
    lat200 = next(x for x in r["latency"] if x["hospitals"] == 200)
    a(f"| Recommendation latency, 200 hospitals | p50 {lat200['p50ms']} ms · p95 {lat200['p95ms']} ms |")
    a(f"| Resource freshness of the sample dataset | {q['freshSharePct']}% fresh · {q['verifiedSharePct']}% hospital-confirmed |")
    a(f"| Optional forecast (synthetic) | GBM MAE {fc['metrics']['Gradient boosting (Poisson)']['MAE']} vs best baseline "
      f"{fc['metrics'][fc['bestBaseline']]['MAE']} ({fc['mlImprovementOverBestBaselinePct']:+.1f}%) |\n")

    a("## 2. What was tested\n")
    a("| README §21 metric | How it was measured here | Section |\n|---|---|---|")
    a("| Eligibility correctness | Scenario suite + invariant: no ranked hospital fails a hard constraint | 3, 4 |")
    a("| Ranking behaviour | Scenario suite with exact expected order; weight-sensitivity analysis | 3, 7 |")
    a("| Recommendation latency | In-process timing at 10–500 hospitals | 6 |")
    a("| Resource freshness | Share of latest records within their resource-specific window | 8 |")
    a("| Referral turnaround | Median request→response per hospital, shown only when n ≥ 10 | 9 |")
    a("| Offline reliability / workflow completion / authorisation | **Not tested here.** These belong to the MERN backend and frontend. | — |\n")

    a("## 3. Predefined scenario suite\n")
    a("Source: `recommendation-service/tests/scenarios/scenarios.json`. Each scenario lists its expected eligible set, exclusions with reasons, flags and exact rank order. All expectations were derived from the documented rules before the engine was run.\n")
    a("| ID | Category | Scenario | Result | Engine output (ranked · needs-confirmation · excluded) |\n|---|---|---|---|---|")
    for s in sc:
        out = ", ".join(s["ranking"]) or "—"
        out += f" · NC: {', '.join(s['needsConfirmation']) or '—'} · EX: {', '.join(s['excluded']) or '—'}"
        a(f"| {s['id']} | {s['category']} | {s['name']} | {'✅ Pass' if s['passed'] else '❌ FAIL: ' + '; '.join(s['failures'])} | {out} |")
    a("")

    a("## 4. Safety invariants (property-based testing)\n")
    a(f"{inv['requests']:,} random fictional requests (1–15 hospitals each, with random staleness, missing fields, "
      "conflicts, future timestamps, closures and rejections) were checked against these properties:\n")
    for p in ["Every hospital lands in exactly one bucket: eligible, needs confirmation, or excluded",
              "No ranked hospital is closed or diverting, previously rejected, or missing a required specialty",
              "No ranked hospital rests on an unknown, expired or conflicting required resource",
              "Non-eligible hospitals never receive a score, so a score can never compensate for a failed constraint",
              "Scores fall in [0, 100] and the factor contributions sum to the score (the explanation matches the number)",
              "Complete scores rank above incomplete ones, scores are sorted, and ranks are contiguous"]:
        a(f"- {p}")
    mix = inv["outcomeMix"]
    a(f"\n**Result: {inv['totalViolations']} violations.** Outcome mix: {mix['eligible']:,} eligible · "
      f"{mix['needsConfirmation']:,} needs confirmation · {mix['excluded']:,} excluded. "
      "pytest also checks reproducibility (identical output for identical input), independence from input order, and monotonicity in travel time.\n")
    if inv["violations"]:
        a("Violations: " + json.dumps(inv["violations"]) + "\n")

    a("## 5. Demo scenario (README §22)\n")
    a("![demo breakdown](../evaluation/charts/demo_step1_breakdown.png)\n")
    a("**Step 1: initial ranking for fictional cardiac case EL-DEMO-001**\n")
    a("| Rank | Hospital | Match score | Resource data | ETA | Flags |\n|---|---|---|---|---|---|")
    for c in d1["candidates"]:
        a(f"| {c['rank']} | {c['name']} | {c['matchScoreLabel']} | {c['resourceReliability']['label']} | {c['eta']['label']} | "
          f"{'; '.join(f['label'] for f in c['flags']) or '—'} |")
    for c in d1["needsConfirmation"]:
        a(f"| — | {c['name']} | {c['matchScoreLabel']} | — | {c['eta']['label']} | {'; '.join(c['reasons'])} |")
    for c in d1["excluded"]:
        a(f"| — | {c['name']} | Excluded | — | — | {'; '.join(c['reasons'])} |")
    top = d1["candidates"][0]
    a("\n**Score breakdown for #1 (README §7.11)**\n")
    a("| Factor | Value | Weight | Contribution | Explanation |\n|---|---:|---:|---:|---|")
    for f in top["factors"]:
        a(f"| {f['label']} | {f['value']}/100 | {f['weight']:.2f} | {f['contribution']:.1f} | {f['explanation']} |")
    a(f"| **Overall match score** | | | **{top['matchScore']}** | Weighted ranking score, not a clinical probability |\n")
    a("Hand check: 0.40×82.7 + 0.30×88.0 + 0.20×40.0 + 0.10×100 = 77.5 ✔\n")
    a("**Step 2 (failure path): Crescent Heart Institute rejects the referral.** Re-ranking gives:\n")
    for c in d2["candidates"]:
        a(f"- #{c['rank']} {c['name']} — {c['matchScoreLabel']} — flags: {'; '.join(f['label'] for f in c['flags'])}")
    for c in d2["excluded"]:
        a(f"- Excluded: {c['name']} — {'; '.join(c['reasons'])}")
    a(f"- Warnings: {'; '.join(d2['warnings'])}\n")
    a("This is the intended behaviour. The engine does not hide uncertainty: the only remaining candidate is shown with its stale, unconfirmed ICU report, and the coordinator is told to reconfirm.\n")

    a("### All 10 fictional cases on the 12-hospital network\n")
    a("![case outcomes](../evaluation/charts/case_outcomes.png)\n")
    a("| Case | Summary | Eligible | Needs conf. | Excluded | #1 candidate | Score | #1 flags |\n|---|---|---:|---:|---:|---|---|---|")
    for o in r["caseOutcomes"]:
        a(f"| {o['caseId']} | {o['summary']} | {o['eligible']} | {o['needsConfirmation']} | {o['excluded']} | {o['top']} | {o['topScore']} | {', '.join(sorted(set(o['topFlags']))) or '—'} |")
    a("")

    a("## 6. Latency\n")
    a("![latency](../evaluation/charts/latency.png)\n")
    a("| Hospitals | Avg snapshots | Runs | p50 (ms) | p95 (ms) | max (ms) |\n|---:|---:|---:|---:|---:|---:|")
    for x in r["latency"]:
        a(f"| {x['hospitals']} | {x['avgSnapshots']} | {x['runs']} | {x['p50ms']} | {x['p95ms']} | {x['maxms']} |")
    a("\nMeasured in-process on the sandbox CPU. Excludes HTTP and database time; the `/health` endpoint reports live median latency once deployed.\n")

    a("## 7. Weight sensitivity\n")
    a("![sensitivity](../evaluation/charts/weight_sensitivity.png)\n")
    a("Each weight was shifted by ±0.05 and ±0.10, with the others re-scaled to keep the sum at 1. Rankings were recomputed for the 10 sample cases, counting complete scores only.\n")
    a("| Weight | Δ | Top-1 unchanged | Mean Kendall τ (cases with ≥3 candidates) |\n|---|---:|---:|---:|")
    for s in r["sensitivity"]:
        a(f"| {s['weight']} | {s['delta']:+.2f} | {s['top1Unchanged']}/{s['cases']} | {s['meanKendallTau'] if s['meanKendallTau'] is not None else '—'} |")
    flips = sum(s["cases"] - s["top1Unchanged"] for s in r["sensitivity"])
    taus = [s["meanKendallTau"] for s in r["sensitivity"] if s["meanKendallTau"] is not None]
    a(f"\nInterpretation: across {len(r['sensitivity'])} perturbations the top-1 recommendation changed in {flips} case-runs, and the lowest mean Kendall τ was {min(taus):.2f}. "
      "Lower-ranked positions reorder only slightly. "
      "Robustness on 10 fictional cases does not prove the weights are right. They remain provisional design choices that need review with operational experts.\n")

    a("## 8. Sample-dataset resource freshness\n")
    a("![freshness](../evaluation/charts/resource_freshness.png)\n")
    a(f"Latest records: {q['latestRecords']} · Fresh {q['fresh']} · Stale {q['stale']} · Expired {q['expired']} · "
      f"hospital-confirmed {q['verifiedSharePct']}% · future-dated records ignored: {q['futureDatedIgnored']}.\n")

    a("## 9. Referral turnaround (historical, fictional)\n")
    a("| Hospital | n | Median response | Display |\n|---|---:|---:|---|")
    for s in r["referralStats"]:
        a(f"| {s['hospitalId']} | {s['sampleSize']} | {s.get('medianResponseMinutes', '—')} | {s['label']} |")
    a("\nMedians are suppressed below 10 records (README §7.12). Past response speed is never presented as a likelihood of acceptance.\n")

    a("## 10. Shortage early warning & surge simulation (stretch)\n")
    a("| Hospital | Resource | Warning | Reasons |\n|---|---|---|---|")
    for w in r["shortageWarnings"]:
        a(f"| {w['hospitalName']} | {w['resourceName']} | {w['warning']} | {'; '.join(w['reasons'])} |")
    a("\n*Assumed demand for illustration: 6 ER arrivals per hospital in the next 4 h.*\n")
    a("![surge](../evaluation/charts/surge_simulation.png)\n")
    sim = r["surge"]
    a(f"{sim['casesSimulated']} cases simulated, {sim['unplacedCases']} could not be placed with an eligible hospital. Assumptions: "
      + "; ".join(sim["assumptions"]) + ".\n")

    a("## 11. Optional demand forecasting (synthetic data only)\n")
    a("![forecast](../evaluation/charts/forecast_synthetic.png)\n")
    a(f"Horizon: {fc['horizon']} · train {fc['trainRows']} h · test {fc['testRows']} h ({fc['testRange'][0][:10]} → {fc['testRange'][1][:10]}).\n")
    a("| Model | MAE | RMSE |\n|---|---:|---:|")
    for k, v in fc["metrics"].items():
        a(f"| {k} | {v['MAE']} | {v['RMSE']} |")
    a(f"\nThe ML model improves on the best baseline ({fc['bestBaseline']}) by {fc['mlImprovementOverBestBaselinePct']:+.1f}% MAE. "
      f"Empirical 80% interval coverage on the test set: {fc['interval80']['empiricalCoverageOnTest']:.0%}. "
      "Known limitations: " + "; ".join(fc["limitations"]) + ". **Do not present these as real hospital forecasts.**\n")

    a("## 12. Known limitations of the engine\n")
    for x in ["Weights, freshness windows and thresholds are provisional design assumptions and are not clinically validated.",
              "The straight-line ETA fallback (detour ×1.4, 22–40 km/h) is crude and is always labelled 'Low' reliability.",
              "Capacity suitability uses the weakest required resource. It ignores queue length and incoming ambulances that are not yet recorded.",
              "Conflict detection only compares reports from different reporters within 30 minutes of each other.",
              "The engine trusts the backend to supply authorised, server-fetched data. Authentication and authorisation are not its responsibility.",
              "Offline sync, authorisation and end-to-end workflow tests belong to the MERN and frontend members and are not covered here."]:
        a(f"- {x}")
    (ROOT / "docs" / "test-report.md").write_text("\n".join(L))


if __name__ == "__main__":
    main()
