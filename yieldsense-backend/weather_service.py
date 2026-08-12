"""
weather_service.py — resolves an average temperature and rainfall figure
for a farm's coordinates, for use as prediction inputs.

Two paths:
  1. Live: calls OpenWeatherMap if WEATHER_API_KEY is set in the environment.
  2. Fallback: a simple seasonal-by-latitude estimate, used when no API key
     is configured or the live call fails. This is clearly NOT real weather
     data — it's a rough placeholder so the prediction endpoint still works
     end-to-end during development.
"""
import math
import os
from datetime import datetime, timezone
from typing import TypedDict

import requests
from dotenv import load_dotenv

load_dotenv()

WEATHER_API_KEY = os.getenv("WEATHER_API_KEY", "")
WEATHER_API_BASE_URL = os.getenv("WEATHER_API_BASE_URL", "https://api.openweathermap.org/data/2.5")


class WeatherEstimate(TypedDict):
    avg_temp: float
    average_rain_fall_mm_per_year: float
    source: str  # "live" or "seasonal_fallback"


def _seasonal_fallback(latitude: float) -> WeatherEstimate:
    """
    Rough estimate with no external calls: temperature falls off with
    distance from the equator, rainfall uses a flat global-average baseline.
    This exists so /predict still works with no WEATHER_API_KEY configured —
    it is not a substitute for real climate data.
    """
    abs_lat = abs(latitude)
    # ~27C at the equator, tapering to ~ -5C near the poles.
    estimated_temp = 27 - (abs_lat / 90) * 32

    # crude seasonal adjustment using current month, tiny swing only
    month = datetime.now(timezone.utc).month
    seasonal_swing = 4 * math.sin((month / 12) * 2 * math.pi)
    estimated_temp += seasonal_swing if latitude >= 0 else -seasonal_swing

    baseline_rainfall_mm_per_year = 1100.0  # rough global land average

    return {
        "avg_temp": round(estimated_temp, 2),
        "average_rain_fall_mm_per_year": baseline_rainfall_mm_per_year,
        "source": "seasonal_fallback",
    }


def get_weather_estimate(latitude: float, longitude: float) -> WeatherEstimate:
    if not WEATHER_API_KEY:
        return _seasonal_fallback(latitude)

    try:
        resp = requests.get(
            f"{WEATHER_API_BASE_URL}/weather",
            params={
                "lat": latitude,
                "lon": longitude,
                "appid": WEATHER_API_KEY,
                "units": "metric",
            },
            timeout=5,
        )
        resp.raise_for_status()
        data = resp.json()

        current_temp = float(data["main"]["temp"])
        # OpenWeatherMap's free tier only gives current conditions, not an
        # annual rainfall total, so we fall back to the baseline for rainfall
        # even on a "live" temperature read.
        return {
            "avg_temp": round(current_temp, 2),
            "average_rain_fall_mm_per_year": 1100.0,
            "source": "live",
        }
    except (requests.RequestException, KeyError, ValueError):
        return _seasonal_fallback(latitude)
