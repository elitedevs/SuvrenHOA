'use client';

/**
 * /health — HOA Health Score full breakdown page.
 */

import { useHealthScore } from '@/hooks/useHealthScore';
import Link from 'next/link';

export default function HealthPage() {
  const { score, grade, color, colorClass, factors, loading, error } = useHealthScore();

  const radius = 90;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const progress = loading ? 0 : (score / 100) * circumference;
  const dashOffset = circumference - progress;

  const suggestions = factors
    .filter((f) => f.score < f.max)
    .sort((a, b) => (a.score / a.max) - (b.score / b.max))
    .slice(0, 3);

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-radial-glow pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 page-enter">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
              ← Dashboard
            </Link>
          </div>
          <p className="text-sm text-gray-500 font-medium uppercase tracking-widest mb-2">Community Health</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            HOA <span className="gradient-text">Health Score</span>
          </h1>
          <p className="text-gray-400 text-base mt-2 font-medium">
            A composite snapshot of your community's financial, governance, and compliance health.
          </p>
        </div>

        {/* Big ring + score */}
        <div className="glass-card rounded-3xl p-8 sm:p-12 mb-8 page-enter page-enter-delay-1 flex flex-col items-center">
          <div className="relative mb-6">
            <svg
              width={radius * 2 + strokeWidth * 2}
              height={radius * 2 + strokeWidth * 2}
              viewBox={`0 0 ${radius * 2 + strokeWidth * 2} ${radius * 2 + strokeWidth * 2}`}
              className="-rotate-90"
              aria-hidden="true"
            >
              {/* Background track */}
              <circle
                cx={radius + strokeWidth}
                cy={radius + strokeWidth}
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth={strokeWidth}
              />
              {/* Progress arc */}
              <circle
                cx={radius + strokeWidth}
                cy={radius + strokeWidth}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{
                  transition: 'stroke-dashoffset 1.2s ease-in-out, stroke 0.4s ease',
                  filter: `drop-shadow(0 0 12px ${color}66)`,
                }}
              />
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {loading ? (
                <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-400 rounded-full animate-spin" />
              ) : error ? (
                <div className="text-center">
                  <p className="text-red-400 text-sm">Error loading</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className={`text-6xl sm:text-7xl font-extrabold leading-none mb-1 ${colorClass}`}>
                    {score}
                  </p>
                  <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">out of 100</p>
                </div>
              )}
            </div>
          </div>

          {!loading && !error && (
            <div className="text-center">
              <div
                className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl border"
                style={{
                  borderColor: `${color}40`,
                  background: `${color}10`,
                }}
              >
                <span className={`text-5xl font-extrabold ${colorClass}`}>{grade}</span>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-200">
                    {grade === 'A' && 'Excellent Community'}
                    {grade === 'B' && 'Very Good Community'}
                    {grade === 'C' && 'Average Community'}
                    {grade === 'D' && 'Needs Improvement'}
                    {grade === 'F' && 'Critical Attention Needed'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {score >= 71 ? 'Community is thriving' : score >= 41 ? 'Room for improvement' : 'Immediate action recommended'}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-4">Auto-refreshes every 60 seconds</p>
            </div>
          )}
        </div>

        {/* Factor breakdown */}
        {!loading && !error && factors.length > 0 && (
          <div className="space-y-4 mb-8 page-enter page-enter-delay-2">
            <h2 className="text-xl font-bold text-gray-200">Score Breakdown</h2>
            {factors.map((factor) => {
              const pct = (factor.score / factor.max) * 100;
              const factorColor = pct >= 71 ? '#22c55e' : pct >= 41 ? '#f59e0b' : '#ef4444';
              const factorColorClass = pct >= 71 ? 'text-green-400' : pct >= 41 ? 'text-amber-400' : 'text-red-400';

              return (
                <div key={factor.name} className="glass-card rounded-2xl p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{factor.icon}</span>
                      <div>
                        <h3 className="font-bold text-gray-100 text-base">{factor.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{factor.description}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-2xl font-extrabold ${factorColorClass}`}>{factor.score}</span>
                      <span className="text-gray-600 text-sm font-medium">/{factor.max}</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2.5 bg-white/5 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${pct}%`,
                        background: factorColor,
                        boxShadow: `0 0 8px ${factorColor}66`,
                      }}
                    />
                  </div>

                  <p className="text-xs text-gray-500 leading-relaxed">{factor.improvement}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* What can we improve */}
        {!loading && !error && suggestions.length > 0 && (
          <div className="glass-card rounded-2xl p-6 mb-8 page-enter page-enter-delay-3 border-l-2 border-l-purple-500/50">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-lg shrink-0">
                🎯
              </div>
              <h2 className="text-xl font-bold text-gray-200">What Can We Improve?</h2>
            </div>
            <div className="space-y-4">
              {suggestions.map((s, i) => (
                <div key={s.name} className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-xs font-bold text-purple-400 shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-200">{s.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-500">
                        {s.score}/{s.max} pts
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed">{s.improvement}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Perfect score message */}
        {!loading && !error && suggestions.length === 0 && (
          <div className="glass-card-success rounded-2xl p-6 mb-8 page-enter page-enter-delay-3 text-center">
            <p className="text-3xl mb-3">🏆</p>
            <h3 className="font-bold text-green-300 text-lg mb-1">Perfect Score!</h3>
            <p className="text-sm text-gray-400">Your community has achieved the maximum health score across all categories.</p>
          </div>
        )}

        {/* Footer: back to transparency */}
        <div className="text-center text-sm text-gray-600 page-enter page-enter-delay-4">
          <Link href="/transparency" className="hover:text-gray-400 transition-colors">
            View full Transparency Dashboard →
          </Link>
        </div>
      </div>
    </div>
  );
}
