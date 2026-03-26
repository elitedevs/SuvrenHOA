'use client';

import { useState, useEffect, useCallback } from 'react';

export type RSVPStatus = 'attending' | 'maybe' | 'decline';

export interface MeetingRSVP {
  address: string;
  status: RSVPStatus;
  name?: string;
}

export interface BoardMeeting {
  id: string;
  title: string;
  date: string;    // ISO date string
  time: string;    // HH:MM
  location: string;
  agenda: string;
  createdBy: string;
  createdAt: string;
  rsvps: MeetingRSVP[];
}

const STORAGE_KEY = 'suvren-board-meetings-v1';

function loadMeetings(): BoardMeeting[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as BoardMeeting[];
  } catch {
    return [];
  }
}

function saveMeetings(meetings: BoardMeeting[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(meetings));
}

export function useMeetings() {
  const [meetings, setMeetings] = useState<BoardMeeting[]>([]);

  useEffect(() => {
    setMeetings(loadMeetings());
  }, []);

  const createMeeting = useCallback((data: {
    title: string;
    date: string;
    time: string;
    location: string;
    agenda: string;
    createdBy: string;
  }): BoardMeeting => {
    const meeting: BoardMeeting = {
      id: `meeting-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...data,
      createdAt: new Date().toISOString(),
      rsvps: [],
    };
    const updated = [meeting, ...meetings].sort(
      (a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime()
    );
    setMeetings(updated);
    saveMeetings(updated);
    return meeting;
  }, [meetings]);

  const rsvpMeeting = useCallback((meetingId: string, address: string, status: RSVPStatus) => {
    const updated = meetings.map(m => {
      if (m.id !== meetingId) return m;
      const filteredRsvps = m.rsvps.filter(r => r.address !== address.toLowerCase());
      return { ...m, rsvps: [...filteredRsvps, { address: address.toLowerCase(), status }] };
    });
    setMeetings(updated);
    saveMeetings(updated);
  }, [meetings]);

  const deleteMeeting = useCallback((meetingId: string) => {
    const updated = meetings.filter(m => m.id !== meetingId);
    setMeetings(updated);
    saveMeetings(updated);
  }, [meetings]);

  const upcomingMeetings = meetings.filter(m => {
    const dt = new Date(m.date + 'T' + m.time);
    return dt >= new Date();
  });

  return { meetings, upcomingMeetings, createMeeting, rsvpMeeting, deleteMeeting };
}
