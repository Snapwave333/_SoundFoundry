"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  const updateMetaTags = (isLight: boolean) => {
    if (typeof document === "undefined") return;
    
    // Update color-scheme meta
    let metaColorScheme = document.querySelector('meta[name="color-scheme"]');
    if (!metaColorScheme) {
      metaColorScheme = document.createElement("meta");
      metaColorScheme.setAttribute("name", "color-scheme");
      document.head.appendChild(metaColorScheme);
    }
    metaColorScheme.setAttribute("content", "dark light");
    
    // Update theme-color meta
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.setAttribute("name", "theme-color");
      document.head.appendChild(metaThemeColor);
    }
    const bgColor = isLight 
      ? "hsl(0 0% 98%)" 
      : "hsl(220 14% 9%)";
    metaThemeColor.setAttribute("content", bgColor);
  };

  useEffect(() => {
    setMounted(true);
    // Check system preference or stored preference
    const stored = localStorage.getItem("theme") as "dark" | "light" | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = stored || (prefersDark ? "dark" : "light");
    setTheme(initialTheme);
    const isLight = initialTheme === "light";
    document.documentElement.classList.toggle("light", isLight);
    document.documentElement.classList.toggle("dark", !isLight);
    updateMetaTags(isLight);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    const isLight = newTheme === "light";
    document.documentElement.classList.toggle("light", isLight);
    document.documentElement.classList.toggle("dark", !isLight);
    updateMetaTags(isLight);
  };

  if (!mounted) {
    return null;
  }

  return (
    <button
      onClick={toggleTheme}
      className="btn btn-ghost p-2 rounded-md transition-normal"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 text-fg" />
      ) : (
        <Moon className="h-4 w-4 text-fg" />
      )}
    </button>
  );
}

