# TODO

## Reports + persistence
- [x] Update `yieldsense-backend/models.py` with report/compare/history schemas
- [x] Update `yieldsense-backend/schema.sql` with `prediction_runs` table
- [x] Refactor `yieldsense-backend/routers/predict.py` to share prediction logic
- [x] Add `POST /api/v1/predict/report`
- [x] Add `POST /api/v1/predict/compare`
- [x] Add `GET /api/v1/predict/history?farm_id=`
- [x] Persist each run into `prediction_runs`

## Soil analysis workflows (standalone)
- [x] Add `POST /api/v1/soil/analysis` endpoint returning soil scores + remediation suggestions
- [x] Add schemas for soil analysis responses in `yieldsense-backend/models.py`

## Frontend & Visualization
- [x] Update `yieldsense-frontend/lib/api.ts` with new API calls
- [x] Update dashboard UI to render:
  - [x] Single report summary card
  - [x] Compare crops ranked list
  - [x] History list
  - [x] Soil analysis workflow section + call-to-endpoint button
  - [x] Dynamic Recharts graphs (historical yield trends, crop comparisons)
  - [x] Agricultural intelligence & risk assessment tabs

## Testing & Deployment
- [x] Run backend locally; verify endpoints in Swagger
- [x] Run frontend locally; smoke test dashboard interactions
- [x] Write backend unit test suite for recommendations logic
- [x] Setup Dockerfiles for frontend/backend and orchestrate with docker-compose.yml
- [x] Document final ML Random Forest model accuracy details
