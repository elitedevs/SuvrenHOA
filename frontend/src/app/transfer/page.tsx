'use client';

import { useState } from 'react';
import { ArrowRight, AlertTriangle, CheckCircle, Wallet, FileText, Send, Clock } from 'lucide-react';

const STEPS = [
  { id: 0, label: 'Confirm Sale', icon: FileText },
  { id: 1, label: 'Buyer Wallet', icon: Wallet },
  { id: 2, label: 'Review', icon: CheckCircle },
  { id: 3, label: 'Board Approval', icon: Clock },
  { id: 4, label: 'Execute', icon: Send },
];

export default function TransferPage() {
  const [step, setStep] = useState(0);
  const [saleConfirmed, setSaleConfirmed] = useState(false);
  const [buyerWallet, setBuyerWallet] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [closingDate, setClosingDate] = useState('');
  const [transferSubmitted, setTransferSubmitted] = useState(false);
  const [walletError, setWalletError] = useState('');

  const validateWallet = (addr: string) => {
    if (!addr.startsWith('0x') || addr.length !== 42) {
      setWalletError('Must be a valid Ethereum address (0x + 40 hex chars)');
      return false;
    }
    setWalletError('');
    return true;
  };

  const handleExecute = () => {
    setTransferSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[oklch(0.06_0.005_60)] p-6 lg:p-10">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-[#e8d5a3] mb-2">Property Transfer Wizard</h1>
          <p className="text-[oklch(0.50_0.01_60)]">Transfer your HOA membership NFT to the new property owner</p>
        </div>

        {/* Warning banner */}
        <div className="mb-8 p-4 rounded-xl border border-amber-600/40 bg-amber-950/20 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-300 font-semibold text-sm">Important: This action is irreversible</p>
            <p className="text-amber-400/70 text-xs mt-1">Transferring your NFT will immediately revoke your voting rights, community access, amenity bookings, and all resident privileges. This process requires board approval and cannot be undone.</p>
          </div>
        </div>

        {/* Step progress */}
        <div className="mb-10 flex items-center gap-0">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className={`flex flex-col items-center gap-1 flex-1`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                  step > s.id ? 'bg-[#b8942e] border-[#b8942e] text-[#1a1a1a]'
                  : step === s.id ? 'border-[#c9a96e] text-[#c9a96e] bg-[oklch(0.12_0.01_60)]'
                  : 'border-[oklch(0.25_0.01_60)] text-[oklch(0.40_0.01_60)] bg-transparent'
                }`}>
                  <s.icon className="w-4 h-4" />
                </div>
                <span className={`text-[10px] text-center hidden sm:block ${step >= s.id ? 'text-[#c9a96e]' : 'text-[oklch(0.35_0.01_60)]'}`}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-8 mx-1 rounded ${step > s.id ? 'bg-[#b8942e]' : 'bg-[oklch(0.20_0.005_60)]'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step panels */}
        <div className="bg-[oklch(0.10_0.005_60)] border border-[oklch(0.18_0.005_60)] rounded-2xl p-8">

          {/* Step 0: Confirm Sale */}
          {step === 0 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-[#e8d5a3]">Confirm Your Sale</h2>
              <p className="text-[oklch(0.55_0.01_60)] text-sm">Before proceeding, please confirm the details of your property sale.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-[oklch(0.50_0.01_60)] mb-1.5 font-medium uppercase tracking-wide">Sale Price (USD)</label>
                  <input
                    type="number"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    placeholder="550000"
                    className="w-full bg-[oklch(0.14_0.005_60)] border border-[oklch(0.22_0.005_60)] rounded-lg px-4 py-3 text-[#e8d5a3] placeholder-[oklch(0.35_0.01_60)] focus:outline-none focus:border-[#c9a96e] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[oklch(0.50_0.01_60)] mb-1.5 font-medium uppercase tracking-wide">Closing Date</label>
                  <input
                    type="date"
                    value={closingDate}
                    onChange={(e) => setClosingDate(e.target.value)}
                    className="w-full bg-[oklch(0.14_0.005_60)] border border-[oklch(0.22_0.005_60)] rounded-lg px-4 py-3 text-[#e8d5a3] focus:outline-none focus:border-[#c9a96e] transition-colors"
                  />
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saleConfirmed}
                    onChange={(e) => setSaleConfirmed(e.target.checked)}
                    className="mt-1 accent-[#c9a96e]"
                  />
                  <span className="text-sm text-[oklch(0.55_0.01_60)]">I confirm that I have executed a valid purchase agreement for my property in Faircroft and am ready to transfer my HOA membership NFT to the buyer.</span>
                </label>
              </div>
              <button
                onClick={() => setStep(1)}
                disabled={!saleConfirmed || !salePrice || !closingDate}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#b8942e] text-[#1a1a1a] font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#c9a96e] transition-colors"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 1: Buyer Wallet */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-[#e8d5a3]">Enter Buyer's Wallet Address</h2>
              <p className="text-[oklch(0.55_0.01_60)] text-sm">The buyer must provide their Ethereum wallet address. The NFT will be transferred directly to this address.</p>
              <div>
                <label className="block text-xs text-[oklch(0.50_0.01_60)] mb-1.5 font-medium uppercase tracking-wide">Buyer Ethereum Address</label>
                <input
                  type="text"
                  value={buyerWallet}
                  onChange={(e) => { setBuyerWallet(e.target.value); setWalletError(''); }}
                  placeholder="0x742d35Cc6634C0532925a3b8D4C9b8F3E9A1234"
                  className={`w-full bg-[oklch(0.14_0.005_60)] border rounded-lg px-4 py-3 text-[#e8d5a3] font-mono text-sm placeholder-[oklch(0.35_0.01_60)] focus:outline-none transition-colors ${walletError ? 'border-red-500' : 'border-[oklch(0.22_0.005_60)] focus:border-[#c9a96e]'}`}
                />
                {walletError && <p className="text-red-400 text-xs mt-1">{walletError}</p>}
              </div>
              <div className="p-4 rounded-xl bg-[oklch(0.14_0.005_60)] border border-[oklch(0.22_0.005_60)]">
                <p className="text-xs text-[oklch(0.45_0.01_60)] font-medium mb-2">What the buyer receives:</p>
                <ul className="space-y-1 text-xs text-[oklch(0.55_0.01_60)]">
                  <li> HOA membership NFT (Token ID: #47)</li>
                  <li> Voting rights in community governance</li>
                  <li> Access to all community amenities</li>
                  <li> Resident portal access</li>
                </ul>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="px-5 py-2.5 rounded-xl border border-[oklch(0.22_0.005_60)] text-[oklch(0.55_0.01_60)] hover:text-[#e8d5a3] transition-colors text-sm">Back</button>
                <button
                  onClick={() => { if (validateWallet(buyerWallet)) setStep(2); }}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#b8942e] text-[#1a1a1a] font-semibold hover:bg-[#c9a96e] transition-colors"
                >
                  Review Transfer <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Review */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-[#e8d5a3]">Review Transfer Details</h2>
              <div className="space-y-3">
                {[
                  { label: 'NFT Token ID', value: '#47 — Lot 12, Faircroft HOA' },
                  { label: 'Sale Price', value: `$${parseInt(salePrice || '0').toLocaleString()}` },
                  { label: 'Closing Date', value: closingDate },
                  { label: 'From (You)', value: '0xABCD...1234' },
                  { label: 'To (Buyer)', value: `${buyerWallet.slice(0, 10)}...${buyerWallet.slice(-8)}` },
                  { label: 'Estimated Gas', value: '~$8.40 USD' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center py-3 border-b border-[oklch(0.15_0.005_60)]">
                    <span className="text-xs text-[oklch(0.45_0.01_60)] uppercase tracking-wide font-medium">{label}</span>
                    <span className="text-sm text-[#e8d5a3] font-mono">{value}</span>
                  </div>
                ))}
              </div>
              <div className="p-4 rounded-xl border border-red-700/40 bg-red-950/20">
                <p className="text-red-400 text-xs font-semibold mb-1"> Final Warning</p>
                <p className="text-red-400/70 text-xs">This transfer requires board approval. You will lose all access immediately upon board confirmation. There is no undo.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="px-5 py-2.5 rounded-xl border border-[oklch(0.22_0.005_60)] text-[oklch(0.55_0.01_60)] hover:text-[#e8d5a3] transition-colors text-sm">Back</button>
                <button
                  onClick={() => setStep(3)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#b8942e] text-[#1a1a1a] font-semibold hover:bg-[#c9a96e] transition-colors"
                >
                  Submit for Board Approval <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Board Approval */}
          {step === 3 && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 rounded-full bg-amber-900/30 border border-amber-600/40 flex items-center justify-center mx-auto">
                <Clock className="w-8 h-8 text-amber-400" />
              </div>
              <h2 className="text-xl font-semibold text-[#e8d5a3]">Awaiting Board Approval</h2>
              <p className="text-[oklch(0.55_0.01_60)] text-sm max-w-sm mx-auto">Your transfer request has been submitted. The HOA board must approve this transfer within 5 business days. You'll receive a notification when approved.</p>
              <div className="p-4 rounded-xl bg-[oklch(0.14_0.005_60)] text-left space-y-2">
                <p className="text-xs text-[oklch(0.45_0.01_60)] font-medium">Approval Checklist:</p>
                {['Verify purchase agreement on file', 'Confirm buyer identity', 'Check outstanding dues/violations', 'Board vote (3/5 required)'].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-[oklch(0.55_0.01_60)]">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center text-[8px] ${i === 0 ? 'border-[#c9a96e] bg-[#b8942e]/20 text-[#c9a96e]' : 'border-[oklch(0.25_0.01_60)]'}`}>
                      {i === 0 ? '' : ''}
                    </div>
                    {item}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setStep(4)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#b8942e] text-[#1a1a1a] font-semibold hover:bg-[#c9a96e] transition-colors mx-auto"
              >
                Board Approved — Execute Transfer <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 4: Execute */}
          {step === 4 && (
            <div className="space-y-6 text-center">
              {!transferSubmitted ? (
                <>
                  <h2 className="text-xl font-semibold text-[#e8d5a3]">Execute On-Chain Transfer</h2>
                  <p className="text-[oklch(0.55_0.01_60)] text-sm max-w-sm mx-auto">Board approval received. Click below to execute the NFT transfer on-chain. Your wallet will prompt you to confirm the transaction.</p>
                  <button
                    onClick={handleExecute}
                    className="flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[#b8942e] to-[#c9a96e] text-[#1a1a1a] font-bold text-lg hover:opacity-90 transition-opacity mx-auto shadow-lg"
                  >
                    <Send className="w-5 h-5" />
                    Execute Transfer
                  </button>
                  <button onClick={() => setStep(3)} className="text-xs text-[oklch(0.40_0.01_60)] hover:text-[oklch(0.60_0.01_60)] transition-colors">Back</button>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-full bg-green-900/30 border border-green-600/40 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-10 h-10 text-green-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#e8d5a3]">Transfer Complete!</h2>
                  <p className="text-[oklch(0.55_0.01_60)] text-sm">NFT Token #47 has been transferred to {buyerWallet.slice(0, 10)}...{buyerWallet.slice(-8)}. Your resident access has been revoked. Thank you for being part of Faircroft HOA.</p>
                  <div className="p-4 rounded-xl bg-[oklch(0.14_0.005_60)] text-left">
                    <p className="text-xs text-[oklch(0.45_0.01_60)] font-mono">Tx: 0xf9a8b2c...4e7d1  Confirmed</p>
                    <p className="text-xs text-[oklch(0.45_0.01_60)] font-mono mt-1">Block: 19,847,203</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
