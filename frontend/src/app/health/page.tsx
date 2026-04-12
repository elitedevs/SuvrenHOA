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
            <Link href="/" className="text-sm text-[var(--text-disabled)] hover:text-[var(--text-body)] transition-colors">
              ← Dashboard
            </Link>
          </div>
          <p className="text-sm text-[var(--text-disabled)] font-medium uppercase tracking-widest mb-2">Community Health</p>
          <h1 className="text-3xl sm:text-4xl font-medium gradient-text sm:">
            HOA <span className="gradient-text">Health Score</span>
          </h1>
          <p className="text-[var(--text-muted)] text-base mt-2 font-medium">
            A composite snapshot of your community's financial, governance, and compliance health.
          </p>
        </div>

        {/* Big ring + score */}
        <div className="glass-card rounded-xl p-8 sm:p-12 mb-8 card-enter card-enter-delay-1 flex flex-col items-center">
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
                <div className="w-10 h-10 border-4 border-[rgba(176,155,113,0.30)] border-t-[#B09B71] rounded-full animate-spin" />
              ) : error ? (
                <div className="text-center">
                  <p className="text-[#8B5A5A] text-sm">Error loading</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className={`text-6xl sm:text-7xl font-normal leading-none mb-1 ${colorClass}`}>
                    {score}
                  </p>
                  <p className="text-[var(--text-disabled)] text-sm font-medium uppercase tracking-wider">out of 100</p>
                </div>
              )}
            </div>
          </div>

          {!loading && !error && (
            <div className="text-center">
              <div
                className="inline-flex items-center gap-3 px-6 py-3 rounded-xl border"
                style={{
                  borderColor: `${color}40`,
                  background: `${color}10`,
                }}
              >
                <span className={`text-5xl font-normal ${colorClass}`}>{grade}</span>
                <div className="text-left">
                  <p className="text-sm font-medium text-[var(--parchment)]">
                    {grade === 'A' && 'Excellent Community'}
                    {grade === 'B' && 'Very Good Community'}
                    {grade === 'C' && 'Average Community'}
                    {grade === 'D' && 'Needs Improvement'}
                    {grade === 'F' && 'Critical Attention Needed'}
                  </p>
                  <p className="text-xs text-[var(--text-disabled)] mt-0.5">
                    {score >= 71 ? 'Community is thriving' : score >= 41 ? 'Room for improvement' : 'Immediate action recommended'}
                  </p>
                </div>
              </div>
              <p className="text-xs text-[var(--text-disabled)] mt-4">Auto-refreshes every 60 seconds</p>
            </div>
          )}
        </div>

        {/* Factor breakdown */}
        {!loading && !error && factors.length > 0 && (
          <div className="space-y-4 mb-8 card-enter card-enter-delay-2">
            <h2 className="text-xl font-medium text-[var(--parchment)]">Score Breakdown</h2>
            {factors.map((factor) => {
              const pct = (factor.score / factor.max) * 100;
              const factorColor = pct >= 71 ? '#2A5D4F' : pct >= 41 ? '#b8942e' : '#8B5A5A';
              const factorColorClass = pct >= 71 ? 'text-[#2A5D4F]' : pct >= 41 ? 'text-[#B09B71]' : 'text-[#8B5A5A]';

              return (
                <div key={factor.name} className="glass-card rounded-xl hover-lift p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{factor.icon}</span>
                      <div>
                        <h3 className="font-medium text-[var(--parchment)] text-base">{factor.name}</h3>
                        <p className="text-xs text-[var(--text-disabled)] mt-0.5">{factor.description}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-2xl font-normal ${factorColorClass}`}>{factor.score}</span>
                      <span className="text-[var(--text-disabled)] text-sm font-medium">/{factor.max}</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2.5 bg-[rgba(245,240,232,0.05)] rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${pct}%`,
                        background: factorColor,
                        boxShadow: `0 0 8px ${factorColor}66`,
                      }}
                    />
                  </div>

                  <p className="text-xs text-[var(--text-disabled)] leading-relaxed">{factor.improvement}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* What can we improve */}
        {!loading && !error && suggestions.length > 0 && (
          <div className="glass-card rounded-xl hover-lift p-6 mb-8 card-enter card-enter-delay-3">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-[rgba(176,155,113,0.10)] border border-[rgba(176,155,113,0.25)] flex items-center justify-center text-lg shrink-0">
                
              </div>
              <h2 className="text-xl font-medium text-[var(--parchment)]">What Can We Improve?</h2>
            </div>
            <div className="space-y-4">
              {suggestions.map((s, i) => (
                <div key={s.name} className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-[rgba(176,155,113,0.15)] border border-[rgba(176,155,113,0.40)] flex items-center justify-center text-xs font-medium text-[#B09B71] shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-[var(--parchment)]">{s.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-lg bg-[rgba(245,240,232,0.05)] text-[var(--text-disabled)]">
                        {s.score}/{s.max} pts
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-muted)] leading-relaxed">{s.improvement}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Perfect score message */}
        {!loading && !error && suggestions.length === 0 && (
          <div className="glass-card-success rounded-xl p-6 mb-8 card-enter card-enter-delay-3 text-center">
            <p className="text-3xl mb-3"></p>
            <h3 className="font-medium text-[#2A5D4F] text-lg mb-1">Perfect Score!</h3>
            <p className="text-sm text-[var(--text-muted)]">Your community has achieved the maximum health score across all categories.</p>
          </div>
        )}

        {/* Footer: back to transparency */}
        <div className="text-center text-sm text-[var(--text-disabled)] card-enter card-enter-delay-4">
          <Link href="/transparency" className="hover:text-[var(--text-muted)] transition-colors">
            View full Transparency Dashboard →
          </Link>
        </div>
      </div>
    </div>
  );
}
