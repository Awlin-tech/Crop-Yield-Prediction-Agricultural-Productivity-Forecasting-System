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
- [ ] Add `POST /api/v1/soil/analysis` endpoint returning soil scores + remediation suggestions
- [ ] Add schemas for soil analysis responses in `yieldsense-backend/models.py`


## Frontend
- [ ] Update `yieldsense-frontend/lib/api.ts` with new API calls
- [ ] Update dashboard UI to render:
  - [ ] single report summary card
  - [ ] compare crops ranked list
  - [ ] history list
  - [ ] soil analysis workflow section + call-to-endpoint button

## Testing
- [ ] Run backend locally; verify endpoints in Swagger
- [ ] Run frontend locally; smoke test dashboard interactions

