import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { societies } from '../frontend/src/data.js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required to seed.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("🌱 Starting Database Seeding...");
  
  // 1. Seed Societies
  for (const s of societies) {
    console.log(`Seeding society: ${s.name}`);
    const { error: sError } = await supabase
      .from('societies')
      .upsert({
        id: s.id,
        name: s.name,
        category: s.category,
        tagline: s.tagline,
        icon: s.icon,
        description: s.description,
        criteria: s.criteria,
        roles: s.roles,
        custom_fields: s.customFields || []
      });
      
    if (sError) {
      console.error(`❌ Failed to seed society ${s.name}:`, sError.message);
      continue;
    }
    
    // 2. Seed Recruitment Slots (5 slots per role by default)
    for (const role of s.roles) {
      const { error: rError } = await supabase
        .from('recruitments')
        .upsert({
          society_id: s.id,
          role: role,
          status: 'open',
          target_count: 5,
          current_intake: 0
        }, { onConflict: 'society_id,role' });
        
      if (rError) {
        console.error(`❌ Failed to seed recruitment for ${s.id} - ${role}:`, rError.message);
      }
    }
  }
  
  console.log("🌱 Seeding completed successfully!");
}

seed().catch(err => {
  console.error("❌ Seeding failed with unexpected error:", err);
});
