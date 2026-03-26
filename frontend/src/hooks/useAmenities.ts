'use client';

import { useState, useEffect, useCallback } from 'react';

export type TimeSlot = '07:00' | '08:00' | '09:00' | '10:00' | '11:00' | '12:00' | '13:00' | '14:00' | '15:00' | '16:00' | '17:00' | '18:00' | '19:00' | '20:00' | '21:00';

export interface AmenityBooking {
  id: string;
  amenityId: string;
  bookedBy: string;
  date: string; // YYYY-MM-DD
  slot: TimeSlot;
  purpose: string;
  createdAt: string;
  status: 'confirmed' | 'cancelled';
}

export interface Amenity {
  id: string;
  name: string;
  icon: string;
  description: string;
  capacity: number;
  rules: string[];
  slots: TimeSlot[];
}

export const AMENITIES: Amenity[] = [
  {
    id: 'pool',
    name: 'Community Pool',
    icon: '🏊',
    description: 'Olympic-style pool with lap lanes, open May–September',
    capacity: 30,
    rules: ['No running on deck', 'Shower before entering', 'Children under 12 must be supervised'],
    slots: ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'],
  },
  {
    id: 'clubhouse',
    name: 'Clubhouse',
    icon: '🏛️',
    description: 'Event hall with catering kitchen, seats up to 80',
    capacity: 80,
    rules: ['Must be cleaned after use', 'No smoking indoors', '72-hour cancellation notice required'],
    slots: ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'],
  },
  {
    id: 'tennis',
    name: 'Tennis Court',
    icon: '🎾',
    description: 'Two regulation tennis courts, lighted until 10 PM',
    capacity: 4,
    rules: ['2-hour max per booking', 'Proper tennis shoes required', 'Equipment available at front desk'],
    slots: ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'],
  },
  {
    id: 'bbq',
    name: 'BBQ Area',
    icon: '🔥',
    description: 'Covered pavilion with 4 grills and picnic tables',
    capacity: 20,
    rules: ['Clean grill after use', 'No charcoal – gas only', 'Dispose of grease properly'],
    slots: ['10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'],
  },
  {
    id: 'playground',
    name: 'Playground',
    icon: '🛝',
    description: 'Modern playground equipment for ages 2–12',
    capacity: 25,
    rules: ['Supervised children only', 'No bicycles inside playground area', 'Report damaged equipment immediately'],
    slots: ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'],
  },
  {
    id: 'fitness',
    name: 'Fitness Center',
    icon: '💪',
    description: 'Full gym with cardio machines, free weights, and yoga studio',
    capacity: 15,
    rules: ['Wipe equipment after use', 'Proper athletic attire required', 'No outside food or drinks'],
    slots: ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'],
  },
];

const LS_KEY = 'suvren_amenity_bookings';

function loadBookings(): AmenityBooking[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  } catch { return []; }
}

function saveBookings(bookings: AmenityBooking[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(bookings));
}

export function useAmenities(walletAddress?: string) {
  const [bookings, setBookings] = useState<AmenityBooking[]>([]);

  useEffect(() => {
    setBookings(loadBookings());
  }, []);

  const getAmenityBookings = useCallback((amenityId: string) => {
    return bookings.filter(b => b.amenityId === amenityId && b.status === 'confirmed');
  }, [bookings]);

  const isSlotBooked = useCallback((amenityId: string, date: string, slot: TimeSlot) => {
    return bookings.some(b =>
      b.amenityId === amenityId &&
      b.date === date &&
      b.slot === slot &&
      b.status === 'confirmed'
    );
  }, [bookings]);

  const getMyBookings = useCallback(() => {
    if (!walletAddress) return [];
    return bookings.filter(b => b.bookedBy === walletAddress && b.status === 'confirmed');
  }, [bookings, walletAddress]);

  const bookAmenity = useCallback((amenityId: string, date: string, slot: TimeSlot, purpose: string) => {
    if (!walletAddress) return false;
    if (isSlotBooked(amenityId, date, slot)) return false;

    const booking: AmenityBooking = {
      id: crypto.randomUUID(),
      amenityId,
      bookedBy: walletAddress,
      date,
      slot,
      purpose,
      createdAt: new Date().toISOString(),
      status: 'confirmed',
    };

    const updated = [...loadBookings(), booking];
    saveBookings(updated);
    setBookings(updated);
    return true;
  }, [walletAddress, isSlotBooked]);

  const cancelBooking = useCallback((bookingId: string) => {
    const updated = loadBookings().map(b =>
      b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
    );
    saveBookings(updated);
    setBookings(updated);
  }, []);

  return { bookings, getAmenityBookings, isSlotBooked, getMyBookings, bookAmenity, cancelBooking };
}
