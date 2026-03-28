'use client';

import { useState, useEffect } from 'react';

const TOUR_KEY = 'suvren-tour-completed';
const WALLET_SEEN_KEY = 'suvren-wallet-seen';

interface TourStep {
  title: string;
  description: string;
  icon?: string;
  hint?: string;
}

const STEPS: TourStep[] = [
  {
    title: 'Welcome to SuvrenHOA',
    description: 'Your blockchain-powered HOA platform. Transparent governance, immutable records, and democratic decision-making — all on-chain.',
    hint: 'No management companies. No hidden spending.',
  },
  {
    title: 'Your Dashboard',
    description: 'View your property NFT, voting power, dues status, and quick-access links to everything you need as a homeowner.',
    hint: 'Your lot = your vote. 1 property, 1 vote.',
  },
  {
    title: 'Get Involved',
    description: 'Vote on proposals, pay dues in USDC, participate in community discussions, and verify any document is authentic.',
    hint: 'Every vote, every dollar is permanently recorded on Base.',
  },
];

interface WelcomeTourProps {
  isConnected: boolean;
}

export function WelcomeTour({ isConnected }: WelcomeTourProps) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!isConnected) return;

    if (typeof window === 'undefined') return;

    const isCompleted = localStorage.getItem(TOUR_KEY);
    const wasSeen = localStorage.getItem(WALLET_SEEN_KEY);

    if (!isCompleted && !wasSeen) {
      // First time wallet connect — show tour after short delay
      const timer = setTimeout(() => setVisible(true), 1200);
      localStorage.setItem(WALLET_SEEN_KEY, '1');
      return () => clearTimeout(timer);
    }
  }, [isConnected]);

  const dismiss = () => {
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      setExiting(false);
      localStorage.setItem(TOUR_KEY, '1');
    }, 300);
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      dismiss();
    }
  };

  const prev = () => {
    if (step > 0) setStep(s => s - 1);
  };

  if (!visible) return null;

  const current = STEPS[step];

  return (
    <div
      className={`fixed inset-0 z-[250] flex items-center justify-center p-4 transition-opacity duration-300 ${
        exiting ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Tour card */}
      <div
        className="relative z-10 w-full max-w-sm rounded-lg border border-[#c9a96e]/40 bg-[#0d0d0d] shadow-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Gold accent bar */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-[#c9a96e] to-transparent" />

        {/* Content */}
        <div className="p-8 text-center">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`transition-all duration-300 rounded-full ${
                  i === step
                    ? 'w-6 h-2 bg-[#c9a96e]'
                    : i < step
                    ? 'w-2 h-2 bg-[#c9a96e]/50'
                    : 'w-2 h-2 bg-gray-700'
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-[#c9a96e]/20 to-[#b8942e]/10 border border-[#c9a96e]/30 flex items-center justify-center text-4xl mx-auto mb-6 shadow-lg">
            
          </div>

          {/* Text */}
          <h2 className="text-xl font-normal text-[#e8d5a3] mb-3">{current.title}</h2>
          <p className="text-sm text-gray-400 leading-relaxed mb-4">{current.description}</p>

          {current.hint && (
            <div className="px-4 py-3 rounded-md bg-[#c9a96e]/8 border border-[#c9a96e]/20 mb-6">
              <p className="text-xs text-[#c9a96e] font-medium">{current.hint}</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3">
            {step > 0 ? (
              <button
                onClick={prev}
                className="flex-1 py-2.5 rounded-md border border-gray-700 text-sm font-medium text-gray-400 hover:text-gray-300 hover:bg-white/5 transition-colors"
              >
                ← Back
              </button>
            ) : (
              <button
                onClick={dismiss}
                className="flex-1 py-2.5 rounded-md border border-gray-700 text-sm font-medium text-gray-400 hover:text-gray-300 hover:bg-white/5 transition-colors"
              >
                Skip Tour
              </button>
            )}

            <button
              onClick={next}
              className="flex-1 py-2.5 rounded-md bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] text-sm font-bold transition-all shadow-sm"
            >
              {step < STEPS.length - 1 ? 'Next →' : "Let's Go! "}
            </button>
          </div>

          {/* Step text */}
          <p className="text-[10px] text-gray-600 mt-4">
            Step {step + 1} of {STEPS.length}
          </p>
        </div>
      </div>
    </div>
  );
}
