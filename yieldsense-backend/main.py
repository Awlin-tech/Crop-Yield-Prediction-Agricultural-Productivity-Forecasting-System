"""
main.py — YieldSense AI Core API entrypoint.

Run locally with:
    uvicorn main:app --reload
Then check:
    http://127.0.0.1:8000/docs           (Swagger UI)
    http://127.0.0.1:8000/api/v1/health  (health check)
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routers import auth, farms, predict, soil, analytics

app = FastAPI(
    title="YieldSense AI Core",
    description="Predictive analytics API for agricultural yield forecasting.",
    version="0.1.0",
)

# Milestone 1: allow the local Next.js dev server to call the API.
# Tighten this list before deploying anywhere beyond localhost.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(farms.router)
app.include_router(predict.router)
app.include_router(soil.router)
app.include_router(analytics.router)


@app.on_event("startup")
def on_startup():
    # Applies schema.sql if tables don't exist yet, so a fresh Postgres
    # instance is usable without a manual psql step.
    init_db()


@app.get("/api/v1/health", tags=["System"])
def health_check():
    return {"status": "healthy", "service": "YieldSense Engine Core"}
