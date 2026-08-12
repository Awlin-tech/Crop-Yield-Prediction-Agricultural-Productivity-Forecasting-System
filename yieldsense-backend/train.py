"""
train.py — Milestone 2: trains a yield-forecasting model on the cleaned
dataset produced by preprocess.py.

Features: crop item (categorical), average temperature, average rainfall.
Target:   hg/ha_yield

Run:
    python train.py

Produces:
    data/model_assets.pkl — the fitted pipeline + training statistics,
    loaded by routers/predict.py at request time.
"""
import os

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

INPUT_CSV = "data/processed/crop_yield_clean.csv"
OUTPUT_PATH = "data/model_assets.pkl"

CROP_COL = "Item"
TEMP_COL = "avg_temp"
RAIN_COL = "average_rain_fall_mm_per_year"
TARGET_COL = "hg/ha_yield"


def train_model():
    if not os.path.exists(INPUT_CSV):
        print(f"No cleaned dataset found at {INPUT_CSV}.")
        print("Run 'python preprocess.py' first to produce it.")
        return

    df = pd.read_csv(INPUT_CSV)

    required = [CROP_COL, TEMP_COL, RAIN_COL, TARGET_COL]
    missing = [c for c in required if c not in df.columns]
    if missing:
        print(f"Dataset is missing required column(s): {missing}")
        print(f"Expected columns: {required}")
        return

    df = df.dropna(subset=required)
    if len(df) < 20:
        print(f"Only {len(df)} usable rows after dropping missing values — need more data to train reliably.")
        return

    X = df[[CROP_COL, TEMP_COL, RAIN_COL]]
    y = df[TARGET_COL]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # One-hot encode the crop item, pass numeric features through untouched.
    preprocessor = ColumnTransformer(
        transformers=[
            ("crop", OneHotEncoder(handle_unknown="ignore"), [CROP_COL]),
        ],
        remainder="passthrough",
    )

    pipeline = Pipeline(steps=[
        ("preprocess", preprocessor),
        ("model", RandomForestRegressor(n_estimators=200, random_state=42, n_jobs=-1)),
    ])

    print(f"Training on {len(X_train)} rows, testing on {len(X_test)} rows...")
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    r2 = r2_score(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)

    print(f"R^2 score:  {r2:.4f}")
    print(f"MAE:        {mae:.2f} hg/ha")

    known_crops = sorted(df[CROP_COL].unique().tolist())
    training_stats = {
        "r2_score": float(r2),
        "mae": float(mae),
        "n_train_rows": int(len(X_train)),
        "n_test_rows": int(len(X_test)),
        "known_crops": known_crops,
        "temp_range": [float(df[TEMP_COL].min()), float(df[TEMP_COL].max())],
        "rainfall_range": [float(df[RAIN_COL].min()), float(df[RAIN_COL].max())],
        "target_mean": float(df[TARGET_COL].mean()),
    }

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    joblib.dump({"pipeline": pipeline, "stats": training_stats}, OUTPUT_PATH)
    print(f"Saved model + training stats to {OUTPUT_PATH}")
    print(f"Known crops: {known_crops}")


if __name__ == "__main__":
    train_model()
