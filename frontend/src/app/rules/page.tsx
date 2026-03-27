'use client';

import { useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

interface Rule {
  question: string;
  answer: string;
}

interface Section {
  id: string;
  icon: string;
  title: string;
  description: string;
  rules: Rule[];
}

const SECTIONS: Section[] = [
  {
    id: 'parking',
    icon: '🚗',
    title: 'Parking',
    description: 'Rules governing parking in driveways, streets, and common areas.',
    rules: [
      { question: 'How many vehicles can I park in my driveway?', answer: 'Up to 2 registered vehicles may be parked in your driveway at any time. Vehicles must be fully within the driveway boundaries and not blocking the sidewalk.' },
      { question: 'Can I park on the street overnight?', answer: 'Street parking is permitted from 8 AM to 10 PM. Overnight street parking (10 PM–8 AM) requires prior written approval from the board, available for special circumstances up to 3 nights per month.' },
      { question: 'Are commercial vehicles allowed?', answer: 'Commercial vehicles, trucks over 1 ton, RVs, boats, and trailers may not be parked in driveways or streets for more than 24 hours without board approval. Storage in garages is permitted.' },
      { question: 'What about guest parking?', answer: 'Guests may park in designated visitor spots or in front of your property for up to 72 consecutive hours. For longer visits, notify the board via the management portal.' },
      { question: 'Can I park on common area grass?', answer: 'Absolutely not. Parking on lawns, common areas, or landscaped areas is strictly prohibited and subject to immediate towing at owner\'s expense plus a $100 fine.' },
    ],
  },
  {
    id: 'pets',
    icon: '🐾',
    title: 'Pets',
    description: 'Guidelines for pet ownership, leashing, and community spaces.',
    rules: [
      { question: 'How many pets am I allowed?', answer: 'Residents may have up to 3 domestic pets (dogs, cats, small animals). Exotic, dangerous, or prohibited breeds require board approval. All pets must be registered in the HOA portal.' },
      { question: 'Are there leash requirements?', answer: 'All dogs must be on a leash no longer than 6 feet when outside the home or fence. Dogs may not be tied up unattended in common areas or on community property.' },
      { question: 'Where can I walk my dog?', answer: 'Designated pet walk areas are along the perimeter trail and the east side of the community. Pets are not allowed in the pool area, fitness center, or playground zone.' },
      { question: 'What is the pet waste policy?', answer: 'All pet waste must be immediately collected and properly disposed of. Waste stations with bags and bins are located throughout the community. Violations are subject to $50 fine.' },
      { question: 'Are there restricted breeds?', answer: 'The following breeds require special liability insurance and board approval: Pit Bulls, Rottweilers, Dobermans, German Shepherds, Chow Chows, and similar breeds. Proof of insurance must be filed annually.' },
    ],
  },
  {
    id: 'noise',
    icon: '🔊',
    title: 'Noise',
    description: 'Quiet hours and acceptable noise levels in the community.',
    rules: [
      { question: 'What are quiet hours?', answer: 'Quiet hours are Sunday–Thursday 10 PM–8 AM and Friday–Saturday 11 PM–9 AM. During quiet hours, all outdoor activities, music, and gatherings must be kept to a minimum.' },
      { question: 'Can I have outdoor gatherings?', answer: 'Outdoor gatherings of up to 25 people are permitted until quiet hours begin. Larger events (25+ guests) require a community event permit submitted to the board 7 days in advance.' },
      { question: 'What about construction noise?', answer: 'Construction and renovation work is permitted Monday–Saturday 8 AM–6 PM. No power tools or loud construction work on Sundays or holidays. Emergency repairs are exempt.' },
      { question: 'How are noise complaints handled?', answer: 'Noise complaints should be submitted through the Violations section of the portal. Board will investigate within 48 hours. Repeated violations result in escalating fines starting at $100.' },
    ],
  },
  {
    id: 'architectural',
    icon: '🏗️',
    title: 'Architectural Changes',
    description: 'Requirements for home modifications, additions, and exterior changes.',
    rules: [
      { question: 'What changes require HOA approval?', answer: 'Any exterior modification visible from the street requires Architectural Review Committee (ARC) approval. This includes paint colors, fences, decks, room additions, solar panels, satellite dishes, and landscaping changes.' },
      { question: 'How do I submit an architectural request?', answer: 'Submit requests through the Architectural Review section of the portal. Include sketches, materials, colors, and dimensions. The ARC has 30 days to respond. Proceeding without approval may require removal at owner\'s expense.' },
      { question: 'Are there approved paint colors?', answer: 'Yes. The community maintains an approved color palette available in the Documents section. All exterior paint must be selected from this palette. Custom colors may be submitted for ARC review and approval.' },
      { question: 'Can I install solar panels?', answer: 'Solar panel installations are permitted but require ARC approval for placement to ensure aesthetics are maintained. Panels generally should not be visible from the front street when possible.' },
      { question: 'What about fences?', answer: 'Fences up to 6 feet are permitted in rear and side yards with ARC approval. Front yard fences are limited to 3.5 feet. Approved materials: wood, vinyl, aluminum. Chain-link and barbed wire are prohibited.' },
    ],
  },
  {
    id: 'landscaping',
    icon: '🌿',
    title: 'Landscaping',
    description: 'Standards for lawn maintenance, plantings, and curb appeal.',
    rules: [
      { question: 'How often must I maintain my lawn?', answer: 'Grass must be mowed when it exceeds 4 inches in height. Lawns should be maintained at 2–3 inches. Homeowners have 10 days to address a lawn maintenance notice before the HOA hires contractors at the owner\'s expense.' },
      { question: 'Are there restrictions on trees?', answer: 'Trees over 6 inches in diameter may not be removed without board approval. Diseased or hazardous trees should be reported to the board for assessment. Stump removal is required within 90 days of tree removal.' },
      { question: 'Can I have a garden?', answer: 'Front yard gardens are permitted if maintained neatly and occupying no more than 30% of the front yard. Raised beds must not exceed 18 inches in height. All gardens must be kept weed-free.' },
      { question: 'What about seasonal decorations?', answer: 'Holiday decorations may be displayed up to 30 days before and must be removed within 15 days after the holiday. Inflatable decorations are limited to one per property and may not exceed 8 feet in height.' },
    ],
  },
  {
    id: 'rentals',
    icon: '🏠',
    title: 'Rentals',
    description: 'Policies for renting your home within the community.',
    rules: [
      { question: 'Can I rent out my home?', answer: 'Long-term rentals (30+ days) are permitted. The homeowner remains responsible for all HOA dues and for ensuring tenants comply with all community rules. A tenant registration form must be filed with the board.' },
      { question: 'Are short-term rentals (Airbnb) allowed?', answer: 'Short-term rentals of less than 30 days are not permitted. This includes all vacation rental platforms. Violations may result in fines and legal action.' },
      { question: 'What must I provide to tenants?', answer: 'Before tenancy begins, owners must provide tenants with a copy of the CC&Rs, community rules, and contact information for the management company. Failure to do so does not exempt tenants from compliance.' },
      { question: 'Who is responsible for tenant violations?', answer: 'The property owner is ultimately responsible for all violations committed by tenants. Fines and notices are issued to the property owner. Owners are encouraged to include HOA rules compliance in lease agreements.' },
    ],
  },
  {
    id: 'common-areas',
    icon: '🏡',
    title: 'Common Areas',
    description: 'Use guidelines for shared spaces including pool, clubhouse, and parks.',
    rules: [
      { question: 'How do I reserve the clubhouse?', answer: 'Clubhouse reservations must be made through the Amenity Booking section at least 72 hours in advance. A refundable security deposit of $200 is required. The space must be cleaned and vacated by the reserved end time.' },
      { question: 'What are pool hours?', answer: 'The pool is open May 15 through September 30, 7 AM–10 PM daily. Children under 14 must be accompanied by an adult resident. Proper swimwear is required. No diving in the shallow end.' },
      { question: 'Can I bring guests to common areas?', answer: 'Each household may bring up to 4 non-resident guests to common areas at one time. Residents are responsible for their guests\' conduct. Guest access must be registered for events in reserved facilities.' },
      { question: 'What is prohibited in common areas?', answer: 'Prohibited: smoking (including e-cigarettes), pets (except designated areas), glass containers, amplified music without approval, commercial solicitation, and any activity that disrupts other residents\' enjoyment.' },
    ],
  },
];

export default function RulesPage() {
  const { isConnected } = useAccount();
  const [search, setSearch] = useState('');
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [openRules, setOpenRules] = useState<Set<string>>(new Set());

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 mb-4">Sign in to view community rules & FAQs</p>
        <ConnectButton label="Sign In" />
      </div>
    );
  }

  const toggleSection = (id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleRule = (key: string) => {
    setOpenRules(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const filteredSections = useMemo(() => {
    if (!search.trim()) return SECTIONS;
    const q = search.toLowerCase();
    return SECTIONS
      .map(section => ({
        ...section,
        rules: section.rules.filter(r =>
          r.question.toLowerCase().includes(q) || r.answer.toLowerCase().includes(q)
        ),
      }))
      .filter(s => s.rules.length > 0 || s.title.toLowerCase().includes(q));
  }, [search]);

  const totalResults = filteredSections.reduce((acc, s) => acc + s.rules.length, 0);

  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">📋 Community Rules & FAQ</h1>
        <p className="text-sm text-gray-400">Official Faircroft HOA guidelines, organized and searchable</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search rules... e.g. 'fence height', 'quiet hours', 'rental'"
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none"
        />
        {search && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <span className="text-[10px] text-gray-500">{totalResults} result{totalResults !== 1 ? 's' : ''}</span>
            <button onClick={() => setSearch('')} className="text-gray-500 hover:text-gray-300 text-xs">✕</button>
          </div>
        )}
      </div>

      {/* Section nav */}
      {!search && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
          {SECTIONS.map(s => (
            <a key={s.id} href={`#${s.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800/40 text-xs text-gray-400 hover:text-[#c9a96e] hover:bg-[#c9a96e]/10 whitespace-nowrap transition-all">
              {s.icon} {s.title}
            </a>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {filteredSections.map(section => (
          <div key={section.id} id={section.id} className="glass-card rounded-xl overflow-hidden">
            {/* Section header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full p-5 flex items-center justify-between text-left hover:bg-white/2 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{section.icon}</span>
                <div>
                  <h2 className="font-semibold text-base">{section.title}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{section.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-gray-500 bg-gray-800/50 px-2 py-0.5 rounded-full">
                  {section.rules.length} rule{section.rules.length !== 1 ? 's' : ''}
                </span>
                <span className={`text-gray-500 transition-transform text-sm ${openSections.has(section.id) ? 'rotate-180' : ''}`}>▾</span>
              </div>
            </button>

            {/* Rules accordion */}
            {(openSections.has(section.id) || search.trim()) && (
              <div className="border-t border-white/5 divide-y divide-white/5">
                {section.rules.map((rule, i) => {
                  const key = `${section.id}-${i}`;
                  const isOpen = openRules.has(key) || !!search.trim();
                  return (
                    <div key={key}>
                      <button
                        onClick={() => !search.trim() && toggleRule(key)}
                        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-white/2 transition-colors"
                      >
                        <span className="text-sm font-medium pr-4 leading-snug">{rule.question}</span>
                        {!search.trim() && (
                          <span className={`text-gray-500 transition-transform text-sm shrink-0 ${isOpen ? 'rotate-45' : ''}`}>+</span>
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-4">
                          <p className="text-sm text-gray-400 leading-relaxed border-l-2 border-[#c9a96e]/30 pl-4">
                            {rule.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredSections.length === 0 && (
        <div className="glass-card rounded-xl p-12 text-center">
          <p className="text-4xl mb-3">🔍</p>
          <h3 className="font-medium mb-1">No results found</h3>
          <p className="text-sm text-gray-400">Try different keywords or browse by section above</p>
        </div>
      )}

      <div className="mt-8 p-4 rounded-xl bg-[#c9a96e]/5 border border-[#c9a96e]/15">
        <p className="text-xs text-gray-400">
          <span className="text-[#c9a96e] font-medium">📜 Official Document:</span>{' '}
          These FAQs summarize the Faircroft CC&Rs and HOA Rules & Regulations. In case of discrepancy, the official recorded documents in the Documents section govern. Contact the board with any questions.
        </p>
      </div>
    </div>
  );
}
