import sys
import os
import unittest

# Add parent directory to path so python can locate routers and other modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from routers.analytics import generate_farm_insights, FarmAnalyticsRequest


class TestRecommendationRules(unittest.TestCase):
    """Test unit for testing the recommendation engine and risk matrix logic directly."""

    def test_optimal_conditions(self):
        """Verify recommendations when all parameters are optimal."""
        payload = FarmAnalyticsRequest(
            crop_type="Wheat",
            avg_temp=22.0,
            rainfall=600.0,
            soil_ph=6.5,
            nitrogen=100.0,
            phosphorus=45.0,
            potassium=45.0
        )
        # Mock user parameter as it's not used by internal rule checks but is part of the API signature
        user_mock = {"sub": "1", "role": "Farmer"}
        result = generate_farm_insights(payload, user_mock)

        self.assertEqual(result["crop"], "Wheat")
        self.assertEqual(result["overall_risk_level"], "Low")
        self.assertEqual(len(result["identified_risks"]), 0)
        self.assertIn("Soil pH is optimal.", result["actionable_recommendations"][0])

    def test_acidic_soil_and_low_nitrogen(self):
        """Verify soil lime suggestions and nitrogen alerts are active on critical parameters."""
        payload = FarmAnalyticsRequest(
            crop_type="Rice",
            avg_temp=24.0,
            rainfall=800.0,
            soil_ph=5.0, # Highly acidic
            nitrogen=30.0, # Low nitrogen
            phosphorus=40.0,
            potassium=40.0
        )
        user_mock = {"sub": "1", "role": "Farmer"}
        result = generate_farm_insights(payload, user_mock)

        # Should recommend lime
        lime_recs = [r for r in result["actionable_recommendations"] if "lime" in r.lower()]
        self.assertTrue(len(lime_recs) > 0, "Lime recommendation should be present for pH < 6.0")

        # Should recommend Nitrogen fertilizer
        n_recs = [r for r in result["actionable_recommendations"] if "nitrogen" in r.lower() or "urea" in r.lower()]
        self.assertTrue(len(n_recs) > 0, "Urea/Nitrogen recommendation should be present for N < 50")

    def test_high_heat_and_drought_alerts(self):
        """Verify overall risk transitions to High on severe drought/temperature limits."""
        payload = FarmAnalyticsRequest(
            crop_type="Maize",
            avg_temp=38.0, # Extreme Heat (>35)
            rainfall=150.0, # Extreme Drought (<300)
            soil_ph=6.8,
            nitrogen=90.0,
            phosphorus=40.0,
            potassium=40.0
        )
        user_mock = {"sub": "1", "role": "Farmer"}
        result = generate_farm_insights(payload, user_mock)

        self.assertEqual(result["overall_risk_level"], "High")
        
        # Verify identified risks contain drought stress and heat stress
        risk_types = [r["type"].lower() for r in result["identified_risks"]]
        self.assertTrue(any("drought" in r for r in risk_types), "Drought stress risk should be identified")
        self.assertTrue(any("heat" in r for r in risk_types), "Heat stress risk should be identified")


if __name__ == "__main__":
    unittest.main()
