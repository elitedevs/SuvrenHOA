'use client';

import { useState } from 'react';

interface Contact {
  id: string;
  category: string;
  name: string;
  phone: string;
  note?: string;
  address?: string;
  icon: string;
  urgent?: boolean;
}

const CONTACTS: Contact[] = [
  // HOA Board
  { id: 'board-president', category: 'HOA Board', name: 'Board President', phone: '(555) 201-0001', note: 'Contact for HOA matters and urgent property issues', icon: '🏛️', urgent: false },
  { id: 'board-treasurer', category: 'HOA Board', name: 'Board Treasurer', phone: '(555) 201-0002', note: 'Contact for financial and dues questions', icon: '💼', urgent: false },
  { id: 'board-secretary', category: 'HOA Board', name: 'Board Secretary', phone: '(555) 201-0003', note: 'Contact for meeting minutes and records', icon: '📋', urgent: false },
  // Emergency Services
  { id: 'police', category: 'Emergency Services', name: 'Police Non-Emergency', phone: '(555) 911-0001', note: 'For non-life-threatening issues', icon: '👮', urgent: false },
  { id: 'fire', category: 'Emergency Services', name: 'Fire Department', phone: '911', note: 'For emergencies — always call 911 first', icon: '🚒', urgent: true },
  { id: 'animal', category: 'Emergency Services', name: 'Animal Control', phone: '(555) 555-2873', note: 'Stray or dangerous animals', icon: '🐾', urgent: false },
  // Utilities
  { id: 'electric', category: 'Utilities', name: 'Electric Company', phone: '(800) 555-3874', note: 'Power outages & emergencies', icon: '⚡', urgent: false },
  { id: 'water', category: 'Utilities', name: 'Water District', phone: '(800) 555-9283', note: 'Water main breaks & outages', icon: '💧', urgent: false },
  { id: 'gas', category: 'Utilities', name: 'Gas Company', phone: '(800) 555-4762', note: '24/7 gas leak emergencies', icon: '🔥', urgent: true },
  { id: 'internet', category: 'Utilities', name: 'Internet / Cable', phone: '(800) 555-6372', note: 'Outages & technical support', icon: '📡', urgent: false },
  // Health & Safety
  { id: 'poison', category: 'Health & Safety', name: 'Poison Control', phone: '(800) 222-1222', note: 'National 24/7 hotline', icon: '☠️', urgent: true },
  { id: 'hospital', category: 'Health & Safety', name: 'Nearest Hospital', phone: '(555) 333-7890', note: 'Faircroft Regional Medical', icon: '🏥', urgent: true },
];

const CATEGORY_ORDER = ['HOA Board', 'Emergency Services', 'Utilities', 'Health & Safety'];

export default function EmergencyPage() {
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const copyPhone = (id: string, phone: string) => {
    navigator.clipboard.writeText(phone).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const filtered = CONTACTS.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const byCategory = CATEGORY_ORDER.map(cat => ({
    category: cat,
    contacts: filtered.filter(c => c.category === cat),
  })).filter(g => g.contacts.length > 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 page-enter">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-1">Community</p>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          🚨 Emergency Contacts
        </h1>
        <p className="text-base text-gray-400 mt-2">Important contacts for the Faircroft community</p>
      </div>

      {/* 911 Banner */}
      <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4 mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-xl shrink-0">🆘</div>
        <div>
          <p className="text-sm font-bold text-red-400">Life-threatening emergency? Call 911 immediately.</p>
          <p className="text-[11px] text-gray-400">All other contacts on this page are for non-emergency situations.</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search contacts..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 text-sm placeholder-gray-500 focus:border-[#c9a96e]/50 focus:outline-none"
        />
      </div>

      {byCategory.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No contacts matching "{search}"</div>
      ) : (
        <div className="space-y-6">
          {byCategory.map(group => (
            <div key={group.category}>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="h-px flex-1 bg-gray-800" />
                {group.category}
                <span className="h-px flex-1 bg-gray-800" />
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {group.contacts.map(contact => (
                  <div
                    key={contact.id}
                    className={`glass-card rounded-2xl hover-lift p-4 border transition-all ${
                      contact.urgent
                        ? 'border-red-500/20 bg-red-500/5'
                        : 'border-[#c9a96e]/10'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                        contact.urgent ? 'bg-red-500/15' : 'bg-[#c9a96e]/10'
                      }`}>
                        {contact.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-100 truncate">{contact.name}</p>
                        {contact.note && (
                          <p className="text-[10px] text-gray-500 truncate">{contact.note}</p>
                        )}
                        <button
                          onClick={() => copyPhone(contact.id, contact.phone)}
                          className={`mt-2 flex items-center gap-1.5 text-sm font-bold transition-all group ${
                            contact.urgent ? 'text-red-400 hover:text-red-300' : 'text-[#c9a96e] hover:text-[#e8d5a3]'
                          }`}
                        >
                          <span>{contact.phone}</span>
                          <span className="text-[10px] opacity-60 group-hover:opacity-100">
                            {copied === contact.id ? '✅ Copied!' : '📋'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] text-gray-600 text-center mt-8">
        Contact information is maintained by the HOA Board. Report inaccuracies to the board.
      </p>
    </div>
  );
}
