'use client';

/**
 * HealthScoreWidget — compact health score for the Dashboard.
 * Links to /health for full breakdown.
 */

import Link from 'next/link';
import { useHealthScore } from '@/hooks/useHealthScore';

export function HealthScoreWidget() {
  const { score, grade, color, colorClass, loading, error } = useHealthScore();

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const progress = loading ? 0 : (score / 100) * circumference;
  const dashOffset = circumference - progress;

  if (error) {
    return (
      <Link href="/health" className="glass-card rounded-2xl p-6 block hover:border-[#B09B71]/30 transition-all duration-200">
        <p className="text-xs tracking-widest uppercase text-[rgba(245,240,232,0.35)] mb-2">HOA Health</p>
        <p className="text-xs text-[#8B5A5A]">Unable to load</p>
      </Link>
    );
  }

  return (
    <Link
      href="/health"
      className="glass-card rounded-2xl p-6 block group hover:border-[#B09B71]/30 transition-all duration-200"
      aria-label={`HOA Health Score: ${score} out of 100, Grade ${grade}. Click for full breakdown.`}
    >
      <p className="text-xs tracking-widest uppercase text-[rgba(245,240,232,0.35)] mb-3">HOA Health</p>

      <div className="flex items-center gap-4">
        {/* Mini SVG ring */}
        <div className="relative shrink-0">
          <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
            {/* Background track */}
            <circle
              cx="36"
              cy="36"
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="6"
            />
            {/* Progress arc */}
            <circle
              cx="36"
              cy="36"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.8s ease-in-out, stroke 0.4s ease' }}
            />
          </svg>
          {/* Score label inside ring */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {loading ? (
              <div className="w-4 h-4 border-2 border-[#B09B71]/30 border-t-[#B09B71] rounded-full animate-spin" />
            ) : (
              <span className={`text-lg font-normal leading-none ${colorClass}`}>{score}</span>
            )}
          </div>
        </div>

        {/* Grade + label */}
        <div className="min-w-0">
          {loading ? (
            <div className="space-y-2">
              <div className="h-8 w-10 bg-white/5 rounded animate-pulse" />
              <div className="h-3 w-20 bg-white/5 rounded animate-pulse" />
            </div>
          ) : (
            <>
              <p className={`text-4xl font-normal leading-none mb-1 ${colorClass}`}>{grade}</p>
              <p className="text-[11px] text-[rgba(245,240,232,0.35)] font-medium">View full breakdown</p>
            </>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1 text-[11px] text-[rgba(245,240,232,0.25)] group-hover:text-[rgba(245,240,232,0.50)] transition-colors">
        <span>Community health score</span>
        <span className="ml-auto text-[#b8942e]/60 group-hover:text-[#B09B71] transition-colors">→</span>
      </div>
    </Link>
  );
}
