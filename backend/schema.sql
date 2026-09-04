-- ==============================================================================
-- SOCIETIES EXPLORER - SUPABASE POSTGRESQL SCHEMA
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. Societies Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS societies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    tagline TEXT,
    icon TEXT,
    description TEXT,
    criteria TEXT,
    roles TEXT[] NOT NULL DEFAULT '{}',
    custom_fields JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. Users Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'recruiter', 'admin')),
    society TEXT REFERENCES societies(id) ON DELETE SET NULL,
    avatar_url TEXT,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. Recruiters Table (Detailed recruiter profiles & permissions)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recruiters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    society_id TEXT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    designation TEXT DEFAULT 'Lead Recruiter',
    permissions JSONB DEFAULT '{"can_approve": true, "can_reject": true, "can_edit_roles": true}'::jsonb,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, society_id)
);

-- ------------------------------------------------------------------------------
-- 4. Applications Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id TEXT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    year INTEGER NOT NULL CHECK (year BETWEEN 1 AND 5),
    branch TEXT NOT NULL,
    role TEXT NOT NULL,
    why_you TEXT NOT NULL,
    additional_info JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'under_review')),
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewer_notes TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. Recruitments Table (Role intake quotas & recruitment state)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recruitments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id TEXT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'paused')),
    target_count INTEGER NOT NULL DEFAULT 5 CHECK (target_count >= 0),
    current_intake INTEGER NOT NULL DEFAULT 0 CHECK (current_intake >= 0),
    deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(society_id, role)
);

-- ------------------------------------------------------------------------------
-- 6. Audit Logs Table (Full activity logging for security, analytics & review)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_email TEXT,
    user_role TEXT,
    society_id TEXT REFERENCES societies(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- e.g. 'USER_SIGNUP', 'USER_SIGNIN', 'APPLICATION_SUBMIT', 'APPLICATION_STATUS_CHANGE', 'RECRUITMENT_UPDATE', 'SOCIETY_SEED'
    entity_type TEXT NOT NULL, -- 'user', 'application', 'recruiter', 'recruitment', 'society', 'auth'
    entity_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Backward compatibility view for access_logs
CREATE OR REPLACE VIEW access_logs AS
SELECT 
    id,
    user_email,
    action,
    details::text AS details,
    ip_address,
    created_at
FROM audit_logs;

-- ------------------------------------------------------------------------------
-- 7. Performance Indexes
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_society ON users(society);

CREATE INDEX IF NOT EXISTS idx_recruiters_society ON recruiters(society_id);
CREATE INDEX IF NOT EXISTS idx_recruiters_user ON recruiters(user_id);

CREATE INDEX IF NOT EXISTS idx_applications_society ON applications(society_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_email ON applications(email);
CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(user_id);

CREATE INDEX IF NOT EXISTS idx_recruitments_society ON recruitments(society_id);
CREATE INDEX IF NOT EXISTS idx_recruitments_status ON recruitments(status);

CREATE INDEX IF NOT EXISTS idx_audit_logs_society ON audit_logs(society_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ------------------------------------------------------------------------------
-- 8. Auto-update `updated_at` Trigger
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_societies_updated_at') THEN
        CREATE TRIGGER trg_societies_updated_at BEFORE UPDATE ON societies FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_users_updated_at') THEN
        CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_recruiters_updated_at') THEN
        CREATE TRIGGER trg_recruiters_updated_at BEFORE UPDATE ON recruiters FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_applications_updated_at') THEN
        CREATE TRIGGER trg_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_recruitments_updated_at') THEN
        CREATE TRIGGER trg_recruitments_updated_at BEFORE UPDATE ON recruitments FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
    END IF;
END $$;
