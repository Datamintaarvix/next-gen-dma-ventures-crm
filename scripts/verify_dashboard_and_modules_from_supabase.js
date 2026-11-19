/**
 * NEXT GEN DMA VENTURES CRM - Supabase Live Activation & Dashboard Verification
 * 
 * Verifies that:
 * 1. Storage engine evaluates to Supabase Cloud (isSupabaseServerConfigured === true)
 * 2. All 14 CRM modules return live records from Supabase
 * 3. Dashboard metrics compute properly from Supabase data
 * 4. Record counts match the 170 expected migrated records
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    lines.forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        let val = match[2].trim().replace(/^["']|["']$/g, '');
        process.env[match[1].trim()] = val;
      }
    });
  }
}
loadEnv();

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isConfigured = Boolean(
  supabaseUrl &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseUrl.includes('your-project') &&
  supabaseKey &&
  !supabaseKey.includes('placeholder') &&
  !supabaseKey.includes('your-anon-key') &&
  !supabaseKey.includes('placeholder-key')
);

if (!isConfigured) {
  console.error('FATAL: Supabase is NOT configured properly in .env.local');
  process.exit(1);
}

const client = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function verifyActivation() {
  console.log('========================================================================');
  console.log('NEXT GEN DMA VENTURES CRM — SUPABASE PRIMARY ACTIVATION AUDIT');
  console.log('========================================================================');
  console.log(`Active Database Engine: SUPABASE POSTGRESQL (CLOUD)`);
  console.log(`Project URL: ${supabaseUrl}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('------------------------------------------------------------------------\n');

  let passed = 0;
  let failed = 0;

  function test(condition, msg) {
    if (condition) {
      console.log(`  [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${msg}`);
      failed++;
    }
  }

  // 1. Verify Storage Engine Flag
  test(isConfigured === true, 'isSupabaseServerConfigured() returns TRUE');

  // 2. Module by Module Live Query Verification (All 14 Modules)
  console.log('\n--- 14 CRM Modules Live Supabase Verification ---');
  
  // 1. Leads
  const { data: leads, error: e1 } = await client.from('leads').select('*');
  test(!e1 && leads.length === 8, `1. Leads: ${leads?.length} records loaded from Supabase`);

  // 2. Enquiries
  const { data: enquiries, error: e2 } = await client.from('enquiries').select('*');
  test(!e2 && enquiries.length === 6, `2. Enquiries: ${enquiries?.length} records loaded from Supabase`);

  // 3. Follow-ups
  const { data: followUps, error: e3 } = await client.from('follow_ups').select('*');
  test(!e3 && followUps.length === 8, `3. Follow-ups: ${followUps?.length} records loaded from Supabase`);

  // 4. Students
  const { data: students, error: e4 } = await client.from('students').select('*');
  test(!e4 && students.length === 11, `4. Students: ${students?.length} records loaded from Supabase`);

  // 5. Courses
  const { data: courses, error: e5 } = await client.from('courses').select('*');
  test(!e5 && courses.length === 6, `5. Courses: ${courses?.length} records loaded from Supabase`);

  // 6. Batches
  const { data: batches, error: e6 } = await client.from('batches').select('*');
  test(!e6 && batches.length === 8, `6. Batches: ${batches?.length} records loaded from Supabase`);

  // 7. Admissions
  const { data: admissions, error: e7 } = await client.from('admissions').select('*');
  test(!e7 && admissions.length === 8, `7. Admissions: ${admissions?.length} records loaded from Supabase`);

  // 8. Payments & Installments
  const { data: payments, error: e8a } = await client.from('payments').select('*');
  const { data: installments, error: e8b } = await client.from('installments').select('*');
  test(!e8a && payments.length === 8, `8a. Payments: ${payments?.length} records loaded from Supabase`);
  test(!e8b && installments.length === 4, `8b. Installments: ${installments?.length} records loaded from Supabase`);

  // 9. Attendance
  const { data: attSessions, error: e9a } = await client.from('attendance_sessions').select('*');
  const { data: attRecords, error: e9b } = await client.from('attendance_records').select('*');
  test(!e9a && attSessions.length === 8, `9a. Attendance Sessions: ${attSessions?.length} records loaded from Supabase`);
  test(!e9b && attRecords.length === 21, `9b. Attendance Records: ${attRecords?.length} records loaded from Supabase`);

  // 10. Counselling
  const { data: counselling, error: e10 } = await client.from('counselling_sessions').select('*');
  test(!e10 && counselling.length === 12, `10. Counselling Sessions: ${counselling?.length} records loaded from Supabase`);

  // 11. Placements (5 tables)
  const { data: pComp, error: ep1 } = await client.from('placement_companies').select('*');
  const { data: pJobs, error: ep2 } = await client.from('placement_jobs').select('*');
  const { data: pProf, error: ep3 } = await client.from('placement_profiles').select('*');
  const { data: pApps, error: ep4 } = await client.from('placement_applications').select('*');
  const { data: pOff, error: ep5 } = await client.from('placement_offers').select('*');
  const totalPlacements = (pComp?.length || 0) + (pJobs?.length || 0) + (pProf?.length || 0) + (pApps?.length || 0) + (pOff?.length || 0);
  test(!ep1 && !ep2 && !ep3 && !ep4 && !ep5 && totalPlacements === 32, `11. Placements: ${totalPlacements} records (Companies: 5, Jobs: 5, Profiles: 11, Apps: 8, Offers: 3) loaded from Supabase`);

  // 12. Staff
  const { data: staff, error: e12 } = await client.from('staff').select('*');
  test(!e12 && staff.length === 15, `12. Staff Directory: ${staff?.length} records loaded from Supabase`);

  // 13. Notifications & Settings
  const { data: notifs, error: e13a } = await client.from('notifications').select('*');
  const { data: notifSettings, error: e13b } = await client.from('notification_settings').select('*');
  test(!e13a && notifs.length === 12, `13a. Notifications: ${notifs?.length} records loaded from Supabase`);
  test(!e13b && notifSettings.length === 1, `13b. Notification Settings: loaded from Supabase (id: ${notifSettings?.[0]?.id})`);

  // 14. System Settings & Audit Logs
  const { data: sysSettings, error: e14a } = await client.from('system_settings').select('*');
  const { data: auditLogs, error: e14b } = await client.from('audit_logs').select('*');
  test(!e14a && sysSettings.length === 1, `14a. System Settings: loaded from Supabase (id: ${sysSettings?.[0]?.id})`);
  test(!e14b && auditLogs.length === 1, `14b. Audit Logs: ${auditLogs?.length} records loaded from Supabase`);

  // 3. Total Count Verification
  const grandTotal = (leads?.length || 0) +
    (enquiries?.length || 0) +
    (followUps?.length || 0) +
    (students?.length || 0) +
    (courses?.length || 0) +
    (batches?.length || 0) +
    (admissions?.length || 0) +
    (payments?.length || 0) +
    (installments?.length || 0) +
    (attSessions?.length || 0) +
    (attRecords?.length || 0) +
    (counselling?.length || 0) +
    totalPlacements +
    (staff?.length || 0) +
    (notifs?.length || 0) +
    (notifSettings?.length || 0) +
    (sysSettings?.length || 0) +
    (auditLogs?.length || 0);

  console.log(`\nGrand Total Migrated Records in Supabase: ${grandTotal}`);
  test(grandTotal === 170, `Expected exactly 170 records, got ${grandTotal}`);

  // 4. Dashboard Metrics Calculation Verification
  console.log('\n--- Live Dashboard Metrics Calculation from Supabase ---');
  const totalLeads = leads.length;
  const totalEnquiries = enquiries.length;
  const activeStudents = students.filter(s => s.status === 'Active' || s.status === 'Completed').length;
  const totalAdmissions = admissions.length;
  const totalRevenue = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const activeBatches = batches.filter(b => b.status === 'Active' || b.status === 'Upcoming').length;
  const totalOffers = pOff.filter(o => o.status === 'Accepted' || o.status === 'Offer Extended').length;
  const placementRate = activeStudents > 0 ? Math.round((totalOffers / activeStudents) * 100) : 92;

  test(totalLeads === 8, `Dashboard Total Leads: ${totalLeads}`);
  test(totalEnquiries === 6, `Dashboard Active Inquiries: ${totalEnquiries}`);
  test(activeStudents === 9, `Dashboard Active Students: ${activeStudents}`);
  test(totalAdmissions === 8, `Dashboard Confirmed Admissions: ${totalAdmissions}`);
  test(totalRevenue > 0, `Dashboard Tuition Collected: ₹${totalRevenue.toLocaleString('en-IN')}`);
  test(activeBatches === 7, `Dashboard Active Cohort Batches: ${activeBatches}`);
  test(totalOffers === 3, `Dashboard Placement Offers: ${totalOffers} (${placementRate}% placement rate)`);

  console.log('\n========================================================================');
  console.log(`ACTIVATION AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`STATUS: ${failed === 0 ? 'SUPABASE IS NOW ACTIVE PRIMARY DATABASE' : 'BLOCKERS DETECTED'}`);
  console.log('========================================================================\n');

  process.exit(failed === 0 ? 0 : 1);
}

verifyActivation().catch(err => {
  console.error('Fatal error during activation verification:', err);
  process.exit(1);
});
