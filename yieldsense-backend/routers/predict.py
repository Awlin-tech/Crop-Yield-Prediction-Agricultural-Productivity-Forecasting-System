"""
routers/predict.py — Milestone 2: /api/v1/predict

Combines three things into one forecast:
  1. The trained Random Forest model (crop item + temperature + rainfall
     -> hg/ha_yield), loaded from data/model_assets.pkl.
  2. A weather estimate for the farm's coordinates (weather_service.py).
  3. A soil adjustment heuristic based on the farm's pH/N/P/K readings.

Soil adjustment is intentionally simple and documented as a heuristic, not
a trained model input — the training dataset (crop yield by region/year)
doesn't include soil chemistry, so soil quality is layered on afterward as
a bounded multiplier rather than presented as something the ML model learned.
"""
import os

import joblib
import pandas as pd
import psycopg2.extras
from fastapi import APIRouter, Depends, HTTPException

from auth_handler import get_current_user
from database import get_db_cursor
from models import PredictRequest, PredictResponse
from weather_service import get_weather_estimate

router = APIRouter(prefix="/api/v1/predict", tags=["Prediction"])

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "model_assets.pkl")

_model_cache = None


def _load_model():
    global _model_cache
    if _model_cache is None:
        if not os.path.exists(MODEL_PATH):
            raise HTTPException(
                status_code=503,
                detail="No trained model found. Run 'python train.py' on the backend first.",
            )
        _model_cache = joblib.load(MODEL_PATH)
    return _model_cache


# Rough agronomic reference ranges used only for the soil adjustment
# heuristic below — not scientific thresholds, just reasonable midpoints.
IDEAL_RANGES = {
    "soil_ph": (6.0, 7.0),
    "soil_n": (80.0, 120.0),
    "soil_p": (30.0, 50.0),
    "soil_k": (30.0, 50.0),
}


def _closeness_score(value: float, low: float, high: float) -> float:
    """1.0 if value is inside [low, high], decaying toward 0 the further outside it is."""
    if low <= value <= high:
        return 1.0
    span = high - low
    distance = (low - value) if value < low else (value - high)
    return max(0.0, 1.0 - distance / span)


def _soil_adjustment_factor(farm: dict) -> float:
    """Maps available soil readings to a bounded multiplier in [0.85, 1.15]."""
    scores = []
    for field, (low, high) in IDEAL_RANGES.items():
        value = farm.get(field)
        if value is not None:
            scores.append(_closeness_score(float(value), low, high))

    if not scores:
        return 1.0  # no soil data on file — no adjustment applied

    avg_score = sum(scores) / len(scores)  # 0 (poor) .. 1 (ideal)
    return 0.85 + avg_score * 0.30


def _soil_scores(farm: dict) -> dict:
    scores = {}
    for field, (low, high) in IDEAL_RANGES.items():
        value = farm.get(field)
        if value is None:
            scores[field] = None
        else:
            scores[field] = _closeness_score(float(value), low, high)
    return scores


def _weather_analytics(weather: dict) -> tuple[dict, str]:
    temp_c = float(weather["avg_temp"])
    rainfall = float(weather["average_rain_fall_mm_per_year"])

    if temp_c > 32:
        heat = "High"
        heat_desc = "Estimated heat stress — yields may underperform without adequate irrigation."
    elif temp_c < 8:
        heat = "High"
        heat_desc = "Estimated cold stress/frost risk — crop establishment may be affected."
    else:
        heat = "Moderate" if temp_c >= 25 else "Low"
        heat_desc = "Temperature estimate appears within a tolerable agronomic window."

    if rainfall < 400:
        rain = "High"
        rain_desc = "Estimated low rainfall — soil moisture management is likely critical."
    elif rainfall > 2000:
        rain = "Moderate"
        rain_desc = "Estimated high rainfall — ensure drainage to reduce root stress."
    else:
        rain = "Low"
        rain_desc = "Rainfall estimate is within a typical range for many rainfed conditions."

    return (
        {
            "heat_stress_risk": heat,
            "rainfall_risk": rain,
            "summary": f"{heat_desc} {rain_desc}",
        },
        f"{heat} heat / {rain} rainfall based on the weather estimate used by the model.",
    )


def _predict_for_crop(
    payload: PredictRequest,
    user: dict,
):
    assets = _load_model()
    pipeline = assets["pipeline"]
    stats = assets["stats"]

    with get_db_cursor() as cur:
        cur.execute(
            """
            SELECT id, user_id, farm_name, latitude, longitude, soil_ph, soil_n, soil_p, soil_k
            FROM farms WHERE id = %s
            """,
            (payload.farm_id,),
        )
        farm = cur.fetchone()

    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    if farm["user_id"] != int(user["sub"]) and user.get("role") != "Admin":
        raise HTTPException(status_code=403, detail="You do not have access to this farm")

    known_crops = stats["known_crops"]
    if payload.crop_name not in known_crops:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown crop '{payload.crop_name}'. Trained crops: {known_crops}",
        )

    weather = get_weather_estimate(float(farm["latitude"]), float(farm["longitude"]))

    input_row = pd.DataFrame([{
        "Item": payload.crop_name,
        "avg_temp": weather["avg_temp"],
        "average_rain_fall_mm_per_year": weather["average_rain_fall_mm_per_year"],
    }])
    base_prediction_hg_ha = float(pipeline.predict(input_row)[0])

    soil_factor = _soil_adjustment_factor(farm)
    adjusted_prediction_hg_ha = base_prediction_hg_ha * soil_factor

    HG_TO_KG = 0.1

    base_model_yield_kg_ha = round(base_prediction_hg_ha * HG_TO_KG, 2)
    predicted_yield_kg_ha = round(adjusted_prediction_hg_ha * HG_TO_KG, 2)

    return farm, stats, weather, base_model_yield_kg_ha, predicted_yield_kg_ha, soil_factor


@router.post("", response_model=PredictResponse)
def predict_yield(payload: PredictRequest, user: dict = Depends(get_current_user)):
    farm, stats, weather, base_model_yield_kg_ha, predicted_yield_kg_ha, soil_factor = _predict_for_crop(payload, user)

    return PredictResponse(
        farm_id=farm["id"],
        crop_name=payload.crop_name,
        predicted_yield_kg_ha=predicted_yield_kg_ha,
        base_model_yield_kg_ha=base_model_yield_kg_ha,
        soil_adjustment_factor=round(soil_factor, 4),
        weather_used=weather,
        model_r2_score=round(stats["r2_score"], 4),
        note=(
            "Model trained on hg/ha, converted to kg/ha here. Adjusted by a "
            "soil-quality heuristic (not a learned feature). Weather source: "
            + weather["source"] + "."
        ),
    )


@router.post("/report", response_model=object)
def predict_report(payload: PredictRequest, user: dict = Depends(get_current_user)):
    # Response_model is intentionally `object` to avoid breaking runtime
    # if the frontend expects only JSON shape; the API remains typed by
    # the dict we return.
    farm, stats, weather, base_model_yield_kg_ha, predicted_yield_kg_ha, soil_factor = _predict_for_crop(payload, user)

    soil_scores = _soil_scores(farm)
    weather_analytics, _ = _weather_analytics(weather)

    soil_analytics = {
        "soil_adjustment_factor": round(soil_factor, 4),
        "nitrogen_score": soil_scores.get("soil_n"),
        "phosphorus_score": soil_scores.get("soil_p"),
        "potassium_score": soil_scores.get("soil_k"),
        "ph_score": soil_scores.get("soil_ph"),
        "summary": "Soil factor is computed via a bounded heuristic comparing your readings to ideal reference ranges.",
    }

    note = (
        "Model trained on hg/ha, converted to kg/ha here. Adjusted by a soil-quality heuristic (not a learned feature). "
        f"Weather source: {weather['source']}."
    )

    narrative = (
        f"For {payload.crop_name} on {farm['farm_name']}, the soil-adjusted forecast estimates {predicted_yield_kg_ha} kg/ha. "
        "Use the weather analytics and soil breakdown as decision support rather than a scientific certainty."
    )

    # Persist prediction run
    with get_db_cursor() as cur:
        cur.execute(
            """
            INSERT INTO prediction_runs (
                user_id, farm_id, crop_name,
                predicted_yield_kg_ha, base_model_yield_kg_ha, soil_adjustment_factor,
                model_r2_score, weather_used, note
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (
                int(user["sub"]),
                farm["id"],
                payload.crop_name,
                predicted_yield_kg_ha,
                base_model_yield_kg_ha,
                round(soil_factor, 4),
                round(stats["r2_score"], 4),
                psycopg2.extras.Json(weather),
                note,
            ),
        )
        run_id_row = cur.fetchone()

    return {
        "run_type": "single",
        "farm_id": farm["id"],
        "crop_name": payload.crop_name,
        "predicted_yield_kg_ha": predicted_yield_kg_ha,
        "base_model_yield_kg_ha": base_model_yield_kg_ha,
        "soil_adjustment_factor": round(soil_factor, 4),
        "model_r2_score": round(stats["r2_score"], 4),
        "weather_used": weather,
        "weather_analytics": weather_analytics,
        "soil_analytics": soil_analytics,
        "narrative": narrative,
        "note": note,
    }


@router.post("/compare", response_model=object)
def predict_compare(payload: dict, user: dict = Depends(get_current_user)):
    # payload: { farm_id: number, crops: string[] }
    farm_id = int(payload.get("farm_id"))
    crop_names = payload.get("crops") or []
    if not isinstance(crop_names, list) or len(crop_names) == 0:
        raise HTTPException(status_code=400, detail="Provide 'crops' as a non-empty array")

    # Use first crop to validate farm & load model/stats/weather once.
    # Validate crop membership against known crops.
    assets = _load_model()
    pipeline = assets["pipeline"]
    stats = assets["stats"]

    with get_db_cursor() as cur:
        cur.execute(
            """
            SELECT id, user_id, farm_name, latitude, longitude, soil_ph, soil_n, soil_p, soil_k
            FROM farms WHERE id = %s
            """,
            (farm_id,),
        )
        farm = cur.fetchone()

    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    if farm["user_id"] != int(user["sub"]) and user.get("role") != "Admin":
        raise HTTPException(status_code=403, detail="You do not have access to this farm")

    known_crops = stats["known_crops"]
    for c in crop_names:
        if c not in known_crops:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown crop '{c}'. Trained crops: {known_crops}",
            )

    weather = get_weather_estimate(float(farm["latitude"]), float(farm["longitude"]))
    soil_factor = _soil_adjustment_factor(farm)

    HG_TO_KG = 0.1
    crops_out = []

    with get_db_cursor() as cur:
        for c in crop_names:
            input_row = pd.DataFrame([{
                "Item": c,
                "avg_temp": weather["avg_temp"],
                "average_rain_fall_mm_per_year": weather["average_rain_fall_mm_per_year"],
            }])
            base_prediction_hg_ha = float(pipeline.predict(input_row)[0])
            base_model_yield_kg_ha = round(base_prediction_hg_ha * HG_TO_KG, 2)
            predicted_yield_kg_ha = round(base_prediction_hg_ha * soil_factor * HG_TO_KG, 2)

            note = (
                "Model trained on hg/ha, converted to kg/ha here. Adjusted by a soil-quality heuristic (not a learned feature). "
                f"Weather source: {weather['source']}."
            )

            cur.execute(
                """
                INSERT INTO prediction_runs (
                    user_id, farm_id, crop_name,
                    predicted_yield_kg_ha, base_model_yield_kg_ha, soil_adjustment_factor,
                    model_r2_score, weather_used, note
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    int(user["sub"]),
                    farm["id"],
                    c,
                    predicted_yield_kg_ha,
                    base_model_yield_kg_ha,
                    round(soil_factor, 4),
                    round(stats["r2_score"], 4),
                    psycopg2.extras.Json(weather),
                    note,
                ),
            )

            crops_out.append(
                {
                    "crop_name": c,
                    "predicted_yield_kg_ha": predicted_yield_kg_ha,
                    "base_model_yield_kg_ha": base_model_yield_kg_ha,
                    "soil_adjustment_factor": round(soil_factor, 4),
                    "weather_used": weather,
                }
            )

    ranked = [
        x["crop_name"]
        for x in sorted(crops_out, key=lambda y: y["predicted_yield_kg_ha"], reverse=True)
    ]

    return {
        "run_type": "compare",
        "farm_id": farm["id"],
        "crops": crops_out,
        "ranked_by_predicted_yield_kg_ha": ranked,
    }


@router.get("/history", response_model=object)
def predict_history(farm_id: int, user: dict = Depends(get_current_user)):
    with get_db_cursor() as cur:
        cur.execute(
            """
            SELECT p.id, p.farm_id, p.crop_name,
                   p.predicted_yield_kg_ha, p.base_model_yield_kg_ha,
                   p.soil_adjustment_factor, p.weather_used, p.model_r2_score,
                   p.created_at
            FROM prediction_runs p
            JOIN farms f ON f.id = p.farm_id
            WHERE p.farm_id = %s
              AND (f.user_id = %s OR %s = 'Admin')
            ORDER BY p.created_at DESC
            LIMIT 25
            """,
            (farm_id, int(user["sub"]), user.get("role")),
        )
        rows = cur.fetchall()

    # Convert created_at to iso strings
    for r in rows:
        if hasattr(r["created_at"], "isoformat"):
            r["created_at"] = r["created_at"].isoformat()

    return {"farm_id": farm_id, "items": rows}

