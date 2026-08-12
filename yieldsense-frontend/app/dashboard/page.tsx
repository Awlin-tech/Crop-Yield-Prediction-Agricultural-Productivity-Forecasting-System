"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import {
  api,
  type FarmResponse,
  type PredictResponse,
  type YieldReportResponse,
  type YieldComparisonResponse,
  type PredictionHistoryItem,
  type SoilAnalysisResponse,
  type FarmAnalyticsResponse,
} from "@/lib/api";
import {
  Sprout,
  MapPin,
  Droplet,
  TrendingUp,
  CloudSun,
  AlertTriangle,
  Sliders,
  Thermometer,
  CloudRain,
  Gauge,
  FileText,
  GitCompare,
  History,
  FlaskConical,
  CheckCircle2,
  Trophy,
  Download,
  Printer,
  Sparkles,
  Info,
  Calendar,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const KNOWN_CROPS = [
  "Cassava",
  "Maize",
  "Plantains and others",
  "Potatoes",
  "Rice, paddy",
  "Sorghum",
  "Soybeans",
  "Sweet potatoes",
  "Wheat",
  "Yams",
];

const IDEAL_RANGES: Record<"soil_ph" | "soil_n" | "soil_p" | "soil_k", [number, number]> = {
  soil_ph: [6.0, 7.0],
  soil_n: [80, 120],
  soil_p: [30, 50],
  soil_k: [30, 50],
};

function closenessScore(value: number, range: [number, number]): number {
  const [low, high] = range;
  if (value >= low && value <= high) return 1;
  const span = high - low;
  const distance = value < low ? low - value : value - high;
  return Math.max(0, 1 - distance / span);
}

export default function DashboardPage() {
  const [farms, setFarms] = useState<FarmResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFarm, setSelectedFarm] = useState<FarmResponse | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<string>(KNOWN_CROPS[8]); // Default to Wheat (index 8)

  const [prediction, setPrediction] = useState<PredictResponse | null>(null);
  const [predicting, setPredicting] = useState(false);
  const [predictError, setPredictError] = useState<string | null>(null);

  // Full report state
  const [report, setReport] = useState<YieldReportResponse | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Multi-crop comparison state
  const [compareSelection, setCompareSelection] = useState<string[]>([]);
  const [compareResult, setCompareResult] = useState<YieldComparisonResponse | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);

  // Prediction history state
  const [history, setHistory] = useState<PredictionHistoryItem[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Soil analysis state (standalone)
  const [soilForm, setSoilForm] = useState({ soil_ph: "", soil_n: "", soil_p: "", soil_k: "" });
  const [soilResult, setSoilResult] = useState<SoilAnalysisResponse | null>(null);
  const [soilLoading, setSoilLoading] = useState(false);
  const [soilError, setSoilError] = useState<string | null>(null);

  // Milestone 3: Recommendations & Risk Assessment state
  const [insights, setInsights] = useState<FarmAnalyticsResponse | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"charts" | "recommendations" | "risks">("charts");

  // SSR protection for Recharts
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    api
      .listFarms()
      .then((data) => {
        setFarms(data);
        if (data.length > 0) setSelectedFarm(data[0]);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load farms"));
  }, []);

  // Fetch prediction details
  useEffect(() => {
    if (!selectedFarm) return;
    setPredicting(true);
    setPredictError(null);
    api
      .predict({ farm_id: selectedFarm.id, crop_name: selectedCrop })
      .then(setPrediction)
      .catch((err) => {
        setPrediction(null);
        setPredictError(err instanceof Error ? err.message : "Could not generate a forecast");
      })
      .finally(() => setPredicting(false));
  }, [selectedFarm, selectedCrop]);

  function loadHistory(farmId: number) {
    setHistoryLoading(true);
    setHistoryError(null);
    api
      .getPredictionHistory(farmId)
      .then((res) => setHistory(res.items))
      .catch((err) => {
        setHistory(null);
        setHistoryError(err instanceof Error ? err.message : "Could not load prediction history");
      })
      .finally(() => setHistoryLoading(false));
  }

  // Load history and reset state on farm change
  useEffect(() => {
    setReport(null);
    setReportError(null);
    setCompareSelection([]);
    setCompareResult(null);
    setCompareError(null);
    setHistory(null);
    setHistoryError(null);
    setInsights(null);
    if (selectedFarm) loadHistory(selectedFarm.id);
  }, [selectedFarm]);

  // Milestone 3: Fetch Recommendations and Risk Ratings dynamically
  useEffect(() => {
    if (!selectedFarm || !prediction) return;
    setInsightsLoading(true);
    api
      .generateFarmInsights({
        crop_type: selectedCrop,
        avg_temp: prediction.weather_used.avg_temp,
        rainfall: prediction.weather_used.average_rain_fall_mm_per_year,
        soil_ph: selectedFarm.soil_ph ?? 6.5,
        nitrogen: selectedFarm.soil_n ?? 80,
        phosphorus: selectedFarm.soil_p ?? 40,
        potassium: selectedFarm.soil_k ?? 40,
      })
      .then(setInsights)
      .catch(() => setInsights(null))
      .finally(() => setInsightsLoading(false));
  }, [selectedFarm, selectedCrop, prediction]);

  function handleGenerateReport() {
    if (!selectedFarm) return;
    setReportLoading(true);
    setReportError(null);
    api
      .getYieldReport({ farm_id: selectedFarm.id, crop_name: selectedCrop })
      .then((res) => {
        setReport(res);
        loadHistory(selectedFarm.id);
      })
      .catch((err) => {
        setReport(null);
        setReportError(err instanceof Error ? err.message : "Could not generate the full report");
      })
      .finally(() => setReportLoading(false));
  }

  function toggleCompareCrop(crop: string) {
    setCompareSelection((prev) =>
      prev.includes(crop) ? prev.filter((c) => c !== crop) : [...prev, crop]
    );
  }

  function handleCompare() {
    if (!selectedFarm || compareSelection.length === 0) return;
    setCompareLoading(true);
    setCompareError(null);
    api
      .compareCrops({ farm_id: selectedFarm.id, crops: compareSelection })
      .then((res) => {
        setCompareResult(res);
        loadHistory(selectedFarm.id);
      })
      .catch((err) => {
        setCompareResult(null);
        setCompareError(err instanceof Error ? err.message : "Could not compare crops");
      })
      .finally(() => setCompareLoading(false));
  }

  function handleAnalyzeSoil() {
    setSoilLoading(true);
    setSoilError(null);
    api
      .analyzeSoil({
        soil_ph: soilForm.soil_ph ? Number(soilForm.soil_ph) : undefined,
        soil_n: soilForm.soil_n ? Number(soilForm.soil_n) : undefined,
        soil_p: soilForm.soil_p ? Number(soilForm.soil_p) : undefined,
        soil_k: soilForm.soil_k ? Number(soilForm.soil_k) : undefined,
      })
      .then(setSoilResult)
      .catch((err) => {
        setSoilResult(null);
        setSoilError(err instanceof Error ? err.message : "Could not analyze this soil profile");
      })
      .finally(() => setSoilLoading(false));
  }

  // Milestone 3: Download CSV predictions report from backend endpoint
  async function handleDownloadCSV() {
    if (!selectedFarm) return;
    try {
      const token = localStorage.getItem("ys_token");
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
      const res = await fetch(`${API_BASE_URL}/api/v1/analytics/export-csv?farm_id=${selectedFarm.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Could not fetch CSV report.");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `yieldsense_${selectedFarm.farm_name.toLowerCase().replace(/\s+/g, "_")}_history.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to download report.");
    }
  }

  // Trigger print-to-pdf stylesheet options
  function handlePrintPDF() {
    window.print();
  }

  const soilScores = selectedFarm
    ? {
        n: selectedFarm.soil_n != null ? closenessScore(selectedFarm.soil_n, IDEAL_RANGES.soil_n) : null,
        p: selectedFarm.soil_p != null ? closenessScore(selectedFarm.soil_p, IDEAL_RANGES.soil_p) : null,
        k: selectedFarm.soil_k != null ? closenessScore(selectedFarm.soil_k, IDEAL_RANGES.soil_k) : null,
        ph: selectedFarm.soil_ph != null ? closenessScore(selectedFarm.soil_ph, IDEAL_RANGES.soil_ph) : null,
      }
    : null;

  // Recharts Line Chart Data formatting (prediction history)
  const yieldTrendData = history
    ? history
        .slice()
        .reverse()
        .map((item) => ({
          date: new Date(item.created_at).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          }),
          Yield: item.predicted_yield_kg_ha,
          crop: item.crop_name,
        }))
    : [];

  // Recharts Bar Chart Data formatting (multi-crop comparison)
  const comparisonChartData = compareResult
    ? compareResult.crops.map((c) => ({
        name: c.crop_name,
        Yield: c.predicted_yield_kg_ha,
        Baseline: c.base_model_yield_kg_ha,
      }))
    : [];

  return (
    <main className="min-h-screen bg-paper text-ink selection:bg-wheat selection:text-paper font-body antialiased">
      <div className="print:hidden">
        <Navbar role="Farmer" />
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 print:px-0 print:py-0">
        
        {/* Printable Document Header (Only visible on print/PDF) */}
        <div className="hidden print:flex flex-col border-b border-line pb-6 mb-8">
          <div className="flex justify-between items-center">
            <span className="font-display font-extrabold text-2xl tracking-tight text-canopy">YieldSense.</span>
            <span className="font-mono text-xs text-ink/40">Date: {new Date().toLocaleDateString()}</span>
          </div>
          <h1 className="font-display text-3xl font-black text-ink mt-6">Acreage Diagnostics & Yield Forecast Summary</h1>
          <p className="text-xs text-ink/70 leading-relaxed mt-2">
            Generated report for acreage: <strong>{selectedFarm?.farm_name}</strong>. Evaluated on agricultural forecasting models with combined N-P-K soil logs.
          </p>
        </div>

        {/* Dashboard Header */}
        <div className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-baseline sm:justify-between print:hidden">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-canopy">Agronomy Dashboard</p>
            <h1 className="mt-1 font-display text-4xl font-extrabold tracking-tight text-ink">Field Command.</h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {selectedFarm && (
              <>
                <button
                  onClick={handleDownloadCSV}
                  className="inline-flex items-center gap-2 border border-line bg-paper px-4 py-2.5 text-xs font-semibold text-ink transition hover:border-canopy hover:text-canopy"
                >
                  <Download className="h-3.5 w-3.5 text-canopy" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={handlePrintPDF}
                  className="inline-flex items-center gap-2 border border-line bg-paper px-4 py-2.5 text-xs font-semibold text-ink transition hover:border-canopy hover:text-canopy"
                >
                  <Printer className="h-3.5 w-3.5 text-canopy" />
                  <span>Print PDF</span>
                </button>
              </>
            )}
            <Link
              href="/onboarding"
              className="inline-block border border-ink bg-ink px-5 py-2.5 text-center text-sm font-semibold text-paper shadow-sm transition duration-200 hover:border-canopyDeep hover:bg-canopyDeep"
            >
              + Register New Acreage
            </Link>
          </div>
        </div>

        {error && (
          <div role="alert" className="mt-6 border border-clay bg-clay/10 px-3 py-2 text-sm text-clay print:hidden">
            {error}
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 print:block">
          
          {/* Column 1: Farm Selector Ledger (35%) */}
          <div className="flex flex-col gap-6 lg:col-span-4 print:hidden">
            <div className="border border-line bg-paper p-5 shadow-sm">
              <h2 className="mb-4 flex items-center justify-between border-b border-line pb-2 font-display text-base font-extrabold text-ink">
                <span>Your Acreages</span>
                {farms && (
                  <span className="border border-line bg-ink/[0.04] px-2 py-0.5 font-mono text-xs text-ink/40">
                    {farms.length} Active
                  </span>
                )}
              </h2>

              <div className="flex max-h-[350px] flex-col gap-2 overflow-y-auto pr-1">
                {farms === null && !error && (
                  <p className="py-6 text-center text-sm text-ink/40">Loading logged farms…</p>
                )}
                {farms?.length === 0 && (
                  <div className="py-6 text-center">
                    <p className="text-xs leading-relaxed text-ink/50">No farm ledgers synced yet.</p>
                    <Link href="/onboarding" className="mt-3 inline-block text-xs font-bold text-canopy hover:underline">
                      Create your first plot &rarr;
                    </Link>
                  </div>
                )}
                {farms?.map((farm) => {
                  const isSelected = selectedFarm?.id === farm.id;
                  return (
                    <button
                      key={farm.id}
                      onClick={() => setSelectedFarm(farm)}
                      className={`flex w-full items-center justify-between border p-3 text-left transition duration-150 ${
                        isSelected ? "border-canopy bg-canopy/5" : "border-line hover:border-canopy"
                      }`}
                    >
                      <div>
                        <p className="font-display text-sm font-bold text-ink">{farm.farm_name}</p>
                        <p className="mt-1 flex items-center gap-1 font-mono text-[10px] text-ink/50">
                          <MapPin className="h-2.5 w-2.5 shrink-0" />
                          <span>
                            {farm.latitude.toFixed(3)}, {farm.longitude.toFixed(3)}
                          </span>
                        </p>
                      </div>
                      <span className="border border-canopy/20 bg-canopy/5 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-canopy">
                        pH {farm.soil_ph?.toFixed(1) ?? "—"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedFarm && (
              <div className="border border-line bg-paper/50 p-5 shadow-sm">
                <h3 className="mb-3 border-b border-line pb-2 font-mono text-xs uppercase tracking-wider text-ink/50">
                  Soil Chemistry Profile
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border-l border-line/60 pl-2">
                    <p className="font-mono text-[10px] text-ink/40">NITROGEN</p>
                    <p className="font-display text-sm font-bold text-ink">{selectedFarm.soil_n ?? "—"} kg/ha</p>
                  </div>
                  <div className="border-l border-line/60 pl-2">
                    <p className="font-mono text-[10px] text-ink/40">PHOSPHORUS</p>
                    <p className="font-display text-sm font-bold text-ink">{selectedFarm.soil_p ?? "—"} kg/ha</p>
                  </div>
                  <div className="border-l border-line/60 pl-2">
                    <p className="font-mono text-[10px] text-ink/40">POTASSIUM</p>
                    <p className="font-display text-sm font-bold text-ink">{selectedFarm.soil_k ?? "—"} kg/ha</p>
                  </div>
                  <div className="border-l border-line/60 pl-2">
                    <p className="font-mono text-[10px] text-ink/40">ACIDITY INDEX</p>
                    <p className="font-display text-sm font-bold text-ink">{selectedFarm.soil_ph ?? "—"} pH</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Column 2: Dashboard Visualization Widgets (65%) */}
          <div className="flex flex-col gap-6 lg:col-span-8 print:w-full print:block">
            {selectedFarm ? (
              <>
                {/* Printable Farm Specs block (Only visible on print/PDF) */}
                <div className="hidden print:block border border-line p-5 bg-paper/30 mb-6">
                  <h2 className="font-display font-bold text-base border-b border-line pb-2 mb-3">Farm Parameters Log</h2>
                  <div className="grid grid-cols-3 gap-4 font-mono text-xs">
                    <div><strong>Acreage ID:</strong> {selectedFarm.id}</div>
                    <div><strong>Plot Name:</strong> {selectedFarm.farm_name}</div>
                    <div><strong>Coordinates:</strong> {selectedFarm.latitude.toFixed(4)}, {selectedFarm.longitude.toFixed(4)}</div>
                    <div><strong>Soil pH:</strong> {selectedFarm.soil_ph ?? "N/A"}</div>
                    <div><strong>NPK Balance:</strong> {selectedFarm.soil_n ?? "N/A"}-{selectedFarm.soil_p ?? "N/A"}-{selectedFarm.soil_k ?? "N/A"}</div>
                    <div><strong>Forecast Crop:</strong> {selectedCrop}</div>
                  </div>
                </div>

                {/* 1. Yield Forecast Summary Card */}
                <div className="border border-line bg-paper p-6 shadow-sm print:break-inside-avoid print:mb-6">
                  <div className="mb-4 flex flex-col gap-4 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between print:border-b-2 print:pb-2">
                    <div>
                      <h3 className="font-display text-lg font-extrabold text-ink">Yield Forecast</h3>
                      <p className="text-xs text-ink/60 print:hidden">From the trained Random Forest model, adjusted for this farm&apos;s soil.</p>
                    </div>
                    <select
                      value={selectedCrop}
                      onChange={(e) => setSelectedCrop(e.target.value)}
                      className="border border-line bg-paper px-3 py-1.5 text-xs font-semibold text-ink print:hidden"
                    >
                      {KNOWN_CROPS.map((crop) => (
                        <option key={crop} value={crop}>
                          {crop}
                        </option>
                      ))}
                    </select>
                  </div>

                  {predicting && <p className="py-8 text-center text-sm text-ink/40 print:hidden">Running forecast…</p>}

                  {predictError && !predicting && (
                    <p role="alert" className="border border-clay bg-clay/10 px-3 py-2 text-xs text-clay">
                      {predictError}
                    </p>
                  )}

                  {prediction && !predicting && (
                    <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-12 print:block">
                      <div className="md:col-span-7">
                        <span className="block font-mono text-[10px] text-ink/40 uppercase tracking-wide">SOIL-ADJUSTED FORECAST YIELD</span>
                        <span className="font-display text-4xl font-black tracking-tight text-canopy">
                          {prediction.predicted_yield_kg_ha.toLocaleString()}
                          <span className="ml-1 font-mono text-sm font-medium text-ink/50">kg/ha</span>
                        </span>

                        <div className="mt-4 h-2 w-full bg-line print:hidden">
                          <div
                            className="h-full bg-canopy"
                            style={{
                              width: `${Math.min(100, (prediction.predicted_yield_kg_ha / (prediction.base_model_yield_kg_ha || 1)) * 100)}%`,
                            }}
                          />
                        </div>
                        <p className="mt-2 font-mono text-[10px] text-ink/40">
                          Model baseline: {prediction.base_model_yield_kg_ha.toLocaleString()} kg/ha · soil adjustment factor ×{prediction.soil_adjustment_factor}
                        </p>
                      </div>

                      <div className="flex flex-col gap-3 border-t border-line pt-4 md:col-span-5 md:border-l md:border-t-0 md:pl-4 md:pt-0 print:border-none print:mt-4">
                        <div className="flex items-center gap-2 border border-line bg-ink/[0.01] p-3 text-xs print:p-1.5">
                          <Gauge className="h-4 w-4 shrink-0 text-wheat" />
                          <span className="leading-tight text-ink/75">
                            Model confidence (R²): <strong className="text-wheat">{prediction.model_r2_score}</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 border border-line bg-ink/[0.01] p-3 text-xs print:hidden">
                          <TrendingUp className="h-4 w-4 shrink-0 text-canopy" />
                          <span className="leading-tight text-ink/75">{prediction.note}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ================= MILESTONE 3: ANALYTICS & RECOMMENDATION SECTION ================= */}
                <div className="border border-line bg-paper p-6 shadow-sm print:break-inside-avoid print:mb-6">
                  {/* Milestone 3 Tabs header */}
                  <div className="mb-5 flex items-center justify-between border-b border-line pb-4 print:border-b-2 print:pb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-canopy fill-canopy/20" />
                      <h3 className="font-display text-lg font-extrabold text-ink">Agricultural Intelligence</h3>
                    </div>
                    {/* Tab controllers */}
                    <div className="flex border border-line bg-paper text-xs print:hidden">
                      {(["charts", "recommendations", "risks"] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`px-3 py-1.5 font-semibold transition ${
                            activeTab === tab ? "bg-canopy text-paper" : "hover:text-canopy text-ink/70"
                          }`}
                        >
                          {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {insightsLoading && (
                    <div className="py-12 text-center text-sm text-ink/40 flex flex-col items-center justify-center gap-2">
                      <span className="h-6 w-6 border-2 border-canopy border-t-transparent rounded-full animate-spin" />
                      <span>Analyzing diagnostics & climate stress…</span>
                    </div>
                  )}

                  {/* Print formatting: render everything sequentially without tabs */}
                  <div className="flex flex-col gap-8 print:gap-6">
                    
                    {/* TAB A: INTERACTIVE VISUALIZATION CHARTS */}
                    {isMounted && (activeTab === "charts" || window.matchMedia("print").matches) && !insightsLoading && (
                      <div className="flex flex-col gap-6 print:block">
                        
                        {/* Historical Yield Trends Line Chart */}
                        {yieldTrendData.length > 0 ? (
                          <div className="border border-line bg-ink/[0.01] p-4 rounded-sm print:mb-6">
                            <h4 className="font-display font-semibold text-sm text-ink mb-4 flex items-center gap-1.5">
                              <Calendar className="h-4 w-4 text-canopy" />
                              <span>Historical Yield Trends</span>
                            </h4>
                            <div className="w-full h-[220px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={yieldTrendData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
                                  <XAxis dataKey="date" stroke="var(--color-ink)" style={{ fontSize: "9px" }} />
                                  <YAxis stroke="var(--color-ink)" style={{ fontSize: "9px" }} />
                                  <Tooltip contentStyle={{ backgroundColor: "var(--color-paper)", borderColor: "var(--color-line)", fontSize: "11px" }} />
                                  <Line type="monotone" dataKey="Yield" stroke="var(--color-canopy)" strokeWidth={2.5} activeDot={{ r: 6 }} />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        ) : (
                          <div className="border border-dashed border-line p-8 text-center text-xs text-ink/40 print:hidden">
                            Run more simulations or reports to populate historical yield trend charts.
                          </div>
                        )}

                        {/* Crop Comparison Bar Chart */}
                        {compareResult && (
                          <div className="border border-line bg-ink/[0.01] p-4 rounded-sm print:break-inside-avoid">
                            <h4 className="font-display font-semibold text-sm text-ink mb-4 flex items-center gap-1.5">
                              <GitCompare className="h-4 w-4 text-canopy" />
                              <span>Comparative Performance Matrix</span>
                            </h4>
                            <div className="w-full h-[220px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={comparisonChartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
                                  <XAxis dataKey="name" stroke="var(--color-ink)" style={{ fontSize: "9px" }} />
                                  <YAxis stroke="var(--color-ink)" style={{ fontSize: "9px" }} />
                                  <Tooltip contentStyle={{ backgroundColor: "var(--color-paper)", borderColor: "var(--color-line)", fontSize: "11px" }} />
                                  <Legend wrapperStyle={{ fontSize: "10px" }} />
                                  <Bar dataKey="Yield" fill="var(--color-canopy)" radius={[0, 0, 0, 0]} />
                                  <Bar dataKey="Baseline" fill="var(--color-wheat)" radius={[0, 0, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB B: REMEDIATION & FARMING RECOMMENDATIONS */}
                    {(activeTab === "recommendations" || window.matchMedia("print").matches) && insights && !insightsLoading && (
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 print:grid-cols-2">
                        {/* Recommendations */}
                        <div className="border border-line p-4 bg-paper/60 rounded-sm">
                          <h4 className="font-display font-bold text-sm text-ink mb-3 flex items-center gap-2 border-b border-line pb-2">
                            <CheckCircle2 className="h-4.5 w-4.5 text-canopy" />
                            <span>Actionable Remediation</span>
                          </h4>
                          <ul className="flex flex-col gap-2">
                            {insights.actionable_recommendations.map((rec, idx) => (
                              <li key={idx} className="text-xs text-ink/75 leading-relaxed bg-white/40 p-2.5 border border-line/40 rounded-sm pl-7 relative">
                                <span className="absolute left-2.5 top-3.5 h-1.5 w-1.5 bg-canopy rounded-full" />
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Best Practice Tips */}
                        <div className="border border-line p-4 bg-paper/60 rounded-sm">
                          <h4 className="font-display font-bold text-sm text-ink mb-3 flex items-center gap-2 border-b border-line pb-2">
                            <Info className="h-4.5 w-4.5 text-canopy" />
                            <span>Best Practice Tips</span>
                          </h4>
                          <ul className="flex flex-col gap-2">
                            {insights.best_practice_tips.map((tip, idx) => (
                              <li key={idx} className="text-xs text-ink/75 leading-relaxed bg-white/40 p-2.5 border border-line/40 rounded-sm pl-7 relative">
                                <span className="absolute left-2.5 top-3.5 h-1.5 w-1.5 bg-wheat rounded-full animate-pulse" />
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* TAB C: AGRICULTURAL RISK ALERT CARDS */}
                    {(activeTab === "risks" || window.matchMedia("print").matches) && insights && !insightsLoading && (
                      <div className="flex flex-col gap-4 print:break-inside-avoid">
                        <div className="flex items-center justify-between border-b border-line pb-2">
                          <span className="text-xs font-mono uppercase text-ink/50 tracking-wider">Overall Environmental Stress Level</span>
                          <span
                            className={`border px-3 py-1 font-mono text-xs font-black uppercase ${
                              insights.overall_risk_level === "High"
                                ? "border-clay/40 bg-clay/10 text-clay"
                                : insights.overall_risk_level === "Medium"
                                ? "border-wheat/40 bg-wheat/10 text-wheat"
                                : "border-canopy/40 bg-canopy/10 text-canopy"
                            }`}
                          >
                            {insights.overall_risk_level} Risk
                          </span>
                        </div>

                        {insights.identified_risks.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {insights.identified_risks.map((risk, idx) => (
                              <div key={idx} className="border border-line bg-paper/30 p-4 rounded-sm">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-display font-bold text-sm text-ink">{risk.type}</span>
                                  <span
                                    className={`px-2 py-0.5 border font-mono text-[9px] font-bold uppercase rounded-sm ${
                                      risk.severity === "High"
                                        ? "border-clay/40 bg-clay/10 text-clay"
                                        : "border-wheat/40 bg-wheat/10 text-wheat"
                                    }`}
                                  >
                                    {risk.severity} Severity
                                  </span>
                                </div>
                                <p className="text-xs text-ink/75 leading-relaxed bg-white/40 p-2 border border-line/40 rounded-sm">
                                  {risk.advice}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-6 text-center text-xs text-ink/50 bg-canopy/5 border border-canopy/25 p-4 rounded-sm flex items-center justify-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-canopy" />
                            <span>No hazardous environmental stresses detected for this profile.</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Full Yield Report Card */}
                <div className="border border-line bg-paper p-6 shadow-sm print:hidden">
                  <div className="mb-4 flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="flex items-center gap-2 font-display text-lg font-extrabold text-ink">
                        <FileText className="h-4 w-4 text-canopy" />
                        <span>Full Yield Report Narrative</span>
                      </h3>
                      <p className="text-xs text-ink/60">
                        Persists run records and outputs complete textual interpretations.
                      </p>
                    </div>
                    <button
                      onClick={handleGenerateReport}
                      disabled={reportLoading}
                      className="inline-flex shrink-0 items-center justify-center gap-2 border border-ink bg-ink px-4 py-2 text-xs font-bold text-paper transition hover:bg-canopyDeep hover:border-canopyDeep disabled:opacity-50"
                    >
                      {reportLoading ? (
                        <>
                          <span className="h-3.5 w-3.5 border-2 border-paper border-t-transparent rounded-full animate-spin" />
                          <span>Generating…</span>
                        </>
                      ) : (
                        <span>Generate Narrative Report</span>
                      )}
                    </button>
                  </div>

                  {reportError && !reportLoading && (
                    <p role="alert" className="border border-clay bg-clay/10 px-3 py-2 text-xs text-clay">
                      {reportError}
                    </p>
                  )}

                  {!report && !reportLoading && !reportError && (
                    <p className="py-6 text-center text-xs text-ink/40">
                      Generate a report to see a narrative summary plus weather and soil risk analytics.
                    </p>
                  )}

                  {report && !reportLoading && (
                    <div className="flex flex-col gap-4">
                      <p className="border-l-2 border-canopy bg-canopy/5 p-3 text-sm leading-relaxed text-ink/80">
                        {report.narrative}
                      </p>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="border border-line p-4">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="font-mono text-[10px] uppercase tracking-wider text-ink/50">Weather Analytics</span>
                            <div className="flex gap-1.5">
                              <span
                                className={`border px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                                  report.weather_analytics.heat_stress_risk === "High"
                                    ? "border-clay/30 bg-clay/10 text-clay"
                                    : report.weather_analytics.heat_stress_risk === "Moderate"
                                    ? "border-wheat/30 bg-wheat/10 text-wheat"
                                    : "border-canopy/30 bg-canopy/10 text-canopy"
                                }`}
                              >
                                Heat: {report.weather_analytics.heat_stress_risk}
                              </span>
                              <span
                                className={`border px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                                  report.weather_analytics.rainfall_risk === "High"
                                    ? "border-clay/30 bg-clay/10 text-clay"
                                    : report.weather_analytics.rainfall_risk === "Moderate"
                                    ? "border-wheat/30 bg-wheat/10 text-wheat"
                                    : "border-canopy/30 bg-canopy/10 text-canopy"
                                }`}
                              >
                                Rain: {report.weather_analytics.rainfall_risk}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs leading-relaxed text-ink/70">{report.weather_analytics.summary}</p>
                        </div>

                        <div className="border border-line p-4">
                          <span className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-ink/50">
                            Soil Analytics · factor ×{report.soil_analytics.soil_adjustment_factor}
                          </span>
                          <p className="text-xs leading-relaxed text-ink/70">{report.soil_analytics.summary}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Compare Crops Card */}
                <div className="border border-line bg-paper p-6 shadow-sm print:hidden">
                  <div className="mb-4 flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="flex items-center gap-2 font-display text-lg font-extrabold text-ink">
                        <GitCompare className="h-4 w-4 text-canopy" />
                        <span>Compare Crops</span>
                      </h3>
                      <p className="text-xs text-ink/60">Select two or more crops to rank by predicted yield on this farm.</p>
                    </div>
                    <button
                      onClick={handleCompare}
                      disabled={compareLoading || compareSelection.length === 0}
                      className="inline-flex shrink-0 items-center justify-center gap-2 border border-ink bg-ink px-4 py-2 text-xs font-bold text-paper transition hover:bg-canopyDeep hover:border-canopyDeep disabled:opacity-50"
                    >
                      {compareLoading ? (
                        <>
                          <span className="h-3.5 w-3.5 border-2 border-paper border-t-transparent rounded-full animate-spin" />
                          <span>Comparing…</span>
                        </>
                      ) : (
                        <span>Compare Selected ({compareSelection.length})</span>
                      )}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {KNOWN_CROPS.map((crop) => {
                      const checked = compareSelection.includes(crop);
                      return (
                        <button
                          key={crop}
                          type="button"
                          onClick={() => toggleCompareCrop(crop)}
                          className={`border px-3 py-1.5 text-xs font-semibold transition ${
                            checked
                              ? "border-canopy bg-canopy text-paper"
                              : "border-line text-ink/70 hover:border-canopy hover:text-canopy"
                          }`}
                        >
                          {crop}
                        </button>
                      );
                    })}
                  </div>

                  {compareError && !compareLoading && (
                    <p role="alert" className="mt-4 border border-clay bg-clay/10 px-3 py-2 text-xs text-clay">
                      {compareError}
                    </p>
                  )}

                  {compareResult && !compareLoading && (
                    <div className="mt-5 flex flex-col gap-2 border-t border-line pt-4">
                      {compareResult.ranked_by_predicted_yield_kg_ha.map((cropName, index) => {
                        const item = compareResult.crops.find((c) => c.crop_name === cropName);
                        if (!item) return null;
                        return (
                          <div
                            key={cropName}
                            className={`flex items-center justify-between border p-3 ${
                              index === 0 ? "border-canopy bg-canopy/5" : "border-line"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`flex h-6 w-6 shrink-0 items-center justify-center font-mono text-xs font-bold ${
                                  index === 0 ? "bg-canopy text-paper" : "bg-ink/[0.06] text-ink/60"
                                }`}
                              >
                                {index === 0 ? <Trophy className="h-3.5 w-3.5" /> : index + 1}
                              </span>
                              <span className="font-display text-sm font-bold text-ink">{item.crop_name}</span>
                            </div>
                            <span className="font-mono text-sm font-bold text-canopy">
                              {item.predicted_yield_kg_ha.toLocaleString()} kg/ha
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 4. Prediction History Card */}
                <div className="border border-line bg-paper p-6 shadow-sm print:hidden">
                  <div className="mb-4 flex items-center justify-between border-b border-line pb-4">
                    <h3 className="flex items-center gap-2 font-display text-lg font-extrabold text-ink">
                      <History className="h-4 w-4 text-canopy" />
                      <span>Prediction History</span>
                    </h3>
                    <span className="font-mono text-[10px] text-ink/40">Last 25 runs</span>
                  </div>

                  {historyLoading && <p className="py-6 text-center text-xs text-ink/40">Loading history…</p>}

                  {historyError && !historyLoading && (
                    <p role="alert" className="border border-clay bg-clay/10 px-3 py-2 text-xs text-clay">
                      {historyError}
                    </p>
                  )}

                  {!historyLoading && !historyError && history?.length === 0 && (
                    <p className="py-6 text-center text-xs text-ink/40">
                      No persisted runs yet — generate a report or run a comparison to populate history.
                    </p>
                  )}

                  {history && history.length > 0 && !historyLoading && (
                    <div className="flex max-h-[280px] flex-col gap-2 overflow-y-auto pr-1">
                      {history.map((run) => (
                        <div key={run.id} className="flex items-center justify-between border border-line p-3 text-xs">
                          <div>
                            <p className="font-display text-sm font-bold text-ink">{run.crop_name}</p>
                            <p className="mt-0.5 font-mono text-[10px] text-ink/40">
                              {new Date(run.created_at).toLocaleString()} · soil ×{run.soil_adjustment_factor}
                            </p>
                          </div>
                          <span className="font-mono text-sm font-bold text-canopy">
                            {run.predicted_yield_kg_ha.toLocaleString()} kg/ha
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 5. Weather & Soil Quality Breakdown (Print layouts adapt it nicely) */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 print:break-inside-avoid print:mb-6">
                  
                  {/* Weather Used panel */}
                  <div className="border border-line bg-paper p-5 shadow-sm">
                    <h3 className="mb-3 flex items-center gap-2 font-display text-base font-extrabold text-ink">
                      <CloudSun className="h-4 w-4 text-canopy" />
                      <span>Weather Used</span>
                    </h3>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between border-b border-line/50 pb-2">
                        <span className="flex items-center gap-1.5 text-xs text-ink/60">
                          <Thermometer className="h-3.5 w-3.5 text-canopy" />
                          Temperature
                        </span>
                        <span className="font-mono text-sm font-bold text-ink">
                          {prediction ? `${prediction.weather_used.avg_temp}°C` : "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-b border-line/50 pb-2">
                        <span className="flex items-center gap-1.5 text-xs text-ink/60">
                          <CloudRain className="h-3.5 w-3.5 text-canopy" />
                          Rainfall
                        </span>
                        <span className="font-mono text-sm font-bold text-ink">
                          {prediction ? `${prediction.weather_used.average_rain_fall_mm_per_year} mm/yr` : "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs text-ink/60">
                          <Droplet className="h-3.5 w-3.5 text-canopy" />
                          Source
                        </span>
                        <span className="border border-line px-2 py-0.5 font-mono text-[10px] uppercase text-ink/60">
                          {prediction?.weather_used.source === "live" ? "Live API" : "Seasonal estimate"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Soil Quality Breakdown */}
                  {soilScores && (
                    <div className="border border-line bg-paper p-5 shadow-sm">
                      <h3 className="mb-1 flex items-center gap-2 font-display text-base font-extrabold text-ink">
                        <Sliders className="h-4 w-4 text-canopy" />
                        <span>Soil Quality Breakdown</span>
                      </h3>
                      
                      <div className="flex flex-col gap-3.5 mt-4">
                        {(
                          [
                            ["Nitrogen (N)", soilScores.n, "bg-canopy"],
                            ["Phosphorus (P)", soilScores.p, "bg-wheat"],
                            ["Potassium (K)", soilScores.k, "bg-horizonTop"],
                            ["Soil pH", soilScores.ph, "bg-clay"],
                          ] as const
                        ).map(([label, score, colorClass]) => (
                          <div key={label}>
                            <div className="mb-1 flex justify-between font-mono text-xs text-ink">
                              <span>{label}</span>
                              <span>{score != null ? `${Math.round(score * 100)}%` : "No reading"}</span>
                            </div>
                            <div className="h-1.5 w-full bg-line">
                              <div className={`h-full ${colorClass}`} style={{ width: `${score != null ? score * 100 : 0}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </>
            ) : (
              <div className="flex h-[400px] flex-col items-center justify-center border border-dashed border-line bg-ink/[0.01] p-6 text-center print:hidden">
                <Sprout className="mb-3 h-12 w-12 text-ink/20" />
                <h3 className="font-display text-lg font-bold text-ink/70">No Farm Selected</h3>
                <p className="mt-1 max-w-[280px] text-xs leading-relaxed text-ink/50">
                  Log a farm plot or select one from the sidebar ledger to display yield analytics and forecast metrics.
                </p>
                <Link
                  href="/onboarding"
                  className="mt-6 border border-ink px-4 py-2 text-xs font-bold text-ink transition hover:bg-ink hover:text-paper"
                >
                  Log a Plot
                </Link>
              </div>
            )}
          </div>

        </div>

        {/* Standalone Soil Analysis Widget */}
        <div className="mt-8 border border-line bg-paper p-6 shadow-sm print:hidden">
          <div className="mb-1 flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-canopy" />
            <h3 className="font-display text-lg font-extrabold text-ink">Standalone Soil Analysis</h3>
          </div>
          <p className="mb-6 text-xs text-ink/60">
            Check any set of readings against the same soil heuristic used in yield reports — no saved farm required.
          </p>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-ink/50">Soil pH</span>
                  <input
                    type="number"
                    step="0.01"
                    value={soilForm.soil_ph}
                    onChange={(e) => setSoilForm((prev) => ({ ...prev, soil_ph: e.target.value }))}
                    placeholder="6.50"
                    className="border border-line bg-paper px-3 py-2 text-sm text-ink"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-ink/50">Nitrogen (N)</span>
                  <input
                    type="number"
                    value={soilForm.soil_n}
                    onChange={(e) => setSoilForm((prev) => ({ ...prev, soil_n: e.target.value }))}
                    placeholder="90"
                    className="border border-line bg-paper px-3 py-2 text-sm text-ink"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-ink/50">Phosphorus (P)</span>
                  <input
                    type="number"
                    value={soilForm.soil_p}
                    onChange={(e) => setSoilForm((prev) => ({ ...prev, soil_p: e.target.value }))}
                    placeholder="40"
                    className="border border-line bg-paper px-3 py-2 text-sm text-ink"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-ink/50">Potassium (K)</span>
                  <input
                    type="number"
                    value={soilForm.soil_k}
                    onChange={(e) => setSoilForm((prev) => ({ ...prev, soil_k: e.target.value }))}
                    placeholder="40"
                    className="border border-line bg-paper px-3 py-2 text-sm text-ink"
                  />
                </label>
              </div>

              <button
                onClick={handleAnalyzeSoil}
                disabled={soilLoading}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 border border-ink bg-ink py-3 text-sm font-bold text-paper transition hover:bg-canopyDeep hover:border-canopyDeep disabled:opacity-50 sm:w-auto sm:px-8"
              >
                {soilLoading ? (
                  <>
                    <span className="h-4 w-4 border-2 border-paper border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing…</span>
                  </>
                ) : (
                  <span>Analyze Soil</span>
                )}
              </button>

              {soilError && !soilLoading && (
                <p role="alert" className="mt-4 border border-clay bg-clay/10 px-3 py-2 text-xs text-clay">
                  {soilError}
                </p>
              )}
            </div>

            <div className="lg:col-span-7">
              {!soilResult && !soilLoading && !soilError && (
                <div className="flex h-full min-h-[160px] flex-col items-center justify-center border border-dashed border-line bg-ink/[0.01] p-6 text-center">
                  <FlaskConical className="mb-2 h-8 w-8 text-ink/20" />
                  <p className="max-w-[260px] text-xs leading-relaxed text-ink/50">
                    Enter any subset of readings and analyze to see scores and remediation suggestions.
                  </p>
                </div>
              )}

              {soilResult && !soilLoading && (
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-4">
                    {(
                      [
                        ["Soil pH", soilResult.ph_score],
                        ["Nitrogen (N)", soilResult.nitrogen_score],
                        ["Phosphorus (P)", soilResult.phosphorus_score],
                        ["Potassium (K)", soilResult.potassium_score],
                      ] as const
                    ).map(([label, score]) => (
                      <div key={label}>
                        <div className="mb-1 flex justify-between font-mono text-xs font-medium text-ink">
                          <span>{label}</span>
                          <span>{score != null ? `${Math.round(score * 100)}% of ideal` : "No reading"}</span>
                        </div>
                        <div className="h-2 w-full bg-line">
                          <div className="h-full bg-canopy" style={{ width: `${score != null ? score * 100 : 0}%` }} />
                        </div>
                      </div>
                    ))}
                    <p className="font-mono text-[10px] text-ink/40">
                      Combined soil adjustment factor: ×{soilResult.soil_adjustment_factor}
                    </p>
                  </div>

                  <div className="border-t border-line pt-4">
                    <span className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-ink/50">
                      <CheckCircle2 className="h-3.5 w-3.5 text-canopy" />
                      Remediation Suggestions
                    </span>
                    <ul className="flex flex-col gap-2">
                      {soilResult.remediation_steps.map((step, i) => (
                        <li key={i} className="border border-line bg-ink/[0.01] p-3 text-xs leading-relaxed text-ink/75">
                          {step}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 font-mono text-[10px] text-ink/40">{soilResult.note}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
