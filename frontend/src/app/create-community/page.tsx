'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/context/AuthContext';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import { Building2, MapPin, Hash, ChevronRight, CheckCircle } from 'lucide-react';

export default function CreateCommunityPage() {
  const router = useRouter();
  const { user } = useSupabaseAuth();
  const [supabase] = useState(() => createSupabaseBrowser());

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [unitCount, setUnitCount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    setLoading(true);

    // Create community
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .insert({
        name,
        address,
        city,
        state,
        zip,
        unit_count: parseInt(unitCount) || 0,
        created_by: user.id,
      })
      .select()
      .single();

    if (communityError) {
      setError(communityError.message);
      setLoading(false);
      return;
    }

    // Add creator as admin
    const { error: memberError } = await supabase
      .from('community_members')
      .insert({
        community_id: community.id,
        profile_id: user.id,
        role: 'admin',
      });

    if (memberError) {
      setError(memberError.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-radial-glow pointer-events-none" />

      <div className="relative glass-card rounded-2xl p-10 max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[rgba(176,155,113,0.10)] border border-[rgba(176,155,113,0.25)] flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-7 h-7 text-[#B09B71]" />
          </div>
          <h1 className="text-2xl font-serif font-medium text-[var(--parchment)] mb-2">Create Your Community</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Set up your HOA on the blockchain in minutes
          </p>
        </div>

        {/* Benefits */}
        <div className="mb-8 space-y-2">
          {['Transparent treasury on-chain', 'Democratic voting — 1 lot, 1 vote', 'Permanent, tamper-proof records'].map((benefit) => (
            <div key={benefit} className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <CheckCircle className="w-4 h-4 text-[#2A5D4F] shrink-0" />
              {benefit}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-[rgba(107,58,58,0.12)] border border-[rgba(107,58,58,0.25)] text-sm text-[#D4A0A0]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Community Name */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-[var(--text-disabled)] mb-2">Community Name</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-disabled)]" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Faircroft Estates HOA"
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--divider)] text-[var(--text-body)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:border-[rgba(176,155,113,0.40)] transition-colors text-sm"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-[var(--text-disabled)] mb-2">Street Address</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-disabled)]" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main Street"
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--divider)] text-[var(--text-body)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:border-[rgba(176,155,113,0.40)] transition-colors text-sm"
              />
            </div>
          </div>

          {/* City, State, Zip */}
          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-2">
              <label className="block text-xs uppercase tracking-widest text-[var(--text-disabled)] mb-2">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Raleigh"
                className="w-full px-3 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--divider)] text-[var(--text-body)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:border-[rgba(176,155,113,0.40)] transition-colors text-sm"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-xs uppercase tracking-widest text-[var(--text-disabled)] mb-2">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="NC"
                maxLength={2}
                className="w-full px-3 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--divider)] text-[var(--text-body)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:border-[rgba(176,155,113,0.40)] transition-colors text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs uppercase tracking-widest text-[var(--text-disabled)] mb-2">ZIP</label>
              <input
                type="text"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                placeholder="27601"
                className="w-full px-3 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--divider)] text-[var(--text-body)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:border-[rgba(176,155,113,0.40)] transition-colors text-sm"
              />
            </div>
          </div>

          {/* Unit Count */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-[var(--text-disabled)] mb-2">Number of Units/Lots</label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-disabled)]" />
              <input
                type="number"
                value={unitCount}
                onChange={(e) => setUnitCount(e.target.value)}
                required
                min={1}
                placeholder="e.g. 150"
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--divider)] text-[var(--text-body)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:border-[rgba(176,155,113,0.40)] transition-colors text-sm"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[#B09B71] text-[#0C0C0E] font-medium text-sm hover:bg-[#C4B08A] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? 'Creating...' : (
              <>Create Community <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
