"""
routers/soil.py — standalone soil analysis endpoint.

Unlike /api/v1/predict/*, this endpoint does not require a saved farm or
a crop selection. It takes raw soil readings directly in the request body
and returns the same soil scoring used by /predict/report and
/predict/compare, plus a short list of remediation suggestions.

Deliberately reuses routers.predict's IDEAL_RANGES / _soil_adjustment_factor
/ _soil_scores rather than a separate scoring scale, so a
soil_adjustment_factor or nitrogen_score here means exactly the same thing
as the one embedded in a prediction report. Those helpers take a dict and
look up soil_ph/soil_n/soil_p/soil_k via .get(), so a plain dict built from
the request body works the same as a `farm` row.

No persistence: this is a quick "check my numbers" workflow, not tied to
prediction_runs.
"""
from fastapi import APIRouter, Depends

from auth_handler import get_current_user
from models import SoilAnalysisRequest, SoilAnalysisResponse
from routers.predict import IDEAL_RANGES, _soil_adjustment_factor, _soil_scores

router = APIRouter(prefix="/api/v1/soil", tags=["Soil"])

# Scores from _soil_scores are 0 (poor) .. 1 (ideal), matching predict.py.
# Anything below this is called out with a remediation suggestion.
ATTENTION_THRESHOLD = 0.7

FIELD_LABELS = {
    "soil_ph": "pH",
    "soil_n": "Nitrogen",
    "soil_p": "Phosphorus",
    "soil_k": "Potassium",
}


def _remediation_for(readings: dict, scores: dict) -> list[str]:
    if all(v is None for v in readings.values()):
        return ["No soil readings were submitted, so there's nothing to assess yet."]

    steps: list[str] = []

    for field, (low, high) in IDEAL_RANGES.items():
        value = readings.get(field)
        score = scores.get(field)
        if value is None or score is None or score >= ATTENTION_THRESHOLD:
            continue

        label = FIELD_LABELS[field]
        if value < low:
            if field == "soil_ph":
                steps.append(
                    f"{label} ({value}) is below the {low}-{high} target; apply agricultural lime to raise it."
                )
            else:
                steps.append(
                    f"{label} ({value}) is below the {low}-{high} target; consider a targeted fertilizer application."
                )
        else:
            if field == "soil_ph":
                steps.append(
                    f"{label} ({value}) is above the {low}-{high} target; incorporate elemental sulfur or organic matter to lower it."
                )
            else:
                steps.append(
                    f"{label} ({value}) is above the {low}-{high} target; hold off on further {label.lower()} application."
                )

    if not steps:
        steps.append("All submitted readings fall within the ideal reference ranges — no remediation needed right now.")

    return steps


@router.post("/analysis", response_model=SoilAnalysisResponse)
def analyze_soil(
    payload: SoilAnalysisRequest,
    user: dict = Depends(get_current_user),
) -> SoilAnalysisResponse:
    """
    Standalone soil scoring workflow. Any subset of soil_ph/soil_n/soil_p/soil_k
    may be provided; only the supplied readings are scored. Uses the exact
    same heuristic as /predict/report and /predict/compare, so results are
    directly comparable to the soil_analytics block in a yield report.
    """
    readings = {
        "soil_ph": payload.soil_ph,
        "soil_n": payload.soil_n,
        "soil_p": payload.soil_p,
        "soil_k": payload.soil_k,
    }

    soil_adjustment_factor = _soil_adjustment_factor(readings)
    scores = _soil_scores(readings)

    any_reading_supplied = any(v is not None for v in readings.values())
    remediation_steps = _remediation_for(readings, scores)

    note = (
        "Scores use the same 0.85-1.15 soil-adjustment heuristic applied in yield reports, based on ideal "
        "reference ranges — not a substitute for a certified soil lab test."
        if any_reading_supplied
        else "No soil readings were provided, so no scores could be calculated."
    )

    return SoilAnalysisResponse(
        soil_adjustment_factor=round(soil_adjustment_factor, 4),
        nitrogen_score=scores.get("soil_n"),
        phosphorus_score=scores.get("soil_p"),
        potassium_score=scores.get("soil_k"),
        ph_score=scores.get("soil_ph"),
        remediation_steps=remediation_steps,
        note=note,
    )
