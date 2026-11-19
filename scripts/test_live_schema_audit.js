const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(process.cwd(), '.env.local');
const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
const env = {};
lines.forEach(l => {
  const trimmed = l.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const eq = trimmed.indexOf('=');
    if (eq !== -1) {
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
});

const urlRaw = env['NEXT_PUBLIC_SUPABASE_URL'] || '';
const cleanUrl = urlRaw.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const anonKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const serviceKey = env['SUPABASE_SERVICE_ROLE_KEY'];

const expectedTables = [
  'courses',
  'batches',
  'staff',
  'leads',
  'enquiries',
  'follow_ups',
  'students',
  'admissions',
  'payments',
  'installments',
  'attendance_sessions',
  'attendance_records',
  'counselling_sessions',
  'placement_companies',
  'placement_jobs',
  'placement_profiles',
  'placement_applications',
  'placement_offers',
  'notifications',
  'notification_settings',
  'audit_logs',
  'system_settings'
];

async function probeLiveSchema() {
  console.log('='.repeat(70));
  console.log(' LIVE SUPABASE SCHEMA & RLS PROBE (READ-ONLY AUDIT)');
  console.log('='.repeat(70));

  const clientService = createClient(cleanUrl, serviceKey);
  const clientAnon = createClient(cleanUrl, anonKey);

  console.log('\n--- 1. Probing All 22 Tables with Service-Role Client ---');
  let servicePassed = 0;
  for (const table of expectedTables) {
    try {
      const { data, error, count } = await clientService.from(table).select('*', { count: 'exact', head: true });
      if (error) {
        console.log(`✕ Table [${table.padEnd(25)}]: Error: ${error.message} (${error.code})`);
      } else {
        console.log(`✓ Table [${table.padEnd(25)}]: Accessible (Existing records: ${count !== null ? count : 0})`);
        servicePassed++;
      }
    } catch (e) {
      console.log(`✕ Table [${table.padEnd(25)}]: Exception: ${e.message}`);
    }
  }

  console.log('\n--- 2. Probing All 22 Tables with Anon (Public/Client) Client ---');
  let anonPassed = 0;
  for (const table of expectedTables) {
    try {
      const { error } = await clientAnon.from(table).select('*', { head: true });
      if (error) {
        console.log(`✕ Table [${table.padEnd(25)}]: Anon Error: ${error.message} (${error.code})`);
      } else {
        console.log(`✓ Table [${table.padEnd(25)}]: Anon Permitted by RLS policy`);
        anonPassed++;
      }
    } catch (e) {
      console.log(`✕ Table [${table.padEnd(25)}]: Anon Exception: ${e.message}`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log(`Summary:`);
  console.log(`Service-Role Access: ${servicePassed} / ${expectedTables.length} tables verified.`);
  console.log(`Anon Key RLS Access: ${anonPassed} / ${expectedTables.length} tables verified.`);
  console.log('='.repeat(70));
}

probeLiveSchema();
