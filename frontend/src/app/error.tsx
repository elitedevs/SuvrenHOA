'use client';

import { useEffect } from 'react';
import { createLogger } from '@/lib/logger';

const log = createLogger('ErrorBoundary');

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    log.error('Page error caught', { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-6">
      <div className="glass-card rounded-lg p-10 text-center max-w-md w-full">
        <div className="w-16 h-16 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-3xl mx-auto mb-5">
          
        </div>
        <h2 className="text-xl font-semibold text-gray-100 mb-2">Something went wrong</h2>
        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
          An unexpected error occurred. You can try again or head back to the dashboard.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <pre className="text-xs text-red-400/70 bg-red-500/5 rounded-lg p-3 mb-6 text-left overflow-auto max-h-32">
            {error.message}
          </pre>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-xl bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] text-sm font-bold transition-all"
          >
            Try Again
          </button>
          <a
            href="/dashboard"
            className="px-5 py-2.5 rounded-xl bg-gray-800/60 border border-gray-700/60 text-sm font-medium text-gray-400 hover:text-gray-200 transition-all"
          >
            Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
