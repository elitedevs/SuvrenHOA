'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  Wifi, Plus, Copy, Trash2, Clock, CheckCircle, AlertTriangle, BarChart2, Shield, RefreshCw,
} from 'lucide-react';
import { QRCode } from '@/components/QRCode';

interface WifiCode {
  id: string;
  code: string;
  label: string;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  uses: number;
  maxUses: number;
  active: boolean;
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += '-';
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function addHours(h: number): string {
  return new Date(Date.now() + h * 3600000).toISOString();
}

const DEMO_CODES: WifiCode[] = [
  { id: '1', code: 'FRCF-WLAN-2842', label: 'Martinez Family Guests', createdBy: 'Lot 42', createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), expiresAt: addHours(22), uses: 2, maxUses: 5, active: true },
  { id: '2', code: 'FRCF-WLAN-7193', label: 'Pool Party Guests', createdBy: 'Board', createdAt: new Date(Date.now() - 3600000 * 5).toISOString(), expiresAt: addHours(19), uses: 8, maxUses: 20, active: true },
  { id: '3', code: 'FRCF-WLAN-4421', label: 'Contractor Access', createdBy: 'Board', createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), expiresAt: new Date(Date.now() - 3600000).toISOString(), uses: 3, maxUses: 5, active: false },
];

const SSID = 'Faircroft-Guest';
const WIFI_PASSWORD_PREFIX = 'FC-';

function timeRemaining(isoStr: string): string {
  const ms = new Date(isoStr).getTime() - Date.now();
  if (ms <= 0) return 'Expired';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function wifiQRString(ssid: string, password: string): string {
  return `WIFI:T:WPA;S:${ssid};P:${password};;`;
}

export default function WifiPage() {
  const { isConnected } = useAccount();
  const [codes, setCodes] = useState<WifiCode[]>(DEMO_CODES);
  const [showCreate, setShowCreate] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<WifiCode | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [newDuration, setNewDuration] = useState(24);
  const [newMaxUses, setNewMaxUses] = useState(5);

  useEffect(() => {
    const stored = localStorage.getItem('hoa_wifi_codes');
    if (stored) { try { setCodes(JSON.parse(stored)); } catch {} }
  }, []);

  const save = (c: WifiCode[]) => {
    setCodes(c);
    localStorage.setItem('hoa_wifi_codes', JSON.stringify(c));
  };

  const createCode = () => {
    const code: WifiCode = {
      id: Date.now().toString(),
      code: generateCode(),
      label: newLabel || 'Guest Access',
      createdBy: 'Lot 42',
      createdAt: new Date().toISOString(),
      expiresAt: addHours(newDuration),
      uses: 0,
      maxUses: newMaxUses,
      active: true,
    };
    save([code, ...codes]);
    setShowCreate(false);
    setNewLabel('');
  };

  const deleteCode = (id: string) => save(codes.filter((c) => c.id !== id));

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const activeCodes = codes.filter((c) => c.active && new Date(c.expiresAt) > new Date());
  const expiredCodes = codes.filter((c) => !c.active || new Date(c.expiresAt) <= new Date());
  const totalUses = activeCodes.reduce((s, c) => s + c.uses, 0);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 mb-4">Sign in to manage guest WiFi</p>
        <ConnectButton label="Sign In" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <Wifi className="w-7 h-7 text-[#c9a96e]" />
            Guest WiFi Portal
          </h1>
          <p className="text-sm text-gray-400 mt-1">Manage temporary WiFi access codes for community guests</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Generate Code
        </button>
      </div>

      {/* Network Info */}
      <div className="glass-card rounded-xl p-4 border border-[#c9a96e]/20 mb-6 flex items-center gap-4">
        <div className="p-3 rounded-xl bg-[#c9a96e]/15 border border-[#c9a96e]/20">
          <Wifi className="w-6 h-6 text-[#c9a96e]" />
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Community Guest Network</p>
          <p className="text-lg font-bold text-white">{SSID}</p>
          <p className="text-xs text-gray-400">WPA2 Protected · Guests need a code to connect</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Shield className="w-4 h-4 text-green-400" />
          <span className="text-xs text-green-400 font-medium">Online</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Active Codes', value: activeCodes.length, icon: CheckCircle, color: 'text-green-400' },
          { label: 'Total Uses Today', value: totalUses, icon: BarChart2, color: 'text-[#c9a96e]' },
          { label: 'Expired Codes', value: expiredCodes.length, icon: AlertTriangle, color: 'text-gray-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card rounded-xl p-4 text-center">
            <Icon className={`w-5 h-5 ${color} mx-auto mb-2`} />
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Active Codes */}
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Active Codes</h2>
      <div className="space-y-3 mb-6">
        {activeCodes.length === 0 && (
          <div className="glass-card rounded-xl p-6 text-center">
            <Wifi className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No active codes — generate one for guests</p>
          </div>
        )}
        {activeCodes.map((code) => (
          <div key={code.id} className="glass-card rounded-xl p-4 border border-green-400/10">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{code.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">Created by {code.createdBy}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="font-mono text-base font-bold text-[#c9a96e] tracking-widest">{code.code}</span>
                  <button
                    onClick={() => copyCode(code.code)}
                    className="p-1 rounded text-gray-500 hover:text-[#c9a96e] transition-colors"
                    title="Copy code"
                  >
                    {copied === code.code ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setQrCode(qrCode?.id === code.id ? null : code)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-[#c9a96e] hover:bg-[#c9a96e]/10 transition-colors text-xs font-medium"
                  >
                    QR
                  </button>
                  <button
                    onClick={() => deleteCode(code.id)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {timeRemaining(code.expiresAt)}
                </div>
                <div className="text-xs text-gray-500">{code.uses}/{code.maxUses} uses</div>
              </div>
            </div>
            <div className="mt-2">
              <div className="w-full h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (code.uses / code.maxUses) * 100)}%` }}
                />
              </div>
            </div>
            {qrCode?.id === code.id && (
              <div className="mt-4 pt-4 border-t border-white/5 flex flex-col items-center gap-3">
                <p className="text-xs text-gray-400">Scan to connect to {SSID}</p>
                <div className="p-3 bg-white rounded-xl">
                  <QRCode value={wifiQRString(SSID, `${WIFI_PASSWORD_PREFIX}${code.code}`)} size={120} />
                </div>
                <p className="text-xs text-gray-500">Password: <span className="font-mono text-gray-300">{WIFI_PASSWORD_PREFIX}{code.code}</span></p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Expired Codes */}
      {expiredCodes.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Expired</h2>
          <div className="space-y-2">
            {expiredCodes.map((code) => (
              <div key={code.id} className="glass-card rounded-xl p-3 border border-white/5 opacity-60">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">{code.label}</p>
                    <p className="font-mono text-xs text-gray-600 mt-0.5">{code.code}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-400">Expired</span>
                    <button onClick={() => deleteCode(code.id)} className="p-1 rounded text-gray-600 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="glass-card rounded-2xl p-6 w-full max-w-md border border-[#c9a96e]/20">
            <h2 className="text-lg font-semibold mb-5">Generate Access Code</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Label / Purpose</label>
                <input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. Weekend Guests"
                  className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-white/10 text-sm text-white placeholder-gray-600 focus:border-[#c9a96e]/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Expires After</label>
                <div className="flex gap-2">
                  {[4, 8, 24, 48, 168].map((h) => (
                    <button
                      key={h}
                      onClick={() => setNewDuration(h)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${newDuration === h ? 'bg-[#c9a96e] text-[#1a1a1a]' : 'glass-card text-gray-400 hover:text-white'}`}
                    >
                      {h < 24 ? `${h}h` : `${h / 24}d`}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Max Device Connections: {newMaxUses}</label>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={newMaxUses}
                  onChange={(e) => setNewMaxUses(Number(e.target.value))}
                  className="w-full accent-[#c9a96e]"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
              <button onClick={createCode} className="flex-1 px-4 py-2 rounded-lg bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
