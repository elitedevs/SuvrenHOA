'use client';

import { useState, useEffect, useCallback } from 'react';

export interface PollOption {
  id: string;
  label: string;
  votes: string[]; // wallet addresses
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  createdAt: string;
  expiresAt?: string;
  createdBy: string;
  pinned?: boolean;
  archived?: boolean;
}

const STORAGE_KEY = 'faircroft_polls_v1';

const DEFAULT_POLLS: Poll[] = [
  {
    id: 'poll-1',
    question: 'Should we add a dog park to the community green space?',
    options: [
      { id: 'yes', label: 'Yes, absolutely!', votes: [] },
      { id: 'no', label: 'No, not right now', votes: [] },
      { id: 'maybe', label: 'Yes, but study it first', votes: [] },
    ],
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    expiresAt: new Date(Date.now() + 4 * 86400000).toISOString(),
    createdBy: 'board',
    pinned: true,
  },
  {
    id: 'poll-2',
    question: 'What time should the pool close on weekends?',
    options: [
      { id: '8pm', label: '8:00 PM', votes: [] },
      { id: '9pm', label: '9:00 PM', votes: [] },
      { id: '10pm', label: '10:00 PM', votes: [] },
    ],
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    expiresAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    createdBy: 'board',
    archived: true,
  },
];

export function usePolls() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    setPolls(raw ? JSON.parse(raw) : DEFAULT_POLLS);
    setLoaded(true);
  }, []);

  const save = useCallback((next: Poll[]) => {
    setPolls(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const vote = useCallback((pollId: string, optionId: string, wallet: string) => {
    save(polls.map(p => {
      if (p.id !== pollId) return p;
      // remove any existing vote
      const opts = p.options.map(o => ({
        ...o,
        votes: o.votes.filter(v => v !== wallet),
      }));
      return {
        ...p,
        options: opts.map(o => o.id === optionId ? { ...o, votes: [...o.votes, wallet] } : o),
      };
    }));
  }, [polls, save]);

  const createPoll = useCallback((question: string, optionLabels: string[], wallet: string, daysUntilExpiry = 7) => {
    const poll: Poll = {
      id: `poll-${Date.now()}`,
      question,
      options: optionLabels.map((label, i) => ({ id: `opt-${i}`, label, votes: [] })),
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + daysUntilExpiry * 86400000).toISOString(),
      createdBy: wallet,
    };
    save([poll, ...polls]);
    return poll;
  }, [polls, save]);

  const archivePoll = useCallback((pollId: string) => {
    save(polls.map(p => p.id === pollId ? { ...p, archived: true, pinned: false } : p));
  }, [polls, save]);

  const activePolls = polls.filter(p => !p.archived && (!p.expiresAt || new Date(p.expiresAt) > new Date()));
  const archivedPolls = polls.filter(p => p.archived || (p.expiresAt && new Date(p.expiresAt) <= new Date()));

  return { polls, activePolls, archivedPolls, loaded, vote, createPoll, archivePoll };
}
