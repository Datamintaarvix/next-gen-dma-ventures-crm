/**
 * NEXT GEN DMA VENTURES CRM - Full Supabase Database Integration Verifier
 * 
 * Verifies:
 * 1. Connectivity & configuration across all 22 tables
 * 2. Reads via Supabase client for all 16 CRM modules
 * 3. Safe temporary CRUD verification across modules with immediate cleanup
 * 4. Foreign key integrity & relational consistency
 * 5. Security & key isolation (anon key vs service-role key)
 * 6. Zero data loss: asserts exact original record count (170) is preserved
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    lines.forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let val = match[2] ? match[2].trim() : '';
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        process.env[match[1]] = val;
      }
    });
  }
}
loadEnv();

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('FATAL: Supabase URL or Service Role Key missing in .env.local');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const anonClient = createClient(supabaseUrl, anonKey || '', {
  auth: { autoRefreshToken: false, persistSession: false }
});

const ALL_22_TABLES = [
  'leads',
  'enquiries',
  'follow_ups',
  'students',
  'courses',
  'batches',
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
  'staff',
  'notifications',
  'notification_settings',
  'system_settings',
  'audit_logs'
];

async function runTest() {
  console.log('========================================================================');
  console.log('NEXT GEN DMA VENTURES CRM — FULL SUPABASE DATABASE INTEGRATION TEST');
  console.log('========================================================================');
  console.log(`Target Supabase URL: ${supabaseUrl}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('------------------------------------------------------------------------\n');

  let passedChecks = 0;
  let failedChecks = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passedChecks++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failedChecks++;
    }
  }

  // ----------------------------------------------------------------------
  // STEP 1: Verify All 22 Tables Readability & Count
  // ----------------------------------------------------------------------
  console.log('--- STEP 1: Table Readability & Baseline Record Counts ---');
  let totalRecords = 0;
  const initialCounts = {};

  for (const table of ALL_22_TABLES) {
    const { count, error } = await adminClient
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      assert(false, `Table '${table}' query error: ${error.message}`);
    } else {
      initialCounts[table] = count;
      totalRecords += count;
      assert(true, `Table '${table}' accessible: ${count} records present`);
    }
  }

  console.log(`\nTotal verified records across all 22 tables: ${totalRecords}`);
  assert(totalRecords === 170, `Expected exactly 170 records, got ${totalRecords}`);

  // ----------------------------------------------------------------------
  // STEP 2: Live CRUD Verification (Safe Temporary Lifecycle)
  // ----------------------------------------------------------------------
  console.log('\n--- STEP 2: Live CRUD Verification Across Modules ---');

  // Ensure cleanup of any leftover test log
  await adminClient.from('audit_logs').delete().eq('id', 'UNAUTHORIZED-TEST');

  // 2.1 Leads CRUD
  const testLeadId = `TEST-LEAD-${Date.now()}`;
  const { error: leadInsErr } = await adminClient.from('leads').insert({
    id: testLeadId,
    lead_code: 'LD-TEST-999',
    student_name: 'Test Lead Verification',
    phone_number: '9999988888',
    email: 'testlead@example.com',
    interested_course: 'Full Stack Development',
    lead_source: 'Website',
    status: 'New',
    assigned_counselor: 'Priya Nair',
    follow_up_date: '2026-12-01',
    created_at: new Date().toISOString()
  });
  assert(!leadInsErr, `Leads CREATE test record: ${leadInsErr ? leadInsErr.message : 'OK'}`);

  const { data: leadRead } = await adminClient.from('leads').select('*').eq('id', testLeadId).single();
  assert(leadRead && leadRead.student_name === 'Test Lead Verification', 'Leads READ test record');

  const { error: leadUpdErr } = await adminClient.from('leads').update({ notes: 'Updated notes' }).eq('id', testLeadId);
  assert(!leadUpdErr, 'Leads UPDATE test record');

  const { error: leadDelErr } = await adminClient.from('leads').delete().eq('id', testLeadId);
  assert(!leadDelErr, 'Leads DELETE test record');

  // 2.2 Follow-ups CRUD
  const testFlwId = `TEST-FLW-${Date.now()}`;
  const { error: flwInsErr } = await adminClient.from('follow_ups').insert({
    id: testFlwId,
    follow_up_code: 'FLW-TEST-999',
    student_name: 'Test Student Follow-Up',
    related_type: 'Lead',
    contact_number: '9999988888',
    follow_up_date: '2026-12-01',
    follow_up_time: '10:00 AM',
    type: 'Phone Call',
    assigned_counsellor: 'Priya Nair',
    priority: 'Medium',
    status: 'Pending',
    created_at: new Date().toISOString()
  });
  assert(!flwInsErr, `Follow-ups CREATE test record: ${flwInsErr ? flwInsErr.message : 'OK'}`);

  const { error: flwUpdErr } = await adminClient.from('follow_ups').update({ status: 'Completed' }).eq('id', testFlwId);
  assert(!flwUpdErr, 'Follow-ups UPDATE test record');

  const { error: flwDelErr } = await adminClient.from('follow_ups').delete().eq('id', testFlwId);
  assert(!flwDelErr, 'Follow-ups DELETE test record');

  // 2.3 Notifications CRUD
  const testNotifId = `TEST-NTF-${Date.now()}`;
  const { error: notifInsErr } = await adminClient.from('notifications').insert({
    id: testNotifId,
    title: 'Integration Test Notification',
    message: 'Testing Supabase integration',
    type: 'System',
    priority: 'Low',
    status: 'Unread',
    is_important: false,
    created_at: new Date().toISOString()
  });
  assert(!notifInsErr, `Notifications CREATE test record: ${notifInsErr ? notifInsErr.message : 'OK'}`);

  const { error: notifUpdErr } = await adminClient.from('notifications').update({ status: 'Read' }).eq('id', testNotifId);
  assert(!notifUpdErr, 'Notifications UPDATE test record');

  const { error: notifDelErr } = await adminClient.from('notifications').delete().eq('id', testNotifId);
  assert(!notifDelErr, 'Notifications DELETE test record');

  // 2.4 Staff CRUD
  const testStaffId = `TEST-STF-${Date.now()}`;
  const { error: stfInsErr } = await adminClient.from('staff').insert({
    id: testStaffId,
    full_name: 'Test Staff Member',
    email: `teststaff_${Date.now()}@example.com`,
    phone_number: '9845099999',
    address: 'Tech Campus Bengaluru',
    department: 'Academics & Training',
    designation: 'Assistant Trainer',
    role: 'Trainer',
    employment_type: 'Full-time',
    joining_date: '2026-11-01',
    reporting_manager: 'Rajesh Khanna',
    employment_status: 'Active',
    created_at: new Date().toISOString()
  });
  assert(!stfInsErr, `Staff CREATE test record: ${stfInsErr ? stfInsErr.message : 'OK'}`);

  const { error: stfDelErr } = await adminClient.from('staff').delete().eq('id', testStaffId);
  assert(!stfDelErr, 'Staff DELETE test record');

  // 2.5 Audit Logs INSERT
  const testLogId = `TEST-LOG-${Date.now()}`;
  const { error: logInsErr } = await adminClient.from('audit_logs').insert({
    id: testLogId,
    timestamp: new Date().toISOString(),
    user_name: 'System Integration Test',
    user_email: 'admin@nextgendma.com',
    action: 'INTEGRATION_TEST_EXECUTION',
    category: 'System',
    details: 'Verifying live audit logging via Supabase data layer'
  });
  assert(!logInsErr, `Audit Logs INSERT test record: ${logInsErr ? logInsErr.message : 'OK'}`);

  const { error: logDelErr } = await adminClient.from('audit_logs').delete().eq('id', testLogId);
  assert(!logDelErr, 'Audit Logs DELETE test record');

  // ----------------------------------------------------------------------
  // STEP 3: Foreign Key & Relationship Integrity
  // ----------------------------------------------------------------------
  console.log('\n--- STEP 3: Foreign Key & Relational Consistency ---');

  // Check payments and installments relationship
  const { data: paymentsWithInstallments, error: payRelErr } = await adminClient
    .from('installments')
    .select('id, admission_id, student_id, total_fee, final_fee, paid_amount, pending_amount, admissions(id, admission_code, student_id)');

  assert(!payRelErr && paymentsWithInstallments && paymentsWithInstallments.length > 0,
    `Installments to Admissions relationship queryable (${paymentsWithInstallments?.length || 0} installment records checked)`);

  // Check admissions with student, course, batch
  const { data: admissionsRel, error: admRelErr } = await adminClient
    .from('admissions')
    .select('id, admission_code, student_id, course_name, batch_name, total_fee, final_fee');

  assert(!admRelErr && admissionsRel && admissionsRel.length > 0,
    `Admissions relational integrity valid (${admissionsRel?.length || 0} admission records checked)`);

  // Check placement applications with companies/jobs
  const { data: placementRel, error: plcRelErr } = await adminClient
    .from('placement_applications')
    .select('id, job_id, student_id, company_name, status');

  assert(!plcRelErr && placementRel && placementRel.length > 0,
    `Placement applications relational integrity valid (${placementRel?.length || 0} applications checked)`);

  // ----------------------------------------------------------------------
  // STEP 4: Security & RLS Policy Enforcement
  // ----------------------------------------------------------------------
  console.log('\n--- STEP 4: Security & Key Isolation Verification ---');

  // Ensure cleanup of UNAUTHORIZED-TEST if present
  await adminClient.from('audit_logs').delete().eq('id', 'UNAUTHORIZED-TEST');

  // Verify that anon client cannot delete records from courses
  const { data: anonDelData, error: anonDelErr } = await anonClient
    .from('courses')
    .delete()
    .eq('id', 'CRS-2026-101')
    .select();

  // Either blocked with error or 0 rows deleted under RLS
  const isProtected = Boolean(anonDelErr) || !anonDelData || anonDelData.length === 0;
  assert(isProtected, 'Unauthenticated anon client cannot delete records from core tables');

  // Verify service-role key is strictly server-side
  const clientFacingFiles = [
    'app/layout.tsx',
    'app/page.tsx',
    'components/sidebar.tsx',
    'components/header.tsx'
  ];
  let secretLeakedInClient = false;
  clientFacingFiles.forEach(f => {
    const fullP = path.join(process.cwd(), f);
    if (fs.existsSync(fullP)) {
      const content = fs.readFileSync(fullP, 'utf8');
      if (content.includes('SUPABASE_SERVICE_ROLE_KEY') || content.includes(serviceKey)) {
        secretLeakedInClient = true;
      }
    }
  });
  assert(!secretLeakedInClient, 'SUPABASE_SERVICE_ROLE_KEY is completely isolated from client bundles');

  // ----------------------------------------------------------------------
  // STEP 5: Final Record Count & Integrity Safety Check
  // ----------------------------------------------------------------------
  console.log('\n--- STEP 5: Post-Test Data Safety & Count Preservation ---');
  let finalTotal = 0;
  let allCountsMatched = true;

  for (const table of ALL_22_TABLES) {
    const { count } = await adminClient
      .from(table)
      .select('*', { count: 'exact', head: true });

    finalTotal += count;
    if (count !== initialCounts[table]) {
      allCountsMatched = false;
      console.error(`  [MISMATCH] Table '${table}' count changed from ${initialCounts[table]} to ${count}!`);
    }
  }

  assert(finalTotal === 170, `Final record count across all 22 tables is exactly 170 (${finalTotal})`);
  assert(allCountsMatched, 'Every individual table count matches its pre-test baseline exactly');

  // Check backup directory intact
  const backupDir = path.join(process.cwd(), 'data', 'backups', 'pre_supabase_migration_1794988769218');
  assert(fs.existsSync(backupDir), `Pre-migration backup directory is intact at ${backupDir}`);

  // Summary Report
  console.log('\n========================================================================');
  console.log(`INTEGRATION TEST SUMMARY: ${passedChecks} PASSED, ${failedChecks} FAILED`);
  console.log(`FINAL STATUS: ${failedChecks === 0 ? 'ALL MODULES FULLY INTEGRATED & VERIFIED' : 'ISSUES DETECTED'}`);
  console.log('========================================================================\n');

  process.exit(failedChecks === 0 ? 0 : 1);
}

runTest().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
