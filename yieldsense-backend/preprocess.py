"""
preprocess.py — Milestone 1 tabular preprocessing pipeline.

Cleans raw agricultural CSVs (missing values, impossible readings) and
writes a model-ready CSV to data/processed/. Run standalone:

    python preprocess.py

or import run_agri_preprocessing_pipeline() from other scripts.
"""
import os

import pandas as pd


def run_agri_preprocessing_pipeline(input_csv_path: str, output_csv_path: str) -> None:
    print(f"Reading raw file: {input_csv_path}")

    if not os.path.exists(input_csv_path):
        print(f"No file found at {input_csv_path} — place a raw CSV there and re-run.")
        return

    df = pd.read_csv(input_csv_path)
    # Kaggle's yield_df.csv includes a leftover index column — drop it if present.
    if "Unnamed: 0" in df.columns:
        df = df.drop(columns=["Unnamed: 0"])

    # 1. Impute missing climate/soil variables with the column mean.
    climate_cols = [
        col for col in ["avg_temp", "average_rain_fall_mm_per_year", "rainfall", "ph", "temperature", "humidity"]
        if col in df.columns
    ]
    for col in climate_cols:
        missing = df[col].isnull().sum()
        if missing > 0:
            mean_val = df[col].mean()
            df[col] = df[col].fillna(mean_val)
            print(f"Imputed {missing} missing values in '{col}' with mean {mean_val:.2f}")

    # 2. Drop rows with physically impossible readings.
    # 2. Drop rows with physically impossible readings.
    rainfall_col = "rainfall" if "rainfall" in df.columns else (
        "average_rain_fall_mm_per_year" if "average_rain_fall_mm_per_year" in df.columns else None
    )
    if rainfall_col:
        before = len(df)
        df = df[df[rainfall_col] >= 0]
        if before != len(df):
            print(f"Dropped {before - len(df)} rows with negative rainfall")

    if "ph" in df.columns:
        before = len(df)
        df = df[df["ph"].between(0, 14)]
        if before != len(df):
            print(f"Dropped {before - len(df)} rows with out-of-range soil pH")

    # 3. Drop exact duplicate rows, common in scraped/merged agri datasets.
    before = len(df)
    df = df.drop_duplicates()
    if before != len(df):
        print(f"Dropped {before - len(df)} duplicate rows")

    # 4. Write cleaned output.
    os.makedirs(os.path.dirname(output_csv_path), exist_ok=True)
    df.to_csv(output_csv_path, index=False)
    print(f"Wrote {len(df)} clean rows to {output_csv_path}")


if __name__ == "__main__":
    run_agri_preprocessing_pipeline(
        "data/raw/crop_yield_raw.csv",
        "data/processed/crop_yield_clean.csv",
    )
