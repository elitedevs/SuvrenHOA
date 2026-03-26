'use client';

import { useState, useEffect } from 'react';
import { CreditCard, RefreshCw, ToggleLeft, ToggleRight, Calendar, Zap } from 'lucide-react';

type Frequency = 'monthly' | 'quarterly' | 'annual';

interface AutoPaySettings {
  enabled: boolean;
  frequency: Frequency;
  walletAddress: string;
  setupDate: string;
}

const STORAGE_KEY = 'hoa_autopay_settings';

const FREQUENCY_CONFIG: Record<Frequency, { label: string; description: string; amount: number; intervalDays: number }> = {
  monthly: { label: 'Monthly', description: 'Every month on the 1st', amount: 50, intervalDays: 30 },
  quarterly: { label: 'Quarterly', description: 'Every 3 months', amount: 150, intervalDays: 90 },
  annual: { label: 'Annual', description: 'Once per year (5% discount)', amount: 570, intervalDays: 365 },
};

function getNextPaymentDate(frequency: Frequency): string {
  const now = new Date();
  const next = new Date(now);
  if (frequency === 'monthly') {
    next.setMonth(next.getMonth() + 1);
    next.setDate(1);
  } else if (frequency === 'quarterly') {
    const currentQuarter = Math.floor(now.getMonth() / 3);
    next.setMonth((currentQuarter + 1) * 3);
    next.setDate(1);
  } else {
    next.setFullYear(next.getFullYear() + 1);
    next.setMonth(0);
    next.setDate(1);
  }
  return next.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getDaysUntilNextPayment(frequency: Frequency): number {
  const days = FREQUENCY_CONFIG[frequency].intervalDays;
  return days;
}

export function DuesAutoPay({ walletAddress }: { walletAddress?: string }) {
  const [settings, setSettings] = useState<AutoPaySettings>({
    enabled: false,
    frequency: 'quarterly',
    walletAddress: walletAddress || '',
    setupDate: new Date().toISOString(),
  });
  const [saved, setSaved] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSettings(prev => ({ ...prev, ...parsed, walletAddress: walletAddress || parsed.walletAddress }));
      }
    } catch {}
  }, [walletAddress]);

  const saveSettings = (updated: AutoPaySettings) => {
    setSettings(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleAutoPay = () => {
    if (!settings.enabled) {
      setShowSetup(true);
    } else {
      saveSettings({ ...settings, enabled: false });
    }
  };

  const config = FREQUENCY_CONFIG[settings.frequency];

  return (
    <div className="glass-card rounded-2xl hover-lift p-6 border border-white/[0.04]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#c9a96e]/15 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-[#c9a96e]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-100">Auto-Pay</h3>
            <p className="text-xs text-gray-500">Recurring dues payments</p>
          </div>
        </div>
        <button
          onClick={toggleAutoPay}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
            settings.enabled
              ? 'bg-green-500/15 text-green-400 border-green-500/25'
              : 'bg-white/[0.04] text-gray-400 border-white/[0.08] hover:border-[#c9a96e]/30 hover:text-[#c9a96e]'
          }`}
        >
          {settings.enabled ? (
            <><ToggleRight className="w-4 h-4" /> Enabled</>
          ) : (
            <><ToggleLeft className="w-4 h-4" /> Set Up</>
          )}
        </button>
      </div>

      {settings.enabled ? (
        <div className="space-y-3">
          {/* Active Status */}
          <div className="p-4 rounded-xl bg-green-500/[0.07] border border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-bold text-green-400">Auto-Pay Active</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-500">Frequency:</span>
                <span className="text-gray-200 ml-1 font-semibold">{config.label}</span>
              </div>
              <div>
                <span className="text-gray-500">Amount:</span>
                <span className="text-[#c9a96e] ml-1 font-bold">${config.amount} USDC</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Next payment:</span>
                <span className="text-gray-200 ml-1 font-semibold">{getNextPaymentDate(settings.frequency)}</span>
              </div>
            </div>
          </div>

          {/* Payment method */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <CreditCard className="w-4 h-4 text-[#c9a96e]" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-gray-300">Payment Wallet</div>
              <div className="text-[11px] text-gray-500 font-mono truncate">
                {settings.walletAddress ? `${settings.walletAddress.slice(0, 10)}...${settings.walletAddress.slice(-6)}` : 'Connected wallet'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-gray-600">Est. gas</div>
              <div className="text-xs text-[#c9a96e]">~$0.05</div>
            </div>
          </div>

          <button
            onClick={() => saveSettings({ ...settings, enabled: false })}
            className="w-full py-2 rounded-xl border border-red-500/20 text-xs text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
          >
            Cancel Auto-Pay
          </button>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-xs text-gray-500 mb-2">Set up automatic dues payments from your connected wallet</p>
          <div className="flex items-center gap-1 justify-center text-[11px] text-gray-600">
            <Zap className="w-3 h-3" />
            <span>Smart contract integration coming soon</span>
          </div>
        </div>
      )}

      {/* Setup Modal */}
      {showSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="glass w-full max-w-sm rounded-2xl border border-white/[0.08] p-5">
            <h3 className="text-base font-bold text-gray-100 mb-4">Set Up Auto-Pay</h3>
            
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-400 mb-2 block">Payment Frequency</label>
              <div className="space-y-2">
                {(Object.entries(FREQUENCY_CONFIG) as [Frequency, typeof FREQUENCY_CONFIG[Frequency]][]).map(([freq, cfg]) => (
                  <div
                    key={freq}
                    onClick={() => setSettings(prev => ({ ...prev, frequency: freq }))}
                    className={`p-3 rounded-xl cursor-pointer border transition-all ${
                      settings.frequency === freq
                        ? 'bg-[#c9a96e]/10 border-[#c9a96e]/30'
                        : 'bg-white/[0.02] border-white/[0.04] hover:border-[#c9a96e]/15'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-gray-200">{cfg.label}</div>
                        <div className="text-[11px] text-gray-500">{cfg.description}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-[#c9a96e]">${cfg.amount}</div>
                        <div className="text-[10px] text-gray-600">USDC</div>
                      </div>
                    </div>
                    {freq === 'annual' && (
                      <div className="mt-1.5 text-[10px] text-green-400 font-semibold">💰 Save 5% vs quarterly</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] mb-4">
              <div className="flex items-center gap-2 text-xs">
                <Calendar className="w-3.5 h-3.5 text-[#c9a96e]" />
                <span className="text-gray-400">Next payment: <span className="text-gray-200 font-semibold">{getNextPaymentDate(settings.frequency)}</span></span>
              </div>
              <div className="flex items-center gap-2 text-xs mt-1.5">
                <CreditCard className="w-3.5 h-3.5 text-[#c9a96e]" />
                <span className="text-gray-400">From: <span className="text-gray-200 font-mono text-[11px]">{walletAddress ? `${walletAddress.slice(0, 10)}...${walletAddress.slice(-4)}` : 'Connected wallet'}</span></span>
              </div>
              <div className="flex items-center gap-2 text-xs mt-1.5">
                <Zap className="w-3.5 h-3.5 text-[#c9a96e]" />
                <span className="text-gray-400">Est. gas per tx: <span className="text-[#c9a96e] font-semibold">~$0.05</span></span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-yellow-400/8 border border-yellow-400/15 mb-4">
              <p className="text-[11px] text-yellow-400">⚠️ Note: Auto-pay scheduling requires smart contract support. This saves your preference — actual automation coming in a future update.</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSetup(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-sm text-gray-400 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  saveSettings({ ...settings, enabled: true, setupDate: new Date().toISOString() });
                  setShowSetup(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] text-sm font-semibold cursor-pointer"
              >
                Enable Auto-Pay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
