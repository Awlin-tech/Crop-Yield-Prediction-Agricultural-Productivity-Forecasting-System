# YieldSense — Crop Yield Prediction Reports (Implemented)

## Backend endpoints

### 1) Single-crop report
- **POST** `/api/v1/predict/report`
- Body: `{ farm_id: number, crop_name: string }`
- Returns: a report JSON containing prediction outputs + derived weather analytics + soil analytics.

### 2) Multi-crop comparison
- **POST** `/api/v1/predict/compare`
- Body: `{ farm_id: number, crops: string[] }`
- Returns: `crops[]` with predicted yields and factors, plus `ranked_by_predicted_yield_kg_ha`.

### 3) Prediction history
- **GET** `/api/v1/predict/history?farm_id=...`
- Returns: last 25 persisted prediction runs for that farm (authorized by the logged user or Admin).

## Persistence

### Added table
- **prediction_runs** in `yieldsense-backend/schema.sql`

Saved fields include: `farm_id`, `crop_name`, predicted yields, `soil_adjustment_factor`, `model_r2_score`, `weather_used` (JSONB), and `created_at`.

## Files changed
- `yieldsense-backend/routers/predict.py`
- `yieldsense-backend/models.py`
- `yieldsense-backend/schema.sql`
- `TODO.md` (progress tracking)

