/**
 * NEXT GEN DMA VENTURES CRM - POST-MIGRATION RECORD COUNT VERIFIER
 * 
 * Verifies that all 170 institutional records across all 22 Supabase tables
 * match the exact count of records in the local JSON data stores.
 * 
 * Usage:
 *   node scripts/verify_imported_counts.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const DATA_DIR = path.join(__dirname, '..', 'data');
const envPath = path.join(__dirname, '..', '.env.local');

function loadEnv() {
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    lines.forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

loadEnv();

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function readJsonFile(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

async function verifyCounts() {
  console.log('='.repeat(75));
  console.log(' NEXT GEN DMA VENTURES CRM - POST-MIGRATION COUNT VERIFIER');
  console.log('='.repeat(75));

  const client = createClient(supabaseUrl, supabaseKey);

  // Read expected counts from JSON stores
  const staff = readJsonFile('staff.json') || [];
  const courses = readJsonFile('courses.json') || [];
  const batches = readJsonFile('batches.json') || [];
  const leads = readJsonFile('leads.json') || [];
  const enquiries = readJsonFile('enquiries.json') || [];
  const followUps = readJsonFile('follow-ups.json') || [];
  const students = readJsonFile('students.json') || [];
  const admissions = readJsonFile('admissions.json') || [];
  const payments = readJsonFile('payments.json') || [];
  const installments = readJsonFile('installments.json') || [];
  const attendance = readJsonFile('attendance.json') || { sessions: [], records: [] };
  const counselling = readJsonFile('counselling.json') || [];
  const placements = readJsonFile('placements.json') || {};
  const notifications = readJsonFile('notifications.json') || [];
  const auditLogs = readJsonFile('audit-logs.json') || [];

  const expectedMatrix = [
    { table: 'staff', expected: staff.length },
    { table: 'courses', expected: courses.length },
    { table: 'system_settings', expected: 1 },
    { table: 'notification_settings', expected: 1 },
    { table: 'batches', expected: batches.length },
    { table: 'leads', expected: leads.length },
    { table: 'enquiries', expected: enquiries.length },
    { table: 'follow_ups', expected: followUps.length },
    { table: 'students', expected: students.length },
    { table: 'admissions', expected: admissions.length },
    { table: 'payments', expected: payments.length },
    { table: 'installments', expected: installments.length },
    { table: 'attendance_sessions', expected: (attendance.sessions || []).length },
    { table: 'attendance_records', expected: (attendance.records || []).length },
    { table: 'counselling_sessions', expected: counselling.length },
    { table: 'placement_companies', expected: (placements.companies || []).length },
    { table: 'placement_jobs', expected: (placements.jobs || []).length },
    { table: 'placement_profiles', expected: (placements.profiles || []).length },
    { table: 'placement_applications', expected: (placements.applications || []).length },
    { table: 'placement_offers', expected: (placements.offers || []).length },
    { table: 'notifications', expected: notifications.length },
    { table: 'audit_logs', expected: auditLogs.length },
  ];

  console.log('Verifying table record counts against local JSON sources:');
  console.log('-'.repeat(75));
  console.log(`| ${'Table Name'.padEnd(25)} | ${'Expected'.padStart(8)} | ${'In Supabase'.padStart(11)} | Status   |`);
  console.log('-'.repeat(75));

  let totalExpected = 0;
  let totalInSupabase = 0;
  let allMatched = true;

  for (const item of expectedMatrix) {
    totalExpected += item.expected;
    try {
      const { count, error } = await client.from(item.table).select('*', { count: 'exact', head: true });
      if (error) {
        console.log(`| ${item.table.padEnd(25)} | ${item.expected.toString().padStart(8)} | ERROR       | ERROR    |`);
        allMatched = false;
        continue;
      }
      const current = count !== null ? count : 0;
      totalInSupabase += current;
      const matched = current === item.expected;
      if (!matched) allMatched = false;
      const statusStr = matched ? 'PASS' : current === 0 ? 'EMPTY' : 'MISMATCH';
      console.log(`| ${item.table.padEnd(25)} | ${item.expected.toString().padStart(8)} | ${current.toString().padStart(11)} | ${statusStr.padEnd(8)} |`);
    } catch (e) {
      console.log(`| ${item.table.padEnd(25)} | ${item.expected.toString().padStart(8)} | ERROR       | ERROR    |`);
      allMatched = false;
    }
  }

  console.log('-'.repeat(75));
  console.log(`Totals: Expected: ${totalExpected} | Found: ${totalInSupabase}`);
  console.log(`Verification Result: ${allMatched ? '100% MATCHED (ALL PASS)' : 'PENDING MIGRATION OR DISCREPANCY'}`);
  console.log('='.repeat(75));
}

verifyCounts().catch(err => {
  console.error('[FATAL] Verification runner failed:', err.message);
  process.exit(1);
});
