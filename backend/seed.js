import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { societies } from '../frontend/src/data.js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY)?.trim();

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project-id')) {
  console.error("❌ Error: Valid SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in backend/.env to seed Supabase.");
  console.error("Please add your credentials to backend/.env and re-run: npm run seed");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("==================================================");
  console.log("🌱 Societies Explorer: Supabase Seeder Starting...");
  console.log("Target Database:", supabaseUrl);
  console.log("==================================================");

  // 1. Seed Societies
  console.log("\n📦 1. Seeding Societies...");
  for (const s of societies) {
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
        roles: s.roles || [],
        custom_fields: s.customFields || []
      }, { onConflict: 'id' });
      
    if (sError) {
      console.error(`  ❌ Failed to seed society '${s.name}':`, sError.message);
    } else {
      console.log(`  ✓ Society '${s.name}' seeded.`);
    }

    // 2. Seed Recruitment Quotas
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
        console.error(`    ❌ Recruitment quota error (${s.id} - ${role}):`, rError.message);
      }
    }
  }

  // 3. Seed Demo Users
  console.log("\n👤 2. Seeding Demo Users (Student, Recruiters, Admin)...");
  const demoUsers = [
    {
      name: "Alex Johnson",
      email: "student@example.com",
      phone: "+1 555-019-2831",
      password: "Student#2026!",
      role: "student",
      society: null
    },
    {
      name: "Devon Chen",
      email: "recruiter.gdg@example.com",
      phone: "+1 555-019-8822",
      password: "Recruiter#2026!",
      role: "recruiter",
      society: "gdg-oc",
      designation: "Lead Technical Recruiter"
    },
    {
      name: "Maya Patel",
      email: "recruiter.ieee@example.com",
      phone: "+1 555-019-3399",
      password: "Recruiter#2026!",
      role: "recruiter",
      society: "ieee-sb",
      designation: "Recruitment Coordinator"
    },
    {
      name: "Marcus Aurelius",
      email: "recruiter.rotaract@example.com",
      phone: "+1 555-019-4411",
      password: "Recruiter#2026!",
      role: "recruiter",
      society: "rotaract",
      designation: "VP of Talent"
    },
    {
      name: "Campus Admin",
      email: "admin@campus.edu",
      phone: "+1 555-019-0000",
      password: "Admin#2026!",
      role: "admin",
      society: null
    }
  ];

  for (const u of demoUsers) {
    const { data: userData, error: uError } = await supabase
      .from('users')
      .upsert({
        name: u.name,
        email: u.email,
        phone: u.phone,
        password: u.password,
        role: u.role,
        society: u.society
      }, { onConflict: 'email' })
      .select();

    if (uError) {
      console.error(`  ❌ Failed to seed user '${u.email}':`, uError.message);
    } else if (userData && userData.length > 0) {
      const createdUser = userData[0];
      console.log(`  ✓ User '${u.name}' (${u.role}) seeded [ID: ${createdUser.id}].`);

      // 4. Seed Recruiter Profile if recruiter
      if (u.role === 'recruiter' && u.society) {
        const { error: recError } = await supabase
          .from('recruiters')
          .upsert({
            user_id: createdUser.id,
            society_id: u.society,
            designation: u.designation || 'Lead Recruiter',
            status: 'active'
          }, { onConflict: 'user_id,society_id' });

        if (recError) {
          console.error(`    ❌ Failed to link recruiter profile:`, recError.message);
        } else {
          console.log(`    ✓ Recruiter profile linked for '${u.name}' -> '${u.society}'`);
        }
      }
    }
  }

  // 5. Seed Demo Applications
  console.log("\n📝 3. Seeding Sample Applications...");
  const demoApplications = [
    {
      society_id: "gdg-oc",
      name: "Rohan Verma",
      email: "rohan.verma@example.com",
      phone: "+1 555-019-7711",
      year: 2,
      branch: "Computer Science",
      role: "Core Team (Technical)",
      why_you: "Passionate about full-stack web and cloud architectures. Organised multiple workshops on campus and eager to contribute to GDG open source initiatives.",
      additional_info: {
        "GitHub / Portfolio Link": "https://github.com/rohanverma",
        "Primary Programming Languages": ["JavaScript", "TypeScript", "Python"],
        "Available Hours Per Week": "10-15 hrs"
      },
      status: "pending"
    },
    {
      society_id: "gdg-oc",
      name: "Sophia Martinez",
      email: "sophia.m@example.com",
      phone: "+1 555-019-7722",
      year: 3,
      branch: "Information Technology",
      role: "UI/UX Designer",
      why_you: "Led design sprints for university hackathon. Proficient in Figma design systems, micro-interactions, and accessibility standards.",
      additional_info: {
        "Figma / Behance Portfolio": "https://behance.net/sophiam",
        "Preferred Design Tools": ["Figma", "Illustrator"]
      },
      status: "approved"
    }
  ];

  for (const app of demoApplications) {
    const { data: appData, error: appError } = await supabase
      .from('applications')
      .insert([app])
      .select();

    if (appError) {
      console.error(`  ❌ Failed to seed application for '${app.name}':`, appError.message);
    } else if (appData && appData.length > 0) {
      console.log(`  ✓ Sample application for '${app.name}' (${app.role}) seeded.`);
      
      // If approved, bump recruitment count
      if (app.status === 'approved') {
        const { data: recData } = await supabase
          .from('recruitments')
          .select('*')
          .eq('society_id', app.society_id)
          .eq('role', app.role);

        if (recData && recData.length > 0) {
          await supabase
            .from('recruitments')
            .update({ current_intake: 1 })
            .eq('id', recData[0].id);
        }
      }
    }
  }

  // 6. Seed Initial Audit Logs
  console.log("\n🛡️ 4. Seeding Initial Audit Log Trail...");
  const initialLogs = [
    {
      user_email: "system@campus.edu",
      user_role: "admin",
      society_id: null,
      action: "DATABASE_INITIALIZE",
      entity_type: "system",
      entity_id: "seed_v1",
      details: { message: "Database tables initialized and initial demo catalog seeded." }
    },
    {
      user_email: "recruiter.gdg@example.com",
      user_role: "recruiter",
      society_id: "gdg-oc",
      action: "USER_SIGNUP",
      entity_type: "user",
      entity_id: null,
      details: { role: "recruiter", society: "gdg-oc", designation: "Lead Technical Recruiter" }
    },
    {
      user_email: "rohan.verma@example.com",
      user_role: "student",
      society_id: "gdg-oc",
      action: "APPLICATION_SUBMIT",
      entity_type: "application",
      entity_id: null,
      details: { applicant_name: "Rohan Verma", role: "Core Team (Technical)" }
    }
  ];

  for (const log of initialLogs) {
    const { error: lError } = await supabase
      .from('audit_logs')
      .insert([log]);

    if (lError) {
      console.error(`  ❌ Failed to insert audit log '${log.action}':`, lError.message);
    } else {
      console.log(`  ✓ Audit log '${log.action}' recorded.`);
    }
  }

  console.log("\n==================================================");
  console.log("🎉 Database Seeding Completed Successfully!");
  console.log("==================================================");
}

seed().catch(err => {
  console.error("❌ Seeding terminated with unhandled exception:", err);
});
