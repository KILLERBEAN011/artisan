"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("naijacraft-theme");
    if (savedTheme === "dark") {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  function toggleTheme() {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("naijacraft-theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("naijacraft-theme", "dark");
      setIsDark(true);
    }
  }

  // Prevent layout shift/hydration mismatch during SSR
  if (!mounted) {
    return <div className="h-10 w-10" />;
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-cloud-200 bg-white text-navy-900 transition-colors hover:bg-cloud-50 dark:border-navy-700 dark:bg-[#101D3F] dark:text-white"
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}
