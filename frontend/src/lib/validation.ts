import { z } from 'zod';

// ─── Shared primitives ───
const walletAddress = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address');
const posInt = z.number().int().positive();
const optPosInt = z.number().int().positive().optional();
const isoDate = z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/));

// M-10: per-field length limits rather than a single generic 5000-char cap.
// Tighter limits reduce memory pressure, prevent log bloat, and reflect realistic
// content sizes — a title is never legitimately 5000 characters.
const titleStr    = z.string().min(1).max(200);    // titles, names, short labels
const bodyStr     = z.string().min(1).max(2000);   // posts, maintenance descriptions
const longBodyStr = z.string().min(1).max(5000);   // announcements, CC&R text, violations

// Backward-compatible aliases used throughout this file
const nonEmptyStr  = bodyStr;
const shortStr     = titleStr;
const optStr       = longBodyStr.optional();
const optShortStr  = titleStr.optional();

// ─── Announcements ───
export const announcementCreateSchema = z.object({
  title: titleStr,
  content: longBodyStr,   // announcements may be up to 5000 chars
  author_name: titleStr,
  author_role: optShortStr,
  priority: z.enum(['info', 'warning', 'urgent']).optional(),
});

// ─── Architectural ───
export const architecturalCreateSchema = z.object({
  lot_number: posInt,
  title: shortStr,
  description: nonEmptyStr,
  modification_type: shortStr,
  estimated_cost: optPosInt,
  contractor_name: optShortStr,
  start_date: isoDate.optional(),
  completion_date: isoDate.optional(),
});

export const architecturalPatchSchema = z.object({
  id: z.string().uuid(),
  status: shortStr,
  reviewer_notes: optStr,
  conditions: optStr,
});

// ─── Events ───
export const eventCreateSchema = z.object({
  title: shortStr,
  description: optStr,
  location: optShortStr,
  event_type: z.enum(['community', 'board', 'social', 'maintenance']).optional(),
  start_time: isoDate,
  end_time: isoDate.optional(),
  all_day: z.boolean().optional(),
  max_attendees: optPosInt,
  rsvp_required: z.boolean().optional(),
});

export const eventRsvpSchema = z.object({
  event_id: z.string().uuid(),
  status: z.enum(['going', 'maybe', 'not_going']).optional(),
});

// ─── Maintenance ───
export const maintenanceCreateSchema = z.object({
  lot_number: optPosInt,
  title: shortStr,
  description: nonEmptyStr,
  category: optShortStr,
  location: shortStr,
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

// ─── Notifications ───
export const notificationPatchSchema = z.object({
  id: z.string().uuid(),
});

export const notificationCreateSchema = z.object({
  wallet_address: walletAddress,
  type: z.enum(['info', 'warning', 'success', 'error']).optional(),
  title: shortStr,
  message: optStr,
  link: optShortStr,
});

// ─── Pets ───
export const petCreateSchema = z.object({
  lot_number: optPosInt,
  name: shortStr,
  species: shortStr,
  breed: optShortStr,
  color: optShortStr,
  weight: z.number().positive().optional(),
  age: optPosInt,
  vaccinated: z.boolean().optional(),
  microchipped: z.boolean().optional(),
  notes: optStr,
});

// ─── Posts ───
export const postCreateSchema = z.object({
  lot_number: optPosInt,
  title: shortStr,
  content: nonEmptyStr,
  category: optShortStr,
});

// ─── Profile ───
export const profileUpdateSchema = z.object({
  display_name: optShortStr,
  lot_number: optPosInt,
  email: z.string().email().optional(),
  phone: optShortStr,
  bio: optStr,
  theme: optShortStr,
});

export const linkWalletSchema = z.object({
  wallet_address: walletAddress.optional(),
});

// ─── Reservations ───
export const reservationCreateSchema = z.object({
  amenity_id: z.string().min(1),
  lot_number: optPosInt,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time_slot: shortStr,
  notes: optStr,
});

// ─── Surveys ───
export const surveyCreateSchema = z.object({
  title: shortStr,
  description: optStr,
  anonymous: z.boolean().optional(),
  closes_in_days: z.number().int().min(1).max(90).optional(),
  options: z.array(z.string().min(1).max(500)).min(2).max(20),
});

export const surveyVoteSchema = z.object({
  survey_id: z.string().uuid(),
  option_id: z.string().uuid(),
});

// ─── Vehicles ───
export const vehicleCreateSchema = z.object({
  lot_number: optPosInt,
  make: shortStr,
  model: shortStr,
  year: z.number().int().min(1900).max(2100).optional(),
  color: shortStr,
  license_plate: z.string().min(1).max(20),
  state: z.string().length(2).optional(),
  vehicle_type: z.enum(['car', 'truck', 'suv', 'motorcycle', 'other']).optional(),
  is_guest: z.boolean().optional(),
  guest_name: optShortStr,
  valid_until: isoDate.optional(),
});

// ─── Violations ───
export const violationCreateSchema = z.object({
  reported_by_lot: optPosInt,
  accused_lot: posInt,
  category: shortStr,
  title: z.string().min(5, 'Title must be at least 5 characters').max(500),
  description: z.string().min(20, 'Description must be at least 20 characters').max(5000),
  location: optShortStr,
  ccr_section: optShortStr,
  anonymous_report: z.boolean().optional(),
});

export const violationPatchSchema = z.object({
  id: z.string().uuid(),
  status: shortStr,
  notes: optStr,
  fine_amount: z.number().int().min(0).optional(),
  cure_days: z.number().int().min(1).max(365).optional(),
  hearing_date: isoDate.optional(),
});

// ─── Auth ───
export const authVerifySchema = z.object({
  message: nonEmptyStr,
  signature: nonEmptyStr,
});
