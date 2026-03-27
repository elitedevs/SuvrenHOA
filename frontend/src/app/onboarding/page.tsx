'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProperty } from '@/hooks/useProperty';
import {
  useOnboarding,
  PetEntry,
  VehicleEntry,
} from '@/hooks/useOnboarding';

// ── Confetti ─────────────────────────────────────────────────────────────────
function Confetti() {
  const pieces = Array.from({ length: 60 }, (_, i) => i);
  const colors = [
    '#c9a96e', '#e8d5a3', '#b8942e', '#22c55e', '#f59e0b',
    '#ec4899', '#06b6d4', '#f97316',
  ];
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-50">
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .confetti-piece {
          position: absolute;
          top: -20px;
          animation: confetti-fall linear forwards;
        }
      `}</style>
      {pieces.map((i) => (
        <div
          key={i}
          className="confetti-piece"
          style={{
            left: `${Math.random() * 100}%`,
            width: `${6 + Math.random() * 8}px`,
            height: `${6 + Math.random() * 8}px`,
            backgroundColor: colors[i % colors.length],
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            animationDuration: `${2 + Math.random() * 3}s`,
            animationDelay: `${Math.random() * 1.5}s`,
          }}
        />
      ))}
    </div>
  );
}

// ── Step Indicator ────────────────────────────────────────────────────────────
function StepIndicator({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 font-semibold uppercase tracking-widest">
          Step {current} of {total}
        </span>
        <span className="text-xs text-[#c9a96e] font-semibold">
          {Math.round((current / total) * 100)}%
        </span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full transition-all duration-500"
            style={{
              background:
                i < current
                  ? 'linear-gradient(90deg, #c9a96e, #b8942e)'
                  : 'rgba(255,255,255,0.08)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Pet Card ─────────────────────────────────────────────────────────────────
function PetCard({
  pet,
  onUpdate,
  onRemove,
}: {
  pet: PetEntry;
  onUpdate: (p: PetEntry) => void;
  onRemove: () => void;
}) {
  return (
    <div className="glass-card rounded-xl p-4 border border-[#c9a96e]/10 mb-3">
      <div className="flex justify-between items-start mb-3">
        <span className="text-sm font-semibold text-[#e8d5a3]">
           Pet
        </span>
        <button
          onClick={onRemove}
          className="text-xs text-red-400 hover:text-red-300 transition-colors"
        >
          Remove
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input
          className="bg-gray-800/60 border border-gray-700/60 rounded-xl px-3 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#c9a96e]/50 col-span-2"
          placeholder="Pet name"
          value={pet.name}
          onChange={(e) => onUpdate({ ...pet, name: e.target.value })}
        />
        <select
          className="bg-gray-800/60 border border-gray-700/60 rounded-xl px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-[#c9a96e]/50"
          value={pet.type}
          onChange={(e) =>
            onUpdate({ ...pet, type: e.target.value as PetEntry["type"] })
          }
        >
          <option value="dog"> Dog</option>
          <option value="cat"> Cat</option>
          <option value="other"> Other</option>
        </select>
        <input
          className="bg-gray-800/60 border border-gray-700/60 rounded-xl px-3 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#c9a96e]/50"
          placeholder="Breed"
          value={pet.breed}
          onChange={(e) => onUpdate({ ...pet, breed: e.target.value })}
        />
        <input
          className="bg-gray-800/60 border border-gray-700/60 rounded-xl px-3 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#c9a96e]/50 col-span-2"
          placeholder="Weight (lbs)"
          value={pet.weight}
          onChange={(e) => onUpdate({ ...pet, weight: e.target.value })}
        />
      </div>
    </div>
  );
}

// ── Vehicle Card ──────────────────────────────────────────────────────────────
function VehicleCard({
  vehicle,
  onUpdate,
  onRemove,
}: {
  vehicle: VehicleEntry;
  onUpdate: (v: VehicleEntry) => void;
  onRemove: () => void;
}) {
  return (
    <div className="glass-card rounded-xl p-4 border border-blue-500/10 mb-3">
      <div className="flex justify-between items-start mb-3">
        <span className="text-sm font-semibold text-blue-300"> Vehicle</span>
        <button
          onClick={onRemove}
          className="text-xs text-red-400 hover:text-red-300 transition-colors"
        >
          Remove
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input
          className="bg-gray-800/60 border border-gray-700/60 rounded-xl px-3 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
          placeholder="Make (e.g. Toyota)"
          value={vehicle.make}
          onChange={(e) => onUpdate({ ...vehicle, make: e.target.value })}
        />
        <input
          className="bg-gray-800/60 border border-gray-700/60 rounded-xl px-3 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
          placeholder="Model (e.g. Camry)"
          value={vehicle.model}
          onChange={(e) => onUpdate({ ...vehicle, model: e.target.value })}
        />
        <input
          className="bg-gray-800/60 border border-gray-700/60 rounded-xl px-3 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
          placeholder="Year"
          value={vehicle.year}
          onChange={(e) => onUpdate({ ...vehicle, year: e.target.value })}
        />
        <input
          className="bg-gray-800/60 border border-gray-700/60 rounded-xl px-3 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
          placeholder="Color"
          value={vehicle.color}
          onChange={(e) => onUpdate({ ...vehicle, color: e.target.value })}
        />
        <input
          className="bg-gray-800/60 border border-gray-700/60 rounded-xl px-3 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500/50 col-span-2"
          placeholder="License Plate"
          value={vehicle.plate}
          onChange={(e) => onUpdate({ ...vehicle, plate: e.target.value })}
        />
      </div>
    </div>
  );
}

// ── Main Wizard ───────────────────────────────────────────────────────────────
function OnboardingWizard() {
  const { propertyInfo, tokenId, hasProperty } = useProperty();
  const { data, save, complete, isCompleted } = useOnboarding();
  const [step, setStep] = useState(1);
  const [showConfetti, setShowConfetti] = useState(false);
  const router = useRouter();

  const TOTAL_STEPS = 6;

  // Local state for form fields
  const [profile, setProfile] = useState(data.profile);
  const [pets, setPets] = useState<PetEntry[]>(data.pets);
  const [vehicles, setVehicles] = useState<VehicleEntry[]>(data.vehicles);
  const [ccrAck, setCcrAck] = useState(data.ccrAcknowledged);

  // Sync data -> local state on load
  useEffect(() => {
    setProfile(data.profile);
    setPets(data.pets);
    setVehicles(data.vehicles);
    setCcrAck(data.ccrAcknowledged);
  }, [data]);

  const goNext = useCallback(() => {
    // Save progress
    save({ profile, pets, vehicles, ccrAcknowledged: ccrAck });
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
  }, [step, save, profile, pets, vehicles, ccrAck]);

  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const addPet = () => {
    setPets((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", type: "dog", breed: "", weight: "" },
    ]);
  };

  const updatePet = (id: string, updated: PetEntry) => {
    setPets((prev) => prev.map((p) => (p.id === id ? updated : p)));
  };

  const removePet = (id: string) => {
    setPets((prev) => prev.filter((p) => p.id !== id));
  };

  const addVehicle = () => {
    setVehicles((prev) => [
      ...prev,
      { id: crypto.randomUUID(), make: "", model: "", year: "", color: "", plate: "" },
    ]);
  };

  const updateVehicle = (id: string, updated: VehicleEntry) => {
    setVehicles((prev) => prev.map((v) => (v.id === id ? updated : v)));
  };

  const removeVehicle = (id: string) => {
    setVehicles((prev) => prev.filter((v) => v.id !== id));
  };

  const handleComplete = () => {
    save({ profile, pets, vehicles, ccrAcknowledged: ccrAck });
    complete();
    setShowConfetti(true);
    setStep(6);
    setTimeout(() => setShowConfetti(false), 5000);
  };

  const lot = propertyInfo ? Number(propertyInfo.lotNumber) : null;
  const address = propertyInfo?.streetAddress ?? "";
  const sqft = propertyInfo ? Number(propertyInfo.squareFootage) : null;

  return (
    <div className="max-w-lg mx-auto px-4 py-10 page-enter">
      {showConfetti && <Confetti />}

      {step < 6 && (
        <div className="mb-6">
          <h1 className="text-2xl font-normal text-gray-100 mb-1">
            Move-In Setup
          </h1>
          <p className="text-sm text-gray-500">Faircroft HOA · Property #{tokenId ?? "—"}</p>
        </div>
      )}

      {step < 6 && <StepIndicator current={step} total={TOTAL_STEPS} />}

      {/* ── Step 1: Welcome ── */}
      {step === 1 && (
        <div className="glass-card rounded-lg p-8 border-l-2 border-l-[#c9a96e]/50 animate-fade-in">
          <div className="text-5xl mb-5 text-center"></div>
          <h2 className="text-2xl font-normal text-center mb-2">
            Welcome to Faircroft!
          </h2>
          <p className="text-gray-400 text-center text-sm mb-7">
            Let&apos;s get you set up as a homeowner. This takes about 2 minutes.
          </p>

          {hasProperty && propertyInfo ? (
            <div className="bg-[#c9a96e]/10 border border-[#c9a96e]/20 rounded-xl p-5 mb-7">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-3">
                Your Property
              </p>
              <div className="space-y-2">
                {address && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Address</span>
                    <span className="text-sm font-semibold text-gray-200">{address}</span>
                  </div>
                )}
                {lot !== null && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Lot #</span>
                    <span className="text-sm font-semibold text-gray-200">{lot}</span>
                  </div>
                )}
                {sqft !== null && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Sq Ft</span>
                    <span className="text-sm font-semibold text-gray-200">
                      {sqft.toLocaleString()} sqft
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-4 mb-7 text-center">
              <p className="text-sm text-amber-300">
                No property NFT detected. Contact the board if you&apos;re a homeowner.
              </p>
            </div>
          )}

          <button
            onClick={goNext}
            className="w-full py-3.5 rounded-xl bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] text-white font-semibold text-sm transition-all duration-200 min-h-[44px]"
          >
            Let&apos;s get you set up →
          </button>
        </div>
      )}

      {/* ── Step 2: Profile ── */}
      {step === 2 && (
        <div className="glass-card rounded-lg p-7 animate-fade-in">
          <h2 className="text-xl font-bold mb-1">Your Profile</h2>
          <p className="text-sm text-gray-500 mb-6">
            All fields optional — helps the community reach you.
          </p>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 font-semibold uppercase tracking-wide block mb-1.5">
                Display Name
              </label>
              <input
                className="w-full bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#c9a96e]/50"
                placeholder="How should neighbors know you?"
                value={profile.displayName}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, displayName: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-semibold uppercase tracking-wide block mb-1.5">
                Email
              </label>
              <input
                type="email"
                className="w-full bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#c9a96e]/50"
                placeholder="For HOA notifications"
                value={profile.email}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, email: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-semibold uppercase tracking-wide block mb-1.5">
                Phone
              </label>
              <input
                type="tel"
                className="w-full bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#c9a96e]/50"
                placeholder="For emergency alerts"
                value={profile.phone}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, phone: e.target.value }))
                }
              />
            </div>
            <div className="flex items-center justify-between py-3 px-4 bg-gray-800/40 rounded-xl border border-gray-700/40">
              <div>
                <p className="text-sm font-semibold text-gray-200">
                  Messaging Opt-In
                </p>
                <p className="text-xs text-gray-500">
                  Receive HOA announcements & alerts
                </p>
              </div>
              <button
                onClick={() =>
                  setProfile((p) => ({ ...p, messagingOptIn: !p.messagingOptIn }))
                }
                className={`w-12 h-6 rounded-full transition-all duration-200 relative ${
                  profile.messagingOptIn ? "bg-[#c9a96e]" : "bg-gray-700"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${
                    profile.messagingOptIn ? "left-6" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex gap-3 mt-7">
            <button
              onClick={goBack}
              className="flex-1 py-3 rounded-xl bg-gray-800/60 border border-gray-700/50 text-gray-400 hover:text-gray-200 font-semibold text-sm transition-all"
            >
              ← Back
            </button>
            <button
              onClick={goNext}
              className="flex-1 py-3 rounded-xl bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] text-white font-semibold text-sm transition-all"
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Pets ── */}
      {step === 3 && (
        <div className="glass-card rounded-lg p-7 animate-fade-in">
          <h2 className="text-xl font-bold mb-1">Pet Registration</h2>
          <p className="text-sm text-gray-500 mb-2">
            Register your pets with the HOA.{" "}
            <Link href="/pets" className="text-[#c9a96e] hover:underline">
              Manage later at /pets →
            </Link>
          </p>

          <div className="mt-5">
            {pets.map((pet) => (
              <PetCard
                key={pet.id}
                pet={pet}
                onUpdate={(updated) => updatePet(pet.id, updated)}
                onRemove={() => removePet(pet.id)}
              />
            ))}
            {pets.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No pets? That&apos;s okay! Skip to continue.
              </p>
            )}
          </div>

          <button
            onClick={addPet}
            className="w-full py-2.5 rounded-xl border border-dashed border-[#c9a96e]/30 text-[#c9a96e] hover:border-[#c9a96e]/50 hover:bg-[#c9a96e]/5 text-sm font-semibold transition-all mt-3 mb-6"
          >
            + Add a Pet
          </button>

          <div className="flex gap-3">
            <button
              onClick={goBack}
              className="flex-1 py-3 rounded-xl bg-gray-800/60 border border-gray-700/50 text-gray-400 hover:text-gray-200 font-semibold text-sm transition-all"
            >
              ← Back
            </button>
            <button
              onClick={goNext}
              className="flex-1 py-3 rounded-xl bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] text-white font-semibold text-sm transition-all"
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Vehicles ── */}
      {step === 4 && (
        <div className="glass-card rounded-lg p-7 animate-fade-in">
          <h2 className="text-xl font-bold mb-1">Vehicle Registration</h2>
          <p className="text-sm text-gray-500 mb-2">
            Register vehicles for parking records.{" "}
            <Link href="/vehicles" className="text-blue-400 hover:underline">
              Manage later at /vehicles →
            </Link>
          </p>

          <div className="mt-5">
            {vehicles.map((v) => (
              <VehicleCard
                key={v.id}
                vehicle={v}
                onUpdate={(updated) => updateVehicle(v.id, updated)}
                onRemove={() => removeVehicle(v.id)}
              />
            ))}
            {vehicles.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No vehicles? Skip to continue.
              </p>
            )}
          </div>

          <button
            onClick={addVehicle}
            className="w-full py-2.5 rounded-xl border border-dashed border-blue-500/30 text-blue-400 hover:border-blue-500/50 hover:bg-blue-500/5 text-sm font-semibold transition-all mt-3 mb-6"
          >
            + Add a Vehicle
          </button>

          <div className="flex gap-3">
            <button
              onClick={goBack}
              className="flex-1 py-3 rounded-xl bg-gray-800/60 border border-gray-700/50 text-gray-400 hover:text-gray-200 font-semibold text-sm transition-all"
            >
              ← Back
            </button>
            <button
              onClick={goNext}
              className="flex-1 py-3 rounded-xl bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] text-white font-semibold text-sm transition-all"
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 5: Review ── */}
      {step === 5 && (
        <div className="glass-card rounded-lg p-7 animate-fade-in">
          <h2 className="text-xl font-bold mb-5">Review & Confirm</h2>

          {/* Profile summary */}
          <div className="mb-5">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-2">
              Profile
            </p>
            <div className="bg-gray-800/40 rounded-xl p-4 space-y-1.5">
              {profile.displayName && (
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Name</span>
                  <span className="text-xs text-gray-300">{profile.displayName}</span>
                </div>
              )}
              {profile.email && (
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Email</span>
                  <span className="text-xs text-gray-300">{profile.email}</span>
                </div>
              )}
              {profile.phone && (
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Phone</span>
                  <span className="text-xs text-gray-300">{profile.phone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Messaging</span>
                <span className="text-xs text-gray-300">
                  {profile.messagingOptIn ? " Opted in" : " Opted out"}
                </span>
              </div>
              {!profile.displayName && !profile.email && !profile.phone && (
                <p className="text-xs text-gray-500">No profile info entered</p>
              )}
            </div>
          </div>

          {/* Pets summary */}
          <div className="mb-5">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-2">
              Pets ({pets.length})
            </p>
            {pets.length === 0 ? (
              <p className="text-xs text-gray-500">None registered</p>
            ) : (
              <div className="bg-gray-800/40 rounded-xl p-4 space-y-1.5">
                {pets.map((p) => (
                  <div key={p.id} className="flex justify-between">
                    <span className="text-xs text-gray-300">{p.name || "Unnamed"}</span>
                    <span className="text-xs text-gray-500">
                      {p.type} {p.breed && `· ${p.breed}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Vehicles summary */}
          <div className="mb-6">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-2">
              Vehicles ({vehicles.length})
            </p>
            {vehicles.length === 0 ? (
              <p className="text-xs text-gray-500">None registered</p>
            ) : (
              <div className="bg-gray-800/40 rounded-xl p-4 space-y-1.5">
                {vehicles.map((v) => (
                  <div key={v.id} className="flex justify-between">
                    <span className="text-xs text-gray-300">
                      {[v.year, v.make, v.model].filter(Boolean).join(" ") || "Vehicle"}
                    </span>
                    <span className="text-xs text-gray-500">{v.plate}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CC&Rs */}
          <div className="border border-[#c9a96e]/20 rounded-xl p-4 mb-7 bg-[#c9a96e]/5">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={ccrAck}
                onChange={(e) => setCcrAck(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-[#c9a96e]"
              />
              <span className="text-sm text-gray-300">
                I have read and agree to the{" "}
                <Link
                  href="/documents"
                  target="_blank"
                  className="text-[#c9a96e] hover:underline"
                >
                  CC&Rs (Covenants, Conditions & Restrictions) →
                </Link>
              </span>
            </label>
          </div>

          <div className="flex gap-3">
            <button
              onClick={goBack}
              className="flex-1 py-3 rounded-xl bg-gray-800/60 border border-gray-700/50 text-gray-400 hover:text-gray-200 font-semibold text-sm transition-all"
            >
              ← Back
            </button>
            <button
              onClick={handleComplete}
              disabled={!ccrAck}
              className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all"
            >
              Complete Setup 
            </button>
          </div>
        </div>
      )}

      {/* ── Step 6: All Done ── */}
      {step === 6 && (
        <div className="glass-card rounded-lg p-10 text-center animate-fade-in border-l-2 border-l-green-500/50">
          <div className="text-6xl mb-5"></div>
          <h2 className="text-2xl font-normal mb-2">You&apos;re all set!</h2>
          <p className="text-gray-400 text-sm mb-8">
            Welcome to the Faircroft community. Your setup is complete.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/dashboard"
              className="glass-card rounded-xl p-4 text-center hover:border-[#c9a96e]/25 transition-all"
            >
              <div className="text-2xl mb-1"></div>
              <p className="text-sm font-semibold text-gray-300">Dashboard</p>
            </Link>
            <Link
              href="/dues"
              className="glass-card rounded-xl p-4 text-center hover:border-green-500/25 transition-all"
            >
              <div className="text-2xl mb-1"></div>
              <p className="text-sm font-semibold text-gray-300">Pay Dues</p>
            </Link>
            <Link
              href="/community"
              className="glass-card rounded-xl p-4 text-center hover:border-blue-500/25 transition-all"
            >
              <div className="text-2xl mb-1"></div>
              <p className="text-sm font-semibold text-gray-300">Community</p>
            </Link>
            <Link
              href="/documents"
              className="glass-card rounded-xl p-4 text-center hover:border-amber-500/25 transition-all"
            >
              <div className="text-2xl mb-1"></div>
              <p className="text-sm font-semibold text-gray-300">Documents</p>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Move-In/Move-Out Checklist ─────────────────────────────────────────────

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  category: 'move-in' | 'move-out' | 'both';
  required: boolean;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  { id: 'keys', label: 'Key Pickup', description: 'Collect property keys, mailbox key, and community access fobs from prior owner or management.', category: 'move-in', required: true },
  { id: 'parking', label: 'Parking Assignment', description: 'Register your assigned parking spot(s) with the HOA management office. Update vehicle registration.', category: 'move-in', required: true },
  { id: 'pets', label: 'Pet Registration', description: 'Register all pets in the HOA portal. Provide vaccination records and photos.', category: 'both', required: false },
  { id: 'vehicles', label: 'Vehicle Registration', description: 'Register all vehicles (make, model, plate) in the HOA portal for parking enforcement.', category: 'both', required: true },
  { id: 'emergency', label: 'Emergency Contacts', description: 'Add emergency contact information to your profile — at least two contacts with phone numbers.', category: 'both', required: true },
  { id: 'utilities', label: 'Utility Transfers', description: 'Transfer electric, gas, water, and internet accounts to your name. Contact utility providers.', category: 'move-in', required: true },
  { id: 'mailbox', label: 'Mailbox Setup', description: 'Obtain mailbox number and key. Set up mail forwarding if moving from previous address.', category: 'move-in', required: true },
  { id: 'rules', label: 'Community Rules Acknowledgment', description: 'Read and acknowledge receipt of CC&Rs, HOA Rules & Regulations, and Welcome Packet.', category: 'move-in', required: true },
  { id: 'insurance', label: 'Homeowner\'s Insurance', description: 'Provide proof of homeowner\'s insurance to management. Minimum coverage requirements apply.', category: 'both', required: true },
  { id: 'directory', label: 'Community Directory', description: 'Add yourself to the community directory. Set display preferences for contact sharing.', category: 'move-in', required: false },
  { id: 'inspection', label: 'Move-Out Inspection', description: 'Schedule and complete a move-out inspection with property management at least 7 days prior to departure.', category: 'move-out', required: true },
  { id: 'dues', label: 'Dues Balance Clearance', description: 'Ensure all HOA dues, assessments, and fines are paid in full before transfer of title.', category: 'move-out', required: true },
  { id: 'access-return', label: 'Return Access Credentials', description: 'Return all keys, fobs, and access cards to HOA management. Security codes will be reset.', category: 'move-out', required: true },
];

const LS_CHECKLIST = 'suvren_checklist_completed';

function loadChecked(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try { return new Set(JSON.parse(localStorage.getItem(LS_CHECKLIST) || '[]')); }
  catch { return new Set(); }
}

function MoveChecklist({ mode }: { mode: 'move-in' | 'move-out' }) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  useEffect(() => { setChecked(loadChecked()); }, []);

  const toggle = (id: string) => {
    const next = new Set(checked);
    next.has(id) ? next.delete(id) : next.add(id);
    localStorage.setItem(LS_CHECKLIST, JSON.stringify([...next]));
    setChecked(next);
  };

  const filtered = CHECKLIST_ITEMS.filter(i => i.category === mode || i.category === 'both');
  const required = filtered.filter(i => i.required);
  const optional = filtered.filter(i => !i.required);
  const completedRequired = required.filter(i => checked.has(i.id)).length;
  const totalRequired = required.length;
  const pct = totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : 0;
  const totalDone = filtered.filter(i => checked.has(i.id)).length;

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-[#e8d5a3]">
              {mode === 'move-in' ? ' Move-In Checklist' : ' Move-Out Checklist'}
            </h3>
            <p className="text-xs text-gray-400">{completedRequired} of {totalRequired} required tasks complete</p>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${pct === 100 ? 'text-green-400' : pct >= 60 ? 'text-[#c9a96e]' : 'text-gray-300'}`}>
              {pct}%
            </div>
            <div className="text-[10px] text-gray-500">Complete</div>
          </div>
        </div>
        <div className="h-2.5 rounded-full bg-gray-800 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: pct === 100 ? '#22c55e' : 'linear-gradient(90deg, #b8942e, #c9a96e)',
            }}
          />
        </div>
        {pct === 100 && (
          <p className="text-xs text-green-400 mt-2"> All required tasks complete!</p>
        )}
      </div>

      {/* Required tasks */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Required ({completedRequired}/{totalRequired})</h4>
        <div className="space-y-2">
          {required.map(item => (
            <ChecklistRow key={item.id} item={item} checked={checked.has(item.id)} onToggle={() => toggle(item.id)} />
          ))}
        </div>
      </div>

      {optional.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Optional</h4>
          <div className="space-y-2">
            {optional.map(item => (
              <ChecklistRow key={item.id} item={item} checked={checked.has(item.id)} onToggle={() => toggle(item.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ChecklistRow({ item, checked, onToggle }: { item: ChecklistItem; checked: boolean; onToggle: () => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`glass-card rounded-xl overflow-hidden transition-all ${checked ? 'opacity-60' : ''}`}>
      <div className="p-4 flex items-start gap-3">
        <button
          onClick={onToggle}
          className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
            checked ? 'bg-[#c9a96e] border-[#c9a96e] text-[#1a1a1a]' : 'border-gray-600 hover:border-[#c9a96e]/50'
          }`}
        >
          {checked && <span className="text-[10px] font-bold"></span>}
        </button>
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${checked ? 'line-through text-gray-500' : 'text-gray-200'}`}>
              {item.label}
            </span>
            {item.required && !checked && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#c9a96e]/10 text-[#c9a96e] border border-[#c9a96e]/20">Required</span>
            )}
          </div>
          {expanded && (
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">{item.description}</p>
          )}
        </div>
        <button onClick={() => setExpanded(!expanded)} className="text-gray-600 text-xs shrink-0">
          {expanded ? '▲' : '▾'}
        </button>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const { isConnected } = useAccount();
  const [view, setView] = useState<'wizard' | 'checklist-in' | 'checklist-out'>('wizard');

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-5xl mb-2"></div>
        <h2 className="text-xl font-bold">Move-In Setup</h2>
        <p className="text-gray-400 text-sm">Connect your wallet to begin</p>
        <ConnectButton label="Connect Wallet" />
      </div>
    );
  }

  return (
    <div>
      {/* View switcher */}
      <div className="max-w-[960px] mx-auto px-4 pt-6 sm:pt-8">
        <div className="flex gap-2 mb-6">
          <button onClick={() => setView('wizard')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${view === 'wizard' ? 'bg-[#c9a96e]/15 text-[#c9a96e] border border-[#c9a96e]/30' : 'glass-card text-gray-400'}`}>
             Setup Wizard
          </button>
          <button onClick={() => setView('checklist-in')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${view === 'checklist-in' ? 'bg-[#c9a96e]/15 text-[#c9a96e] border border-[#c9a96e]/30' : 'glass-card text-gray-400'}`}>
             Move-In Checklist
          </button>
          <button onClick={() => setView('checklist-out')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${view === 'checklist-out' ? 'bg-[#c9a96e]/15 text-[#c9a96e] border border-[#c9a96e]/30' : 'glass-card text-gray-400'}`}>
             Move-Out Checklist
          </button>
        </div>
      </div>

      {view === 'wizard' ? (
        <OnboardingWizard />
      ) : view === 'checklist-in' ? (
        <div className="max-w-[960px] mx-auto px-4 pb-8">
          <MoveChecklist mode="move-in" />
        </div>
      ) : (
        <div className="max-w-[960px] mx-auto px-4 pb-8">
          <MoveChecklist mode="move-out" />
        </div>
      )}
    </div>
  );
}
