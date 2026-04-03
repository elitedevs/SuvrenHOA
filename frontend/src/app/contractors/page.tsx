'use client';
import { AuthWall } from '@/components/AuthWall';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

interface Contractor {
  id: string;
  name: string;
  specialty: string;
  category: string;
  phone: string;
  email?: string;
  rating: number;
  reviews: number;
  verified: boolean;
  description: string;
  addedBy?: string;
  addedAt: string;
}

const CATEGORIES = [
  { id: 'all', label: 'All', icon: '' },
  { id: 'plumbing', label: 'Plumbing', icon: '' },
  { id: 'electrical', label: 'Electrical', icon: '' },
  { id: 'hvac', label: 'HVAC', icon: '' },
  { id: 'landscaping', label: 'Landscaping', icon: '' },
  { id: 'painting', label: 'Painting', icon: '' },
  { id: 'roofing', label: 'Roofing', icon: '' },
  { id: 'general', label: 'General', icon: '' },
];

const SAMPLE_CONTRACTORS: Contractor[] = [
  { id: '1', name: 'Apex Plumbing & Drain', specialty: 'Residential & Commercial Plumbing', category: 'plumbing', phone: '(555) 234-5678', email: 'apex@plumbing.com', rating: 4.8, reviews: 42, verified: true, description: 'Full-service plumbing, emergency response within 2 hours. HOA preferred vendor since 2019.', addedAt: '2024-01-15' },
  { id: '2', name: 'Bright Spark Electric', specialty: 'Panel Upgrades, EV Chargers, Rewiring', category: 'electrical', phone: '(555) 345-6789', email: 'info@brightspark.com', rating: 4.9, reviews: 38, verified: true, description: 'Licensed master electrician. Specializes in smart home integrations and EV charger installation.', addedAt: '2024-01-20' },
  { id: '3', name: 'Cool Comfort HVAC', specialty: 'AC/Heating Install, Maintenance, Repair', category: 'hvac', phone: '(555) 456-7890', rating: 4.7, reviews: 29, verified: true, description: 'Carrier and Trane certified. HOA bulk discount available — mention Faircroft.', addedAt: '2024-02-01' },
  { id: '4', name: 'Green Thumb Landscapes', specialty: 'Lawn Care, Irrigation, Tree Service', category: 'landscaping', phone: '(555) 567-8901', email: 'greenthumb@landscape.com', rating: 4.6, reviews: 55, verified: true, description: 'Full landscape design and maintenance. Familiar with HOA architectural guidelines.', addedAt: '2024-02-10' },
  { id: '5', name: 'Premier Paint Co.', specialty: 'Interior & Exterior Painting', category: 'painting', phone: '(555) 678-9012', rating: 4.5, reviews: 31, verified: true, description: 'Licensed and insured. Benjamin Moore certified. Board-approved color consultations available.', addedAt: '2024-02-15' },
  { id: '6', name: 'Shield Roofing', specialty: 'Roof Repair, Replacement, Inspections', category: 'roofing', phone: '(555) 789-0123', email: 'shieldroofing@mail.com', rating: 4.8, reviews: 18, verified: true, description: 'GAF certified installer. Free inspections for Faircroft residents, 5-year labor warranty.', addedAt: '2024-03-01' },
  { id: '7', name: 'All-Pro Handyman', specialty: 'General Repairs, Drywall, Carpentry', category: 'general', phone: '(555) 890-1234', rating: 4.4, reviews: 67, verified: false, description: 'Versatile handyman for small to medium jobs. Quick turnaround, fair pricing.', addedAt: '2024-03-10' },
  { id: '8', name: 'Valley Plumbing Solutions', specialty: 'Water Heaters, Drain Cleaning', category: 'plumbing', phone: '(555) 901-2345', rating: 4.3, reviews: 22, verified: false, description: 'Tankless water heater specialists. Same-day service available on weekdays.', addedAt: '2024-03-20' },
];

const LS_KEY = 'suvren_contractors';

function loadContractors(): Contractor[] {
  if (typeof window === 'undefined') return SAMPLE_CONTRACTORS;
  try {
    const stored = localStorage.getItem(LS_KEY);
    return stored ? JSON.parse(stored) : SAMPLE_CONTRACTORS;
  } catch { return SAMPLE_CONTRACTORS; }
}

function saveContractors(contractors: Contractor[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(contractors));
}

export default function ContractorsPage() {
  const { isConnected, address } = useAccount();
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  useEffect(() => {
    setContractors(loadContractors());
  }, []);

  if (!isConnected) {
    return <AuthWall title="Contractors" description="Browse approved community contractors and service providers." />;
  }

  const filtered = contractors.filter(c => {
    if (category !== 'all' && c.category !== category) return false;
    if (verifiedOnly && !c.verified) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.specialty.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
    }
    return true;
  });

  const handleAdd = (newContractor: Omit<Contractor, 'id' | 'addedAt' | 'addedBy'>) => {
    const updated = [...contractors, {
      ...newContractor,
      id: crypto.randomUUID(),
      addedAt: new Date().toISOString().split('T')[0],
      addedBy: address,
    }];
    saveContractors(updated);
    setContractors(updated);
    setShowAdd(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-medium gradient-text sm:"> Contractor Directory</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Board-vetted contractors for Faircroft residents</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-5 py-2.5 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] text-sm font-medium transition-all shrink-0"
        >
          {showAdd ? '← Back' : '+ Add Contractor'}
        </button>
      </div>

      {showAdd ? (
        <AddContractorForm onAdd={handleAdd} onCancel={() => setShowAdd(false)} />
      ) : (
        <>
          {/* Filters */}
          <div className="space-y-3 mb-6">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, specialty, or service..."
              className="w-full px-4 py-3 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none"
            />
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
                {CATEGORIES.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                      category === c.id ? 'bg-[rgba(176,155,113,0.15)] text-[#B09B71] border border-[rgba(176,155,113,0.30)]' : 'glass-card text-[var(--text-muted)]'
                    }`}
                  >
                    {c.icon} {c.label}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 cursor-pointer shrink-0">
                <input type="checkbox" checked={verifiedOnly} onChange={e => setVerifiedOnly(e.target.checked)} className="rounded border-[rgba(245,240,232,0.08)] bg-[var(--surface-2)]" />
                <span className="text-xs text-[var(--text-muted)]">Verified only</span>
              </label>
            </div>
          </div>

          <p className="text-xs text-[var(--text-disabled)] mb-4">{filtered.length} contractor{filtered.length !== 1 ? 's' : ''} found</p>

          {filtered.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center">
              <p className="text-4xl mb-3"></p>
              <h3 className="font-medium mb-1">No contractors found</h3>
              <p className="text-sm text-[var(--text-muted)]">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map(c => <ContractorCard key={c.id} contractor={c} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} className={`text-xs ${s <= Math.round(rating) ? 'text-[#B09B71]' : 'text-[var(--text-disabled)]'}`}></span>
      ))}
      <span className="text-[10px] text-[var(--text-disabled)] ml-1">{rating.toFixed(1)} ({count})</span>
    </div>
  );
}

function ContractorCard({ contractor: c }: { contractor: Contractor }) {
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORIES.find(cat => cat.id === c.category);

  return (
    <div className="glass-card rounded-xl hover-lift overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-medium text-sm">{c.name}</h3>
              {c.verified && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[rgba(176,155,113,0.10)] text-[#B09B71] border border-[rgba(176,155,113,0.20)] font-medium">
                   Verified
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-muted)]">{cat?.icon} {c.specialty}</p>
          </div>
          <span className="text-[10px] px-2 py-1 rounded-lg bg-[rgba(26,26,30,0.50)] text-[var(--text-disabled)] capitalize shrink-0">{c.category}</span>
        </div>

        <StarRating rating={c.rating} count={c.reviews} />

        <p className="text-xs text-[var(--text-disabled)] mt-3 leading-relaxed line-clamp-2">{c.description}</p>

        <div className="mt-4 flex items-center justify-between">
          <a href={`tel:${c.phone}`} className="text-xs text-[#B09B71] hover:text-[#D4C4A0] font-medium">
             {c.phone}
          </a>
          {c.email && (
            <a href={`mailto:${c.email}`} className="text-xs text-[var(--text-muted)] hover:text-[var(--parchment)]">
               Email
            </a>
          )}
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-[rgba(245,240,232,0.05)]">
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">{c.description}</p>
            <p className="text-[10px] text-[var(--text-disabled)] mt-2">Added {c.addedAt}</p>
          </div>
        )}
        <button onClick={() => setExpanded(!expanded)} className="mt-2 text-[10px] text-[var(--text-disabled)] hover:text-[var(--text-body)]">
          {expanded ? 'Show less ▲' : 'Show more ▾'}
        </button>
      </div>
    </div>
  );
}

function AddContractorForm({ onAdd, onCancel }: {
  onAdd: (c: Omit<Contractor, 'id' | 'addedAt' | 'addedBy'>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [category, setCategory] = useState('general');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [verified, setVerified] = useState(false);

  const handleSubmit = () => {
    if (!name.trim() || !phone.trim() || !specialty.trim()) return;
    onAdd({ name, specialty, category, phone, email, description, verified, rating: 0, reviews: 0 });
  };

  return (
    <div className="glass-card rounded-xl p-6 space-y-5 max-w-2xl">
      <h2 className="text-lg font-medium">Add Contractor</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-[var(--text-muted)] mb-2">Company Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Apex Plumbing Co."
            className="w-full px-4 py-3 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm text-[var(--text-muted)] mb-2">Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none">
            {CATEGORIES.filter(c => c.id !== 'all').map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm text-[var(--text-muted)] mb-2">Specialty *</label>
        <input value={specialty} onChange={e => setSpecialty(e.target.value)} placeholder="Water heater repair, drain cleaning..."
          className="w-full px-4 py-3 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-[var(--text-muted)] mb-2">Phone *</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 123-4567" type="tel"
            className="w-full px-4 py-3 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm text-[var(--text-muted)] mb-2">Email (optional)</label>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="contact@company.com" type="email"
            className="w-full px-4 py-3 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none" />
        </div>
      </div>

      <div>
        <label className="block text-sm text-[var(--text-muted)] mb-2">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)}
          placeholder="Services offered, experience, any HOA discounts or notes..."
          rows={3} className="w-full px-4 py-3 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none resize-none" />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={verified} onChange={e => setVerified(e.target.checked)} className="rounded border-[rgba(245,240,232,0.08)] bg-[var(--surface-2)]" />
        <span className="text-sm text-[var(--text-muted)]">Board-verified contractor</span>
      </label>

      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-3 rounded-xl border border-[rgba(245,240,232,0.08)] text-sm font-medium hover:bg-[rgba(245,240,232,0.04)] transition-colors">Cancel</button>
        <button onClick={handleSubmit} disabled={!name.trim() || !phone.trim() || !specialty.trim()}
          className="flex-1 py-3 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] disabled:opacity-50 text-sm font-medium transition-all">
          Add Contractor
        </button>
      </div>
    </div>
  );
}
