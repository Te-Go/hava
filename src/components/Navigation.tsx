"use client";

import React, { useRef, useEffect, useState } from "react";
import { Icon } from "./Icons";
import { toSlug } from "../services/weatherService";
import { REGULAR_CITIES, SEASONAL_SPOTS } from "../shared/cityData";
import Link from "next/link";
import { useRouter } from "next/navigation";

const RAIL_CITIES = [...REGULAR_CITIES, ...SEASONAL_SPOTS.map((s) => s.name)];

interface NavigationProps {
  currentCity: string;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentCity,
  isDarkMode = true,
  onToggleTheme,
}) => {
  const [inputValue, setInputValue] = useState(currentCity);
  const router = useRouter();

  useEffect(() => {
    setInputValue(currentCity);
  }, [currentCity]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = e.currentTarget.value.trim();
      if (val.length > 2) {
        const slug = toSlug(val);
        router.push(`/hava-durumu/${slug}`);
        e.currentTarget.blur();
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-md border-b border-white/10 px-4 py-3">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Branding & Logo */}
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">🌤️</span>
            <span className="font-extrabold text-white tracking-wide text-lg">
              HAVAPRO
            </span>
          </Link>

          {/* Mobile Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="md:hidden p-2 text-white/70 hover:text-white rounded-lg border border-white/10"
          >
            {isDarkMode ? "🌙" : "☀️"}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-white/40">
            🔍
          </span>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Şehir veya ilçe ara..."
            className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder-white/40 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-colors"
          />
        </div>

        {/* Desktop Controls */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={onToggleTheme}
            className="p-2 text-white/70 hover:text-white rounded-lg border border-white/10 transition-colors"
          >
            {isDarkMode ? "🌙" : "☀️"}
          </button>
        </div>
      </div>

      {/* Crawlable Horizontal Cities Rail */}
      <div className="max-w-6xl mx-auto mt-3 overflow-x-auto no-scrollbar flex items-center gap-2 py-1 text-xs">
        {RAIL_CITIES.map((city) => {
          const slug = toSlug(city);
          const isActive = toSlug(currentCity) === slug;
          return (
            <Link
              key={city}
              href={`/hava-durumu/${slug}`}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-colors border ${
                isActive
                  ? "bg-blue-600 border-blue-500 text-white font-semibold"
                  : "bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {city}
            </Link>
          );
        })}
      </div>
    </header>
  );
};

export default Navigation;
