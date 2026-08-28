-- SQL Schema for Societies Explorer database setup

-- 1. Societies Table
CREATE TABLE IF NOT EXISTS societies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    tagline TEXT,
    icon TEXT,
    description TEXT,
    criteria TEXT,
    roles TEXT[] NOT NULL,
    custom_fields JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'student',
    society TEXT REFERENCES societies(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Applications Table
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id TEXT REFERENCES societies(id),
    name TEXT NOT NULL,
    year INTEGER NOT NULL,
    branch TEXT NOT NULL,
    role TEXT NOT NULL,
    why_you TEXT NOT NULL,
    additional_info JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Recruitments Table
CREATE TABLE IF NOT EXISTS recruitments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id TEXT REFERENCES societies(id),
    role TEXT NOT NULL,
    status TEXT DEFAULT 'open', -- 'open', 'closed'
    target_count INTEGER DEFAULT 5,
    current_intake INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(society_id, role)
);

-- 5. Access Logs Table
CREATE TABLE IF NOT EXISTS access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT,
    action TEXT NOT NULL, -- 'SIGNUP', 'SIGNIN', 'APPLICATION_SUBMIT', 'STATUS_CHANGE'
    details TEXT,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
