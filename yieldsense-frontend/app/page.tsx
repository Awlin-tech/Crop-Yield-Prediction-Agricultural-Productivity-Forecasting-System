import Link from "next/link";
import Image from "next/image";
import SoilHorizonBar from "@/components/SoilHorizonBar";
import Navbar from "@/components/Navbar";
import { LineChart, Sprout, CloudRain, ShieldCheck, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-paper text-ink selection:bg-wheat selection:text-paper">
      {/* Soil Core Profile bar */}
      <SoilHorizonBar />
      
      {/* Brand Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24 animate-fade-in-up">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left Column: Heading and Tagline */}
          <div className="flex flex-col gap-6 lg:col-span-7">
            <p className="font-mono text-xs uppercase tracking-widest text-canopy bg-canopy/10 px-2.5 py-1 w-fit">
              Predictive analytics · kg/ha forecasts
            </p>
            <h1 className="font-display text-4xl font-extrabold leading-tight text-ink sm:text-6xl tracking-tight">
              Know the harvest
              <br />
              <span className="bg-gradient-to-r from-canopy to-wheat bg-clip-text text-transparent">
                before you plant it.
              </span>
            </h1>
            <p className="max-w-xl text-base text-ink/75 sm:text-lg leading-relaxed">
              YieldSense reads your soil N-P-K profiles, geo-coordinates, and seasonal weather,
              then forecasts agricultural yield and flags climate risks before you commit resources to the field.
            </p>
            <div className="flex flex-col gap-4 pt-4 sm:flex-row">
              <Link
                href="/signup"
                className="flex items-center justify-center gap-2 border border-ink bg-ink px-8 py-4 text-center text-sm font-semibold text-paper transition duration-300 hover:bg-canopyDeep hover:border-canopyDeep hover:-translate-y-0.5 shadow-sm"
              >
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="border border-ink/40 px-8 py-4 text-center text-sm font-semibold text-ink transition duration-300 hover:border-canopy hover:text-canopy hover:-translate-y-0.5"
              >
                Log in to account
              </Link>
            </div>
          </div>

          {/* Right Column: Hero Visual Asset */}
          <div className="relative overflow-hidden border border-line lg:col-span-5 h-[320px] sm:h-[400px] lg:h-[450px] shadow-lg bg-ink/5 dark:bg-paper/5 animate-fade-in-up-delay-1">
            <Image
              src="/hero_graphic.jpg"
              alt="YieldSense Agricultural technology visualization"
              fill
              className="object-cover opacity-90 transition duration-700 hover:scale-105"
              priority
            />
            {/* Ambient visual overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-paper/30 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-4 left-4 right-4 bg-paper/90 dark:bg-ink/90 border border-line/50 p-4 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-canopy animate-pulse" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink/60 dark:text-paper/60">
                  Agri-Engine: Model Active
                </span>
              </div>
              <p className="mt-1 font-display text-sm font-bold text-ink dark:text-paper">
                Optimized Yield Estimation
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="border-y border-line bg-ink/[0.01] py-16 dark:bg-paper/[0.01]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <p className="text-center font-mono text-xs uppercase tracking-widest text-canopy">
            Scientific Agronomy
          </p>
          <h2 className="mt-2 text-center font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Features engineered for yield stability.
          </h2>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Feature 1 */}
            <div className="border border-line bg-paper p-6 hover:border-canopy hover:-translate-y-1 transition duration-300 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex h-10 w-10 items-center justify-center bg-canopy/10 text-canopy mb-4">
                  <LineChart className="h-5 w-5" />
                </div>
                <h3 className="font-display font-bold text-lg text-ink">Yield Forecasting</h3>
                <p className="mt-2 text-sm text-ink/75 leading-relaxed">
                  Predict harvest outputs in kg/ha based on pre-trained crop estimation models.
                </p>
              </div>
              <span className="mt-4 font-mono text-xs text-canopy font-medium">Interactive Graph &rarr;</span>
            </div>

            {/* Feature 2 */}
            <div className="border border-line bg-paper p-6 hover:border-canopy hover:-translate-y-1 transition duration-300 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex h-10 w-10 items-center justify-center bg-canopy/10 text-canopy mb-4">
                  <Sprout className="h-5 w-5" />
                </div>
                <h3 className="font-display font-bold text-lg text-ink">Soil Health Audit</h3>
                <p className="mt-2 text-sm text-ink/75 leading-relaxed">
                  Input and monitor Soil pH, Nitrogen (N), Phosphorus (P), and Potassium (K) metrics.
                </p>
              </div>
              <span className="mt-4 font-mono text-xs text-canopy font-medium">Real-time Gauges &rarr;</span>
            </div>

            {/* Feature 3 */}
            <div className="border border-line bg-paper p-6 hover:border-canopy hover:-translate-y-1 transition duration-300 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex h-10 w-10 items-center justify-center bg-canopy/10 text-canopy mb-4">
                  <CloudRain className="h-5 w-5" />
                </div>
                <h3 className="font-display font-bold text-lg text-ink">Climate Analytics</h3>
                <p className="mt-2 text-sm text-ink/75 leading-relaxed">
                  Weather telemetry integration flags heat waves, frost limits, and rainfall shortages.
                </p>
              </div>
              <span className="mt-4 font-mono text-xs text-canopy font-medium">Risk Mapping &rarr;</span>
            </div>

            {/* Feature 4 */}
            <div className="border border-line bg-paper p-6 hover:border-canopy hover:-translate-y-1 transition duration-300 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex h-10 w-10 items-center justify-center bg-canopy/10 text-canopy mb-4">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="font-display font-bold text-lg text-ink">Data Stewardship</h3>
                <p className="mt-2 text-sm text-ink/75 leading-relaxed">
                  Keep structured digital field ledgers of all acreages mapped across your farms.
                </p>
              </div>
              <span className="mt-4 font-mono text-xs text-canopy font-medium">Secure SQL Ledger &rarr;</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line py-8 bg-paper">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4 px-4 text-xs font-mono text-ink/50 sm:px-6">
          <span>&copy; 2026 YieldSense AI Inc. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-canopy">Data Policy</a>
            <span>·</span>
            <a href="#" className="hover:text-canopy">API Service Docs</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
