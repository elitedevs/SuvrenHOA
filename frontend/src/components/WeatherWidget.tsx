'use client';

import { useEffect, useState } from 'react';

interface WeatherData {
  temp_F: string;
  humidity: string;
  windspeedMiles: string;
  weatherDesc: string;
  weatherCode: string;
}

function getWeatherEmoji(code: string): string {
  const n = parseInt(code, 10);
  if (n === 113) return '';
  if (n === 116) return '';
  if (n === 119 || n === 122) return '';
  if ([143, 248, 260].includes(n)) return '';
  if ([176, 293, 296, 299, 302, 305, 308].includes(n)) return '';
  if ([179, 323, 326, 329, 332, 335, 338, 371, 374, 377].includes(n)) return '';
  if ([200, 386, 389, 392, 395].includes(n)) return '';
  if ([227, 230].includes(n)) return '';
  return '';
}

const CACHE_KEY = 'suvren_weather_cache';
const CACHE_TTL = 30 * 60 * 1000; // 30 min

interface Cache {
  data: WeatherData;
  timestamp: number;
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function fetchWeather() {
    try {
      // Check cache
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: Cache = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_TTL) {
          setWeather(parsed.data);
          setLoading(false);
          return;
        }
      }

      const res = await fetch('https://wttr.in/Raleigh,NC?format=j1');
      if (!res.ok) throw new Error('fetch failed');
      const json = await res.json();

      const current = json.current_condition?.[0];
      if (!current) throw new Error('no data');

      const data: WeatherData = {
        temp_F: current.temp_F,
        humidity: current.humidity,
        windspeedMiles: current.windspeedMiles,
        weatherDesc: current.weatherDesc?.[0]?.value || 'Unknown',
        weatherCode: current.weatherCode,
      };

      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
      setWeather(data);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, CACHE_TTL);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-4 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-24 mb-2" />
        <div className="h-8 bg-white/10 rounded w-16" />
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="glass-card rounded-2xl p-4 border border-[#c9a96e]/10">
        <p className="text-xs text-gray-500"> Raleigh, NC</p>
        <p className="text-xs text-gray-600 mt-1">Weather unavailable</p>
      </div>
    );
  }

  const emoji = getWeatherEmoji(weather.weatherCode);

  return (
    <div className="glass-card rounded-2xl p-5 border border-[#c9a96e]/15">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Raleigh, NC</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-[#e8d5a3]">{weather.temp_F}°</span>
            <span className="text-xs text-gray-500">F</span>
          </div>
        </div>
        <span className="text-3xl">{emoji}</span>
      </div>
      <p className="text-xs text-gray-400 mb-3">{weather.weatherDesc}</p>
      <div className="flex gap-3 text-xs text-gray-500">
        <span> {weather.humidity}%</span>
        <span> {weather.windspeedMiles} mph</span>
      </div>
    </div>
  );
}
