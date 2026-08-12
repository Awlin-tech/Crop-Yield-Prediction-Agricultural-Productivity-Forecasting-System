"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, type FormEvent } from "react";
import { ArrowLeft, KeyRound, Mail, Sparkles, Leaf } from "lucide-react";
import FieldInput from "@/components/FieldInput";
import SoilHorizonBar from "@/components/SoilHorizonBar";
import { api, storeSession } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const token = await api.login(email, password);
      storeSession(token);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-paper text-ink flex flex-col justify-between">
      <SoilHorizonBar />

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12">
        {/* Left Side: Brand Visual Asset (Large Viewports Only) */}
        <div className="hidden lg:block lg:col-span-5 relative overflow-hidden bg-ink/10 dark:bg-paper/5 border-r border-line">
          <Image
            src="/auth_graphic.jpg"
            alt="Agriculture monitoring technology"
            fill
            className="object-cover opacity-90 transition duration-700 hover:scale-102"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/40 to-transparent pointer-events-none" />
          
          {/* Vertical banner content */}
          <div className="absolute bottom-12 left-8 right-8 text-paper z-10 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Leaf className="h-6 w-6 text-canopy fill-canopy/20" />
              <span className="font-mono text-xs uppercase tracking-widest text-paper/80">YieldSense Analytics</span>
            </div>
            <h2 className="font-display text-3xl font-extrabold leading-tight">
              Precision farming starts with clean intelligence.
            </h2>
            <div className="mt-4 border-t border-paper/20 pt-4 flex gap-8">
              <div>
                <p className="font-mono text-2xl font-bold text-wheat">94.2%</p>
                <p className="text-xs text-paper/70 mt-1 font-mono">Prediction Accuracy</p>
              </div>
              <div>
                <p className="font-mono text-2xl font-bold text-wheat">450k+</p>
                <p className="text-xs text-paper/70 mt-1 font-mono">Hectares Mapped</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Centered Login Form Card */}
        <div className="lg:col-span-7 flex items-center justify-center p-6 sm:p-12 md:p-16 animate-fade-in-up">
          <div className="w-full max-w-md border border-line bg-paper p-8 shadow-md">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-1.5 font-mono text-xs text-ink/50 hover:text-canopy transition">
                <ArrowLeft className="h-3 w-3" />
                <span>Back to Home</span>
              </Link>
              <span className="font-mono text-[10px] text-canopy font-bold uppercase tracking-wider bg-canopy/10 px-2 py-0.5">
                SECURE ENDPOINT
              </span>
            </div>

            <h1 className="mt-6 font-display text-3xl font-bold text-ink">Welcome back to the field.</h1>
            <p className="mt-1 text-sm text-ink/65">
              Enter your credentials to access your farm profiles.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 border-t border-line">
              <FieldInput
                label="Email Address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@farmdomain.com"
                autoComplete="email"
              />
              <FieldInput
                label="Security Password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />

              {error && (
                <div role="alert" className="mt-4 border border-clay bg-clay/10 px-3 py-2 text-xs text-clay flex items-center gap-2">
                  <span className="h-1.5 w-1.5 bg-clay rounded-full animate-pulse" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-8 w-full flex items-center justify-center gap-2 border border-ink bg-ink py-3.5 text-sm font-semibold text-paper transition duration-300 hover:bg-canopyDeep hover:border-canopyDeep disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 border-2 border-paper border-t-transparent rounded-full animate-spin" />
                    <span>Verifying session…</span>
                  </>
                ) : (
                  <span>Log in</span>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-line/50 flex flex-col gap-2 text-xs text-ink/60">
              <p>
                No account registered yet?{" "}
                <Link href="/signup" className="text-canopy font-bold underline underline-offset-2 hover:text-canopyDeep">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mini-footer */}
      <footer className="border-t border-line py-4 px-6 bg-paper text-center font-mono text-[10px] text-ink/40">
        YieldSense Core v0.1.0 · SQL Ledger Server Active
      </footer>
    </main>
  );
}
