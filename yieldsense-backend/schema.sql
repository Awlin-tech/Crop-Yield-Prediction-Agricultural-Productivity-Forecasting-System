-- YieldSense AI — Milestone 1 schema
-- Run with: psql -U yieldsense_user -d yieldsense_db -f schema.sql

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'Farmer' NOT NULL, -- 'Farmer', 'Admin'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS farms (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    farm_name VARCHAR(100) NOT NULL,
    latitude NUMERIC(9,6) NOT NULL,
    longitude NUMERIC(9,6) NOT NULL,
    soil_ph NUMERIC(3,2),
    soil_n NUMERIC(6,2),
    soil_p NUMERIC(6,2),
    soil_k NUMERIC(6,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crops (
    id SERIAL PRIMARY KEY,
    farm_id INT REFERENCES farms(id) ON DELETE CASCADE,
    crop_name VARCHAR(100) NOT NULL,
    hectares_planted NUMERIC(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_farms_user_id ON farms(user_id);
CREATE INDEX IF NOT EXISTS idx_crops_farm_id ON crops(farm_id);

CREATE TABLE IF NOT EXISTS prediction_runs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    farm_id INT REFERENCES farms(id) ON DELETE CASCADE,
    crop_name VARCHAR(100) NOT NULL,

    predicted_yield_kg_ha NUMERIC(12,3) NOT NULL,
    base_model_yield_kg_ha NUMERIC(12,3) NOT NULL,
    soil_adjustment_factor NUMERIC(8,4) NOT NULL,
    model_r2_score NUMERIC(8,4) NOT NULL,

    weather_used JSONB NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prediction_runs_farm_id ON prediction_runs(farm_id);
CREATE INDEX IF NOT EXISTS idx_prediction_runs_user_id ON prediction_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_prediction_runs_created_at ON prediction_runs(created_at);

