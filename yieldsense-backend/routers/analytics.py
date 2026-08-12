# routers/analytics.py — Milestone 3: Recommendations & Risk Assessment Logic
import io
import csv
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from auth_handler import get_current_user
from database import get_db_cursor

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics & Recommendations"])


class FarmAnalyticsRequest(BaseModel):
    crop_type: str  # Wheat, Rice, or Maize
    avg_temp: float
    rainfall: float
    soil_ph: float
    nitrogen: float  # N level in soil
    phosphorus: float  # P level in soil
    potassium: float  # K level in soil


@router.post("/recommendations")
def generate_farm_insights(payload: FarmAnalyticsRequest, user: dict = Depends(get_current_user)):
    recommendations = []
    risks = []
    
    # 1. Fertilizer & Soil Recommendation Logic
    if payload.soil_ph < 6.0:
        recommendations.append("Apply agricultural lime to raise soil pH to optimal range (6.0 - 7.0).")
    elif payload.soil_ph > 7.5:
        recommendations.append("Apply elemental sulfur to lower soil pH.")
    else:
        recommendations.append("Soil pH is optimal. Maintain current organic matter levels.")

    # Nitrogen (N) suggestions
    if payload.nitrogen < 50:
        recommendations.append("Low Nitrogen detected: Apply Urea or NPK (20-10-10) fertilizer during early growth.")
    elif payload.nitrogen > 150:
        recommendations.append("Nitrogen excess: Reduce fertilizer to prevent vegetative overgrowth and lodging.")
    else:
        recommendations.append("Nitrogen level is adequate for early developmental stages.")

    # Phosphorus (P) suggestions
    if payload.phosphorus < 30:
        recommendations.append("Low Phosphorus: Amend soil with Diammonium Phosphate (DAP) or bone meal to boost root development.")
    else:
        recommendations.append("Phosphorus level is stable. Continue standard organic mulching.")

    # Potassium (K) suggestions
    if payload.potassium < 30:
        recommendations.append("Low Potassium: Add potash or kelp meal to increase disease resistance and water efficiency.")

    # 2. Climate Risk Assessment Logic
    risk_score = "Low"
    
    # Rainfall-based alerts
    if payload.rainfall < 300:
        risks.append({
            "type": "Drought Stress",
            "severity": "High",
            "advice": "Initiate drip irrigation immediately to conserve root moisture."
        })
        risk_score = "High"
    elif payload.rainfall < 500:
        risks.append({
            "type": "Moderate Drought Risk",
            "severity": "Medium",
            "advice": "Monitor moisture depletion rates and plan supplemental watering."
        })
        risk_score = "Medium"
    elif payload.rainfall > 1500:
        risks.append({
            "type": "Flood & Root Rot",
            "severity": "High",
            "advice": "Silt build-up and saturation detected. Ensure field drainage channels are clear."
        })
        risk_score = "High"
    elif payload.rainfall > 1200:
        risks.append({
            "type": "Excessive Moisture",
            "severity": "Medium",
            "advice": "Ensure field drainage paths are clear to reduce waterlogging."
        })
        if risk_score != "High":
            risk_score = "Medium"

    # Temperature-based alerts
    if payload.avg_temp > 35:
        risks.append({
            "type": "Heat Stress",
            "severity": "High",
            "advice": "Consider shade netting or shift to early-morning overhead irrigation."
        })
        risk_score = "High"
    elif payload.avg_temp > 30:
        risks.append({
            "type": "Moderate Thermal Stress",
            "severity": "Medium",
            "advice": "Mulch soil surface heavily to reduce evaporation loss."
        })
        if risk_score != "High":
            risk_score = "Medium"
    elif payload.avg_temp < 5:
        risks.append({
            "type": "Frost / Freezing Risk",
            "severity": "High",
            "advice": "Frost risk is extreme. Utilize floating row covers or wind machines if available."
        })
        risk_score = "High"

    return {
        "crop": payload.crop_type,
        "overall_risk_level": risk_score,
        "identified_risks": risks,
        "actionable_recommendations": recommendations,
        "best_practice_tips": [
            "Rotate crops seasonally to restore natural soil nutrient balances.",
            "Monitor weekly meteorological updates for sudden shifts in weather trends.",
            "Incorporate organic compost to enhance soil structure and water retention."
        ]
    }


@router.get("/export-csv")
def export_prediction_history(farm_id: int, user: dict = Depends(get_current_user)):
    with get_db_cursor() as cur:
        # First verify ownership
        cur.execute(
            "SELECT id, farm_name, user_id, latitude, longitude, soil_ph, soil_n, soil_p, soil_k FROM farms WHERE id = %s",
            (farm_id,)
        )
        farm = cur.fetchone()
        if not farm:
            raise HTTPException(status_code=404, detail="Farm not found")
        if farm["user_id"] != int(user["sub"]) and user.get("role") != "Admin":
            raise HTTPException(status_code=403, detail="You do not have access to this farm")

        # Fetch history
        cur.execute(
            """
            SELECT id, crop_name, predicted_yield_kg_ha, base_model_yield_kg_ha,
                   soil_adjustment_factor, model_r2_score, weather_used, created_at
            FROM prediction_runs
            WHERE farm_id = %s
            ORDER BY created_at DESC
            """,
            (farm_id,)
        )
        runs = cur.fetchall()

    # Build CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write metadata header
    writer.writerow(["FARM HISTORY REPORT", farm["farm_name"]])
    writer.writerow(["Latitude", float(farm["latitude"]), "Longitude", float(farm["longitude"])])
    writer.writerow(["Soil pH", farm["soil_ph"] or "—", "Soil N-P-K", f"{farm['soil_n'] or '—'}-{farm['soil_p'] or '—'}-{farm['soil_k'] or '—'}"])
    writer.writerow([]) # blank row
    
    # Table headers
    writer.writerow([
        "Run ID", "Crop Mapped", "Soil-Adjusted Yield (kg/ha)", 
        "Base Model Yield (kg/ha)", "Soil Adjustment Multiplier", 
        "Model R2 Score", "Temperature Used (C)", "Rainfall Used (mm/yr)", "Timestamp"
    ])
    
    for r in runs:
        w = r["weather_used"]
        temp = w.get("avg_temp", "—")
        rain = w.get("average_rain_fall_mm_per_year", "—")
        writer.writerow([
            r["id"],
            r["crop_name"],
            float(r["predicted_yield_kg_ha"]),
            float(r["base_model_yield_kg_ha"]),
            float(r["soil_adjustment_factor"]),
            float(r["model_r2_score"]),
            temp,
            rain,
            r["created_at"].isoformat() if hasattr(r["created_at"], "isoformat") else r["created_at"]
        ])

    response_content = output.getvalue()
    output.close()
    
    # Return file response
    return StreamingResponse(
        io.BytesIO(response_content.encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=yieldsense_report_farm_{farm_id}.csv"}
    )
