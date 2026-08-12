/**
 * lib/api.ts — thin fetch wrapper around the YieldSense FastAPI backend.
 * Token storage uses an in-memory + localStorage pattern; swap for
 * httpOnly cookies before shipping past Milestone 1.
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export interface TokenResponse {
  access_token: string;
  token_type: string;
  role: "Farmer" | "Admin";
}

export interface FarmPayload {
  farm_name: string;
  latitude: number;
  longitude: number;
  soil_ph?: number;
  soil_n?: number;
  soil_p?: number;
  soil_k?: number;
}

export interface FarmResponse extends FarmPayload {
  id: number;
  user_id: number;
}

export interface PredictRequest {
  farm_id: number;
  crop_name: string;
}

export interface WeatherUsed {
  avg_temp: number;
  average_rain_fall_mm_per_year: number;
  source: string;
}

export interface PredictResponse {
  farm_id: number;
  crop_name: string;
  predicted_yield_kg_ha: number;
  base_model_yield_kg_ha: number;
  soil_adjustment_factor: number;
  weather_used: WeatherUsed;
  model_r2_score: number;
  note: string;
}

// --- Reports / Compare / History ---

export type RiskLevel = "Low" | "Moderate" | "High";

export interface WeatherAnalytics {
  heat_stress_risk: RiskLevel;
  rainfall_risk: RiskLevel;
  summary: string;
}

export interface SoilAnalytics {
  soil_adjustment_factor: number;
  nitrogen_score?: number | null;
  phosphorus_score?: number | null;
  potassium_score?: number | null;
  ph_score?: number | null;
  summary: string;
}

export interface YieldReportRequest {
  farm_id: number;
  crop_name: string;
}

export interface YieldReportResponse {
  run_type: "single";
  farm_id: number;
  crop_name: string;
  predicted_yield_kg_ha: number;
  base_model_yield_kg_ha: number;
  soil_adjustment_factor: number;
  model_r2_score: number;
  weather_used: WeatherUsed;
  weather_analytics: WeatherAnalytics;
  soil_analytics: SoilAnalytics;
  narrative: string;
  note: string;
}

export interface YieldCompareRequest {
  farm_id: number;
  crops: string[];
}

export interface CropComparisonItem {
  crop_name: string;
  predicted_yield_kg_ha: number;
  base_model_yield_kg_ha: number;
  soil_adjustment_factor: number;
  weather_used: WeatherUsed;
}

export interface YieldComparisonResponse {
  run_type: "compare";
  farm_id: number;
  crops: CropComparisonItem[];
  ranked_by_predicted_yield_kg_ha: string[];
}

export interface PredictionHistoryItem {
  id: number;
  farm_id: number;
  crop_name: string;
  predicted_yield_kg_ha: number;
  base_model_yield_kg_ha: number;
  soil_adjustment_factor: number;
  weather_used: WeatherUsed;
  model_r2_score: number;
  created_at: string;
}

export interface PredictionHistoryResponse {
  farm_id: number;
  items: PredictionHistoryItem[];
}

// --- Soil analysis (standalone) ---

export interface SoilAnalysisRequest {
  soil_ph?: number;
  soil_n?: number;
  soil_p?: number;
  soil_k?: number;
}

export interface SoilAnalysisResponse {
  soil_adjustment_factor: number;
  nitrogen_score?: number | null;
  phosphorus_score?: number | null;
  potassium_score?: number | null;
  ph_score?: number | null;
  remediation_steps: string[];
  note: string;
}

// --- Analytics & Recommendations ---

export interface FarmAnalyticsRequest {
  crop_type: string;
  avg_temp: number;
  rainfall: number;
  soil_ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
}

export interface IdentifiedRisk {
  type: string;
  severity: "Low" | "Medium" | "High";
  advice: string;
}

export interface FarmAnalyticsResponse {
  crop: string;
  overall_risk_level: "Low" | "Medium" | "High";
  identified_risks: IdentifiedRisk[];
  actionable_recommendations: string[];
  best_practice_tips: string[];
}

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("ys_token")
      : null;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({
      detail: res.statusText,
    }));

    throw new ApiError(
      res.status,
      body.detail ?? "Request failed"
    );
  }

  return res.json() as Promise<T>;
}

export const api = {
  register: (
    email: string,
    password: string,
    role: "Farmer" | "Admin" = "Farmer"
  ) =>
    request<TokenResponse>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, role }),
    }),

  login: (email: string, password: string) =>
    request<TokenResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  createFarm: (payload: FarmPayload) =>
    request<FarmResponse>("/api/v1/farms", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  listFarms: () => request<FarmResponse[]>("/api/v1/farms"),

  predict: (payload: PredictRequest) =>
    request<PredictResponse>("/api/v1/predict", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Single-crop report: prediction + weather analytics + soil analytics + narrative.
  getYieldReport: (payload: YieldReportRequest) =>
    request<YieldReportResponse>("/api/v1/predict/report", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Multi-crop comparison, ranked by predicted yield.
  compareCrops: (payload: YieldCompareRequest) =>
    request<YieldComparisonResponse>("/api/v1/predict/compare", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Last 25 persisted prediction runs for a farm.
  getPredictionHistory: (farmId: number) =>
    request<PredictionHistoryResponse>(
      `/api/v1/predict/history?farm_id=${encodeURIComponent(farmId)}`
    ),

  // Standalone soil scoring + remediation suggestions (no farm/crop required).
  analyzeSoil: (payload: SoilAnalysisRequest) =>
    request<SoilAnalysisResponse>("/api/v1/soil/analysis", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Recommendations and Risk Assessment Engine
  generateFarmInsights: (payload: FarmAnalyticsRequest) =>
    request<FarmAnalyticsResponse>("/api/v1/analytics/recommendations", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export function storeSession(token: TokenResponse) {
  localStorage.setItem("ys_token", token.access_token);
  localStorage.setItem("ys_role", token.role);
}

export function clearSession() {
  localStorage.removeItem("ys_token");
  localStorage.removeItem("ys_role");
}
