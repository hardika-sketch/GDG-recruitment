import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const USERS_FILE_PATH = path.join(__dirname, 'users.json');
const APPLICATIONS_FILE_PATH = path.join(__dirname, 'applications.json');
const AUDIT_LOGS_FILE_PATH = path.join(__dirname, 'audit_logs.json');

// Load environment variables from .env file
dotenv.config();

// ─── Local Mock DB Fallback Helpers ──────────────────────────────────────────
function loadJsonFile(filePath, fallback = []) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (err) {
    console.error(`Error reading ${path.basename(filePath)}:`, err.message);
  }
  return fallback;
}

function saveJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error writing ${path.basename(filePath)}:`, err.message);
  }
}

const loadUsersFromFile = () => loadJsonFile(USERS_FILE_PATH, []);
const saveUsersToFile = (users) => saveJsonFile(USERS_FILE_PATH, users);

const loadApplicationsFromFile = () => loadJsonFile(APPLICATIONS_FILE_PATH, []);
const saveApplicationsToFile = (apps) => saveJsonFile(APPLICATIONS_FILE_PATH, apps);

const loadAuditLogsFromFile = () => loadJsonFile(AUDIT_LOGS_FILE_PATH, []);
const saveAuditLogsToFile = (logs) => saveJsonFile(AUDIT_LOGS_FILE_PATH, logs);

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || '*'
}));
app.use(express.json());

// ─── Initialize Supabase Client ──────────────────────────────────────────────
const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY)?.trim();

const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseKey && 
  supabaseUrl.startsWith('http') && 
  !supabaseUrl.includes('your-project-id') &&
  !supabaseKey.includes('your-supabase-service-role')
);

if (!isSupabaseConfigured) {
  console.warn("⚠️ Warning: Supabase is not fully configured in .env. Running with local storage fallback active.");
} else {
  console.log("⚡ Supabase credentials detected. Connecting to:", supabaseUrl);
}

const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseKey : 'placeholder-key'
);

// ─── Audit Logger Helper ─────────────────────────────────────────────────────
async function logAudit({
  userId = null,
  userName = null,
  userEmail = null,
  userRole = null,
  role = null,
  societyId = null,
  action,
  entityType,
  entityId = null,
  details = {},
  req = null
}) {
  const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1') : null;
  const userAgent = req ? req.headers['user-agent'] : null;
  const nowTimestamp = new Date().toISOString();
  const effectiveRole = role || userRole;

  const logEntry = {
    user_id: userId,
    user_name: userName,
    role: effectiveRole,
    user_email: userEmail,
    user_role: effectiveRole,
    society_id: societyId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
    ip_address: ipAddress,
    user_agent: userAgent,
    time_access: nowTimestamp,
    created_at: nowTimestamp
  };

  // 1. Insert into Supabase audit_logs table if configured
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('audit_logs').insert([logEntry]);
      if (error) {
        console.warn("Supabase audit_logs insert failed:", error.message);
      }
    } catch (err) {
      console.warn("Supabase audit_logs exception:", err.message);
    }
  }

  // 2. Always persist to local audit log fallback
  const localLogs = loadAuditLogsFromFile();
  localLogs.unshift({
    id: 'log_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
    ...logEntry
  });
  if (localLogs.length > 500) localLogs.length = 500; // keep last 500 entries
  saveAuditLogsToFile(localLogs);
}

// ─── Health & Database Diagnostics ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    supabaseConnected: isSupabaseConfigured,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/db/status', async (req, res) => {
  const result = {
    supabaseConfigured: isSupabaseConfigured,
    supabaseUrl: isSupabaseConfigured ? supabaseUrl : null,
    tables: {
      societies: { count: 0, status: 'unknown' },
      users: { count: 0, status: 'unknown' },
      recruiters: { count: 0, status: 'unknown' },
      applications: { count: 0, status: 'unknown' },
      recruitments: { count: 0, status: 'unknown' },
      audit_logs: { count: 0, status: 'unknown' }
    }
  };

  if (isSupabaseConfigured) {
    for (const table of Object.keys(result.tables)) {
      try {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (error) {
          result.tables[table] = { count: 0, status: 'error', error: error.message };
        } else {
          result.tables[table] = { count: count || 0, status: 'ok' };
        }
      } catch (err) {
        result.tables[table] = { count: 0, status: 'exception', error: err.message };
      }
    }
  } else {
    // Fallback counts
    result.tables.users.count = loadUsersFromFile().length;
    result.tables.users.status = 'local_fallback';
    result.tables.applications.count = loadApplicationsFromFile().length;
    result.tables.applications.status = 'local_fallback';
    result.tables.audit_logs.count = loadAuditLogsFromFile().length;
    result.tables.audit_logs.status = 'local_fallback';
  }

  res.json(result);
});

// ─── GET /api/societies ──────────────────────────────────────────────────────
app.get('/api/societies', async (req, res) => {
  try {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('societies')
        .select('*')
        .order('name');
      
      if (!error && data && data.length > 0) {
        // Map database columns to camelCase expected by frontend
        const mapped = data.map(s => ({
          id: s.id,
          name: s.name,
          category: s.category,
          tagline: s.tagline,
          icon: s.icon,
          description: s.description,
          criteria: s.criteria,
          roles: s.roles || [],
          customFields: s.custom_fields || []
        }));
        return res.json(mapped);
      }
    }
    
    // Fallback to static data
    const { societies } = await import('../frontend/src/data.js').catch(() => ({ societies: [] }));
    res.json(societies);
  } catch (err) {
    console.error("Internal Server Error in GET /api/societies:", err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ─── GET /api/applications ───────────────────────────────────────────────────
app.get('/api/applications', async (req, res) => {
  try {
    const { societyId, email, status } = req.query;
    const localApps = loadApplicationsFromFile();

    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('applications').select('*').order('created_at', { ascending: false });
        if (societyId) query = query.eq('society_id', societyId);
        if (email) query = query.eq('email', email.trim().toLowerCase());
        if (status) query = query.eq('status', status);

        const { data, error } = await query;
        if (!error && data) {
          const apiApps = data.map(s => {
            let whyYou = s.why_you || '';
            let additionalFields = s.additional_info || {};

            // Backward compatibility for legacy why_you formatted strings
            if (whyYou.includes('\n\nStatement of Purpose:\n') && Object.keys(additionalFields).length === 0) {
              const parts = whyYou.split('\n\nStatement of Purpose:\n');
              const fieldsPart = parts[0];
              whyYou = parts[1];
              
              fieldsPart.split('\n').forEach(line => {
                const colonIdx = line.indexOf(':');
                if (colonIdx > -1) {
                  const key = line.slice(0, colonIdx).trim();
                  const val = line.slice(colonIdx + 1).trim();
                  additionalFields[key] = val;
                }
              });
            }

            return {
              id: s.id,
              societyId: s.society_id,
              userId: s.user_id,
              name: s.name,
              email: s.email,
              phone: s.phone,
              year: s.year,
              branch: s.branch,
              role: s.role,
              whyyou: whyYou,
              additionalFields: additionalFields,
              status: s.status || 'pending',
              reviewedBy: s.reviewed_by,
              reviewerNotes: s.reviewer_notes,
              reviewedAt: s.reviewed_at,
              submittedAt: s.created_at || new Date().toISOString()
            };
          });

          // Sync into local cache
          apiApps.forEach(apiApp => {
            const exists = localApps.some(l => l.id === apiApp.id);
            if (!exists) localApps.push(apiApp);
          });
          saveApplicationsToFile(localApps);

          return res.json(apiApps);
        }
      } catch (dbErr) {
        console.warn("Supabase fetch applications error:", dbErr.message);
      }
    }

    // Local fallback filtering
    let filtered = localApps;
    if (societyId) filtered = filtered.filter(a => a.societyId === societyId);
    if (email) filtered = filtered.filter(a => a.email?.toLowerCase() === email.toLowerCase());
    if (status) filtered = filtered.filter(a => a.status === status);

    res.json(filtered);
  } catch (err) {
    console.error("Internal Server Error in GET /api/applications:", err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ─── POST /api/applications ──────────────────────────────────────────────────
app.post('/api/applications', async (req, res) => {
  try {
    const { societyId, name, year, branch, role, whyyou, additionalFields, email, phone, userId } = req.body;
    
    // Server-side validation
    if (!societyId || !name || !year || !branch || !role || !whyyou) {
      return res.status(400).json({ error: 'All primary fields (societyId, name, year, branch, role, whyyou) are required' });
    }

    if (name.trim().length < 3) {
      return res.status(400).json({ error: 'Name must be at least 3 characters long' });
    }

    const numYear = parseInt(year, 10);
    if (isNaN(numYear) || numYear < 1 || numYear > 5) {
      return res.status(400).json({ error: 'Year must be between 1 and 5' });
    }

    if (whyyou.trim().length < 20 || whyyou.trim().length > 1000) {
      return res.status(400).json({ error: 'Statement of purpose must be between 20 and 1000 characters' });
    }

    let finalId = 'app_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
    const cleanEmail = email ? email.trim().toLowerCase() : null;
    const cleanPhone = phone ? phone.trim() : null;
    const cleanFields = additionalFields && typeof additionalFields === 'object' ? additionalFields : {};

    // 1. Persist to Supabase applications table
    if (isSupabaseConfigured) {
      try {
        const insertPayload = {
          society_id: societyId,
          user_id: userId || null,
          name: name.trim(),
          email: cleanEmail,
          phone: cleanPhone,
          year: numYear,
          branch: branch.trim(),
          role: role.trim(),
          why_you: whyyou.trim(),
          additional_info: cleanFields,
          status: 'pending'
        };

        const { data, error } = await supabase
          .from('applications')
          .insert([insertPayload])
          .select();

        if (!error && data && data.length > 0) {
          finalId = data[0].id;
          console.log(`✅ Application persisted in Supabase [ID: ${finalId}]`);
        } else if (error) {
          console.warn("Supabase application insert error:", error.message);
        }
      } catch (dbErr) {
        console.warn("Supabase application connection error:", dbErr.message);
      }
    }

    // 2. Audit Log entry
    await logAudit({
      userId: userId || null,
      userEmail: cleanEmail,
      userRole: 'student',
      societyId: societyId,
      action: 'APPLICATION_SUBMIT',
      entityType: 'application',
      entityId: finalId,
      details: {
        applicant_name: name.trim(),
        role: role.trim(),
        year: numYear,
        branch: branch.trim()
      },
      req
    });

    // 3. Local fallback persistence
    const localApps = loadApplicationsFromFile();
    const newApp = {
      id: finalId,
      societyId,
      userId: userId || null,
      name: name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      year: numYear,
      branch: branch.trim(),
      role: role.trim(),
      whyyou: whyyou.trim(),
      additionalFields: cleanFields,
      status: 'pending',
      submittedAt: new Date().toISOString()
    };
    localApps.push(newApp);
    saveApplicationsToFile(localApps);

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: newApp
    });
  } catch (err) {
    console.error("Internal Server Error in POST /api/applications:", err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ─── POST /api/applications/status ───────────────────────────────────────────
app.post('/api/applications/status', async (req, res) => {
  try {
    const { applicationId, status, reviewerId, reviewerEmail, reviewerNotes } = req.body;

    if (!applicationId || !status) {
      return res.status(400).json({ error: 'applicationId and status are required.' });
    }

    if (!['pending', 'approved', 'rejected', 'under_review'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value.' });
    }

    const localApps = loadApplicationsFromFile();
    const appIndex = localApps.findIndex(app => app.id === applicationId);

    let targetSocietyId = null;
    let targetRole = null;
    let applicantName = null;

    if (appIndex !== -1) {
      localApps[appIndex].status = status;
      localApps[appIndex].reviewedAt = new Date().toISOString();
      localApps[appIndex].reviewerNotes = reviewerNotes || null;
      targetSocietyId = localApps[appIndex].societyId;
      targetRole = localApps[appIndex].role;
      applicantName = localApps[appIndex].name;
      saveApplicationsToFile(localApps);
    }

    // 1. Update Supabase applications table
    if (isSupabaseConfigured) {
      try {
        const updatePayload = {
          status: status,
          reviewed_at: new Date().toISOString(),
          reviewer_notes: reviewerNotes || null
        };
        if (reviewerId) updatePayload.reviewed_by = reviewerId;

        const { data, error } = await supabase
          .from('applications')
          .update(updatePayload)
          .eq('id', applicationId)
          .select();

        if (!error && data && data.length > 0) {
          targetSocietyId = data[0].society_id;
          targetRole = data[0].role;
          applicantName = data[0].name;
        }

        // 2. If approved, automatically increment recruitment intake count
        if (status === 'approved' && targetSocietyId && targetRole) {
          const { data: recData } = await supabase
            .from('recruitments')
            .select('*')
            .eq('society_id', targetSocietyId)
            .eq('role', targetRole);

          if (recData && recData.length > 0) {
            const currentIntake = (recData[0].current_intake || 0) + 1;
            await supabase
              .from('recruitments')
              .update({ current_intake: currentIntake })
              .eq('id', recData[0].id);
          }
        }
      } catch (dbErr) {
        console.warn("Supabase status update error:", dbErr.message);
      }
    }

    // 3. Log Audit Action
    await logAudit({
      userId: reviewerId || null,
      userEmail: reviewerEmail || 'recruiter',
      userRole: 'recruiter',
      societyId: targetSocietyId,
      action: 'APPLICATION_STATUS_CHANGE',
      entityType: 'application',
      entityId: applicationId,
      details: {
        new_status: status,
        applicant_name: applicantName,
        role: targetRole,
        notes: reviewerNotes || null
      },
      req
    });

    res.json({
      success: true,
      message: `Application status updated to ${status}`,
      applicationId,
      status
    });

  } catch (err) {
    console.error("Internal Server Error in POST /api/applications/status:", err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ─── Helper: Password Strength Check ─────────────────────────────────────────
function checkPasswordStrength(p) {
  const password = p || "";
  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);
  return minLength && hasUpper && hasLower && hasNumber && hasSpecial;
}

// ─── POST /api/auth/signup ───────────────────────────────────────────────────
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, phone, password, role, society, designation } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: 'All fields (name, email, phone, password) are required.' });
    }

    if (name.trim().length < 3) {
      return res.status(400).json({ error: 'Name must be at least 3 characters long.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Invalid email address format.' });
    }

    const phoneRegex = /^\+?[0-9\s\-]{10,15}$/;
    if (!phoneRegex.test(phone.trim())) {
      return res.status(400).json({ error: 'Invalid phone number format.' });
    }

    if (!checkPasswordStrength(password)) {
      return res.status(400).json({ 
        error: 'Password does not meet complexity requirements (minimum 8 letters, uppercase, lowercase, special character, number).' 
      });
    }

    const localUsers = loadUsersFromFile();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const userRole = role || 'student';
    const userSociety = userRole === 'recruiter' ? society : null;

    if (userRole === 'recruiter' && !userSociety) {
      return res.status(400).json({ error: 'Recruiters must select their head society.' });
    }

    let createdUserId = 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);

    // 1. Supabase User Insertion
    if (isSupabaseConfigured) {
      try {
        // Check uniqueness in Supabase
        const { data: existingUsers } = await supabase
          .from('users')
          .select('id, email')
          .eq('email', cleanEmail);

        if (existingUsers && existingUsers.length > 0) {
          return res.status(400).json({ error: 'Email address is already registered in database.' });
        }

        const { data: insertedUser, error: userError } = await supabase
          .from('users')
          .insert([
            {
              name: name.trim(),
              email: cleanEmail,
              phone: cleanPhone,
              password: password, // In production, hash with bcrypt
              role: userRole,
              society: userSociety
            }
          ])
          .select();

        if (userError) {
          console.warn("Supabase user insert error:", userError.message);
        } else if (insertedUser && insertedUser.length > 0) {
          createdUserId = insertedUser[0].id;
          console.log(`✅ User registered in Supabase users table [ID: ${createdUserId}]`);

          // If recruiter, also create profile record in recruiters table
          if (userRole === 'recruiter') {
            const { error: recError } = await supabase
              .from('recruiters')
              .insert([
                {
                  user_id: createdUserId,
                  society_id: userSociety,
                  designation: designation || 'Lead Recruiter',
                  status: 'active'
                }
              ]);
            if (recError) {
              console.warn("Supabase recruiters table insert error:", recError.message);
            } else {
              console.log(`✅ Recruiter profile linked in Supabase recruiters table`);
            }
          }
        }
      } catch (dbErr) {
        console.warn("Supabase signup connection error:", dbErr.message);
      }
    } else {
      // Local uniqueness check
      if (localUsers.some(u => u.email.toLowerCase() === cleanEmail)) {
        return res.status(400).json({ error: 'Email address is already registered.' });
      }
    }

    // 2. Audit Log
    await logAudit({
      userId: createdUserId,
      userName: name.trim(),
      userEmail: cleanEmail,
      userRole: userRole,
      role: userRole,
      societyId: userSociety,
      action: 'USER_SIGNUP',
      entityType: 'user',
      entityId: createdUserId,
      details: { name: name.trim(), role: userRole, society: userSociety },
      req
    });

    // 3. Local fallback persistence
    const newUser = {
      id: createdUserId,
      name: name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      password: password,
      role: userRole,
      society: userSociety,
      designation: designation || 'Lead Recruiter',
      registeredAt: new Date().toISOString()
    };
    localUsers.push(newUser);
    saveUsersToFile(localUsers);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        society: newUser.society,
        designation: newUser.designation
      }
    });

  } catch (err) {
    console.error("Internal Server Error in POST /api/auth/signup:", err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ─── POST /api/auth/signin ───────────────────────────────────────────────────
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { identifier, password, role } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email/Phone and Password are required.' });
    }

    const expectedRole = role || 'student';
    const cleanIdent = identifier.trim().toLowerCase();
    let authUser = null;

    // 1. Supabase Auth Verification
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('users').select('*').eq('password', password).eq('role', expectedRole);
        if (cleanIdent.includes('@')) {
          query = query.eq('email', cleanIdent);
        } else {
          query = query.eq('phone', identifier.trim());
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          authUser = data[0];
          
          // Update last_login_at in Supabase
          await supabase
            .from('users')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', authUser.id);
        }
      } catch (dbErr) {
        console.warn("Supabase signin error:", dbErr.message);
      }
    }

    // 2. Fallback to local users
    if (!authUser) {
      const localUsers = loadUsersFromFile();
      const localMatch = localUsers.find(
        u => (u.email.toLowerCase() === cleanIdent || u.phone === identifier.trim()) 
          && u.password === password
          && (u.role || 'student') === expectedRole
      );
      if (localMatch) authUser = localMatch;
    }

    if (!authUser) {
      return res.status(401).json({ error: `Invalid ${expectedRole} credentials or password.` });
    }

    // 3. Log Audit Action
    await logAudit({
      userId: authUser.id,
      userName: authUser.name,
      userEmail: authUser.email,
      userRole: authUser.role || expectedRole,
      role: authUser.role || expectedRole,
      societyId: authUser.society || null,
      action: 'USER_SIGNIN',
      entityType: 'auth',
      entityId: authUser.id,
      details: { role: authUser.role || expectedRole },
      req
    });

    res.json({
      success: true,
      message: 'Signed in successfully',
      user: {
        id: authUser.id,
        name: authUser.name,
        email: authUser.email,
        phone: authUser.phone,
        role: authUser.role || 'student',
        society: authUser.society || null,
        designation: authUser.designation || 'Lead Recruiter'
      }
    });

  } catch (err) {
    console.error("Internal Server Error in POST /api/auth/signin:", err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ─── GET /api/audit-logs ─────────────────────────────────────────────────────
app.get('/api/audit-logs', async (req, res) => {
  try {
    const { societyId, action, limit = 50 } = req.query;

    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(parseInt(limit, 10) || 50);

        if (societyId) query = query.eq('society_id', societyId);
        if (action) query = query.eq('action', action);

        const { data, error } = await query;
        if (!error && data) {
          return res.json(data);
        }
      } catch (dbErr) {
        console.warn("Supabase audit log fetch error:", dbErr.message);
      }
    }

    // Fallback to local logs
    let localLogs = loadAuditLogsFromFile();
    if (societyId) localLogs = localLogs.filter(l => l.society_id === societyId);
    if (action) localLogs = localLogs.filter(l => l.action === action);

    res.json(localLogs.slice(0, parseInt(limit, 10) || 50));
  } catch (err) {
    console.error("Internal Server Error in GET /api/audit-logs:", err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ─── GET & PATCH /api/recruitments ───────────────────────────────────────────
app.get('/api/recruitments', async (req, res) => {
  try {
    const { societyId } = req.query;
    if (isSupabaseConfigured) {
      let query = supabase.from('recruitments').select('*').order('role');
      if (societyId) query = query.eq('society_id', societyId);

      const { data, error } = await query;
      if (!error && data) {
        return res.json(data);
      }
    }
    res.json([]);
  } catch (err) {
    console.error("Internal Server Error in GET /api/recruitments:", err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.patch('/api/recruitments', async (req, res) => {
  try {
    const { societyId, role, status, targetCount, currentIntake, editorEmail } = req.body;

    if (!societyId || !role) {
      return res.status(400).json({ error: 'societyId and role are required.' });
    }

    if (isSupabaseConfigured) {
      const updateData = {};
      if (status) updateData.status = status;
      if (typeof targetCount === 'number') updateData.target_count = targetCount;
      if (typeof currentIntake === 'number') updateData.current_intake = currentIntake;

      const { data, error } = await supabase
        .from('recruitments')
        .update(updateData)
        .eq('society_id', societyId)
        .eq('role', role)
        .select();

      if (!error && data && data.length > 0) {
        await logAudit({
          userEmail: editorEmail || 'recruiter',
          userRole: 'recruiter',
          societyId,
          action: 'RECRUITMENT_UPDATE',
          entityType: 'recruitment',
          entityId: data[0].id,
          details: { role, updates: updateData },
          req
        });

        return res.json({ success: true, data: data[0] });
      }
    }

    res.json({ success: true, message: 'Updated locally / mock mode' });
  } catch (err) {
    console.error("Internal Server Error in PATCH /api/recruitments:", err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ─── GET /api/recruiters ─────────────────────────────────────────────────────
app.get('/api/recruiters', async (req, res) => {
  try {
    const { societyId } = req.query;
    if (isSupabaseConfigured) {
      let query = supabase
        .from('recruiters')
        .select(`
          id,
          designation,
          status,
          created_at,
          user:users(id, name, email, phone),
          society:societies(id, name)
        `);

      if (societyId) query = query.eq('society_id', societyId);

      const { data, error } = await query;
      if (!error && data) {
        return res.json(data);
      }
    }
    res.json([]);
  } catch (err) {
    console.error("Internal Server Error in GET /api/recruiters:", err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ─── Start Express Server ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Societies Explorer Backend API listening on port ${PORT}`);
});
