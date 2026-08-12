"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, type FormEvent } from "react";
import FieldInput from "@/components/FieldInput";
import Navbar from "@/components/Navbar";
import { api } from "@/lib/api";
import { MapPin, Info, Droplet, Flame, ThermometerSun, Save } from "lucide-react";

interface FormState {
  farm_name: string;
  latitude: string;
  longitude: string;
  soil_ph: string;
  soil_n: string;
  soil_p: string;
  soil_k: string;
}

const initialState: FormState = {
  farm_name: "",
  latitude: "",
  longitude: "",
  soil_ph: "",
  soil_n: "",
  soil_p: "",
  soil_k: "",
};

export default function OnboardingPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Sync dark mode class on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("ys_theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  function update<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.createFarm({
        farm_name: form.farm_name,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        soil_ph: form.soil_ph ? Number(form.soil_ph) : undefined,
        soil_n: form.soil_n ? Number(form.soil_n) : undefined,
        soil_p: form.soil_p ? Number(form.soil_p) : undefined,
        soil_k: form.soil_k ? Number(form.soil_k) : undefined,
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this farm profile");
    } finally {
      setLoading(false);
    }
  }

  // Live analysis functions based on inputs
  function getPhStatus(phStr: string) {
    if (!phStr) return { text: "No Reading Entered", color: "text-ink/40" };
    const ph = parseFloat(phStr);
    if (isNaN(ph) || ph < 0 || ph > 14) return { text: "Invalid Value", color: "text-clay font-bold" };
    if (ph < 5.5) return { text: "Strongly Acidic (Lime recommended)", color: "text-clay font-semibold" };
    if (ph >= 5.5 && ph < 6.0) return { text: "Slightly Acidic (Suitable for most crops)", color: "text-wheat font-semibold" };
    if (ph >= 6.0 && ph <= 7.2) return { text: "Neutral / Optimal Soil Range", color: "text-canopy font-bold" };
    if (ph > 7.2 && ph <= 8.5) return { text: "Slightly Alkaline", color: "text-wheat font-semibold" };
    return { text: "Strongly Alkaline (Sulfur recommended)", color: "text-clay font-semibold" };
  }

  function getNutrientStatus(nStr: string, name: string) {
    if (!nStr) return { text: "No Reading", color: "text-ink/40" };
    const val = parseFloat(nStr);
    if (isNaN(val) || val < 0) return { text: "Invalid", color: "text-clay font-bold" };
    if (val < 40) return { text: "Low Concentration (Fertilizer suggested)", color: "text-clay/90 font-medium" };
    if (val >= 40 && val <= 100) return { text: "Optimal Level", color: "text-canopy font-bold" };
    return { text: "High Saturation", color: "text-wheat font-bold" };
  }

  const phAnalysis = getPhStatus(form.soil_ph);
  const nAnalysis = getNutrientStatus(form.soil_n, "Nitrogen");
  const pAnalysis = getNutrientStatus(form.soil_p, "Phosphorus");
  const kAnalysis = getNutrientStatus(form.soil_k, "Potassium");

  return (
    <main className="min-h-screen bg-paper text-ink selection:bg-wheat selection:text-paper">
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 animate-fade-in-up">
        <div className="flex flex-col gap-2">
          <p className="font-mono text-xs uppercase tracking-widest text-canopy bg-canopy/10 px-2.5 py-0.5 w-fit">
            Acreage Registry
          </p>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink mt-2">Log a new plot.</h1>
          <p className="max-w-2xl text-sm text-ink/70 leading-relaxed">
            Specify geo-coordinates to retrieve climate histories, and record core N-P-K soil samples to configure the model.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
          
          {/* Left Column: Form Fields */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* General Info Card */}
            <div className="border border-line bg-paper p-6 shadow-sm">
              <div className="flex items-center gap-2 border-b border-line pb-3 mb-2">
                <MapPin className="h-4 w-4 text-canopy" />
                <h2 className="font-display font-bold text-base text-ink">General & Location Details</h2>
              </div>
              
              <FieldInput
                label="Farm plot name"
                required
                value={form.farm_name}
                onChange={(e) => update("farm_name", e.target.value)}
                placeholder="North Ridge Plot A"
              />

              <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2 mt-4">
                <FieldInput
                  label="Latitude coordinates"
                  type="number"
                  step="0.000001"
                  required
                  value={form.latitude}
                  onChange={(e) => update("latitude", e.target.value)}
                  placeholder="12.9716"
                />
                <FieldInput
                  label="Longitude coordinates"
                  type="number"
                  step="0.000001"
                  required
                  value={form.longitude}
                  onChange={(e) => update("longitude", e.target.value)}
                  placeholder="77.5946"
                />
              </div>
              <p className="mt-3 text-[11px] font-mono text-ink/40 flex items-center gap-1.5">
                <Info className="h-3 w-3" />
                Coordinates are used for pulling local weather forecasts.
              </p>
            </div>

            {/* Soil Chemistry Input Card */}
            <div className="border border-line bg-paper p-6 shadow-sm">
              <div className="flex items-center gap-2 border-b border-line pb-3 mb-2">
                <Droplet className="h-4 w-4 text-canopy" />
                <h2 className="font-display font-bold text-base text-ink">Soil Chemistry Log</h2>
              </div>
              
              <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                <FieldInput
                  label="Soil pH index"
                  unit="0–14"
                  type="number"
                  step="0.01"
                  value={form.soil_ph}
                  onChange={(e) => update("soil_ph", e.target.value)}
                  placeholder="6.50"
                />
                <FieldInput
                  label="Nitrogen (N) Content"
                  unit="kg/ha"
                  type="number"
                  value={form.soil_n}
                  onChange={(e) => update("soil_n", e.target.value)}
                  placeholder="80"
                />
                <FieldInput
                  label="Phosphorus (P) Content"
                  unit="kg/ha"
                  type="number"
                  value={form.soil_p}
                  onChange={(e) => update("soil_p", e.target.value)}
                  placeholder="45"
                />
                <FieldInput
                  label="Potassium (K) Content"
                  unit="kg/ha"
                  type="number"
                  value={form.soil_k}
                  onChange={(e) => update("soil_k", e.target.value)}
                  placeholder="50"
                />
              </div>
            </div>

            {error && (
              <div role="alert" className="border border-clay bg-clay/10 px-3 py-2 text-xs text-clay">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 border border-ink bg-ink py-4 text-sm font-bold text-paper transition duration-300 hover:bg-canopyDeep hover:border-canopyDeep disabled:opacity-50 sm:w-auto sm:px-10"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 border-2 border-paper border-t-transparent rounded-full animate-spin" />
                  <span>Saving plot...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save farm profile</span>
                </>
              )}
            </button>
          </div>

          {/* Right Column: Live Analysis Visualizer */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="border border-line bg-paper/60 p-6 sticky top-24 shadow-sm backdrop-blur-sm">
              <h3 className="font-display font-extrabold text-lg text-ink border-b border-line pb-3">
                Live Soil Analysis
              </h3>
              <p className="mt-2 text-xs text-ink/65 leading-relaxed">
                Here is a real-time chemical assessment of the readings entered:
              </p>

              <div className="mt-6 flex flex-col gap-5">
                {/* pH Status */}
                <div className="border-l-2 border-line pl-3">
                  <p className="font-mono text-[10px] uppercase text-ink/50 tracking-wider">Soil pH Level</p>
                  <p className="font-display text-sm font-bold text-ink mt-0.5">
                    {form.soil_ph ? `pH ${form.soil_ph}` : "—"}
                  </p>
                  <p className={`text-xs mt-1 ${phAnalysis.color}`}>{phAnalysis.text}</p>
                </div>

                {/* Nitrogen Status */}
                <div className="border-l-2 border-line pl-3">
                  <p className="font-mono text-[10px] uppercase text-ink/50 tracking-wider">Nitrogen (N)</p>
                  <p className="font-display text-sm font-bold text-ink mt-0.5">
                    {form.soil_n ? `${form.soil_n} kg/ha` : "—"}
                  </p>
                  <p className={`text-xs mt-1 ${nAnalysis.color}`}>{nAnalysis.text}</p>
                </div>

                {/* Phosphorus Status */}
                <div className="border-l-2 border-line pl-3">
                  <p className="font-mono text-[10px] uppercase text-ink/50 tracking-wider">Phosphorus (P)</p>
                  <p className="font-display text-sm font-bold text-ink mt-0.5">
                    {form.soil_p ? `${form.soil_p} kg/ha` : "—"}
                  </p>
                  <p className={`text-xs mt-1 ${pAnalysis.color}`}>{pAnalysis.text}</p>
                </div>

                {/* Potassium Status */}
                <div className="border-l-2 border-line pl-3">
                  <p className="font-mono text-[10px] uppercase text-ink/50 tracking-wider">Potassium (K)</p>
                  <p className="font-display text-sm font-bold text-ink mt-0.5">
                    {form.soil_k ? `${form.soil_k} kg/ha` : "—"}
                  </p>
                  <p className={`text-xs mt-1 ${kAnalysis.color}`}>{kAnalysis.text}</p>
                </div>
              </div>

              {/* Summary Indicator Card */}
              <div className="mt-8 border border-line bg-ink/[0.02] p-4 text-[11px] leading-relaxed text-ink/60">
                <span className="font-bold text-ink block mb-1">💡 Agronomy Hint</span>
                A balanced pH (6.0 - 7.0) is crucial. Outside this range, even high levels of Nitrogen or Potassium become chemically locked in the soil, preventing root absorption.
              </div>
            </div>
          </div>

        </form>
      </div>
    </main>
  );
}
