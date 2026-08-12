"""
models.py — Pydantic schemas shared across routers.
"""
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field


# --- Auth ---

class UserSignup(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, description="Minimum 8 characters")
    role: Literal["Farmer", "Admin"] = "Farmer"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str


# --- Farms ---

class FarmCreate(BaseModel):
    farm_name: str = Field(min_length=1, max_length=100)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    soil_ph: Optional[float] = Field(default=None, ge=0, le=14)
    soil_n: Optional[float] = None
    soil_p: Optional[float] = None
    soil_k: Optional[float] = None


class FarmResponse(FarmCreate):
    id: int
    user_id: int


# --- Crops ---

class CropCreate(BaseModel):
    farm_id: int
    crop_name: str = Field(min_length=1, max_length=100)
    hectares_planted: Optional[float] = None


class CropResponse(CropCreate):
    id: int
    
    
# --- Prediction ---

class PredictRequest(BaseModel):
    farm_id: int
    crop_name: str = Field(min_length=1, max_length=100)


class WeatherUsed(BaseModel):
    avg_temp: float
    average_rain_fall_mm_per_year: float
    source: str


class PredictResponse(BaseModel):
    farm_id: int
    crop_name: str
    predicted_yield_kg_ha: float
    base_model_yield_kg_ha: float
    soil_adjustment_factor: float
    weather_used: WeatherUsed
    model_r2_score: float
    note: str


# --- Reports / Compare / History ---
class WeatherAnalytics(BaseModel):
    heat_stress_risk: Literal["Low", "Moderate", "High"]
    rainfall_risk: Literal["Low", "Moderate", "High"]
    summary: str


class SoilAnalytics(BaseModel):
    soil_adjustment_factor: float
    nitrogen_score: Optional[float] = None
    phosphorus_score: Optional[float] = None
    potassium_score: Optional[float] = None
    ph_score: Optional[float] = None
    summary: str


class YieldReportResponse(BaseModel):
    # Identity
    run_type: Literal["single"] = "single"
    farm_id: int
    crop_name: str

    # Predictions
    predicted_yield_kg_ha: float
    base_model_yield_kg_ha: float
    soil_adjustment_factor: float
    model_r2_score: float

    # Supporting inputs/interpretation
    weather_used: WeatherUsed
    weather_analytics: WeatherAnalytics
    soil_analytics: SoilAnalytics

    # UX text
    narrative: str
    note: str


class CropComparisonItem(BaseModel):
    crop_name: str
    predicted_yield_kg_ha: float
    base_model_yield_kg_ha: float
    soil_adjustment_factor: float
    weather_used: WeatherUsed


class YieldComparisonResponse(BaseModel):
    run_type: Literal["compare"] = "compare"
    farm_id: int
    crops: list[CropComparisonItem]
    ranked_by_predicted_yield_kg_ha: list[str]


class PredictionHistoryItem(BaseModel):
    id: int
    farm_id: int
    crop_name: str
    predicted_yield_kg_ha: float
    base_model_yield_kg_ha: float
    soil_adjustment_factor: float
    weather_used: WeatherUsed
    model_r2_score: float
    created_at: str


class SoilAnalysisRequest(BaseModel):
    soil_ph: Optional[float] = Field(default=None, ge=0, le=14)
    soil_n: Optional[float] = None
    soil_p: Optional[float] = None
    soil_k: Optional[float] = None


class SoilAnalysisResponse(BaseModel):
    soil_adjustment_factor: float
    nitrogen_score: Optional[float] = None
    phosphorus_score: Optional[float] = None
    potassium_score: Optional[float] = None
    ph_score: Optional[float] = None
    remediation_steps: list[str]
    note: str

