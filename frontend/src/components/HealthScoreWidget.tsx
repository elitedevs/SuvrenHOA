'use client';

import Link from 'next/link';
import { useHealthScore } from '@/hooks/useHealthScore';

export function HealthScoreWidget() {
  const { score, grade, loading, error } = useHealthScore();

  // Grade color using palette — rosewood for low, brass for mid, verdigris for high
  const gradeColor = score >= 70 ? '#2A5D4F' : score >= 40 ? '#B09B71' : '#6B3A3A';

  if (error) {
    return (
      <Link href="/health" className="glass-card rounded-lg p-6 block">
        <p className="text-[11px] uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Community Health</p>
        <p className="text-[13px]" style={{ color: '#6B3A3A' }}>Unable to load</p>
      </Link>
    );
  }

  return (
    <Link href="/health" className="glass-card rounded-lg p-6 block group">
      <p className="text-[11px] uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Community Health</p>

      <div className="flex items-center gap-3">
        {loading ? (
          <div className="skeleton w-12 h-12 rounded" />
        ) : (
          <span
            className="font-heading"
            style={{
              fontFamily: 'var(--font-heading), Georgia, serif',
              fontSize: '48px',
              fontWeight: 400,
              lineHeight: 1,
              color: gradeColor,
            }}
          >
            {grade}
          </span>
        )}
      </div>

      <p className="text-[11px] mt-3" style={{ color: 'var(--text-muted)' }}>
        View breakdown <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
      </p>
    </Link>
  );
}
