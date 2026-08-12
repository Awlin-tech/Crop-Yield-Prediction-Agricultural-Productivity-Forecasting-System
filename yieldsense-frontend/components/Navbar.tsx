"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Sun, Moon, LogOut, Menu, X, Leaf } from "lucide-react";
import { clearSession } from "@/lib/api";

export default function Navbar({ role }: { role?: "Farmer" | "Admin" }) {
  const router = useRouter();
  const pathname = usePathname();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Check login state and initial theme
  useEffect(() => {
    const token = localStorage.getItem("ys_token");
    const storedRole = localStorage.getItem("ys_role");
    setIsLoggedIn(!!token);
    setUserRole(storedRole);

    // Initial theme check
    const savedTheme = localStorage.getItem("ys_theme") as "light" | "dark" | null;
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const initialTheme = savedTheme || systemTheme;
    setTheme(initialTheme);
    
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Theme toggle handler
  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("ys_theme", nextTheme);
    
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  function handleLogout() {
    clearSession();
    setIsLoggedIn(false);
    router.push("/login");
  }

  const navLinks = isLoggedIn
    ? [
        { name: "Dashboard", href: "/dashboard" },
        { name: "Add Farm", href: "/onboarding" },
      ]
    : [
        { name: "Home", href: "/" },
        { name: "Log In", href: "/login" },
        { name: "Sign Up", href: "/signup" },
      ];

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-ink hover:opacity-90">
          <Leaf className="h-5 w-5 text-canopy fill-canopy/20" />
          <span>
            YieldSense<span className="text-canopy">.</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 text-sm sm:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`font-medium transition hover:text-canopy ${
                  isActive ? "text-canopy border-b border-canopy pb-0.5" : "text-ink/75"
                }`}
              >
                {link.name}
              </Link>
            );
          })}

          {/* User Role Badge */}
          {(role || userRole) && (
            <span className="border border-line px-2 py-0.5 font-mono text-xs text-ink/60 bg-ink/[0.03]">
              {role || userRole}
            </span>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="border border-line p-2 text-ink hover:border-canopy hover:text-canopy transition bg-paper"
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>

          {/* Logout Button */}
          {isLoggedIn && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 border border-clay/35 text-clay px-3 py-1.5 hover:bg-clay/5 transition font-medium"
            >
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </button>
          )}
        </nav>

        {/* Mobile Navigation Controls */}
        <div className="flex items-center gap-3 sm:hidden">
          {/* Mobile Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="border border-line p-2 text-ink bg-paper"
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>

          {/* Mobile Burger Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="border border-line p-2 text-ink bg-paper"
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isMenuOpen && (
        <div className="border-b border-line bg-paper px-4 py-4 sm:hidden animate-fade-in-up">
          <nav className="flex flex-col gap-4 text-sm">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`py-2 font-medium border-b border-line/30 ${
                    isActive ? "text-canopy" : "text-ink/80"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}

            {isLoggedIn && (
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  handleLogout();
                }}
                className="mt-2 flex items-center justify-center gap-2 border border-clay py-2 text-clay transition font-medium w-full"
              >
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
