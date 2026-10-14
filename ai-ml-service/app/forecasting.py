"""
OPTIONAL demand forecasting (README §8.2) — hourly emergency arrivals.

IMPORTANT: trained and evaluated on SYNTHETIC data. Results demonstrate the
workflow (baseline vs ML comparison on a held-out period) and DO NOT
establish real-world forecasting accuracy.

Forecast horizon: 24 h ahead (all features use lags ≥ 24 h, so every
prediction for hour t uses only information available at t-24h).
"""
from __future__ import annotations

import numpy as np
import pandas as pd

MODEL_VERSION = "arrivals-gbm-v1.0 (synthetic)"


def synthetic_arrivals(start: str = "2026-04-01", days: int = 180, seed: int = 26) -> pd.DataFrame:
    """Poisson arrivals with daily + weekly seasonality, slow trend, heat-wave & festival surges."""
    rng = np.random.default_rng(seed)
    idx = pd.date_range(start, periods=days * 24, freq="h", tz="UTC")
    local = idx.tz_convert("Asia/Karachi")
    hour = local.hour.values
    dow = local.dayofweek.values
    daily = 1.0 + 0.55 * np.sin((hour - 9) / 24 * 2 * np.pi) + 0.25 * np.sin((hour - 18) / 12 * 2 * np.pi)
    daily = np.clip(daily, 0.35, None)
    weekly = np.where(dow == 4, 1.12, np.where(dow >= 5, 0.92, 1.0))  # busier Fri, quieter weekend
    t = np.arange(len(idx)) / (24 * 365)
    trend = 1.0 + 0.08 * t
    surge = np.ones(len(idx))
    # three multi-day surge episodes (e.g., heat waves) + random single-hour spikes (incidents)
    for d0, length, mult in [(40, 4, 1.45), (95, 3, 1.35), (150, 5, 1.5)]:
        surge[d0 * 24:(d0 + length) * 24] *= mult
    spikes = rng.random(len(idx)) < 0.004
    surge[spikes] *= rng.uniform(2.0, 3.5, spikes.sum())
    lam = 6.0 * daily * weekly * trend * surge
    y = rng.poisson(lam)
    return pd.DataFrame({"ts": idx, "arrivals": y, "hour": hour, "dow": dow})


def make_features(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    y = out["arrivals"]
    for lag in (24, 48, 72, 168, 336):
        out[f"lag_{lag}"] = y.shift(lag)
    out["roll24_lag24"] = y.shift(24).rolling(24).mean()
    out["roll168_lag24"] = y.shift(24).rolling(168).mean()
    out["same_hour_4w"] = (y.shift(168) + y.shift(336) + y.shift(504) + y.shift(672)) / 4
    out["is_weekend"] = (out["dow"] >= 5).astype(int)
    out["hour_sin"] = np.sin(out["hour"] / 24 * 2 * np.pi)
    out["hour_cos"] = np.cos(out["hour"] / 24 * 2 * np.pi)
    return out.dropna().reset_index(drop=True)


FEATURES = ["hour", "dow", "is_weekend", "hour_sin", "hour_cos", "lag_24", "lag_48", "lag_72",
            "lag_168", "lag_336", "roll24_lag24", "roll168_lag24", "same_hour_4w"]


def evaluate(df: pd.DataFrame, test_days: int = 14, seed: int = 0) -> dict:
    from sklearn.ensemble import HistGradientBoostingRegressor
    from sklearn.metrics import mean_absolute_error, mean_squared_error

    f = make_features(df)
    split = len(f) - test_days * 24
    train, test = f.iloc[:split], f.iloc[split:]
    y_te = test["arrivals"].values

    preds = {
        "Seasonal naive (same hour yesterday)": test["lag_24"].values,
        "Seasonal naive (same hour last week)": test["lag_168"].values,
        "Moving average (same hour, last 4 weeks)": test["same_hour_4w"].values,
    }
    model = HistGradientBoostingRegressor(loss="poisson", max_iter=300, learning_rate=0.05,
                                          max_leaf_nodes=31, random_state=seed)
    model.fit(train[FEATURES], train["arrivals"])
    preds["Gradient boosting (Poisson)"] = model.predict(test[FEATURES])

    metrics = {}
    for k, p in preds.items():
        metrics[k] = {"MAE": round(float(mean_absolute_error(y_te, p)), 3),
                      "RMSE": round(float(np.sqrt(mean_squared_error(y_te, p))), 3)}
    baselines = {k: v for k, v in metrics.items() if "Gradient" not in k}
    best_base = min(baselines, key=lambda k: baselines[k]["MAE"])
    ml = metrics["Gradient boosting (Poisson)"]["MAE"]
    impr = 100 * (baselines[best_base]["MAE"] - ml) / baselines[best_base]["MAE"]

    # Empirical 80% interval from training residual quantiles (honest, uncalibrated on real data)
    tr_pred = model.predict(train[FEATURES])
    res = train["arrivals"].values - tr_pred
    q10, q90 = np.quantile(res, [0.1, 0.9])
    lo = np.clip(preds["Gradient boosting (Poisson)"] + q10, 0, None)
    hi = preds["Gradient boosting (Poisson)"] + q90
    coverage = float(np.mean((y_te >= lo) & (y_te <= hi)))

    return {
        "modelVersion": MODEL_VERSION,
        "dataset": "synthetic hourly arrivals (fictional)",
        "horizon": "24 hours ahead",
        "trainRange": [str(train["ts"].iloc[0]), str(train["ts"].iloc[-1])],
        "testRange": [str(test["ts"].iloc[0]), str(test["ts"].iloc[-1])],
        "trainRows": int(len(train)), "testRows": int(len(test)),
        "metrics": metrics,
        "bestBaseline": best_base,
        "mlImprovementOverBestBaselinePct": round(float(impr), 1),
        "interval80": {"empiricalCoverageOnTest": round(coverage, 3),
                       "method": "training-residual quantiles (not calibrated on real data)"},
        "limitations": [
            "Synthetic data with known seasonal structure — real arrivals are noisier and non-stationary",
            "No external drivers (weather, events, holidays) beyond synthetic surges",
            "Single held-out window; no rolling-origin backtest across seasons",
        ],
        "_series": {"ts": test["ts"].astype(str).tolist(), "actual": y_te.tolist(),
                    **{k: np.asarray(v).round(3).tolist() for k, v in preds.items()},
                    "lo80": lo.round(3).tolist(), "hi80": hi.round(3).tolist()},
    }
