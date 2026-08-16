import sys
import os
from fastapi.testclient import TestClient

# Add parent directory to path so python can locate main.py and other modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app
from auth_handler import get_current_user

# Create a mock user dependency so we can test endpoints without auth database setup
def override_get_current_user():
    return {"sub": "1", "email": "test@farmdomain.com", "role": "Farmer"}

# Apply the dependency override
app.dependency_overrides[get_current_user] = override_get_current_user

client = TestClient(app)


def test_health_check():
    """Verify that the health check endpoint is operational."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_recommendations_endpoint():
    """Verify that the recommendations & risk assessment endpoint behaves correctly."""
    payload = {
        "crop_type": "Wheat",
        "avg_temp": 28.5,
        "rainfall": 850.0,
        "soil_ph": 6.2,
        "nitrogen": 80.0,
        "phosphorus": 45.0,
        "potassium": 40.0
    }
    response = client.post("/api/v1/analytics/recommendations", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert "crop" in data
    assert data["crop"] == "Wheat"
    assert "overall_risk_level" in data
    assert "identified_risks" in data
    assert "actionable_recommendations" in data
    assert "best_practice_tips" in data
    assert isinstance(data["actionable_recommendations"], list)
    assert isinstance(data["identified_risks"], list)


def test_recommendations_acidic_soil():
    """Verify soil acidity recommendations are triggered correctly."""
    payload = {
        "crop_type": "Rice",
        "avg_temp": 25.0,
        "rainfall": 1000.0,
        "soil_ph": 5.2, # Acidic pH
        "nitrogen": 60.0,
        "phosphorus": 40.0,
        "potassium": 40.0
    }
    response = client.post("/api/v1/analytics/recommendations", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    # Check if pH warning recommendation is present
    ph_recs = [r for r in data["actionable_recommendations"] if "lime" in r.lower()]
    assert len(ph_recs) > 0


def test_recommendations_drought_risk():
    """Verify drought risk is correctly flagged on low rainfall."""
    payload = {
        "crop_type": "Maize",
        "avg_temp": 32.0,
        "rainfall": 150.0, # Low rainfall (Drought stress)
        "soil_ph": 6.5,
        "nitrogen": 90.0,
        "phosphorus": 50.0,
        "potassium": 50.0
    }
    response = client.post("/api/v1/analytics/recommendations", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    # Verify overall risk level and identified risks list
    assert data["overall_risk_level"] == "High"
    drought_alerts = [r for r in data["identified_risks"] if "drought" in r["type"].lower()]
    assert len(drought_alerts) > 0
    assert drought_alerts[0]["severity"] == "High"
