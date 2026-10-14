from app.forecasting import evaluate, make_features, synthetic_arrivals


def test_synthetic_series_is_reproducible():
    a, b = synthetic_arrivals(days=30), synthetic_arrivals(days=30)
    assert a["arrivals"].tolist() == b["arrivals"].tolist() and len(a) == 30 * 24


def test_features_use_only_lags_of_24h_or_more():
    f = make_features(synthetic_arrivals(days=40))
    lag_cols = [c for c in f.columns if c.startswith("lag_")]
    assert all(int(c.split("_")[1]) >= 24 for c in lag_cols)  # no leakage for a 24-h horizon


def test_evaluation_reports_baselines_and_limitations():
    r = evaluate(synthetic_arrivals(days=90), test_days=7)
    assert len(r["metrics"]) == 4 and r["bestBaseline"] in r["metrics"]
    assert "synthetic" in r["dataset"] and r["limitations"]
