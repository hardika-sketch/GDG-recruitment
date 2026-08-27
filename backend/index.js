import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

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

app.listen(PORT, () => {
  console.log(`🚀 Backend Express API listening on port ${PORT}`);
});
