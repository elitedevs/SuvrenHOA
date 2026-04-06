import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import packageJson from '../../../../package.json';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const startTime = Date.now();

export async function GET() {
  const checks: Record<string, string> = {};
  let overallOk = true;

  // ── Database check ────────────────────────────────────────────────────────
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    // Lightweight ping — count on a small indexed column
    const { error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true });

    checks.db = error ? 'error' : 'ok';
    if (error) overallOk = false;
  } catch {
    checks.db = 'error';
    overallOk = false;
  }

  const body = {
    status: overallOk ? 'ok' : 'degraded',
    version: packageJson.version,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    checks,
  };

  return NextResponse.json(body, {
    status: overallOk ? 200 : 503,
    headers: {
      // Don't cache health checks
      'Cache-Control': 'no-store',
    },
  });
}
