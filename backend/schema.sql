-- ═══════════════════════════════════════════════════════════════════════════
-- SuvrenHOA — Off-Chain Database Schema (Supabase/Postgres)
-- 
-- On-chain: Governance, treasury, documents, property NFTs (smart contracts)
-- Off-chain: Forum, maintenance, reservations, announcements, profiles
--
-- All tables use wallet_address as the user identifier (links to on-chain identity)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Community Forum ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hoa_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    lot_number INTEGER,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    pinned BOOLEAN DEFAULT FALSE,
    likes_count INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hoa_post_replies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES hoa_posts(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    lot_number INTEGER,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hoa_post_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES hoa_posts(id) ON DELETE CASCADE,
    reply_id UUID REFERENCES hoa_post_replies(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, wallet_address),
    UNIQUE(reply_id, wallet_address)
);

-- ── Announcements ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hoa_announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_role TEXT NOT NULL DEFAULT 'Board',
    priority TEXT NOT NULL DEFAULT 'info' CHECK (priority IN ('urgent', 'important', 'info')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hoa_announcement_reads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    announcement_id UUID REFERENCES hoa_announcements(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    read_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(announcement_id, wallet_address)
);

-- ── Maintenance Requests ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hoa_maintenance_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_number TEXT UNIQUE NOT NULL, -- MR-2026-001
    wallet_address TEXT NOT NULL,
    lot_number INTEGER,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Other',
    location TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'scheduled', 'resolved', 'closed')),
    assigned_to TEXT,
    estimated_completion TEXT,
    photo_urls TEXT[], -- Array of image URLs
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hoa_maintenance_updates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID REFERENCES hoa_maintenance_requests(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    updated_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Reservations ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hoa_amenities (
    id TEXT PRIMARY KEY, -- 'pool', 'clubhouse', etc.
    name TEXT NOT NULL,
    icon TEXT,
    description TEXT,
    hours TEXT,
    capacity INTEGER DEFAULT 0,
    requires_key BOOLEAN DEFAULT FALSE,
    rules TEXT[], -- Array of rule strings
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS hoa_reservations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    amenity_id TEXT REFERENCES hoa_amenities(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    lot_number INTEGER,
    date DATE NOT NULL,
    time_slot TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── User Profiles ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hoa_profiles (
    wallet_address TEXT PRIMARY KEY,
    display_name TEXT,
    lot_number INTEGER,
    email TEXT,
    phone TEXT,
    avatar_url TEXT,
    bio TEXT,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    theme TEXT DEFAULT 'dark' CHECK (theme IN ('dark', 'light')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Board & Committee Members ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hoa_board_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    lot_number INTEGER,
    email TEXT,
    phone TEXT,
    bio TEXT,
    since TEXT,
    active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS hoa_committees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    chair TEXT NOT NULL,
    description TEXT,
    meeting_schedule TEXT,
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS hoa_committee_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    committee_id UUID REFERENCES hoa_committees(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    lot_number INTEGER
);

-- ── Notifications ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hoa_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    type TEXT NOT NULL, -- 'announcement', 'maintenance_update', 'vote_open', 'dues_reminder', 'reservation_confirmed'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT, -- URL to navigate to
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_posts_category ON hoa_posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_created ON hoa_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_wallet ON hoa_posts(wallet_address);
CREATE INDEX IF NOT EXISTS idx_replies_post ON hoa_post_replies(post_id);
CREATE INDEX IF NOT EXISTS idx_announcements_created ON hoa_announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON hoa_maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_created ON hoa_maintenance_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON hoa_reservations(date);
CREATE INDEX IF NOT EXISTS idx_reservations_amenity ON hoa_reservations(amenity_id);
CREATE INDEX IF NOT EXISTS idx_notifications_wallet ON hoa_notifications(wallet_address);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON hoa_notifications(wallet_address, read) WHERE read = FALSE;

-- ── Row Level Security ───────────────────────────────────────────────────
-- Note: For MVP, we use service role key in API routes.
-- RLS policies can be added later for direct client access.

ALTER TABLE hoa_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hoa_post_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE hoa_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE hoa_maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE hoa_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hoa_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hoa_notifications ENABLE ROW LEVEL SECURITY;

-- Allow all reads for authenticated users (community is transparent)
CREATE POLICY "Anyone can read posts" ON hoa_posts FOR SELECT USING (true);
CREATE POLICY "Anyone can read replies" ON hoa_post_replies FOR SELECT USING (true);
CREATE POLICY "Anyone can read announcements" ON hoa_announcements FOR SELECT USING (true);
CREATE POLICY "Anyone can read maintenance" ON hoa_maintenance_requests FOR SELECT USING (true);
CREATE POLICY "Anyone can read reservations" ON hoa_reservations FOR SELECT USING (true);
CREATE POLICY "Anyone can read profiles" ON hoa_profiles FOR SELECT USING (true);

-- Service role handles all writes via API routes

-- ── Surveys / Polls ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hoa_surveys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    created_by TEXT NOT NULL, -- wallet_address or 'board'
    type TEXT NOT NULL DEFAULT 'poll' CHECK (type IN ('poll', 'survey', 'rsvp')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
    allow_multiple BOOLEAN DEFAULT FALSE,
    anonymous BOOLEAN DEFAULT FALSE,
    closes_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hoa_survey_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    survey_id UUID REFERENCES hoa_surveys(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS hoa_survey_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    survey_id UUID REFERENCES hoa_surveys(id) ON DELETE CASCADE,
    option_id UUID REFERENCES hoa_survey_options(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(survey_id, wallet_address, option_id)
);

CREATE INDEX IF NOT EXISTS idx_surveys_status ON hoa_surveys(status);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey ON hoa_survey_responses(survey_id);

ALTER TABLE hoa_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE hoa_survey_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE hoa_survey_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read surveys" ON hoa_surveys FOR SELECT USING (true);
CREATE POLICY "Anyone can read survey options" ON hoa_survey_options FOR SELECT USING (true);
CREATE POLICY "Anyone can read survey responses" ON hoa_survey_responses FOR SELECT USING (true);

-- ── Violations System ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hoa_violations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    violation_number TEXT UNIQUE NOT NULL, -- VIO-2026-001
    reported_by TEXT NOT NULL, -- wallet_address (or 'anonymous')
    reported_by_lot INTEGER,
    accused_lot INTEGER NOT NULL,
    accused_wallet TEXT,
    category TEXT NOT NULL CHECK (category IN ('architectural','landscaping','noise','parking','pet','trash','maintenance','other')),
    ccr_section TEXT, -- Which CC&R section was violated
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    photo_urls TEXT[], -- Evidence photos
    location TEXT,
    anonymous_report BOOLEAN DEFAULT FALSE,
    
    -- Status lifecycle
    status TEXT NOT NULL DEFAULT 'reported' CHECK (status IN (
        'reported',      -- Initial report
        'under-review',  -- Board is reviewing
        'dismissed',     -- Board dismissed (not a violation)
        'notice-issued', -- Formal notice sent to homeowner
        'cure-period',   -- Homeowner has time to fix
        'cured',         -- Homeowner fixed it
        'disputed',      -- Homeowner disputes the violation  
        'hearing',       -- Hearing scheduled/in progress
        'ruling-upheld', -- Board upheld after hearing
        'ruling-modified', -- Board modified ruling
        'ruling-dismissed', -- Board dismissed after hearing
        'fined',         -- Fine issued
        'appealed',      -- Community appeal (governance proposal created)
        'appeal-upheld', -- Community upheld the ruling
        'appeal-overturned', -- Community overturned (violation dismissed)
        'resolved',      -- Fully resolved
        'closed'         -- Administratively closed
    )),
    
    severity TEXT DEFAULT 'minor' CHECK (severity IN ('minor','moderate','major','critical')),
    offense_number INTEGER DEFAULT 1, -- 1st, 2nd, 3rd offense
    
    -- Fine tracking
    fine_amount INTEGER DEFAULT 0, -- In cents (USDC * 100)
    fine_paid BOOLEAN DEFAULT FALSE,
    fine_proposal_id TEXT, -- On-chain governance proposal ID (for appeals)
    
    -- Dates
    cure_deadline TIMESTAMPTZ,
    hearing_date TIMESTAMPTZ,
    
    -- Board actions
    reviewed_by TEXT, -- Board member wallet
    review_notes TEXT,
    ruling_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hoa_violation_updates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    violation_id UUID REFERENCES hoa_violations(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'status_change', 'note', 'evidence_added', 'fine_issued', 'appeal_created'
    old_status TEXT,
    new_status TEXT,
    text TEXT NOT NULL,
    updated_by TEXT NOT NULL, -- wallet_address or 'system'
    photo_urls TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hoa_violation_evidence (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    violation_id UUID REFERENCES hoa_violations(id) ON DELETE CASCADE,
    submitted_by TEXT NOT NULL,
    type TEXT DEFAULT 'photo' CHECK (type IN ('photo','document','video','statement')),
    url TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_violations_status ON hoa_violations(status);
CREATE INDEX IF NOT EXISTS idx_violations_lot ON hoa_violations(accused_lot);
CREATE INDEX IF NOT EXISTS idx_violations_created ON hoa_violations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_violation_updates ON hoa_violation_updates(violation_id);

ALTER TABLE hoa_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hoa_violation_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE hoa_violation_evidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read violations" ON hoa_violations FOR SELECT USING (true);
CREATE POLICY "Anyone can read violation updates" ON hoa_violation_updates FOR SELECT USING (true);
CREATE POLICY "Anyone can read violation evidence" ON hoa_violation_evidence FOR SELECT USING (true);
