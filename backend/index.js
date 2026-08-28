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

// File-based persistence helper for local mock DB fallback
function loadUsersFromFile() {
  try {
    if (fs.existsSync(USERS_FILE_PATH)) {
      return JSON.parse(fs.readFileSync(USERS_FILE_PATH, 'utf8'));
    }
  } catch (err) {
    console.error("Error reading users file:", err);
  }
  return [];
}

function saveUsersToFile(users) {
  try {
    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(users, null, 2), 'utf8');
  } catch (err) {
    console.error("Error writing users file:", err);
  }
}

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*'
}));
app.use(express.json());

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("⚠️ Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing from environment variables.");
}

const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /api/societies - Retrieve all societies from Supabase
app.get('/api/societies', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('societies')
      .select('*')
      .order('name');
    
    if (error) {
      console.error("Error fetching societies from Supabase:", error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json(data);
  } catch (err) {
    console.error("Internal Server Error in GET /api/societies:", err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/applications - Submit application to Supabase
app.post('/api/applications', async (req, res) => {
  try {
    const { societyId, name, year, branch, role, whyyou } = req.body;
    
    // Server-side validation checks
    if (!societyId || !name || !year || !branch || !role || !whyyou) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (name.trim().length < 3) {
      return res.status(400).json({ error: 'Name must be at least 3 characters long' });
    }

    const numYear = parseInt(year, 10);
    if (isNaN(numYear) || numYear < 1 || numYear > 4) {
      return res.status(400).json({ error: 'Year must be between 1 and 4' });
    }

    if (whyyou.trim().length < 20 || whyyou.trim().length > 500) {
      return res.status(400).json({ error: 'Explanation must be between 20 and 500 characters' });
    }

    // Insert into applications table
    const { data, error } = await supabase
      .from('applications')
      .insert([
        { 
          society_id: societyId, 
          name: name.trim(), 
          year: numYear, 
          branch: branch.trim(), 
          role: role.trim(), 
          why_you: whyyou.trim() 
        }
      ])
      .select();

    if (error) {
      console.error("Error inserting application into Supabase:", error);
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ success: true, message: 'Application submitted successfully', data: data[0] });
  } catch (err) {
    console.error("Internal Server Error in POST /api/applications:", err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Helper validation function
function checkPasswordStrength(p) {
  const password = p || "";
  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);
  return minLength && hasUpper && hasLower && hasNumber && hasSpecial;
}

// POST /api/auth/signup - User registration
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Field checks
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
    const isEmailTaken = localUsers.some(u => u.email.toLowerCase() === email.toLowerCase().trim());
    const isPhoneTaken = localUsers.some(u => u.phone === phone.trim());

    if (isEmailTaken) {
      return res.status(400).json({ error: 'Email address is already registered.' });
    }
    if (isPhoneTaken) {
      return res.status(400).json({ error: 'Phone number is already registered.' });
    }

    // Try saving to Supabase if config is provided
    let supabaseSuccess = false;
    let savedUser = null;
    
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { data, error } = await supabase
          .from('users')
          .insert([
            { 
              name: name.trim(), 
              email: email.trim().toLowerCase(), 
              phone: phone.trim(), 
              password: password 
            }
          ])
          .select();
          
        if (!error && data && data.length > 0) {
          supabaseSuccess = true;
          savedUser = data[0];
          console.log("Registered user in Supabase");
        } else if (error) {
          console.warn("Supabase insert error (falling back to users.json):", error.message);
        }
      } catch (dbErr) {
        console.warn("Supabase connection issue (falling back to users.json):", dbErr.message);
      }
    }

    // Always keep local users.json in sync as secondary store & fallback
    const newUser = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password: password,
      registeredAt: new Date().toISOString()
    };
    localUsers.push(newUser);
    saveUsersToFile(localUsers);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone
      }
    });

  } catch (err) {
    console.error("Internal Server Error in POST /api/auth/signup:", err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/auth/signin - User login with email/phone
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email/Phone and Password are required.' });
    }

    // First try local users file
    const localUsers = loadUsersFromFile();
    const matchedUser = localUsers.find(
      u => (u.email.toLowerCase() === identifier.trim().toLowerCase() || u.phone === identifier.trim()) && u.password === password
    );

    if (matchedUser) {
      return res.json({
        success: true,
        message: 'Signed in successfully',
        user: {
          name: matchedUser.name,
          email: matchedUser.email,
          phone: matchedUser.phone
        }
      });
    }

    // If local check fails, check Supabase as secondary
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        // Query by email
        let query = supabase.from('users').select('*').eq('password', password);
        
        if (identifier.includes('@')) {
          query = query.eq('email', identifier.trim().toLowerCase());
        } else {
          query = query.eq('phone', identifier.trim());
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const dbUser = data[0];
          
          // Sync to local file if not present
          const exists = localUsers.some(u => u.email.toLowerCase() === dbUser.email.toLowerCase());
          if (!exists) {
            localUsers.push({
              name: dbUser.name,
              email: dbUser.email,
              phone: dbUser.phone,
              password: dbUser.password,
              registeredAt: dbUser.created_at || new Date().toISOString()
            });
            saveUsersToFile(localUsers);
          }

          return res.json({
            success: true,
            message: 'Signed in successfully',
            user: {
              name: dbUser.name,
              email: dbUser.email,
              phone: dbUser.phone
            }
          });
        }
      } catch (dbErr) {
        console.warn("Supabase query issue:", dbErr.message);
      }
    }

    // If no match anywhere
    res.status(401).json({ error: 'Invalid email/phone number or password.' });

  } catch (err) {
    console.error("Internal Server Error in POST /api/auth/signin:", err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend Express API listening on port ${PORT}`);
});
