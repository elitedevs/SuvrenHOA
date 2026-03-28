'use client';

/**
 * HealthScoreWidget — compact health score for the Dashboard.
 * Displays a Playfair Display letter grade. No donut chart.
 * Links to /health for full breakdown.
 */

import Link from 'next/link';
import { useHealthScore } from '@/hooks/useHealthScore';

function getGradeColor(grade: string): string {
  if (grade === 'A' || grade === 'A+') return '#2A5D4F';   // verdigris
  if (grade === 'B') return '#B09B71';                      // brass
  if (grade === 'C') return '#B09B71';                      // brass
  return '#6B3A3A';                                          // rosewood for D/F
}

function getGradeOpacity(grade: string): string {
  if (grade === 'A' || grade === 'A+') return '1';
  if (grade === 'B') return '0.9';
  if (grade === 'C') return '0.8';
  return '0.75';
}

export function HealthScoreWidget() {
  const { score, grade, loading, error } = useHealthScore();

  const gradeColor = getGradeColor(grade);
  const gradeOpacity = getGradeOpacity(grade);

  if (error) {
    return (
      <Link href="/health" className="glass-card rounded-xl p-6 block transition-all duration-200">
        <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-2">HOA Health</p>
        <p className="text-xs text-[var(--text-disabled)]">Unable to load</p>
      </Link>
    );
  }

  return (
    <Link
      href="/health"
      className="glass-card rounded-xl p-6 block group transition-all duration-200"
      aria-label={`HOA Health Score: ${score} out of 100, Grade ${grade}. Click for full breakdown.`}
    >
      <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-3">HOA Health</p>

      <div className="flex items-end gap-3">
        {/* Letter grade — Playfair Display, large */}
        <div className="min-w-0">
          {loading ? (
            <div className="space-y-2">
              <div className="h-12 w-10 bg-[rgba(245,240,232,0.05)] rounded animate-pulse" />
              <div className="h-3 w-20 bg-[rgba(245,240,232,0.05)] rounded animate-pulse" />
            </div>
          ) : (
            <>
              <p
                className="font-normal leading-none mb-1"
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '48px',
                  color: gradeColor,
                  opacity: gradeOpacity,
                }}
              >
                {grade}
              </p>
              <p className="text-[11px] text-[var(--text-disabled)] tracking-widest uppercase font-medium">
                Community Health
              </p>
            </>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1 text-[11px] text-[var(--text-disabled)] group-hover:text-[var(--text-muted)] transition-colors">
        <span>View full breakdown</span>
        <span className="ml-auto opacity-60 group-hover:opacity-100 transition-opacity" style={{ color: gradeColor }}>→</span>
      </div>
    </Link>
  );
}
